import { getDatabase } from '../../database/init.js';
import { logSecurityEvent } from '../security/auditLog.js';
import { getStripe, isStripeConfigured } from '../stripe/stripeConfig.js';
import { mapStripeStatus } from '../stripe/subscriptionService.js';
import { deleteKidData } from '../privacy/privacyService.js';
import { purgeUserVoiceData } from '../voice/voiceDataDeletionService.js';
import { invalidateParentDashboardCache } from '../parentDashboardService.js';

export const ADMIN_PERMISSIONS = Object.freeze([
  'overview.read',
  'users.read',
  'users.delete',
  'content.read',
  'content.moderate',
  'books.validate',
  'subscriptions.read',
  'subscriptions.manage',
  'reports.read',
  'reports.manage',
  'support.read',
  'support.manage',
  'audit.read',
  'permissions.manage',
  'search.use'
]);

const VALID_MODERATION_STATUSES = new Set(['pending', 'approved', 'rejected']);
const VALID_REPORT_STATUSES = new Set(['open', 'reviewing', 'resolved', 'dismissed']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

function httpError(status, message, code, details = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeQuery(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

export function normalizeAdminPermissions(value) {
  if (value === null) return null;
  if (!Array.isArray(value)) {
    throw httpError(400, 'permissions must be an array or null', 'INVALID_PERMISSIONS');
  }
  const permissions = [...new Set(value.map(String))];
  const invalid = permissions.filter((permission) => !ADMIN_PERMISSIONS.includes(permission));
  if (invalid.length > 0) {
    throw httpError(400, 'Unknown admin permission', 'UNKNOWN_PERMISSION', { invalid });
  }
  return permissions;
}

export async function getAdminPermissionState(userId) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT id, username, role, admin_permissions FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  const admin = result.rows[0];
  if (!admin || admin.role !== 'admin') {
    throw httpError(403, 'Admin role required', 'ADMIN_REQUIRED');
  }
  const unrestricted = admin.admin_permissions == null;
  return {
    admin: {
      id: admin.id,
      username: admin.username
    },
    unrestricted,
    permissions: unrestricted ? [...ADMIN_PERMISSIONS] : normalizeAdminPermissions(admin.admin_permissions)
  };
}

export function requireAdminPermission(permission) {
  if (!ADMIN_PERMISSIONS.includes(permission)) {
    throw new Error(`Unknown permission middleware: ${permission}`);
  }
  return async (req, res, next) => {
    try {
      const state = await getAdminPermissionState(req.user.id);
      if (!state.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Admin permission required',
          code: 'ADMIN_PERMISSION_REQUIRED',
          permission
        });
      }
      req.adminPermissions = state;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function listModerationQueue({
  type = 'all',
  status = 'pending',
  query = '',
  limit = 50,
  offset = 0
} = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  const search = normalizeQuery(query);
  const allowedTypes = new Set(['all', 'book', 'generated_story']);
  if (!allowedTypes.has(type)) throw httpError(400, 'Invalid moderation type', 'INVALID_TYPE');
  if (status !== 'all' && !VALID_MODERATION_STATUSES.has(status)) {
    throw httpError(400, 'Invalid moderation status', 'INVALID_STATUS');
  }

  const params = [status, search ? `%${search}%` : null, type, safeLimit, safeOffset];
  const result = await pool.query(
    `WITH moderation_items AS (
       SELECT
         'book'::text AS type,
         b.id,
         b.title,
         b.description,
         b.cover_image,
         b.language,
         b.moderation_status,
         b.moderation_note,
         b.is_published,
         b.created_at,
         b.moderated_at,
         moderator.username AS moderated_by_name,
         NULL::text AS owner_name
       FROM books b
       LEFT JOIN users moderator ON moderator.id = b.moderated_by
       UNION ALL
       SELECT
         'generated_story'::text,
         gs.id,
         gs.title,
         gs.summary,
         NULL::text,
         gs.language,
         gs.moderation_status,
         gs.moderation_note,
         NOT gs.is_hidden,
         gs.created_at,
         gs.moderated_at,
         moderator.username,
         owner.username
       FROM generated_stories gs
       LEFT JOIN users moderator ON moderator.id = gs.moderated_by
       LEFT JOIN users owner ON owner.id = gs.user_id
     )
     SELECT *, COUNT(*) OVER()::int AS total
     FROM moderation_items
     WHERE ($1 = 'all' OR moderation_status = $1)
       AND ($2::text IS NULL OR title ILIKE $2 OR COALESCE(description, '') ILIKE $2)
       AND ($3 = 'all' OR type = $3)
     ORDER BY
       CASE moderation_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
       created_at DESC
     LIMIT $4 OFFSET $5`,
    params
  );

  return {
    items: result.rows.map(({ total: _total, ...item }) => item),
    total: Number(result.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function moderateContent({
  actor,
  type,
  id,
  status,
  note = '',
  publish = false,
  req = null
}) {
  if (!['book', 'generated_story'].includes(type)) {
    throw httpError(400, 'Invalid content type', 'INVALID_TYPE');
  }
  if (!VALID_MODERATION_STATUSES.has(status)) {
    throw httpError(400, 'Invalid moderation status', 'INVALID_STATUS');
  }
  const resourceId = boundedInteger(id, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!resourceId) throw httpError(400, 'Invalid content id', 'INVALID_ID');

  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let result;
    if (type === 'book') {
      result = await client.query(
        `UPDATE books
         SET moderation_status = $1,
             moderation_note = $2,
             moderated_by = $3,
             moderated_at = NOW(),
             is_published = CASE
               WHEN $1 = 'rejected' THEN FALSE
               WHEN $1 = 'approved' AND $4 = TRUE THEN TRUE
               ELSE is_published
             END,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [status, normalizeQuery(note, 1000) || null, actor.id, Boolean(publish), resourceId]
      );
    } else {
      result = await client.query(
        `UPDATE generated_stories
         SET moderation_status = $1,
             moderation_note = $2,
             moderated_by = $3,
             moderated_at = NOW(),
             is_hidden = ($1 = 'rejected'),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, title, moderation_status, moderation_note, is_hidden, moderated_at`,
        [status, normalizeQuery(note, 1000) || null, actor.id, resourceId]
      );
    }
    if (!result.rows[0]) throw httpError(404, 'Content not found', 'CONTENT_NOT_FOUND');

    await logSecurityEvent(client, {
      userId: actor.id,
      actorRole: actor.role,
      action: 'admin_content_moderated',
      resourceType: type,
      resourceId,
      req,
      metadata: { status, publish: Boolean(publish), note: normalizeQuery(note, 1000) }
    });
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listReports({
  status = 'open',
  priority = 'all',
  type = 'all',
  query = '',
  limit = 50,
  offset = 0
} = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  if (status !== 'all' && !VALID_REPORT_STATUSES.has(status)) {
    throw httpError(400, 'Invalid report status', 'INVALID_STATUS');
  }
  if (priority !== 'all' && !VALID_PRIORITIES.has(priority)) {
    throw httpError(400, 'Invalid report priority', 'INVALID_PRIORITY');
  }
  const search = normalizeQuery(query);
  const result = await pool.query(
    `SELECT
       cr.*,
       reporter.username AS reporter_name,
       assignee.username AS assigned_admin_name,
       CASE cr.target_type
         WHEN 'book' THEN (SELECT title FROM books WHERE id = cr.target_id)
         WHEN 'generated_story' THEN (SELECT title FROM generated_stories WHERE id = cr.target_id)
         WHEN 'user' THEN (SELECT username FROM users WHERE id = cr.target_id)
         ELSE NULL
       END AS target_label,
       COUNT(*) OVER()::int AS total
     FROM content_reports cr
     LEFT JOIN users reporter ON reporter.id = cr.reporter_user_id
     LEFT JOIN users assignee ON assignee.id = cr.assigned_admin_id
     WHERE ($1 = 'all' OR cr.status = $1)
       AND ($2 = 'all' OR cr.priority = $2)
       AND ($3 = 'all' OR cr.target_type = $3)
       AND (
         $4::text IS NULL
         OR cr.reason ILIKE $4
         OR COALESCE(cr.details, '') ILIKE $4
         OR COALESCE(reporter.username, '') ILIKE $4
       )
     ORDER BY
       CASE cr.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
       cr.created_at DESC
     LIMIT $5 OFFSET $6`,
    [status, priority, type, search ? `%${search}%` : null, safeLimit, safeOffset]
  );
  return {
    items: result.rows.map(({ total: _total, ...item }) => item),
    total: Number(result.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function updateReport({
  actor,
  id,
  status,
  priority = null,
  resolutionNote = '',
  assignToSelf = false,
  req = null
}) {
  if (!VALID_REPORT_STATUSES.has(status)) {
    throw httpError(400, 'Invalid report status', 'INVALID_STATUS');
  }
  if (priority != null && !VALID_PRIORITIES.has(priority)) {
    throw httpError(400, 'Invalid report priority', 'INVALID_PRIORITY');
  }
  const pool = getDatabase();
  const result = await pool.query(
    `UPDATE content_reports
     SET status = $1,
         priority = COALESCE($2, priority),
         resolution_note = NULLIF($3, ''),
         assigned_admin_id = CASE WHEN $4 THEN $5 ELSE assigned_admin_id END,
         resolved_at = CASE WHEN $1 IN ('resolved', 'dismissed') THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [status, priority, normalizeQuery(resolutionNote, 1000), Boolean(assignToSelf), actor.id, id]
  );
  if (!result.rows[0]) throw httpError(404, 'Report not found', 'REPORT_NOT_FOUND');
  await logSecurityEvent(pool, {
    userId: actor.id,
    actorRole: actor.role,
    action: 'admin_report_updated',
    resourceType: 'content_report',
    resourceId: id,
    req,
    metadata: { status, priority, assign_to_self: Boolean(assignToSelf) }
  });
  return result.rows[0];
}

export async function createContentReport({
  reporter,
  targetType,
  targetId,
  reason,
  details = ''
}) {
  if (!['book', 'generated_story', 'user'].includes(targetType)) {
    throw httpError(400, 'Invalid report target type', 'INVALID_TARGET_TYPE');
  }
  const safeReason = normalizeQuery(reason, 160);
  if (safeReason.length < 3) throw httpError(400, 'Report reason is required', 'REASON_REQUIRED');
  const pool = getDatabase();

  const targetQueries = {
    book: 'SELECT id FROM books WHERE id = $1',
    generated_story: 'SELECT id FROM generated_stories WHERE id = $1',
    user: 'SELECT id FROM users WHERE id = $1'
  };
  const target = await pool.query(targetQueries[targetType], [targetId]);
  if (!target.rows[0]) throw httpError(404, 'Report target not found', 'TARGET_NOT_FOUND');

  const duplicate = await pool.query(
    `SELECT id FROM content_reports
     WHERE reporter_user_id = $1 AND target_type = $2 AND target_id = $3
       AND status IN ('open', 'reviewing')
     LIMIT 1`,
    [reporter.id, targetType, targetId]
  );
  if (duplicate.rows[0]) {
    return { id: duplicate.rows[0].id, duplicate: true };
  }
  const result = await pool.query(
    `INSERT INTO content_reports (reporter_user_id, target_type, target_id, reason, details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reporter.id, targetType, targetId, safeReason, normalizeQuery(details, 2000) || null]
  );
  return { ...result.rows[0], duplicate: false };
}

export async function listAuditLogs({
  action = '',
  actorId = null,
  resourceType = '',
  from = null,
  to = null,
  limit = 50,
  offset = 0
} = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  const result = await pool.query(
    `SELECT
       sal.id, sal.user_id, sal.actor_role, sal.action, sal.resource_type,
       sal.resource_id, sal.ip_address, sal.user_agent, sal.metadata, sal.created_at,
       u.username AS actor_name,
       COUNT(*) OVER()::int AS total
     FROM security_audit_logs sal
     LEFT JOIN users u ON u.id = sal.user_id
     WHERE ($1::text = '' OR sal.action ILIKE '%' || $1 || '%')
       AND ($2::int IS NULL OR sal.user_id = $2)
       AND ($3::text = '' OR sal.resource_type = $3)
       AND ($4::timestamptz IS NULL OR sal.created_at >= $4)
       AND ($5::timestamptz IS NULL OR sal.created_at <= $5)
     ORDER BY sal.created_at DESC
     LIMIT $6 OFFSET $7`,
    [normalizeQuery(action), actorId || null, normalizeQuery(resourceType), from, to, safeLimit, safeOffset]
  );
  return {
    items: result.rows.map(({ total: _total, ...item }) => item),
    total: Number(result.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function advancedAdminSearch({ query, types = [], limit = 8 } = {}) {
  const pool = getDatabase();
  const search = normalizeQuery(query);
  if (search.length < 2) return { query: search, results: [] };
  const safeLimit = boundedInteger(limit, 8, 1, 20);
  const requestedTypes = new Set(
    (Array.isArray(types) ? types : String(types || '').split(','))
      .map((type) => type.trim())
      .filter(Boolean)
  );
  const include = (type) => requestedTypes.size === 0 || requestedTypes.has(type);
  const like = `%${search}%`;
  const tasks = [];

  if (include('users')) {
    tasks.push(pool.query(
      `SELECT 'user'::text AS type, id, username AS title, role AS subtitle,
              '/admin/users'::text AS url, created_at
       FROM users WHERE username ILIKE $1 ORDER BY created_at DESC LIMIT $2`,
      [like, safeLimit]
    ));
  }
  if (include('books')) {
    tasks.push(pool.query(
      `SELECT 'book'::text AS type, id, title,
              COALESCE(author, moderation_status) AS subtitle,
              '/admin/contents'::text AS url, created_at
       FROM books
       WHERE title ILIKE $1 OR COALESCE(author, '') ILIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [like, safeLimit]
    ));
  }
  if (include('subscriptions')) {
    tasks.push(pool.query(
      `SELECT 'subscription'::text AS type, us.id,
              u.username AS title, sp.name || ' · ' || us.status AS subtitle,
              '/admin/subscriptions'::text AS url, us.created_at
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE u.username ILIKE $1 OR sp.name ILIKE $1 OR us.status ILIKE $1
       ORDER BY us.created_at DESC LIMIT $2`,
      [like, safeLimit]
    ));
  }
  if (include('reports')) {
    tasks.push(pool.query(
      `SELECT 'report'::text AS type, id, reason AS title,
              target_type || ' · ' || status AS subtitle,
              '/admin/reports'::text AS url, created_at
       FROM content_reports
       WHERE reason ILIKE $1 OR COALESCE(details, '') ILIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [like, safeLimit]
    ));
  }
  const results = (await Promise.all(tasks))
    .flatMap((result) => result.rows)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, safeLimit * Math.max(1, tasks.length));
  return { query: search, results };
}

export async function deleteUserAccount({ actor, targetUserId, reason = '', req = null }) {
  const targetId = boundedInteger(targetUserId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!targetId) throw httpError(400, 'Invalid user id', 'INVALID_USER_ID');
  if (Number(actor.id) === targetId) {
    throw httpError(409, 'You cannot delete your own admin account', 'SELF_DELETE_FORBIDDEN');
  }
  const pool = getDatabase();
  const targetResult = await pool.query(
    'SELECT id, username, role, stripe_customer_id FROM users WHERE id = $1 LIMIT 1',
    [targetId]
  );
  const target = targetResult.rows[0];
  if (!target) throw httpError(404, 'User not found', 'USER_NOT_FOUND');
  if (target.role === 'admin') {
    throw httpError(403, 'Admin accounts cannot be deleted through this endpoint', 'ADMIN_DELETE_FORBIDDEN');
  }

  const stripeSubscriptions = await pool.query(
    `SELECT provider_subscription_id FROM user_subscriptions
     WHERE user_id = $1 AND provider = 'stripe'
       AND provider_subscription_id IS NOT NULL
       AND status IN ('trialing', 'active', 'past_due', 'unpaid')`,
    [targetId]
  );
  if (stripeSubscriptions.rowCount > 0 || target.stripe_customer_id) {
    if (!isStripeConfigured()) {
      throw httpError(503, 'Stripe must be configured before deleting a subscribed user', 'STRIPE_REQUIRED');
    }
    const stripe = getStripe();
    for (const subscription of stripeSubscriptions.rows) {
      await stripe.subscriptions.cancel(subscription.provider_subscription_id);
    }
    if (target.stripe_customer_id) {
      await stripe.customers.del(target.stripe_customer_id);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const kids = await client.query(
      'SELECT id FROM kids_profiles WHERE parent_id = $1',
      [targetId]
    );
    for (const kid of kids.rows) {
      await deleteKidData(client, kid.id);
    }
    await purgeUserVoiceData({ client, userId: targetId });
    await client.query('DELETE FROM content_reports WHERE reporter_user_id = $1', [targetId]);
    await client.query('DELETE FROM subscription_events WHERE user_id = $1', [targetId]);
    await client.query('DELETE FROM subscription_invoices WHERE user_id = $1', [targetId]);
    await client.query('DELETE FROM voice_audit_logs WHERE user_id = $1', [targetId]);
    await client.query('DELETE FROM voice_consent_records WHERE user_id = $1', [targetId]);
    await logSecurityEvent(client, {
      userId: actor.id,
      actorRole: actor.role,
      action: 'admin_user_deleted',
      resourceType: 'user',
      resourceId: targetId,
      req,
      metadata: {
        target_username: target.username,
        target_role: target.role,
        reason: normalizeQuery(reason, 1000)
      }
    });
    await client.query('DELETE FROM users WHERE id = $1', [targetId]);
    await client.query('COMMIT');
    await Promise.all(kids.rows.map((kid) => invalidateParentDashboardCache(kid.id)));
    return { deleted: true, id: targetId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listManagedSubscriptions({
  status = 'all',
  query = '',
  limit = 50,
  offset = 0
} = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  const search = normalizeQuery(query);
  const result = await pool.query(
    `SELECT
       us.*, u.username AS parent_name, sp.name AS plan_name, sp.code AS plan_code,
       sp.monthly_price_cents, sp.currency, sp.book_limit,
       COUNT(*) OVER()::int AS total
     FROM user_subscriptions us
     JOIN users u ON u.id = us.user_id
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE ($1 = 'all' OR us.status = $1)
       AND ($2::text IS NULL OR u.username ILIKE $2 OR sp.name ILIKE $2
            OR COALESCE(us.provider_subscription_id, '') ILIKE $2)
     ORDER BY us.created_at DESC
     LIMIT $3 OFFSET $4`,
    [status, search ? `%${search}%` : null, safeLimit, safeOffset]
  );
  return {
    items: result.rows.map(({ total: _total, ...item }) => item),
    total: Number(result.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function manageSubscription({ actor, id, action, status = null, req = null }) {
  const pool = getDatabase();
  const result = await pool.query(
    `SELECT us.*, sp.code AS plan_code
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.id = $1 LIMIT 1`,
    [id]
  );
  const subscription = result.rows[0];
  if (!subscription) throw httpError(404, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND');

  let updated;
  if (subscription.provider === 'stripe' && subscription.provider_subscription_id) {
    if (!isStripeConfigured()) throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');
    const stripe = getStripe();
    let stripeSubscription;
    if (action === 'cancel_at_period_end') {
      stripeSubscription = await stripe.subscriptions.update(subscription.provider_subscription_id, {
        cancel_at_period_end: true
      });
    } else if (action === 'resume') {
      stripeSubscription = await stripe.subscriptions.update(subscription.provider_subscription_id, {
        cancel_at_period_end: false
      });
    } else if (action === 'cancel_now') {
      stripeSubscription = await stripe.subscriptions.cancel(subscription.provider_subscription_id);
    } else {
      throw httpError(400, 'Unsupported Stripe subscription action', 'INVALID_ACTION');
    }
    updated = await pool.query(
      `UPDATE user_subscriptions
       SET status = $1,
           cancel_at_period_end = $2,
           current_period_start = to_timestamp($3),
           current_period_end = to_timestamp($4),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        mapStripeStatus(stripeSubscription.status),
        Boolean(stripeSubscription.cancel_at_period_end),
        stripeSubscription.current_period_start,
        stripeSubscription.current_period_end,
        id
      ]
    );
  } else {
    if (action !== 'set_status') throw httpError(400, 'Invalid subscription action', 'INVALID_ACTION');
    const allowedStatuses = ['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'paused'];
    if (!allowedStatuses.includes(status)) throw httpError(400, 'Invalid subscription status', 'INVALID_STATUS');
    updated = await pool.query(
      `UPDATE user_subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
  }
  await logSecurityEvent(pool, {
    userId: actor.id,
    actorRole: actor.role,
    action: 'admin_subscription_managed',
    resourceType: 'subscription',
    resourceId: id,
    req,
    metadata: { action, status, provider: subscription.provider }
  });
  return updated.rows[0];
}

export async function listAdminAccounts() {
  const pool = getDatabase();
  const result = await pool.query(
    `SELECT id, username, admin_permissions, created_at
     FROM users WHERE role = 'admin' ORDER BY created_at ASC`
  );
  return result.rows.map((admin) => ({
    ...admin,
    unrestricted: admin.admin_permissions == null,
    permissions: admin.admin_permissions == null ? [...ADMIN_PERMISSIONS] : admin.admin_permissions
  }));
}

export async function setAdminPermissions({
  actor,
  targetAdminId,
  permissions,
  req = null
}) {
  if (Number(actor.id) === Number(targetAdminId)) {
    throw httpError(409, 'You cannot change your own permissions', 'SELF_PERMISSION_CHANGE_FORBIDDEN');
  }
  const normalized = normalizeAdminPermissions(permissions);
  const pool = getDatabase();
  const result = await pool.query(
    `UPDATE users SET admin_permissions = $1::jsonb
     WHERE id = $2 AND role = 'admin'
     RETURNING id, username, admin_permissions`,
    [normalized == null ? null : JSON.stringify(normalized), targetAdminId]
  );
  if (!result.rows[0]) throw httpError(404, 'Admin account not found', 'ADMIN_NOT_FOUND');
  await logSecurityEvent(pool, {
    userId: actor.id,
    actorRole: actor.role,
    action: 'admin_permissions_updated',
    resourceType: 'admin',
    resourceId: targetAdminId,
    req,
    metadata: { permissions: normalized, unrestricted: normalized == null }
  });
  return {
    ...result.rows[0],
    unrestricted: result.rows[0].admin_permissions == null,
    permissions: result.rows[0].admin_permissions == null
      ? [...ADMIN_PERMISSIONS]
      : result.rows[0].admin_permissions
  };
}
