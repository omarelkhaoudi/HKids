import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Helper function to get database pool safely
function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

// Middleware to verify parent role
function verifyParent(req, res, next) {
  if (req.user.role !== 'parent' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Parent role required.' });
  }
  next();
}

function getGoalWindow(period) {
  if (period === 'daily') {
    return "date_trunc('day', NOW())";
  }
  if (period === 'monthly') {
    return "date_trunc('month', NOW())";
  }
  return "date_trunc('week', NOW())";
}

function buildBadges(summary, progressRows) {
  const totalMinutes = Math.floor(Number(summary.total_time_seconds || 0) / 60);
  const totalSessions = Number(summary.total_sessions || 0);
  const completedBooks = Number(summary.completed_books || 0);
  const activeBooks = progressRows.length;

  return [
    {
      id: 'first_steps',
      label: 'Premier pas',
      description: 'Premiere session de lecture terminee',
      earned: totalSessions >= 1
    },
    {
      id: 'ten_minutes',
      label: '10 minutes de lecture',
      description: 'A lu au moins 10 minutes au total',
      earned: totalMinutes >= 10
    },
    {
      id: 'first_book',
      label: 'Premier livre termine',
      description: 'A termine son premier livre',
      earned: completedBooks >= 1
    },
    {
      id: 'regular_reader',
      label: 'Lecteur regulier',
      description: 'A realise au moins 5 sessions',
      earned: totalSessions >= 5
    },
    {
      id: 'explorer',
      label: 'Explorateur',
      description: 'A commence au moins 3 livres differents',
      earned: activeBooks >= 3
    }
  ];
}

function normalizeInterests(interests) {
  if (Array.isArray(interests)) {
    return interests
      .map((interest) => String(interest).trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  if (typeof interests === 'string') {
    return interests
      .split(',')
      .map((interest) => interest.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  return [];
}

// Get all kids profiles for the logged-in parent
router.get('/kids', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE parent_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching kids profiles:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new kid profile
router.post('/kids', verifyToken, verifyParent, async (req, res) => {
  try {
    const { name, avatar, age, photo_url, preferred_language, interests } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO kids_profiles (
        parent_id, name, avatar, age, photo_url, preferred_language, interests
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        req.user.id,
        name,
        avatar || null,
        age || null,
        photo_url || null,
        preferred_language || 'fr',
        normalizeInterests(interests)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating kid profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update a kid profile
router.put('/kids/:id', verifyToken, verifyParent, async (req, res) => {
  try {
    const { name, avatar, age, photo_url, preferred_language, interests } = req.body;
    const pool = getPool();
    
    // Verify the kid profile belongs to the parent
    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const result = await pool.query(
      `UPDATE kids_profiles
       SET name = $1,
           avatar = $2,
           age = $3,
           photo_url = $4,
           preferred_language = $5,
           interests = $6,
           updated_at = NOW()
       WHERE id = $7 AND parent_id = $8
       RETURNING *`,
      [
        name,
        avatar || null,
        age || null,
        photo_url || null,
        preferred_language || 'fr',
        normalizeInterests(interests),
        req.params.id,
        req.user.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating kid profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a kid profile
router.delete('/kids/:id', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();
    
    // Verify the kid profile belongs to the parent
    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    await pool.query('DELETE FROM kids_profiles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kid profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting kid profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get approved categories for a kid
router.get('/kids/:id/approvals', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();
    
    // Verify the kid profile belongs to the parent
    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const result = await pool.query(
      `SELECT pa.*, c.name as category_name, c.description as category_description
       FROM parent_approvals pa
       JOIN categories c ON pa.category_id = c.id
       WHERE pa.kid_profile_id = $1`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching approvals:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update category approval for a kid
router.post('/kids/:id/approvals', verifyToken, verifyParent, async (req, res) => {
  try {
    const { category_id, approved } = req.body;
    
    if (category_id === undefined || approved === undefined) {
      return res.status(400).json({ error: 'category_id and approved are required' });
    }

    const pool = getPool();
    
    // Verify the kid profile belongs to the parent
    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    // Verify category exists
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const result = await pool.query(
      `INSERT INTO parent_approvals (kid_profile_id, category_id, approved, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (kid_profile_id, category_id)
       DO UPDATE SET approved = $3, updated_at = NOW()
       RETURNING *`,
      [req.params.id, category_id, approved === true || approved === 'true']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Bulk update approvals (set multiple categories at once)
router.put('/kids/:id/approvals/bulk', verifyToken, verifyParent, async (req, res) => {
  try {
    const { approvals } = req.body; // Array of { category_id, approved }
    
    if (!Array.isArray(approvals)) {
      return res.status(400).json({ error: 'approvals must be an array' });
    }

    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify the kid profile belongs to the parent
      const kidCheck = await client.query(
        'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
        [req.params.id, req.user.id]
      );

      if (kidCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Kid profile not found' });
      }

      // Delete existing approvals for this kid
      await client.query('DELETE FROM parent_approvals WHERE kid_profile_id = $1', [req.params.id]);

      // Insert new approvals
      for (const approval of approvals) {
        if (approval.category_id !== undefined && approval.approved !== undefined) {
          await client.query(
            `INSERT INTO parent_approvals (kid_profile_id, category_id, approved, updated_at)
             VALUES ($1, $2, $3, NOW())`,
            [req.params.id, approval.category_id, approval.approved === true || approval.approved === 'true']
          );
        }
      }

      await client.query('COMMIT');
      
      // Return updated approvals
      const result = await client.query(
        `SELECT pa.*, c.name as category_name
         FROM parent_approvals pa
         JOIN categories c ON pa.category_id = c.id
         WHERE pa.kid_profile_id = $1`,
        [req.params.id]
      );

      res.json(result.rows);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error bulk updating approvals:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a kid account linked to a kid profile
router.post('/kids/:id/create-account', verifyToken, verifyParent, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const pool = getPool();
    
    // Verify the kid profile belongs to the parent
    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    // Check if username already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if this kid profile already has an account
    const existingKidAccount = await pool.query(
      'SELECT * FROM users WHERE kid_profile_id = $1',
      [req.params.id]
    );

    if (existingKidAccount.rows.length > 0) {
      return res.status(409).json({ error: 'This kid profile already has an account' });
    }

    // Create the kid account
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password, role, kid_profile_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, kid_profile_id',
      [username.trim(), hashedPassword, 'kid', req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating kid account:', err);
    // Log more details for debugging
    if (err.code === '42703') {
      return res.status(500).json({ 
        error: 'Database schema error: kid_profile_id column may not exist. Please run database migrations.' 
      });
    }
    if (err.code === '23503') {
      return res.status(500).json({ 
        error: 'Foreign key constraint error. Please check that the kid profile exists.' 
      });
    }
    res.status(500).json({ 
      error: err.message || 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Record reading progress from a kid account
router.post('/reading-progress', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'kid' || !req.user.kid_profile_id) {
      return res.status(403).json({ error: 'Access denied. Kid account required.' });
    }

    const {
      book_id,
      current_page = 0,
      total_pages = 0,
      duration_seconds = 0,
      completed = false
    } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: 'book_id is required' });
    }

    const safeCurrentPage = Math.max(0, Number.parseInt(current_page, 10) || 0);
    const safeTotalPages = Math.max(0, Number.parseInt(total_pages, 10) || 0);
    const safeDuration = Math.max(0, Number.parseInt(duration_seconds, 10) || 0);
    const isCompleted = completed === true || completed === 'true';
    const progressPercent = safeTotalPages > 0
      ? Math.min(100, Math.round(((safeCurrentPage + 1) / safeTotalPages) * 100))
      : 0;

    const pool = getPool();
    const bookCheck = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND is_published = TRUE',
      [book_id]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const progressResult = await pool.query(
      `INSERT INTO kid_reading_progress (
        kid_profile_id,
        book_id,
        current_page,
        total_pages,
        progress_percent,
        completed,
        last_read_at,
        completed_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), CASE WHEN $6 THEN NOW() ELSE NULL END, NOW())
      ON CONFLICT (kid_profile_id, book_id)
      DO UPDATE SET
        current_page = GREATEST(kid_reading_progress.current_page, EXCLUDED.current_page),
        total_pages = EXCLUDED.total_pages,
        progress_percent = GREATEST(kid_reading_progress.progress_percent, EXCLUDED.progress_percent),
        completed = kid_reading_progress.completed OR EXCLUDED.completed,
        last_read_at = NOW(),
        completed_at = CASE
          WHEN kid_reading_progress.completed_at IS NOT NULL THEN kid_reading_progress.completed_at
          WHEN EXCLUDED.completed THEN NOW()
          ELSE NULL
        END,
        updated_at = NOW()
      RETURNING *`,
      [
        req.user.kid_profile_id,
        book_id,
        safeCurrentPage,
        safeTotalPages,
        progressPercent,
        isCompleted
      ]
    );

    if (safeDuration > 0) {
      await pool.query(
        `INSERT INTO kid_reading_sessions (
          kid_profile_id,
          book_id,
          duration_seconds,
          page_reached,
          completed
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [req.user.kid_profile_id, book_id, safeDuration, safeCurrentPage, isCompleted]
      );
    }

    res.status(201).json(progressResult.rows[0]);
  } catch (err) {
    console.error('Error recording reading progress:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get reading activity for one child
router.get('/kids/:id/activity', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();

    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const [summaryResult, progressResult, sessionsResult, goalResult] = await Promise.all([
      pool.query(
        `SELECT
          COALESCE(SUM(duration_seconds), 0)::int AS total_time_seconds,
          COUNT(*)::int AS total_sessions,
          COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS completed_sessions
        FROM kid_reading_sessions
        WHERE kid_profile_id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT
          krp.*,
          b.title AS book_title,
          b.cover_image,
          b.page_count
        FROM kid_reading_progress krp
        JOIN books b ON b.id = krp.book_id
        WHERE krp.kid_profile_id = $1
        ORDER BY krp.last_read_at DESC
        LIMIT 8`,
        [req.params.id]
      ),
      pool.query(
        `SELECT
          krs.*,
          b.title AS book_title
        FROM kid_reading_sessions krs
        JOIN books b ON b.id = krs.book_id
        WHERE krs.kid_profile_id = $1
        ORDER BY krs.created_at DESC
        LIMIT 10`,
        [req.params.id]
      ),
      pool.query(
        `SELECT *
         FROM kid_reading_goals
         WHERE kid_profile_id = $1 AND active = TRUE
         ORDER BY updated_at DESC
         LIMIT 1`,
        [req.params.id]
      )
    ]);

    const completedBooks = progressResult.rows.filter((item) => item.completed).length;
    const summary = {
      ...summaryResult.rows[0],
      completed_books: completedBooks
    };
    const activeGoal = goalResult.rows[0] || null;
    let goal = null;

    if (activeGoal) {
      const windowStart = getGoalWindow(activeGoal.period);
      let progressValue = 0;

      if (activeGoal.goal_type === 'completed_books') {
        const goalProgress = await pool.query(
          `SELECT COUNT(*)::int AS value
           FROM kid_reading_progress
           WHERE kid_profile_id = $1
             AND completed = TRUE
             AND completed_at >= ${windowStart}`,
          [req.params.id]
        );
        progressValue = Number(goalProgress.rows[0]?.value || 0);
      } else if (activeGoal.goal_type === 'sessions') {
        const goalProgress = await pool.query(
          `SELECT COUNT(*)::int AS value
           FROM kid_reading_sessions
           WHERE kid_profile_id = $1
             AND created_at >= ${windowStart}`,
          [req.params.id]
        );
        progressValue = Number(goalProgress.rows[0]?.value || 0);
      } else {
        const goalProgress = await pool.query(
          `SELECT COALESCE(SUM(duration_seconds), 0)::int AS value
           FROM kid_reading_sessions
           WHERE kid_profile_id = $1
             AND created_at >= ${windowStart}`,
          [req.params.id]
        );
        progressValue = Math.floor(Number(goalProgress.rows[0]?.value || 0) / 60);
      }

      goal = {
        ...activeGoal,
        progress_value: progressValue,
        progress_percent: Math.min(100, Math.round((progressValue / Number(activeGoal.target_value || 1)) * 100)),
        achieved: progressValue >= Number(activeGoal.target_value || 1)
      };
    }

    res.json({
      summary,
      goal,
      badges: buildBadges(summary, progressResult.rows),
      progress: progressResult.rows,
      recent_sessions: sessionsResult.rows
    });
  } catch (err) {
    console.error('Error fetching reading activity:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create or replace the active reading goal for one child
router.put('/kids/:id/reading-goal', verifyToken, verifyParent, async (req, res) => {
  try {
    const { goal_type = 'minutes', target_value = 10, period = 'weekly' } = req.body;
    const allowedGoalTypes = ['minutes', 'completed_books', 'sessions'];
    const allowedPeriods = ['daily', 'weekly', 'monthly'];

    if (!allowedGoalTypes.includes(goal_type)) {
      return res.status(400).json({ error: 'Invalid goal_type' });
    }

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const safeTarget = Math.max(1, Math.min(999, Number.parseInt(target_value, 10) || 1));
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const kidCheck = await client.query(
        'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
        [req.params.id, req.user.id]
      );

      if (kidCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Kid profile not found' });
      }

      await client.query(
        'UPDATE kid_reading_goals SET active = FALSE, updated_at = NOW() WHERE kid_profile_id = $1 AND active = TRUE',
        [req.params.id]
      );

      const result = await client.query(
        `INSERT INTO kid_reading_goals (kid_profile_id, goal_type, target_value, period, active, updated_at)
         VALUES ($1, $2, $3, $4, TRUE, NOW())
         RETURNING *`,
        [req.params.id, goal_type, safeTarget, period]
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving reading goal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Disable the active reading goal for one child
router.delete('/kids/:id/reading-goal', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();

    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    await pool.query(
      'UPDATE kid_reading_goals SET active = FALSE, updated_at = NOW() WHERE kid_profile_id = $1 AND active = TRUE',
      [req.params.id]
    );

    res.json({ message: 'Reading goal disabled' });
  } catch (err) {
    console.error('Error disabling reading goal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get books approved for a kid (used by kids interface)
router.get('/kids/:id/books', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get kid profile
    const kidResult = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [req.params.id]);
    
    if (kidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const kid = kidResult.rows[0];
    
    // If user is not the parent or admin, deny access
    if (req.user.role !== 'admin' && req.user.id !== kid.parent_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get approved category IDs for this kid
    const approvalsResult = await pool.query(
      'SELECT category_id FROM parent_approvals WHERE kid_profile_id = $1 AND approved = TRUE',
      [req.params.id]
    );

    const approvedCategoryIds = approvalsResult.rows.map(row => row.category_id);

    // If no categories approved, return empty array
    if (approvedCategoryIds.length === 0) {
      return res.json([]);
    }

    // Get books from approved categories
    const booksResult = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.is_published = TRUE 
       AND b.category_id = ANY($1::int[])
       ORDER BY b.created_at DESC`,
      [approvedCategoryIds]
    );

    res.json(booksResult.rows);
  } catch (err) {
    console.error('Error fetching approved books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

