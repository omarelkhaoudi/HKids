import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
  requireAdminPermission
} from '../services/admin/adminService.js';

test('admin permission catalog is unique and covers sensitive operations', () => {
  assert.equal(new Set(ADMIN_PERMISSIONS).size, ADMIN_PERMISSIONS.length);
  for (const permission of [
    'users.delete',
    'books.validate',
    'subscriptions.manage',
    'reports.manage',
    'audit.read',
    'permissions.manage'
  ]) {
    assert.ok(ADMIN_PERMISSIONS.includes(permission));
  }
});

test('admin permissions accept null as unrestricted compatibility mode', () => {
  assert.equal(normalizeAdminPermissions(null), null);
});

test('admin permissions remove duplicates', () => {
  assert.deepEqual(
    normalizeAdminPermissions(['users.read', 'users.read', 'audit.read']),
    ['users.read', 'audit.read']
  );
});

test('admin permissions reject unknown capabilities', () => {
  assert.throws(
    () => normalizeAdminPermissions(['users.read', 'root.everything']),
    (error) => error.code === 'UNKNOWN_PERMISSION' && error.status === 400
  );
});

test('permission middleware rejects unknown permission at startup', () => {
  assert.throws(
    () => requireAdminPermission('unknown.permission'),
    /Unknown permission middleware/
  );
});
