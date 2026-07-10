import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import {
  ADMIN_PERMISSIONS,
  advancedAdminSearch,
  deleteUserAccount,
  getAdminPermissionState,
  listAdminAccounts,
  listAuditLogs,
  listManagedSubscriptions,
  listModerationQueue,
  listReports,
  manageSubscription,
  moderateContent,
  requireAdminPermission,
  setAdminPermissions,
  updateReport
} from '../services/admin/adminService.js';

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

function sendAdminError(res, error) {
  return res.status(error?.status || 500).json({
    error: error?.status ? error.message : 'Admin service unavailable',
    code: error?.code || 'ADMIN_SERVICE_ERROR',
    details: error?.details || undefined
  });
}

router.get('/overview', requireAdminPermission('overview.read'), async (req, res) => {
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

router.get('/users', requireAdminPermission('users.read'), async (req, res) => {
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

router.get('/users/:id', requireAdminPermission('users.read'), async (req, res) => {
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

router.get('/statistics', requireAdminPermission('overview.read'), async (req, res) => {
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

router.get('/subscriptions', requireAdminPermission('subscriptions.read'), async (req, res) => {
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

router.delete('/users/:id', requireAdminPermission('users.delete'), async (req, res) => {
  try {
    const result = await deleteUserAccount({
      actor: req.user,
      targetUserId: req.params.id,
      reason: req.body?.reason || '',
      req
    });
    res.json(result);
  } catch (error) {
    console.error('Error deleting admin-managed user:', error);
    sendAdminError(res, error);
  }
});

router.get('/moderation', requireAdminPermission('content.read'), async (req, res) => {
  try {
    res.json(await listModerationQueue({
      type: req.query.type || 'all',
      status: req.query.status || 'pending',
      query: req.query.q || '',
      limit: req.query.limit,
      offset: req.query.offset
    }));
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    sendAdminError(res, error);
  }
});

router.patch(
  '/moderation/:type/:id',
  requireAdminPermission('content.moderate'),
  async (req, res) => {
    try {
      const requiredPermission = req.params.type === 'book' && req.body.status === 'approved'
        ? 'books.validate'
        : 'content.moderate';
      const permissionState = req.adminPermissions || await getAdminPermissionState(req.user.id);
      if (!permissionState.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: 'Admin permission required',
          code: 'ADMIN_PERMISSION_REQUIRED',
          permission: requiredPermission
        });
      }
      const item = await moderateContent({
        actor: req.user,
        type: req.params.type,
        id: req.params.id,
        status: req.body.status,
        note: req.body.note,
        publish: req.body.publish === true,
        req
      });
      res.json(item);
    } catch (error) {
      console.error('Error moderating content:', error);
      sendAdminError(res, error);
    }
  }
);

router.get('/reports', requireAdminPermission('reports.read'), async (req, res) => {
  try {
    res.json(await listReports({
      status: req.query.status || 'open',
      priority: req.query.priority || 'all',
      type: req.query.type || 'all',
      query: req.query.q || '',
      limit: req.query.limit,
      offset: req.query.offset
    }));
  } catch (error) {
    console.error('Error fetching content reports:', error);
    sendAdminError(res, error);
  }
});

router.patch('/reports/:id', requireAdminPermission('reports.manage'), async (req, res) => {
  try {
    res.json(await updateReport({
      actor: req.user,
      id: req.params.id,
      status: req.body.status,
      priority: req.body.priority,
      resolutionNote: req.body.resolution_note,
      assignToSelf: req.body.assign_to_self === true,
      req
    }));
  } catch (error) {
    console.error('Error updating content report:', error);
    sendAdminError(res, error);
  }
});

router.get('/audit-logs', requireAdminPermission('audit.read'), async (req, res) => {
  try {
    res.json(await listAuditLogs({
      action: req.query.action,
      actorId: req.query.actor_id,
      resourceType: req.query.resource_type,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
      offset: req.query.offset
    }));
  } catch (error) {
    console.error('Error fetching admin audit logs:', error);
    sendAdminError(res, error);
  }
});

router.get('/search', requireAdminPermission('search.use'), async (req, res) => {
  try {
    res.json(await advancedAdminSearch({
      query: req.query.q,
      types: req.query.types,
      limit: req.query.limit
    }));
  } catch (error) {
    console.error('Error running admin search:', error);
    sendAdminError(res, error);
  }
});

router.get(
  '/managed-subscriptions',
  requireAdminPermission('subscriptions.read'),
  async (req, res) => {
    try {
      res.json(await listManagedSubscriptions({
        status: req.query.status || 'all',
        query: req.query.q || '',
        limit: req.query.limit,
        offset: req.query.offset
      }));
    } catch (error) {
      console.error('Error fetching managed subscriptions:', error);
      sendAdminError(res, error);
    }
  }
);

router.patch(
  '/managed-subscriptions/:id',
  requireAdminPermission('subscriptions.manage'),
  async (req, res) => {
    try {
      res.json(await manageSubscription({
        actor: req.user,
        id: req.params.id,
        action: req.body.action,
        status: req.body.status,
        req
      }));
    } catch (error) {
      console.error('Error managing subscription:', error);
      sendAdminError(res, error);
    }
  }
);

router.get('/permissions/me', async (req, res) => {
  try {
    res.json(await getAdminPermissionState(req.user.id));
  } catch (error) {
    sendAdminError(res, error);
  }
});

router.get('/permissions', requireAdminPermission('permissions.manage'), async (req, res) => {
  try {
    res.json({
      available_permissions: ADMIN_PERMISSIONS,
      admins: await listAdminAccounts()
    });
  } catch (error) {
    console.error('Error fetching admin permissions:', error);
    sendAdminError(res, error);
  }
});

router.put(
  '/permissions/:id',
  requireAdminPermission('permissions.manage'),
  async (req, res) => {
    try {
      res.json(await setAdminPermissions({
        actor: req.user,
        targetAdminId: req.params.id,
        permissions: req.body.permissions,
        req
      }));
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      sendAdminError(res, error);
    }
  }
);

export default router;
