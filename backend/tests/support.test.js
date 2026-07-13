import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
} from '../services/admin/adminService.js';
import { createSupportTicket } from '../services/support/supportTicketService.js';
import { initDatabase, getDatabase } from '../database/init.js';

process.env.NODE_ENV = 'development';
process.env.JWT_SECRET ||= 'hkids-test-jwt-secret-with-32-characters-minimum';
await initDatabase();

test('admin permission catalog includes support capabilities', () => {
  assert.ok(ADMIN_PERMISSIONS.includes('support.read'));
  assert.ok(ADMIN_PERMISSIONS.includes('support.manage'));
});

test('admin permissions accept support permissions in normalized sets', () => {
  assert.deepEqual(
    normalizeAdminPermissions(['support.read', 'support.manage', 'support.read']),
    ['support.read', 'support.manage']
  );
});

test('support ticket creation rejects non-parent accounts', async () => {
  await assert.rejects(
    () => createSupportTicket({
      user: { id: 1, role: 'kid' },
      subject: 'Help',
      message: 'Need help',
    }),
    (error) => error.code === 'PARENT_REQUIRED' && error.status === 403
  );
});

test('support ticket creation requires subject and message', async () => {
  await assert.rejects(
    () => createSupportTicket({
      user: { id: 1, role: 'parent' },
      subject: '',
      message: 'Need help',
    }),
    (error) => error.code === 'INVALID_TICKET' && error.status === 400
  );
});

test('support ticket creation persists ticket for parent user', async () => {
  const pool = getDatabase();
  const suffix = Date.now();
  const username = `support_parent_${suffix}`;
  const passwordHash = bcrypt.hashSync('SecurePass123!', 12);
  const userResult = await pool.query(
    `INSERT INTO users (username, password, role) VALUES ($1, $2, 'parent') RETURNING id, role`,
    [username, passwordHash]
  );
  const user = userResult.rows[0];

  const ticket = await createSupportTicket({
    user,
    subject: 'Test ticket QA',
    message: 'Message de validation automatique.',
    category: 'general',
  });

  assert.ok(ticket.id);
  assert.equal(ticket.subject, 'Test ticket QA');
  assert.equal(ticket.status, 'open');
  assert.equal(ticket.category, 'general');
});
