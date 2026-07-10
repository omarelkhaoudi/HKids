import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  boundedInteger,
  buildPrivacyExportFilename,
  deleteKidData,
  listPrivacyLogs,
  verifyParentPassword
} from '../services/privacy/privacyService.js';

test('privacy pagination clamps untrusted values', () => {
  assert.equal(boundedInteger('25', 50, 1, 100), 25);
  assert.equal(boundedInteger('-4', 50, 1, 100), 1);
  assert.equal(boundedInteger('999', 50, 1, 100), 100);
  assert.equal(boundedInteger('invalid', 50, 1, 100), 50);
});

test('GDPR export filename is deterministic and contains no user input', () => {
  const filename = buildPrivacyExportFilename(42, new Date('2026-07-10T10:00:00.000Z'));
  assert.equal(filename, 'hkids-rgpd-42-2026-07-10.json');
});

test('parent password confirmation accepts the correct password', async () => {
  const passwordHash = await bcrypt.hash('secure-password', 4);
  const pool = {
    async query() {
      return {
        rows: [{
          id: 7,
          username: 'parent',
          password: passwordHash,
          role: 'parent',
          created_at: new Date()
        }]
      };
    }
  };

  const user = await verifyParentPassword(7, 'secure-password', pool);
  assert.equal(user.id, 7);
});

test('parent password confirmation rejects missing and invalid credentials', async () => {
  const passwordHash = await bcrypt.hash('secure-password', 4);
  const pool = {
    async query() {
      return {
        rows: [{
          id: 7,
          username: 'parent',
          password: passwordHash,
          role: 'parent',
          created_at: new Date()
        }]
      };
    }
  };

  await assert.rejects(
    verifyParentPassword(7, '', pool),
    (error) => error.status === 400 && error.code === 'PASSWORD_REQUIRED'
  );
  await assert.rejects(
    verifyParentPassword(7, 'wrong-password', pool),
    (error) => error.status === 401 && error.code === 'INVALID_CREDENTIALS'
  );
});

test('kid erasure removes linked kid login before the profile cascade', async () => {
  const calls = [];
  const client = {
    async query(text, values) {
      calls.push({ text, values });
      if (text.includes('SELECT id FROM users')) {
        return { rows: [{ id: 91 }] };
      }
      return { rows: [], rowCount: 1 };
    }
  };

  const result = await deleteKidData(client, 12);
  assert.deepEqual(result.deleted_kid_account_ids, [91]);
  assert.match(calls[1].text, /DELETE FROM users/);
  assert.match(calls[2].text, /DELETE FROM kids_profiles/);
  assert.deepEqual(calls[2].values, [12]);
});

test('privacy logs are user-scoped and paginated', async () => {
  let captured;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{
          id: 1,
          action: 'privacy_export_downloaded',
          created_at: new Date(),
          total: 1
        }]
      };
    }
  };

  const result = await listPrivacyLogs({
    userId: 7,
    limit: 500,
    offset: -2,
    pool
  });

  assert.equal(result.total, 1);
  assert.equal(result.limit, 100);
  assert.equal(result.offset, 0);
  assert.equal(captured.values[0], 7);
  assert.equal(captured.values[2], 100);
  assert.equal(captured.values[3], 0);
  assert.match(captured.text, /WHERE user_id = \$1/);
});
