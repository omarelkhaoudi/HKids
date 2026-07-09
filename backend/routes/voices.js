import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { VoiceCloneService } from '../services/ai/VoiceCloneService.js';
import { aiErrorResponse } from '../services/ai/errors.js';
import {
  getContentAccessViolation,
  loadChildAccessPolicy,
  sendParentalAccessError
} from '../services/parental/parentalAccessService.js';

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
const narrationJobs = new Map();

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

async function deleteStoredVoiceFile(audioPath) {
  if (!audioPath || !audioPath.startsWith('/uploads/voices/')) return;
  const absolutePath = path.join(voiceStorageDir, path.basename(audioPath));
  try {
    await fs.remove(absolutePath);
  } catch (error) {
    console.warn('Stored voice file could not be removed:', error.message);
  }
}

function voiceFileUrl(audioPath) {
  if (!audioPath) return null;
  const filename = path.basename(audioPath);
  return `/api/voices/files/${encodeURIComponent(filename)}`;
}

async function canAccessVoiceFile(pool, req, audioPath) {
  if (!audioPath || !audioPath.startsWith('/uploads/voices/')) return false;

  if (['parent', 'admin'].includes(req.user?.role)) {
    const result = await pool.query(
      `SELECT 1
       WHERE EXISTS (
         SELECT 1 FROM voice_profiles
         WHERE user_id = $1 AND deleted_at IS NULL
           AND (sample_audio_path = $2 OR preview_audio_path = $2)
       )
       OR EXISTS (
         SELECT 1 FROM voice_messages
         WHERE user_id = $1 AND deleted_at IS NULL AND audio_path = $2
       )
       OR EXISTS (
         SELECT 1 FROM voice_narrations
         WHERE user_id = $1 AND audio_path = $2
       )`,
      [req.user.id, audioPath]
    );
    return result.rows.length > 0;
  }

  if (req.user?.role === 'kid' && req.user.kid_profile_id) {
    const result = await pool.query(
      `SELECT 1
       FROM kids_profiles kp
       WHERE kp.id = $1
         AND (
           EXISTS (
             SELECT 1 FROM voice_profiles vp
             WHERE vp.user_id = kp.parent_id
               AND vp.deleted_at IS NULL
               AND vp.consent_given = TRUE
               AND (vp.sample_audio_path = $2 OR vp.preview_audio_path = $2)
           )
           OR EXISTS (
             SELECT 1 FROM voice_narrations vn
             JOIN voice_profiles vp ON vp.id = vn.voice_profile_id
             WHERE vp.user_id = kp.parent_id
               AND vp.deleted_at IS NULL
               AND vp.consent_given = TRUE
               AND vn.audio_path = $2
           )
         )`,
      [req.user.kid_profile_id, audioPath]
    );
    return result.rows.length > 0;
  }

  return false;
}

async function logVoiceAction(pool, { userId, voiceProfileId = null, action, metadata = {} }) {
  await pool.query(
    `INSERT INTO voice_audit_logs (user_id, voice_profile_id, action, metadata)
     VALUES ($1, $2, $3, $4)`,
    [userId, voiceProfileId, action, metadata]
  );
}

function sendAIError(res, error) {
  const response = aiErrorResponse(error);
  return res.status(response.status).json(response.body);
}

function createAudioUploadFromSynthesis(synthesis, filename = 'voice-audio.mp3') {
  if (!synthesis?.audioBuffer) return null;
  return {
    originalname: filename,
    mimetype: synthesis.mimeType || 'audio/mpeg',
    buffer: synthesis.audioBuffer,
  };
}

function hashNarration({ text, voiceProfileId, providerVoiceId }) {
  return crypto
    .createHash('sha256')
    .update([text, voiceProfileId, providerVoiceId || 'mock'].join('|'))
    .digest('hex');
}

async function getAccessibleBook(pool, req, bookId) {
  const result = await pool.query(
    `SELECT b.*, c.name AS category_name
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = $1
       AND (b.is_published = TRUE OR $2 = TRUE)`,
    [bookId, ['parent', 'admin'].includes(req.user?.role)]
  );
  return result.rows[0] || null;
}

async function getBookNarrationText(pool, book) {
  const pagesResult = await pool.query(
    `SELECT content
     FROM book_pages
     WHERE book_id = $1 AND NULLIF(TRIM(content), '') IS NOT NULL
     ORDER BY page_number ASC`,
    [book.id]
  );

  const pageText = pagesResult.rows.map((row) => row.content).join('\n\n').trim();
  const fallbackText = [book.title, book.description].filter(Boolean).join('\n\n').trim();
  return (pageText || fallbackText).slice(0, 5000);
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

router.get('/files/:filename', verifyToken, async (req, res) => {
  try {
    const filename = path.basename(req.params.filename || '');
    if (!/^[a-zA-Z0-9_.-]+\.(webm|mp3|wav|ogg|m4a|mpeg|audio)$/i.test(filename)) {
      return res.status(400).json({ error: 'Invalid voice file name' });
    }

    const audioPath = `/uploads/voices/${filename}`;
    const pool = getPool();
    const allowed = await canAccessVoiceFile(pool, req, audioPath);
    if (!allowed) return res.status(404).json({ error: 'Voice file not found' });

    const absolutePath = path.join(voiceStorageDir, filename);
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'Voice file not found' });

    res.sendFile(absolutePath);
  } catch (err) {
    console.error('Error serving voice file:', err);
    res.status(500).json({ error: 'Could not load voice file' });
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
      mimeType: req.file?.mimetype,
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
    const clonePreparation = req.file && quality.quality_status !== 'low'
      ? await voiceCloneService.prepareVoiceProfile({
          audioSample: req.file.buffer,
          mimeType: req.file.mimetype,
          consent: profile.consent_given,
          metadata: { name, relation, language },
        })
      : null;
    const status = req.file
      ? (quality.quality_status === 'low' ? 'needs_new_sample' : clonePreparation?.status || 'sample_received')
      : (req.body.status || profile.status);

    const result = await pool.query(
      `UPDATE voice_profiles
       SET name = $1, relation = $2, language = $3, sample_audio_path = $4,
           preview_audio_path = COALESCE($4, preview_audio_path),
           status = $5, provider = $6, provider_voice_id = $7,
           quality_score = $8, quality_status = $9,
           quality_notes = $10, updated_at = NOW()
       WHERE id = $11 AND user_id = $12 AND deleted_at IS NULL
       RETURNING *`,
      [
        name,
        relation,
        language,
        samplePath,
        status,
        clonePreparation?.provider || profile.provider,
        clonePreparation?.provider_voice_id || profile.provider_voice_id,
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
      metadata: clonePreparation ? { provider: clonePreparation.provider, status } : {},
    });

    res.json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    console.error('Error updating voice profile:', err);
    res.status(500).json({ error: 'Could not update voice profile' });
  }
});

router.post('/profiles/:id/revoke-consent', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const profile = await getOwnedVoiceProfile(pool, req.user.id, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });

    let providerDeletion = null;
    if (profile.provider_voice_id) {
      try {
        providerDeletion = await voiceCloneService.deleteVoiceProfile({
          providerVoiceId: profile.provider_voice_id,
        });
      } catch (error) {
        providerDeletion = {
          deleted: false,
          reason: error?.code || error?.message || 'provider_deletion_failed',
        };
      }
    }

    const result = await pool.query(
      `UPDATE voice_profiles
       SET consent_given = FALSE,
           status = 'consent_revoked',
           provider_voice_id = NULL,
           preview_audio_path = NULL,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    await deleteStoredVoiceFile(profile.preview_audio_path);
    await pool.query(
      `DELETE FROM voice_narrations
       WHERE voice_profile_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: 'voice_consent_revoked',
      metadata: { provider_deletion: providerDeletion },
    });

    res.json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    console.error('Error revoking voice consent:', err);
    res.status(500).json({ error: 'Could not revoke voice consent' });
  }
});

router.delete('/profiles/:id', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const profile = await getOwnedVoiceProfile(pool, req.user.id, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });

    let providerDeletion = null;
    if (profile.provider_voice_id) {
      try {
        providerDeletion = await voiceCloneService.deleteVoiceProfile({
          providerVoiceId: profile.provider_voice_id,
        });
      } catch (error) {
        console.warn('Provider voice deletion failed, continuing local deletion:', error);
        providerDeletion = {
          deleted: false,
          reason: error?.code || error?.message || 'provider_deletion_failed',
        };
      }
    }

    await deleteStoredVoiceFile(profile.sample_audio_path);
    await deleteStoredVoiceFile(profile.preview_audio_path);
    const messageFiles = await pool.query(
      `SELECT audio_path FROM voice_messages
       WHERE voice_profile_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );
    await Promise.all(messageFiles.rows.map((row) => deleteStoredVoiceFile(row.audio_path)));

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
    await pool.query(
      `DELETE FROM voice_narrations
       WHERE voice_profile_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: 'voice_profile_permanently_deleted',
      metadata: { provider_deletion: providerDeletion },
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

    res.redirect(voiceFileUrl(profile.preview_audio_path));
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
    let profile = null;

    if (voiceProfileId) {
      profile = await getOwnedVoiceProfile(pool, req.user.id, voiceProfileId);
      if (!profile) return res.status(404).json({ error: 'Voice profile not found' });
    }

    const title = sanitizeText(req.body.title);
    if (!title) return res.status(400).json({ error: 'Message title is required' });

    const messageText = sanitizeText(req.body.message_text);
    let audioPath = req.file ? await saveAudioFile(req.file, req.user.id, 'message') : null;
    let generatedWithProvider = false;

    if (!audioPath && profile?.provider_voice_id && profile?.consent_given && messageText) {
      const synthesis = await voiceCloneService.synthesizeSpeech({
        providerVoiceId: profile.provider_voice_id,
        text: messageText,
      });
      const synthesizedFile = createAudioUploadFromSynthesis(synthesis, 'parent-message.mp3');
      if (synthesizedFile) {
        audioPath = await saveAudioFile(synthesizedFile, req.user.id, 'message');
        generatedWithProvider = true;
      }
    }

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
        messageText,
        sanitizeText(req.body.language, 'fr').slice(0, 12),
        audioPath,
        Math.max(0, Number.parseInt(req.body.duration_seconds || '0', 10) || 0),
      ]
    );

    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId,
      action: 'voice_message_created',
      metadata: {
        has_audio: Boolean(audioPath),
        generated_with_provider: generatedWithProvider,
        provider: profile?.provider || null,
      },
    });

    res.status(201).json(mapVoiceMessage(result.rows[0]));
  } catch (err) {
    console.error('Error creating voice message:', err);
    if (err?.isAIError) return sendAIError(res, err);
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

    res.redirect(voiceFileUrl(audioPath));
  } catch (err) {
    console.error('Error loading voice message audio:', err);
    res.status(500).json({ error: 'Could not load message audio' });
  }
});

router.delete('/messages/:id', verifyToken, requireParent, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `WITH existing AS (
         SELECT *
         FROM voice_messages
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       ),
       updated AS (
         UPDATE voice_messages
         SET deleted_at = NOW(), audio_path = NULL
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         RETURNING *
       )
       SELECT updated.*, existing.audio_path AS deleted_audio_path
       FROM updated
       JOIN existing ON existing.id = updated.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Voice message not found' });

    await deleteStoredVoiceFile(result.rows[0].deleted_audio_path);
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

router.post('/narrations', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const bookId = Number.parseInt(req.body.book_id, 10);
    const voiceProfileId = req.body.voice_profile_id ? Number.parseInt(req.body.voice_profile_id, 10) : null;

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Valid book_id is required' });
    }

    const book = await getAccessibleBook(pool, req, bookId);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (req.user.role === 'kid') {
      const policy = await loadChildAccessPolicy({ user: req.user, pool });
      const violation = getContentAccessViolation(policy, book);
      if (violation) return sendParentalAccessError(res, violation);
    }

    if (!voiceProfileId) {
      return res.json({
        audio_url: book.audio_url || null,
        source: 'original',
        cached: false,
      });
    }

    const profile = await getAccessibleVoiceProfile(pool, req, voiceProfileId);
    if (!profile || !profile.consent_given || !profile.provider_voice_id) {
      return res.json({
        audio_url: book.audio_url || null,
        source: 'original',
        cached: false,
        reason: 'cloned_voice_unavailable',
      });
    }

    const narrationText = await getBookNarrationText(pool, book);
    if (!narrationText) {
      return res.status(422).json({ error: 'No readable text available for narration' });
    }

    const textHash = hashNarration({
      text: narrationText,
      voiceProfileId: profile.id,
      providerVoiceId: profile.provider_voice_id,
    });

    const cachedResult = await pool.query(
      `SELECT *
       FROM voice_narrations
       WHERE voice_profile_id = $1 AND book_id = $2 AND text_hash = $3
       LIMIT 1`,
      [profile.id, book.id, textHash]
    );

    if (cachedResult.rows[0]?.audio_path) {
      await logVoiceAction(pool, {
        userId: req.user.id,
        voiceProfileId: profile.id,
        action: 'voice_narration_cache_hit',
        metadata: { book_id: book.id, provider: profile.provider },
      });

      return res.json({
        audio_url: voiceFileUrl(cachedResult.rows[0].audio_path),
        source: 'cloned_voice',
        cached: true,
        provider: cachedResult.rows[0].provider,
      });
    }

    const jobKey = `${profile.id}:${book.id}:${textHash}`;
    const reusedExistingJob = narrationJobs.has(jobKey);
    const generationJob = narrationJobs.get(jobKey) || (async () => {
      const synthesis = await voiceCloneService.synthesizeSpeech({
        providerVoiceId: profile.provider_voice_id,
        text: narrationText,
      });
      const synthesizedFile = createAudioUploadFromSynthesis(synthesis, `book-${book.id}-narration.mp3`);

      if (!synthesizedFile) return null;

      const audioPath = await saveAudioFile(synthesizedFile, req.user.id, 'narration');
      const insertResult = await pool.query(
        `INSERT INTO voice_narrations (
          user_id, voice_profile_id, book_id, provider, provider_voice_id,
          text_hash, audio_path, duration_seconds, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (voice_profile_id, book_id, text_hash)
        DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [
          req.user.id,
          profile.id,
          book.id,
          profile.provider || 'mock',
          profile.provider_voice_id,
          textHash,
          audioPath,
          Math.max(0, Number.parseInt(book.duration_seconds || '0', 10) || 0),
          {
            text_length: narrationText.length,
            provider_metadata: synthesis.provider_metadata || {},
          },
        ]
      );

      await logVoiceAction(pool, {
        userId: req.user.id,
        voiceProfileId: profile.id,
        action: 'voice_narration_generated',
        metadata: { book_id: book.id, provider: profile.provider, cached: false },
      });

      return insertResult.rows[0];
    })();

    if (!narrationJobs.has(jobKey)) {
      narrationJobs.set(jobKey, generationJob);
    }

    let generatedNarration = null;
    try {
      generatedNarration = await generationJob;
    } finally {
      narrationJobs.delete(jobKey);
    }

    if (!generatedNarration) {
      return res.json({
        audio_url: book.audio_url || null,
        source: 'original',
        cached: false,
        reason: 'provider_returned_no_audio',
      });
    }

    res.status(reusedExistingJob ? 200 : 201).json({
      audio_url: voiceFileUrl(generatedNarration.audio_path),
      source: 'cloned_voice',
      cached: reusedExistingJob,
      provider: generatedNarration.provider,
    });
  } catch (err) {
    console.error('Error creating voice narration:', err);
    if (err?.isAIError) return sendAIError(res, err);
    res.status(500).json({ error: 'Could not create voice narration' });
  }
});

export default router;
