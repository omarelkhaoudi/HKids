import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
} from '../services/admin/adminService.js';
import { createSupportTicket } from '../services/support/supportTicketService.js';

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
