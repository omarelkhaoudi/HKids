import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { VoiceCloneService } from '../services/ai/VoiceCloneService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (/^audio\//i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  },
});
const voiceCloneService = new VoiceCloneService();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const voiceStorageDir = path.join(__dirname, '..', 'uploads', 'voices');

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function requireParent(req, res, next) {
  if (!['parent', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Parent account required' });
  }
  next();
}

function mapVoiceProfile(row) {
  return {
    id: row.id,
    name: row.name,
    relation: row.relation,
    language: row.language,
    status: row.status,
    provider: row.provider,
    has_sample: Boolean(row.sample_audio_path),
    has_preview: Boolean(row.preview_audio_path || row.sample_audio_path),
    consent_given: row.consent_given === true,
    consent_at: row.consent_at,
    quality_score: Number(row.quality_score || 0),
    quality_status: row.quality_status,
    quality_notes: row.quality_notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapVoiceMessage(row) {
  return {
    id: row.id,
    voice_profile_id: row.voice_profile_id,
    title: row.title,
    message_text: row.message_text || '',
    language: row.language,
    has_audio: Boolean(row.audio_path),
    duration_seconds: Number(row.duration_seconds || 0),
    created_at: row.created_at,
  };
}

function sanitizeText(value, fallback = '') {
  return String(value || fallback).trim().slice(0, 160);
}

function fileExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;
  if (file.mimetype.includes('webm')) return '.webm';
  if (file.mimetype.includes('mpeg')) return '.mp3';
  if (file.mimetype.includes('wav')) return '.wav';
  if (file.mimetype.includes('ogg')) return '.ogg';
  return '.audio';
}

async function saveAudioFile(file, userId, kind) {
  await fs.ensureDir(voiceStorageDir);
  const filename = `${kind}-${userId}-${Date.now()}-${crypto.randomBytes(12).toString('hex')}${fileExtension(file)}`;
  const absolutePath = path.join(voiceStorageDir, filename);
  await fs.writeFile(absolutePath, file.buffer);
  return `/uploads/voices/${filename}`;
}

async function logVoiceAction(pool, { userId, voiceProfileId = null, action, metadata = {} }) {
  await pool.query(
    `INSERT INTO voice_audit_logs (user_id, voice_profile_id, action, metadata)
     VALUES ($1, $2, $3, $4)`,
    [userId, voiceProfileId, action, metadata]
  );
}

async function getOwnedVoiceProfile(pool, userId, profileId) {
  const result = await pool.query(
    `SELECT * FROM voice_profiles
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [profileId, userId]
  );
  return result.rows[0] || null;
}

async function getAccessibleVoiceProfile(pool, req, profileId) {
  if (['parent', 'admin'].includes(req.user?.role)) {
    return getOwnedVoiceProfile(pool, req.user.id, profileId);
  }

  if (req.user?.role === 'kid' && req.user.kid_profile_id) {
    const result = await pool.query(
      `SELECT vp.*
       FROM voice_profiles vp
       JOIN kids_profiles kp ON kp.parent_id = vp.user_id
       WHERE vp.id = $1
         AND kp.id = $2
         AND vp.deleted_at IS NULL`,
      [profileId, req.user.kid_profile_id]
    );
    return result.rows[0] || null;
  }

  return null;
}

router.get('/profiles', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM voice_profiles
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(mapVoiceProfile));
  } catch (err) {
    console.error('Error loading voice profiles:', err);
    res.status(500).json({ error: 'Could not load voice profiles' });
  }
});

router.get('/available', verifyToken, async (req, res) => {
  try {
    const pool = getPool();

    if (['parent', 'admin'].includes(req.user?.role)) {
      const result = await pool.query(
        `SELECT * FROM voice_profiles
         WHERE user_id = $1 AND deleted_at IS NULL AND consent_given = TRUE
         ORDER BY created_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows.map(mapVoiceProfile));
    }

    if (req.user?.role === 'kid' && req.user.kid_profile_id) {
      const result = await pool.query(
        `SELECT vp.*
         FROM voice_profiles vp
         JOIN kids_profiles kp ON kp.parent_id = vp.user_id
         WHERE kp.id = $1
           AND vp.deleted_at IS NULL
           AND vp.consent_given = TRUE
         ORDER BY vp.created_at DESC`,
        [req.user.kid_profile_id]
      );
      return res.json(result.rows.map(mapVoiceProfile));
    }

    res.status(403).json({ error: 'Voice access denied' });
  } catch (err) {
    console.error('Error loading available voices:', err);
    res.status(500).json({ error: 'Could not load available voices' });
  }
});

router.post('/profiles', verifyToken, requireParent, upload.single('sample'), async (req, res) => {
  try {
    const pool = getPool();
    const consentGiven = req.body.consent_given === 'true' || req.body.consent_given === true;

    if (!consentGiven) {
      return res.status(400).json({ error: 'Explicit consent is required' });
    }

    const name = sanitizeText(req.body.name);
    const relation = sanitizeText(req.body.relation);
    const language = sanitizeText(req.body.language, 'fr').slice(0, 12);

    if (!name || !relation) {
      return res.status(400).json({ error: 'Name and relation are required' });
    }

    const samplePath = req.file ? await saveAudioFile(req.file, req.user.id, 'sample') : null;
    const quality = voiceCloneService.evaluateAudioQuality({
      audioBuffer: req.file?.buffer,
      mimeType: req.file?.mimetype,
    });
    const clonePreparation = await voiceCloneService.prepareVoiceProfile({
      audioSample: req.file?.buffer || null,
      consent: consentGiven,
      metadata: { name, relation, language },
    });
    const status = quality.quality_status === 'low' ? 'needs_new_sample' : clonePreparation.status;

    const result = await pool.query(
      `INSERT INTO voice_profiles (
        user_id, name, relation, language, status, provider, provider_voice_id,
        sample_audio_path, preview_audio_path, consent_given, consent_at,
        quality_score, quality_status, quality_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, TRUE, NOW(), $9, $10, $11)
      RETURNING *`,
      [
        req.user.id,
        name,
        relation,
        language,
        status,
        clonePreparation.provider,
        clonePreparation.provider_voice_id,
        samplePath,
        quality.quality_score,
        quality.quality_status,
        quality.quality_notes,
      ]
    );

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: result.rows[0].id,
      action: 'voice_profile_created',
      metadata: {
        quality_status: quality.quality_status,
        provider: clonePreparation.provider,
        status,
      },
    });

    res.status(201).json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    console.error('Error creating voice profile:', err);
    res.status(500).json({ error: 'Could not create voice profile' });
  }
});

router.put('/profiles/:id', verifyToken, requireParent, upload.single('sample'), async (req, res) => {
  try {
    const pool = getPool();
    const profile = await getOwnedVoiceProfile(pool, req.user.id, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });

    const name = sanitizeText(req.body.name, profile.name);
    const relation = sanitizeText(req.body.relation, profile.relation);
    const language = sanitizeText(req.body.language, profile.language).slice(0, 12);
    const samplePath = req.file ? await saveAudioFile(req.file, req.user.id, 'sample') : profile.sample_audio_path;
    const quality = req.file
      ? voiceCloneService.evaluateAudioQuality({ audioBuffer: req.file.buffer, mimeType: req.file.mimetype })
      : {
          quality_score: profile.quality_score,
          quality_status: profile.quality_status,
          quality_notes: profile.quality_notes,
        };
    const status = req.file
      ? (quality.quality_status === 'low' ? 'needs_new_sample' : 'sample_received')
      : (req.body.status || profile.status);

    const result = await pool.query(
      `UPDATE voice_profiles
       SET name = $1, relation = $2, language = $3, sample_audio_path = $4,
           preview_audio_path = COALESCE($4, preview_audio_path),
           status = $5, quality_score = $6, quality_status = $7,
           quality_notes = $8, updated_at = NOW()
       WHERE id = $9 AND user_id = $10 AND deleted_at IS NULL
       RETURNING *`,
      [
        name,
        relation,
        language,
        samplePath,
        status,
        quality.quality_score,
        quality.quality_status,
        quality.quality_notes,
        req.params.id,
        req.user.id,
      ]
    );

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: req.file ? 'voice_profile_sample_updated' : 'voice_profile_updated',
    });

    res.json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    console.error('Error updating voice profile:', err);
    res.status(500).json({ error: 'Could not update voice profile' });
  }
});

router.delete('/profiles/:id', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const profile = await getOwnedVoiceProfile(pool, req.user.id, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });

    await pool.query(
      `UPDATE voice_profiles
       SET deleted_at = NOW(), status = 'deleted', sample_audio_path = NULL,
           preview_audio_path = NULL, provider_voice_id = NULL, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await pool.query(
      `UPDATE voice_messages
       SET deleted_at = NOW(), audio_path = NULL
       WHERE voice_profile_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: 'voice_profile_permanently_deleted',
    });

    res.json({ message: 'Voice profile deleted permanently' });
  } catch (err) {
    console.error('Error deleting voice profile:', err);
    res.status(500).json({ error: 'Could not delete voice profile' });
  }
});

router.get('/profiles/:id/preview', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const profile = await getAccessibleVoiceProfile(pool, req, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });
    if (!profile.preview_audio_path) return res.status(404).json({ error: 'Preview not available' });

    res.redirect(profile.preview_audio_path);
  } catch (err) {
    console.error('Error loading voice preview:', err);
    res.status(500).json({ error: 'Could not load preview' });
  }
});

router.get('/messages', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM voice_messages
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(mapVoiceMessage));
  } catch (err) {
    console.error('Error loading voice messages:', err);
    res.status(500).json({ error: 'Could not load voice messages' });
  }
});

router.post('/messages', verifyToken, requireParent, upload.single('audio'), async (req, res) => {
  try {
    const pool = getPool();
    const voiceProfileId = req.body.voice_profile_id || null;

    if (voiceProfileId) {
      const profile = await getOwnedVoiceProfile(pool, req.user.id, voiceProfileId);
      if (!profile) return res.status(404).json({ error: 'Voice profile not found' });
    }

    const title = sanitizeText(req.body.title);
    if (!title) return res.status(400).json({ error: 'Message title is required' });

    const audioPath = req.file ? await saveAudioFile(req.file, req.user.id, 'message') : null;
    const result = await pool.query(
      `INSERT INTO voice_messages (
        user_id, voice_profile_id, title, message_text, language, audio_path, duration_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        req.user.id,
        voiceProfileId,
        title,
        sanitizeText(req.body.message_text),
        sanitizeText(req.body.language, 'fr').slice(0, 12),
        audioPath,
        Math.max(0, Number.parseInt(req.body.duration_seconds || '0', 10) || 0),
      ]
    );

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId,
      action: 'voice_message_created',
      metadata: { has_audio: Boolean(audioPath) },
    });

    res.status(201).json(mapVoiceMessage(result.rows[0]));
  } catch (err) {
    console.error('Error creating voice message:', err);
    res.status(500).json({ error: 'Could not create voice message' });
  }
});

router.get('/messages/:id/audio', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT audio_path FROM voice_messages
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );

    const audioPath = result.rows[0]?.audio_path;
    if (!audioPath) return res.status(404).json({ error: 'Message audio not found' });

    res.redirect(audioPath);
  } catch (err) {
    console.error('Error loading voice message audio:', err);
    res.status(500).json({ error: 'Could not load message audio' });
  }
});

router.delete('/messages/:id', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE voice_messages
       SET deleted_at = NOW(), audio_path = NULL
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Voice message not found' });

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: result.rows[0].voice_profile_id,
      action: 'voice_message_deleted',
    });

    res.json({ message: 'Voice message deleted permanently' });
  } catch (err) {
    console.error('Error deleting voice message:', err);
    res.status(500).json({ error: 'Could not delete voice message' });
  }
});

export default router;
