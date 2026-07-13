import { getDatabase } from '../../database/init.js';
import { logSecurityEvent } from '../security/auditLog.js';

const VALID_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const VALID_CATEGORIES = new Set(['general', 'billing', 'technical', 'content', 'bug']);

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

function normalizeText(value, maxLength = 2000) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function createSupportTicket({ user, subject, message, category = 'general' }) {
  if (!user?.id) throw httpError(401, 'Authentication required', 'AUTH_REQUIRED');
  if (!['parent', 'admin'].includes(user.role)) {
    throw httpError(403, 'Parent account required', 'PARENT_REQUIRED');
  }

  const cleanSubject = normalizeText(subject, 160);
  const cleanMessage = normalizeText(message, 4000);
  const cleanCategory = VALID_CATEGORIES.has(category) ? category : 'general';

  if (!cleanSubject || !cleanMessage) {
    throw httpError(400, 'Subject and message are required', 'INVALID_TICKET');
  }

  const pool = getDatabase();
  const result = await pool.query(
    `INSERT INTO support_tickets (user_id, subject, message, category, status, priority)
     VALUES ($1, $2, $3, $4, 'open', 'normal')
     RETURNING *`,
    [user.id, cleanSubject, cleanMessage, cleanCategory]
  );

  await logSecurityEvent(pool, {
    userId: user.id,
    actorRole: user.role,
    action: 'support_ticket_created',
    resourceType: 'support_ticket',
    resourceId: String(result.rows[0].id),
    metadata: { category: cleanCategory }
  });

  return result.rows[0];
}

export async function listUserSupportTickets(userId, { limit = 20, offset = 0 } = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 20, 1, 50);
  const safeOffset = boundedInteger(offset, 0, 0, 10_000);

  const result = await pool.query(
    `SELECT id, subject, message, category, status, priority, admin_note, created_at, updated_at, resolved_at
     FROM support_tickets
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, safeLimit, safeOffset]
  );

  return { items: result.rows, total: result.rows.length };
}

export async function listSupportTickets({
  status = 'open',
  priority = 'all',
  category = 'all',
  query = '',
  limit = 50,
  offset = 0
} = {}) {
  const pool = getDatabase();
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  const search = normalizeText(query, 120);

  if (status !== 'all' && !VALID_STATUSES.has(status)) {
    throw httpError(400, 'Invalid ticket status', 'INVALID_STATUS');
  }
  if (priority !== 'all' && !VALID_PRIORITIES.has(priority)) {
    throw httpError(400, 'Invalid ticket priority', 'INVALID_PRIORITY');
  }
  if (category !== 'all' && !VALID_CATEGORIES.has(category)) {
    throw httpError(400, 'Invalid ticket category', 'INVALID_CATEGORY');
  }

  const params = [
    status === 'all' ? null : status,
    priority === 'all' ? null : priority,
    category === 'all' ? null : category,
    search ? `%${search}%` : null,
    safeLimit,
    safeOffset
  ];

  const result = await pool.query(
    `SELECT
       t.*,
       u.username AS requester_name,
       admin.username AS assigned_admin_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN users admin ON admin.id = t.assigned_admin_id
     WHERE ($1::text IS NULL OR t.status = $1)
       AND ($2::text IS NULL OR t.priority = $2)
       AND ($3::text IS NULL OR t.category = $3)
       AND ($4::text IS NULL OR t.subject ILIKE $4 OR t.message ILIKE $4 OR u.username ILIKE $4)
     ORDER BY
       CASE t.priority
         WHEN 'urgent' THEN 0
         WHEN 'high' THEN 1
         WHEN 'normal' THEN 2
         ELSE 3
       END,
       t.created_at DESC
     LIMIT $5 OFFSET $6`,
    params
  );

  return { items: result.rows, total: result.rows.length };
}

export async function updateSupportTicket({
  ticketId,
  admin,
  status,
  priority,
  adminNote,
  assignToSelf = false
}) {
  const pool = getDatabase();
  const existing = await pool.query('SELECT * FROM support_tickets WHERE id = $1 LIMIT 1', [ticketId]);
  const ticket = existing.rows[0];
  if (!ticket) throw httpError(404, 'Support ticket not found', 'TICKET_NOT_FOUND');

  const nextStatus = status && VALID_STATUSES.has(status) ? status : ticket.status;
  const nextPriority = priority && VALID_PRIORITIES.has(priority) ? priority : ticket.priority;
  const nextNote = adminNote != null ? normalizeText(adminNote, 2000) : ticket.admin_note;
  const assignedAdminId = assignToSelf ? admin.id : ticket.assigned_admin_id;
  const resolvedAt = ['resolved', 'closed'].includes(nextStatus) ? new Date().toISOString() : null;

  const result = await pool.query(
    `UPDATE support_tickets
     SET status = $2,
         priority = $3,
         admin_note = $4,
         assigned_admin_id = $5,
         resolved_at = COALESCE($6::timestamptz, resolved_at),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [ticketId, nextStatus, nextPriority, nextNote, assignedAdminId, resolvedAt]
  );

  await logSecurityEvent(pool, {
    userId: admin.id,
    actorRole: admin.role,
    action: 'support_ticket_updated',
    resourceType: 'support_ticket',
    resourceId: String(ticketId),
    metadata: { status: nextStatus, priority: nextPriority }
  });

  return result.rows[0];
}

export async function getAdminNotificationSummary() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM books WHERE moderation_status = 'pending') AS pending_moderation,
      (SELECT COUNT(*)::int FROM generated_stories WHERE moderation_status = 'pending' AND is_hidden = FALSE) AS pending_ai_stories,
      (SELECT COUNT(*)::int FROM content_reports WHERE status IN ('open', 'reviewing')) AS open_reports,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open', 'in_progress')) AS open_tickets,
      (SELECT COUNT(*)::int FROM user_subscriptions WHERE status IN ('trialing', 'active') AND created_at >= NOW() - INTERVAL '24 hours') AS new_subscriptions_24h
  `);

  const row = result.rows[0] || {};
  const items = [];

  if (Number(row.open_tickets) > 0) {
    items.push({
      id: 'open-tickets',
      title: 'Tickets support ouverts',
      message: `${row.open_tickets} demande(s) parent en attente.`,
      href: '/admin/support',
      created_at: new Date().toISOString(),
    });
  }
  if (Number(row.open_reports) > 0) {
    items.push({
      id: 'open-reports',
      title: 'Signalements à traiter',
      message: `${row.open_reports} signalement(s) ouvert(s) ou en cours.`,
      href: '/admin/reports',
      created_at: new Date().toISOString(),
    });
  }
  if (Number(row.pending_moderation) + Number(row.pending_ai_stories) > 0) {
    items.push({
      id: 'pending-moderation',
      title: 'Modération en attente',
      message: `${Number(row.pending_moderation) + Number(row.pending_ai_stories)} contenu(s) à valider.`,
      href: '/admin/moderation',
      created_at: new Date().toISOString(),
    });
  }
  if (Number(row.new_subscriptions_24h) > 0) {
    items.push({
      id: 'new-subscriptions',
      title: 'Nouveaux abonnements',
      message: `${row.new_subscriptions_24h} abonnement(s) créé(s) dans les dernières 24h.`,
      href: '/admin/subscriptions',
      created_at: new Date().toISOString(),
    });
  }

  return {
    summary: row,
    items,
    unread_count: items.length,
  };
}
