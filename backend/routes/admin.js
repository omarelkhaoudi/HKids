import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

router.use(verifyToken, adminOnly);

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function getSummary(row = {}) {
  return {
    total_parents: Number(row.total_parents || 0),
    total_children: Number(row.total_children || 0),
    total_stories: Number(row.total_stories || 0),
    total_listens: Number(row.total_listens || 0),
    active_subscriptions: Number(row.active_subscriptions || 0),
    total_listening_seconds: Number(row.total_listening_seconds || 0),
    average_listening_seconds: Math.round(Number(row.average_listening_seconds || 0)),
  };
}

router.get('/overview', async (req, res) => {
  try {
    const pool = getPool();
    const [summary, recentActivity, latestUsers, latestBooks] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'parent')::int AS total_parents,
          (SELECT COUNT(*) FROM kids_profiles)::int AS total_children,
          (SELECT COUNT(*) FROM books)::int AS total_stories,
          (SELECT COUNT(*) FROM kid_reading_sessions)::int AS total_listens,
          (SELECT COUNT(*) FROM user_subscriptions WHERE status IN ('trialing', 'active'))::int AS active_subscriptions,
          (SELECT COALESCE(SUM(duration_seconds), 0) FROM kid_reading_sessions)::int AS total_listening_seconds,
          (SELECT COALESCE(AVG(duration_seconds), 0) FROM kid_reading_sessions)::numeric AS average_listening_seconds
      `),
      pool.query(`
        SELECT
          krs.id,
          krs.duration_seconds,
          krs.completed,
          krs.created_at,
          b.title AS book_title,
          kp.name AS kid_name,
          u.username AS parent_name
        FROM kid_reading_sessions krs
        JOIN books b ON b.id = krs.book_id
        JOIN kids_profiles kp ON kp.id = krs.kid_profile_id
        JOIN users u ON u.id = kp.parent_id
        ORDER BY krs.created_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          u.id,
          u.username,
          u.role,
          u.created_at,
          COUNT(kp.id)::int AS children_count
        FROM users u
        LEFT JOIN kids_profiles kp ON kp.parent_id = u.id
        WHERE u.role IN ('parent', 'kid')
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT b.id, b.title, b.created_at, b.is_published, b.audio_url, c.name AS category_name
        FROM books b
        LEFT JOIN categories c ON c.id = b.category_id
        ORDER BY b.created_at DESC
        LIMIT 8
      `),
    ]);

    res.json({
      summary: getSummary(summary.rows[0]),
      recent_activity: recentActivity.rows,
      latest_users: latestUsers.rows,
      latest_books: latestBooks.rows,
    });
  } catch (err) {
    console.error('Error fetching admin overview:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT
        u.id,
        u.username AS name,
        NULL::text AS email,
        u.created_at,
        NULL::timestamptz AS last_login_at,
        COUNT(kp.id)::int AS children_count,
        COALESCE(MAX(us.status) FILTER (WHERE us.status IN ('trialing', 'active')), 'free') AS subscription_status
      FROM users u
      LEFT JOIN kids_profiles kp ON kp.parent_id = u.id
      LEFT JOIN user_subscriptions us ON us.user_id = u.id
      WHERE u.role = 'parent'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [parentResult, kidsResult] = await Promise.all([
      pool.query(
        `SELECT
          u.id,
          u.username AS name,
          NULL::text AS email,
          u.created_at,
          COALESCE(MAX(us.status) FILTER (WHERE us.status IN ('trialing', 'active')), 'free') AS subscription_status
         FROM users u
         LEFT JOIN user_subscriptions us ON us.user_id = u.id
         WHERE u.id = $1 AND u.role = 'parent'
         GROUP BY u.id`,
        [req.params.id]
      ),
      pool.query(
        `SELECT
          kp.*,
          COALESCE(SUM(krs.duration_seconds), 0)::int AS total_time_seconds,
          COUNT(krs.id)::int AS total_sessions,
          MAX(krs.created_at) AS last_activity_at
         FROM kids_profiles kp
         LEFT JOIN kid_reading_sessions krs ON krs.kid_profile_id = kp.id
         WHERE kp.parent_id = $1
         GROUP BY kp.id
         ORDER BY kp.created_at DESC`,
        [req.params.id]
      ),
    ]);

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json({
      parent: parentResult.rows[0],
      kids: kidsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching admin user detail:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const pool = getPool();
    const [summary, topBooks, topCategories, activeUsers, recentActivity] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM kid_reading_sessions)::int AS total_listens,
          (SELECT COALESCE(SUM(duration_seconds), 0) FROM kid_reading_sessions)::int AS total_listening_seconds,
          (SELECT COALESCE(AVG(duration_seconds), 0) FROM kid_reading_sessions)::numeric AS average_listening_seconds,
          (SELECT COUNT(DISTINCT kid_profile_id) FROM kid_reading_sessions)::int AS active_children
      `),
      pool.query(`
        SELECT
          b.id,
          b.title,
          COUNT(krs.id)::int AS listens_count,
          COALESCE(SUM(krs.duration_seconds), 0)::int AS listening_seconds
        FROM books b
        LEFT JOIN kid_reading_sessions krs ON krs.book_id = b.id
        GROUP BY b.id
        ORDER BY listens_count DESC, listening_seconds DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          c.id,
          c.name,
          COUNT(krs.id)::int AS listens_count,
          COALESCE(SUM(krs.duration_seconds), 0)::int AS listening_seconds
        FROM categories c
        LEFT JOIN books b ON b.category_id = c.id
        LEFT JOIN kid_reading_sessions krs ON krs.book_id = b.id
        GROUP BY c.id
        ORDER BY listens_count DESC, listening_seconds DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          kp.id,
          kp.name,
          u.username AS parent_name,
          COUNT(krs.id)::int AS sessions_count,
          COALESCE(SUM(krs.duration_seconds), 0)::int AS listening_seconds,
          MAX(krs.created_at) AS last_activity_at
        FROM kids_profiles kp
        JOIN users u ON u.id = kp.parent_id
        LEFT JOIN kid_reading_sessions krs ON krs.kid_profile_id = kp.id
        GROUP BY kp.id, u.username
        ORDER BY last_activity_at DESC NULLS LAST
        LIMIT 8
      `),
      pool.query(`
        SELECT
          krs.id,
          krs.duration_seconds,
          krs.created_at,
          b.title AS book_title,
          kp.name AS kid_name
        FROM kid_reading_sessions krs
        JOIN books b ON b.id = krs.book_id
        JOIN kids_profiles kp ON kp.id = krs.kid_profile_id
        ORDER BY krs.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      summary: summary.rows[0],
      top_books: topBooks.rows,
      top_categories: topCategories.rows,
      active_users: activeUsers.rows,
      recent_activity: recentActivity.rows,
    });
  } catch (err) {
    console.error('Error fetching admin statistics:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/subscriptions', async (req, res) => {
  try {
    const pool = getPool();
    const [plans, activeSubscriptions, summary] = await Promise.all([
      pool.query('SELECT * FROM subscription_plans ORDER BY book_limit ASC, monthly_price_cents ASC'),
      pool.query(`
        SELECT
          us.*,
          u.username AS parent_name,
          sp.name AS plan_name,
          sp.code AS plan_code,
          sp.monthly_price_cents,
          sp.currency,
          sp.book_limit
        FROM user_subscriptions us
        JOIN users u ON u.id = us.user_id
        JOIN subscription_plans sp ON sp.id = us.plan_id
        WHERE us.status IN ('trialing', 'active')
        ORDER BY us.current_period_end ASC
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'parent')::int AS total_parents,
          (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE status IN ('trialing', 'active'))::int AS premium_subscribers
      `),
    ]);

    const totalParents = Number(summary.rows[0]?.total_parents || 0);
    const premiumSubscribers = Number(summary.rows[0]?.premium_subscribers || 0);

    res.json({
      plans: plans.rows,
      active_subscriptions: activeSubscriptions.rows,
      summary: {
        free_subscribers: Math.max(0, totalParents - premiumSubscribers),
        premium_subscribers: premiumSubscribers,
        active_subscriptions: activeSubscriptions.rowCount,
      },
      future_actions: ['payment', 'renewal', 'cancellation', 'plan_change'],
    });
  } catch (err) {
    console.error('Error fetching admin subscriptions:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
