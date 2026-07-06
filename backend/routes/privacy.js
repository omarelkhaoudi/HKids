import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { logSecurityEvent } from '../services/security/auditLog.js';

const router = express.Router();

function getPool() {
  return getDatabase();
}

function requireParentOrAdmin(req, res, next) {
  if (!['parent', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Parent or admin account required' });
  }
  next();
}

async function getAuthorizedKid(pool, req, kidProfileId) {
  const query = req.user.role === 'admin'
    ? 'SELECT * FROM kids_profiles WHERE id = $1'
    : 'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2';
  const params = req.user.role === 'admin' ? [kidProfileId] : [kidProfileId, req.user.id];
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function deleteKidData(client, kidProfileId) {
  await client.query('DELETE FROM generated_stories WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM learning_attempts WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kid_rewards WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kid_challenge_progress WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kid_reading_sessions WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kid_reading_progress WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kid_reading_goals WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM parental_rules WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM parent_approvals WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('UPDATE users SET kid_profile_id = NULL WHERE kid_profile_id = $1', [kidProfileId]);
  await client.query('DELETE FROM kids_profiles WHERE id = $1', [kidProfileId]);
}

router.delete('/kids/:id', verifyToken, requireParentOrAdmin, async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const kid = await getAuthorizedKid(pool, req, req.params.id);
    if (!kid) return res.status(404).json({ error: 'Kid profile not found' });

    await client.query('BEGIN');
    await deleteKidData(client, kid.id);
    await logSecurityEvent(client, {
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'kid_profile_deleted_permanently',
      resourceType: 'kid_profile',
      resourceId: kid.id,
      req
    });
    await client.query('COMMIT');

    res.json({
      message: 'Kid profile and linked data deleted permanently',
      sync: {
        clear_local_keys: [
          'hkids_favorites',
          'hkids_history',
          'hkids_listening_history',
          'hkids_downloaded_content'
        ],
        clear_indexeddb_prefixes: ['book:', 'generated-story:', 'voice-message:']
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting kid privacy data:', error);
    res.status(500).json({ error: 'Could not delete kid profile data' });
  } finally {
    client.release();
  }
});

router.delete('/account', verifyToken, async (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Only parent accounts can self-delete here' });
  }

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password confirmation required' });

  const pool = getPool();
  const client = await pool.connect();

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [req.user.id, 'parent']);
    const user = userResult.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await client.query('BEGIN');
    const kids = await client.query('SELECT id FROM kids_profiles WHERE parent_id = $1', [req.user.id]);
    for (const kid of kids.rows) {
      await deleteKidData(client, kid.id);
    }

    await client.query('UPDATE voice_profiles SET deleted_at = NOW(), status = $2, sample_audio_path = NULL, preview_audio_path = NULL, provider_voice_id = NULL WHERE user_id = $1', [req.user.id, 'deleted']);
    await client.query('UPDATE voice_messages SET deleted_at = NOW(), audio_path = NULL WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM voice_narrations WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM user_subscriptions WHERE user_id = $1', [req.user.id]);

    await logSecurityEvent(client, {
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'parent_account_deleted_permanently',
      resourceType: 'user',
      resourceId: req.user.id,
      req
    });
    await client.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    await client.query('COMMIT');

    res.json({
      message: 'Parent account and linked data deleted permanently',
      sync: {
        clear_local_storage: true,
        clear_indexeddb: true
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting parent account:', error);
    res.status(500).json({ error: 'Could not delete account data' });
  } finally {
    client.release();
  }
});

export default router;
