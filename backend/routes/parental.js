import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { logSecurityEvent } from '../services/security/auditLog.js';
import {
  filterAllowedContent,
  getContentAccessViolation,
  getGlobalAccessViolation,
  loadChildAccessPolicy,
  sendParentalAccessError,
  serializePolicyForClient
} from '../services/parental/parentalAccessService.js';
import {
  disableKidReadingGoal,
  getConnectedKidOverview,
  getKidActivitySnapshot,
  getParentDashboardSnapshot,
  importKidLocalActivity,
  invalidateParentDashboardCache,
  recordKidBookHistory,
  recordKidReadingProgress,
  recordKidScreenTime,
  setKidBookFavorite,
  upsertKidReadingGoal
} from '../services/parentDashboardService.js';
import { pullCloudSync, pushCloudSync } from '../services/cloud/cloudSyncService.js';
import { permanentlyDeleteKid } from '../services/privacy/privacyService.js';

import {
  CONTROL_THEME_IDS,
  DEFAULT_LIBRARY_CONTROLS,
  DEFAULT_RECOMMENDATION_RAILS,
  OFFICIAL_AGE_GROUP_IDS,
  normalizeIdList,
  normalizeLibraryControls,
  normalizeRecommendationRails,
} from '../constants/parentControlCenter.js';

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

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function optionalIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw Object.assign(new Error('Invalid activity date'), { status: 400 });
  return parsed.toISOString();
}

function sendDashboardServiceError(res, error) {
  return res.status(error?.status || 500).json({
    error: error?.status ? error.message : 'Parent dashboard service unavailable',
    code: error?.code || 'PARENT_DASHBOARD_ERROR'
  });
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

function normalizeBirthDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : trimmed;
}

function normalizeAge(value) {
  if (value === undefined || value === null || value === '') return null;
  const age = Number.parseInt(value, 10);
  if (Number.isNaN(age)) return null;
  return Math.max(0, Math.min(18, age));
}

const allowedLanguages = ['fr', 'ar', 'en'];
const allowedThemes = CONTROL_THEME_IDS;
const allowedContentTypes = ['story', 'audio_story', 'educational', 'song', 'quiz'];
const allowedAgeGroups = OFFICIAL_AGE_GROUP_IDS;

function normalizeAllowedList(value, allowedValues) {
  return normalizeIdList(value, allowedValues);
}

function normalizeTime(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeRules(row) {
  if (!row) {
    return {
      daily_screen_time_minutes: 30,
      quiet_start_time: '',
      quiet_end_time: '',
      allowed_languages: [],
      allowed_themes: [],
      allowed_content_types: [],
      allowed_age_groups: [],
      blocked_themes: [],
      recommendation_rails: { ...DEFAULT_RECOMMENDATION_RAILS },
      library_controls: { ...DEFAULT_LIBRARY_CONTROLS },
    };
  }

  return {
    id: row.id,
    kid_profile_id: row.kid_profile_id,
    daily_screen_time_minutes: row.daily_screen_time_minutes == null
      ? 30
      : Number(row.daily_screen_time_minutes),
    quiet_start_time: row.quiet_start_time ? String(row.quiet_start_time).slice(0, 5) : '',
    quiet_end_time: row.quiet_end_time ? String(row.quiet_end_time).slice(0, 5) : '',
    allowed_languages: row.allowed_languages || [],
    allowed_themes: row.allowed_themes || [],
    allowed_content_types: row.allowed_content_types || [],
    allowed_age_groups: row.allowed_age_groups || [],
    blocked_themes: row.blocked_themes || [],
    recommendation_rails: normalizeRecommendationRails(row.recommendation_rails),
    library_controls: normalizeLibraryControls(row.library_controls),
    updated_at: row.updated_at,
  };
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
    const { name, avatar, age, date_of_birth, photo_url, preferred_language, interests, school_level, favorite_themes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO kids_profiles (
        parent_id, name, avatar, age, date_of_birth, photo_url, preferred_language, interests, school_level, favorite_themes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.id,
        String(name).trim(),
        avatar || null,
        normalizeAge(age),
        normalizeBirthDate(date_of_birth),
        photo_url || null,
        preferred_language || 'fr',
        normalizeInterests(interests),
        school_level ? String(school_level).trim().slice(0, 64) : null,
        normalizeAllowedList(favorite_themes, allowedThemes),
      ]
    );

    await logSecurityEvent(pool, {
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'kid_profile_created',
      resourceType: 'kid_profile',
      resourceId: result.rows[0].id,
      req
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating kid profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update a kid profile
router.put('/kids/:id', verifyToken, verifyParent, async (req, res) => {
  try {
    const { name, avatar, age, date_of_birth, photo_url, preferred_language, interests, school_level, favorite_themes } = req.body;
    const pool = getPool();

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
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
           date_of_birth = $4,
           photo_url = $5,
           preferred_language = $6,
           interests = $7,
           school_level = $8,
           favorite_themes = $9,
           updated_at = NOW()
       WHERE id = $10 AND parent_id = $11
       RETURNING *`,
      [
        String(name).trim(),
        avatar || null,
        normalizeAge(age),
        normalizeBirthDate(date_of_birth),
        photo_url || null,
        preferred_language || 'fr',
        normalizeInterests(interests),
        school_level ? String(school_level).trim().slice(0, 64) : null,
        normalizeAllowedList(favorite_themes, allowedThemes),
        req.params.id,
        req.user.id
      ]
    );

    await invalidateParentDashboardCache(req.params.id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating kid profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a kid profile
router.delete('/kids/:id', verifyToken, verifyParent, async (req, res) => {
  try {
    const deletion = await permanentlyDeleteKid({
      actor: req.user,
      kidProfileId: req.params.id,
      req
    });
    res.json({
      message: 'Kid profile deleted successfully',
      deletion,
      sync: {
        clear_local_keys: [
          'hkids_favorites',
          'hkids_history',
          'hkids_listening_history',
          'hkids_reading_stats',
          'hkids_downloaded_content'
        ],
        clear_indexeddb_prefixes: ['book:', 'generated-story:', 'voice-message:']
      }
    });
  } catch (err) {
    console.error('Error deleting kid profile:', err);
    res.status(err?.status || 500).json({
      error: err?.status ? err.message : 'Database error',
      code: err?.code || 'KID_DELETE_FAILED'
    });
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

// Get bedtime and content rules for a kid
router.get('/kids/:id/rules', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();

    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const result = await pool.query(
      'SELECT * FROM parental_rules WHERE kid_profile_id = $1 LIMIT 1',
      [req.params.id]
    );

    res.json(normalizeRules(result.rows[0]));
  } catch (err) {
    console.error('Error fetching parental rules:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create or update bedtime and content rules for a kid
router.put('/kids/:id/rules', verifyToken, verifyParent, async (req, res) => {
  try {
    const {
      daily_screen_time_minutes = 30,
      quiet_start_time,
      quiet_end_time,
      allowed_languages,
      allowed_themes,
      allowed_content_types,
      allowed_age_groups,
      blocked_themes,
      recommendation_rails,
      library_controls,
    } = req.body;

    const safeDailyMinutes = Math.max(
      0,
      Math.min(240, Number.parseInt(daily_screen_time_minutes, 10) || 0)
    );
    const normalizedLanguages = normalizeAllowedList(allowed_languages, allowedLanguages);
    const normalizedThemes = normalizeAllowedList(allowed_themes, allowedThemes);
    const normalizedContentTypes = normalizeAllowedList(allowed_content_types, allowedContentTypes);
    const normalizedAgeGroups = normalizeAllowedList(allowed_age_groups, allowedAgeGroups);
    const normalizedBlockedThemes = normalizeAllowedList(blocked_themes, allowedThemes);
    const normalizedRails = normalizeRecommendationRails(recommendation_rails);
    const normalizedLibrary = normalizeLibraryControls(library_controls);
    const startTime = normalizeTime(quiet_start_time);
    const endTime = normalizeTime(quiet_end_time);

    const pool = getPool();

    const kidCheck = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.id]
    );

    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    const result = await pool.query(
      `INSERT INTO parental_rules (
        kid_profile_id,
        daily_screen_time_minutes,
        quiet_start_time,
        quiet_end_time,
        allowed_languages,
        allowed_themes,
        allowed_content_types,
        allowed_age_groups,
        blocked_themes,
        recommendation_rails,
        library_controls,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, NOW())
      ON CONFLICT (kid_profile_id)
      DO UPDATE SET
        daily_screen_time_minutes = EXCLUDED.daily_screen_time_minutes,
        quiet_start_time = EXCLUDED.quiet_start_time,
        quiet_end_time = EXCLUDED.quiet_end_time,
        allowed_languages = EXCLUDED.allowed_languages,
        allowed_themes = EXCLUDED.allowed_themes,
        allowed_content_types = EXCLUDED.allowed_content_types,
        allowed_age_groups = EXCLUDED.allowed_age_groups,
        blocked_themes = EXCLUDED.blocked_themes,
        recommendation_rails = EXCLUDED.recommendation_rails,
        library_controls = EXCLUDED.library_controls,
        updated_at = NOW()
      RETURNING *`,
      [
        req.params.id,
        safeDailyMinutes,
        startTime,
        endTime,
        normalizedLanguages,
        normalizedThemes,
        normalizedContentTypes,
        normalizedAgeGroups,
        normalizedBlockedThemes,
        JSON.stringify(normalizedRails),
        JSON.stringify(normalizedLibrary),
      ]
    );

    await invalidateParentDashboardCache(req.params.id);
    res.json(normalizeRules(result.rows[0]));
  } catch (err) {
    console.error('Error saving parental rules:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Remove one favorite for a kid (parent control center)
router.delete('/kids/:id/favorites/:bookId', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();
    const kidId = Number.parseInt(req.params.id, 10);
    const bookId = Number.parseInt(req.params.bookId, 10);
    const kidCheck = await pool.query(
      'SELECT id FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [kidId, req.user.id],
    );
    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }
    await pool.query(
      'DELETE FROM kid_book_favorites WHERE kid_profile_id = $1 AND book_id = $2',
      [kidId, bookId],
    );
    await invalidateParentDashboardCache(kidId);
    res.json({ ok: true, book_id: bookId, favorite: false });
  } catch (err) {
    console.error('Error removing kid favorite:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Clear all favorites / history for a kid
router.delete('/kids/:id/activity/:kind', verifyToken, verifyParent, async (req, res) => {
  try {
    const pool = getPool();
    const kidId = Number.parseInt(req.params.id, 10);
    const kind = String(req.params.kind || '').toLowerCase();
    const kidCheck = await pool.query(
      'SELECT id FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [kidId, req.user.id],
    );
    if (kidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kid profile not found' });
    }

    if (kind === 'favorites') {
      await pool.query('DELETE FROM kid_book_favorites WHERE kid_profile_id = $1', [kidId]);
    } else if (kind === 'history') {
      await pool.query('DELETE FROM kid_book_history WHERE kid_profile_id = $1', [kidId]);
    } else if (kind === 'all') {
      await pool.query('DELETE FROM kid_book_favorites WHERE kid_profile_id = $1', [kidId]);
      await pool.query('DELETE FROM kid_book_history WHERE kid_profile_id = $1', [kidId]);
    } else {
      return res.status(400).json({ error: 'Unsupported activity kind' });
    }

    await invalidateParentDashboardCache(kidId);
    res.json({ ok: true, cleared: kind });
  } catch (err) {
    console.error('Error clearing kid activity:', err);
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
    const hashedPassword = bcrypt.hashSync(password, 12);

    const result = await pool.query(
      'INSERT INTO users (username, password, role, kid_profile_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, kid_profile_id',
      [username.trim(), hashedPassword, 'kid', req.params.id]
    );

    await logSecurityEvent(pool, {
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'kid_account_created',
      resourceType: 'kid_profile',
      resourceId: req.params.id,
      req
    });

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

router.get('/kids/:id/dashboard', verifyToken, verifyParent, async (req, res) => {
  try {
    const kidProfileId = boundedInteger(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!kidProfileId) return res.status(400).json({ error: 'Valid kid profile id required' });

    const snapshot = await getParentDashboardSnapshot({
      user: req.user,
      kidProfileId,
      days: boundedInteger(req.query.days, 7, 7, 30),
      favoritesLimit: boundedInteger(req.query.favorites_limit ?? req.query.limit, 20, 1, 20),
      favoritesOffset: boundedInteger(req.query.favorites_offset ?? req.query.offset, 0, 0, 10_000),
      historyLimit: boundedInteger(req.query.history_limit ?? req.query.limit, 50, 1, 50),
      historyOffset: boundedInteger(req.query.history_offset ?? req.query.offset, 0, 0, 10_000),
      timelineLimit: boundedInteger(req.query.timeline_limit ?? req.query.limit, 50, 1, 50),
      timelineOffset: boundedInteger(req.query.timeline_offset ?? req.query.offset, 0, 0, 10_000)
    });
    res.json(snapshot);
  } catch (error) {
    console.error('Error loading parent dashboard:', error);
    sendDashboardServiceError(res, error);
  }
});

router.post('/me/screen-time', verifyToken, async (req, res) => {
  try {
    const clientSessionId = String(req.body.client_session_id || '').trim();
    const startedAt = new Date(req.body.started_at);
    const startedAtMs = startedAt.getTime();
    const now = Date.now();
    if (
      !/^[a-zA-Z0-9:_-]{8,120}$/.test(clientSessionId)
      || Number.isNaN(startedAtMs)
      || startedAtMs < now - 31 * 24 * 60 * 60 * 1000
      || startedAtMs > now + 5 * 60 * 1000
    ) {
      return res.status(400).json({ error: 'Valid client_session_id and started_at required' });
    }
    const result = await recordKidScreenTime({
      user: req.user,
      clientSessionId,
      durationSeconds: boundedInteger(req.body.duration_seconds, 0, 0, 86_400),
      startedAt: startedAt.toISOString()
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error recording screen time:', error);
    sendDashboardServiceError(res, error);
  }
});

router.post('/me/favorites', verifyToken, async (req, res) => {
  try {
    const bookId = boundedInteger(req.body.book_id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!bookId || typeof req.body.favorite !== 'boolean') {
      return res.status(400).json({ error: 'book_id and favorite are required' });
    }
    const result = await setKidBookFavorite({
      user: req.user,
      bookId,
      favorite: req.body.favorite,
      favoritedAt: optionalIsoDate(req.body.favorited_at)
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving kid favorite:', error);
    sendDashboardServiceError(res, error);
  }
});

router.post('/me/history', verifyToken, async (req, res) => {
  try {
    const bookId = boundedInteger(req.body.book_id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!bookId) return res.status(400).json({ error: 'Valid book_id required' });
    const result = await recordKidBookHistory({
      user: req.user,
      bookId,
      lastPage: boundedInteger(req.body.last_page, 0, 0, 100_000),
      listenedSeconds: boundedInteger(req.body.listened_seconds, 0, 0, 86_400),
      audioDurationSeconds: boundedInteger(req.body.audio_duration_seconds, 0, 0, 86_400),
      completed: req.body.completed === true,
      occurredAt: optionalIsoDate(req.body.occurred_at)
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving kid history:', error);
    sendDashboardServiceError(res, error);
  }
});

router.post('/me/activity-import', verifyToken, async (req, res) => {
  try {
    const importKey = String(req.body.import_key || '').trim();
    if (!/^[a-zA-Z0-9:_-]{3,120}$/.test(importKey)) {
      return res.status(400).json({ error: 'Valid import_key required' });
    }
    const result = await importKidLocalActivity({
      user: req.user,
      importKey,
      favorites: Array.isArray(req.body.favorites) ? req.body.favorites.slice(0, 20) : [],
      history: Array.isArray(req.body.history) ? req.body.history.slice(0, 50) : [],
      listeningHistory: Array.isArray(req.body.listening_history) ? req.body.listening_history.slice(0, 50) : []
    });
    res.status(result.imported ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error importing kid activity:', error);
    sendDashboardServiceError(res, error);
  }
});

router.get('/me/cloud-sync', verifyToken, async (req, res) => {
  try {
    const result = await pullCloudSync({
      user: req.user,
      clientSyncToken: req.query.sync_token || null
    });
    res.json(result);
  } catch (error) {
    console.error('Error pulling cloud sync:', error);
    sendDashboardServiceError(res, error);
  }
});

router.post('/me/cloud-sync', verifyToken, async (req, res) => {
  try {
    const changes = req.body?.changes || {};
    const hasChanges = ['favorites', 'progress', 'history', 'downloads'].some(
      (key) => changes[key] && (
        Array.isArray(changes[key]) ? changes[key].length > 0 : Object.keys(changes[key]).length > 0
      )
    );

    const result = hasChanges
      ? await pushCloudSync({
        user: req.user,
        clientSyncToken: req.body?.sync_token || null,
        changes
      })
      : await pullCloudSync({
        user: req.user,
        clientSyncToken: req.body?.sync_token || null
      });

    res.json(result);
  } catch (error) {
    console.error('Error syncing cloud state:', error);
    sendDashboardServiceError(res, error);
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
      completed = false,
      client_session_id = null
    } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: 'book_id is required' });
    }

    const clientSessionId = client_session_id == null ? null : String(client_session_id).trim();
    if (clientSessionId && !/^[a-zA-Z0-9:_-]{8,120}$/.test(clientSessionId)) {
      return res.status(400).json({ error: 'Invalid client_session_id' });
    }

    const progress = await recordKidReadingProgress({
      user: req.user,
      kidProfileId: req.user.kid_profile_id,
      bookId: book_id,
      currentPage: current_page,
      totalPages: total_pages,
      durationSeconds: duration_seconds,
      completed,
      clientSessionId
    });
    res.status(201).json(progress);
  } catch (err) {
    if (err?.isParentalAccessError || err?.name === 'ParentalAccessError') {
      return sendParentalAccessError(res, err);
    }
    console.error('Error recording reading progress:', err);
    sendDashboardServiceError(res, err);
  }
});

// Get the connected kid profile and its real reading activity
router.get('/me/overview', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'kid' || !req.user.kid_profile_id) {
      return res.status(403).json({ error: 'Access denied. Kid account required.' });
    }

    const overview = await getConnectedKidOverview(req.user);
    res.json(overview);
  } catch (err) {
    console.error('Error fetching connected kid overview:', err);
    sendDashboardServiceError(res, err);
  }
});

router.get('/me/access-policy', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'kid' || !req.user.kid_profile_id) {
      return res.status(403).json({ error: 'Access denied. Kid account required.' });
    }

    const policy = await loadChildAccessPolicy({ user: req.user });
    res.json(serializePolicyForClient(policy));
  } catch (error) {
    console.error('Error fetching connected kid access policy:', error);
    res.status(503).json({
      error: 'Le contrôle parental est momentanément indisponible.',
      code: 'POLICY_UNAVAILABLE',
      parental_restriction: true
    });
  }
});

// Get reading activity for one child
router.get('/kids/:id/activity', verifyToken, verifyParent, async (req, res) => {
  try {
    const activity = await getKidActivitySnapshot({
      user: req.user,
      kidProfileId: req.params.id
    });
    res.json(activity);
  } catch (err) {
    console.error('Error fetching reading activity:', err);
    sendDashboardServiceError(res, err);
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
    const goal = await upsertKidReadingGoal({
      user: req.user,
      kidProfileId: req.params.id,
      goalType: goal_type,
      targetValue: safeTarget,
      period
    });
    res.status(201).json(goal);
  } catch (err) {
    console.error('Error saving reading goal:', err);
    sendDashboardServiceError(res, err);
  }
});

// Disable the active reading goal for one child
router.delete('/kids/:id/reading-goal', verifyToken, verifyParent, async (req, res) => {
  try {
    const result = await disableKidReadingGoal({
      user: req.user,
      kidProfileId: req.params.id
    });
    res.json(result);
  } catch (err) {
    console.error('Error disabling reading goal:', err);
    sendDashboardServiceError(res, err);
  }
});

// Get books approved for a kid (used by kids interface)
router.get('/kids/:id/books', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const requestedKidProfileId = req.params.id;
    const policy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId,
      pool
    });
    if (!policy.applies) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const enforceGlobalRules = req.user.role === 'kid';
    const globalViolation = enforceGlobalRules ? getGlobalAccessViolation(policy) : null;
    if (globalViolation) return sendParentalAccessError(res, globalViolation);

    const booksResult = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.is_published = TRUE
       ORDER BY b.created_at DESC`,
      []
    );

    res.json(filterAllowedContent(policy, booksResult.rows, { includeGlobal: enforceGlobalRules }));
  } catch (err) {
    console.error('Error fetching approved books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

