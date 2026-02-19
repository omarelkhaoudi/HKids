import express from 'express';
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
    const { name, avatar, age } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO kids_profiles (parent_id, name, avatar, age) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, avatar || null, age || null]
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
    const { name, avatar, age } = req.body;
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
      'UPDATE kids_profiles SET name = $1, avatar = $2, age = $3, updated_at = NOW() WHERE id = $4 AND parent_id = $5 RETURNING *',
      [name, avatar || null, age || null, req.params.id, req.user.id]
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
    const bcrypt = await import('bcryptjs');
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password, role, kid_profile_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, kid_profile_id',
      [username.trim(), hashedPassword, 'kid', req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating kid account:', err);
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

