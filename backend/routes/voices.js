import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { VoiceCloneService } from '../services/ai/VoiceCloneService.js';
import { aiErrorResponse, AIQuotaExceededError } from '../services/ai/errors.js';
import { voiceConfig } from '../services/voice/voiceConfig.js';
import { isAllowedAudioMetadata, validateAudioUpload } from '../services/voice/audioValidation.js';
import {
  deleteStoredVoiceFile,
  deleteStoredVoiceFiles,
  saveVoiceAudioFile as saveAudioFile,
  voiceFileUrl,
  voiceStorageDir
} from '../services/voice/voiceStorage.js';
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
    if (isAllowedAudioMetadata(file)) return cb(null, true);
    const error = new Error('Unsupported audio format');
    error.status = 415;
    cb(error);
  },
});
const voiceCloneService = new VoiceCloneService();
const narrationJobs = new Map();
const CONSENT_VERSION = 'voice-cloning-v1';
const CONSENT_TEXT = 'Explicit consent for ElevenLabs voice cloning, text-to-speech, secure storage and deletion.';
const CONSENT_TEXT_HASH = crypto.createHash('sha256').update(CONSENT_TEXT).digest('hex');

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
               AND vp.preview_audio_path = $2
           )
           OR EXISTS (
             SELECT 1 FROM voice_narrations vn
             JOIN voice_profiles vp ON vp.id = vn.voice_profile_id
             WHERE vp.user_id = kp.parent_id
               AND vp.deleted_at IS NULL
               AND vp.consent_given = TRUE
               AND vn.audio_path = $2
           )
           OR EXISTS (
             SELECT 1 FROM voice_messages vm
             WHERE vm.user_id = kp.parent_id
               AND vm.deleted_at IS NULL
               AND vm.audio_path = $2
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

async function recordConsent(pool, { req, voiceProfileId, locale }) {
  await pool.query(
    `INSERT INTO voice_consent_records (
       user_id, voice_profile_id, consent_version, legal_text_hash, scope,
       locale, ip_address, user_agent
     )
     VALUES ($1, $2, $3, $4, 'voice_clone_tts_storage', $5, $6, $7)`,
    [
      req.user.id,
      voiceProfileId,
      CONSENT_VERSION,
      CONSENT_TEXT_HASH,
      locale || 'fr',
      req.ip || null,
      req.get('user-agent') || null
    ]
  );
}

async function revokeConsentRecord(pool, profileId) {
  await pool.query(
    `UPDATE voice_consent_records
     SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE voice_profile_id = $1 AND revoked_at IS NULL`,
    [profileId]
  );
}

async function assertVoiceUsageWithinLimit(pool, userId, characterCount) {
  if (!voiceConfig.monthlyCharacterLimit) return;
  const result = await pool.query(
    `SELECT COALESCE(SUM(character_count), 0)::int AS used
     FROM voice_usage_records
     WHERE user_id = $1
       AND operation <> 'speech_to_text'
       AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  const used = Number(result.rows[0]?.used || 0);
  if (used + characterCount > voiceConfig.monthlyCharacterLimit) {
    throw new AIQuotaExceededError('Monthly voice synthesis limit reached', {
      provider: 'elevenlabs',
      retryable: false
    });
  }
}

async function recordVoiceUsage(pool, {
  userId,
  voiceProfileId,
  operation,
  characterCount,
  requestHash = null
}) {
  await pool.query(
    `INSERT INTO voice_usage_records (
       user_id, voice_profile_id, operation, provider, character_count, request_hash
     )
     VALUES ($1, $2, $3, 'elevenlabs', $4, $5)
     ON CONFLICT DO NOTHING`,
    [userId, voiceProfileId, operation, characterCount, requestHash]
  );
}

async function deleteNarrationFiles(pool, userId, voiceProfileId) {
  const files = await pool.query(
    `SELECT audio_path FROM voice_narrations
     WHERE user_id = $1 AND voice_profile_id = $2`,
    [userId, voiceProfileId]
  );
  await deleteStoredVoiceFiles(files.rows.map((row) => row.audio_path));
}

async function enqueueProviderDeletion(pool, { userId, providerVoiceId, error }) {
  if (!providerVoiceId) return;
  await pool.query(
    `INSERT INTO voice_provider_deletion_queue (
       user_id, provider, provider_voice_id, retry_count, last_error
     )
     VALUES ($1, 'elevenlabs', $2, 1, $3)
     ON CONFLICT (provider_voice_id)
     DO UPDATE SET retry_count = voice_provider_deletion_queue.retry_count + 1,
                   last_error = EXCLUDED.last_error,
                   updated_at = NOW()`,
    [userId, providerVoiceId, String(error?.code || error?.message || 'provider_deletion_failed').slice(0, 500)]
  );
}

async function retryPendingProviderDeletions(pool, userId) {
  const pending = await pool.query(
    `SELECT id, provider_voice_id
     FROM voice_provider_deletion_queue
     WHERE user_id = $1
     ORDER BY updated_at ASC
     LIMIT 3`,
    [userId]
  );
  for (const item of pending.rows) {
    try {
      await voiceCloneService.deleteVoiceProfile({ providerVoiceId: item.provider_voice_id });
      await pool.query('DELETE FROM voice_provider_deletion_queue WHERE id = $1', [item.id]);
    } catch (error) {
      await pool.query(
        `UPDATE voice_provider_deletion_queue
         SET retry_count = retry_count + 1, last_error = $2, updated_at = NOW()
         WHERE id = $1`,
        [item.id, String(error?.code || error?.message || 'provider_deletion_failed').slice(0, 500)]
      );
    }
  }
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
    .update([
      text,
      voiceProfileId,
      providerVoiceId,
      voiceConfig.providers.elevenlabs.model,
      voiceConfig.providers.elevenlabs.outputFormat,
      'stability=.55|similarity=.75|style=.2|speaker_boost=1'
    ].join('|'))
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
         AND vp.deleted_at IS NULL
         AND vp.consent_given = TRUE`,
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
    void retryPendingProviderDeletions(pool, req.user.id).catch((error) => {
      console.warn('Pending ElevenLabs deletions could not be retried:', error.message);
    });
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

    res.set({
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    });
    res.sendFile(absolutePath);
  } catch (err) {
    console.error('Error serving voice file:', err);
    res.status(500).json({ error: 'Could not load voice file' });
  }
});

router.post('/profiles', verifyToken, requireParent, upload.single('sample'), async (req, res) => {
  let samplePath = null;
  let previewPath = null;
  let providerVoiceId = null;
  let client = null;
  try {
    const pool = getPool();
    const validatedAudio = validateAudioUpload(req.file, { minBytes: 40000 });
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

    const quality = voiceCloneService.evaluateAudioQuality({
      audioBuffer: req.file.buffer,
      mimeType: validatedAudio.mimeType,
    });
    if (quality.quality_status === 'low') {
      return res.status(422).json({
        error: 'Audio sample is too short for reliable voice cloning',
        quality
      });
    }

    const clonePreparation = await voiceCloneService.prepareVoiceProfile({
      audioSample: req.file.buffer,
      mimeType: validatedAudio.mimeType,
      consent: consentGiven,
      metadata: { name, relation, language },
    });
    providerVoiceId = clonePreparation.provider_voice_id;
    if (!providerVoiceId) {
      return res.status(502).json({ error: 'ElevenLabs did not create a usable voice profile' });
    }

    const previewText = language.startsWith('en')
      ? `Hello, I am ${name}. I am ready to tell you a wonderful story.`
      : language.startsWith('ar')
        ? `مرحباً، أنا ${name}. أنا مستعد لأحكي لك قصة رائعة.`
        : `Bonjour, je suis ${name}. Je suis prêt à te raconter une merveilleuse histoire.`;
    await assertVoiceUsageWithinLimit(pool, req.user.id, previewText.length);
    const previewSynthesis = await voiceCloneService.synthesizeSpeech({
      providerVoiceId,
      text: previewText
    });
    const previewFile = createAudioUploadFromSynthesis(previewSynthesis, 'voice-preview.mp3');
    if (!previewFile) throw new Error('ElevenLabs returned no preview audio');

    samplePath = await saveAudioFile(req.file, req.user.id, 'sample', validatedAudio);
    previewPath = await saveAudioFile(previewFile, req.user.id, 'preview');
    client = await pool.connect();
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO voice_profiles (
        user_id, name, relation, language, status, provider, provider_voice_id,
        sample_audio_path, preview_audio_path, consent_given, consent_at,
        quality_score, quality_status, quality_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), $10, $11, $12)
      RETURNING *`,
      [
        req.user.id,
        name,
        relation,
        language,
        clonePreparation.status,
        clonePreparation.provider,
        providerVoiceId,
        samplePath,
        previewPath,
        quality.quality_score,
        quality.quality_status,
        quality.quality_notes,
      ]
    );

    await recordConsent(client, {
      req,
      voiceProfileId: result.rows[0].id,
      locale: language
    });
    await recordVoiceUsage(client, {
      userId: req.user.id,
      voiceProfileId: result.rows[0].id,
      operation: 'voice_preview',
      characterCount: previewText.length,
      requestHash: crypto.createHash('sha256').update(`preview|${providerVoiceId}|${previewText}`).digest('hex')
    });
    await logVoiceAction(client, {
      userId: req.user.id,
      voiceProfileId: result.rows[0].id,
      action: 'voice_profile_created',
      metadata: {
        quality_status: quality.quality_status,
        provider: clonePreparation.provider,
        status: clonePreparation.status,
        consent_version: CONSENT_VERSION
      },
    });
    await client.query('COMMIT');

    res.status(201).json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    await deleteStoredVoiceFiles([samplePath, previewPath]);
    if (providerVoiceId) {
      await voiceCloneService.deleteVoiceProfile({ providerVoiceId }).catch(() => {});
    }
    console.error('Error creating voice profile:', err);
    if (err?.isAIError) return sendAIError(res, err);
    res.status(err?.status || 500).json({ error: err?.status ? err.message : 'Could not create voice profile' });
  } finally {
    client?.release();
  }
});

router.put('/profiles/:id', verifyToken, requireParent, upload.single('sample'), async (req, res) => {
  let newSamplePath = null;
  let newPreviewPath = null;
  let newProviderVoiceId = null;
  let client = null;
  try {
    const pool = getPool();
    const profile = await getOwnedVoiceProfile(pool, req.user.id, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Voice profile not found' });

    const name = sanitizeText(req.body.name, profile.name);
    const relation = sanitizeText(req.body.relation, profile.relation);
    const language = sanitizeText(req.body.language, profile.language).slice(0, 12);
    const explicitConsent = req.body.consent_given === 'true' || req.body.consent_given === true;
    if (req.file && (!profile.consent_given || !explicitConsent)) {
      return res.status(400).json({ error: 'Explicit consent is required for a new voice sample' });
    }
    const validatedAudio = req.file ? validateAudioUpload(req.file, { minBytes: 40000 }) : null;
    const quality = req.file
      ? voiceCloneService.evaluateAudioQuality({ audioBuffer: req.file.buffer, mimeType: validatedAudio.mimeType })
      : {
          quality_score: profile.quality_score,
          quality_status: profile.quality_status,
          quality_notes: profile.quality_notes,
        };
    if (req.file && quality.quality_status === 'low') {
      return res.status(422).json({ error: 'Audio sample is too short for reliable voice cloning', quality });
    }
    const clonePreparation = req.file && quality.quality_status !== 'low'
      ? await voiceCloneService.prepareVoiceProfile({
          audioSample: req.file.buffer,
          mimeType: validatedAudio.mimeType,
          consent: explicitConsent,
          metadata: { name, relation, language },
        })
      : null;
    newProviderVoiceId = clonePreparation?.provider_voice_id || null;
    if (req.file && !newProviderVoiceId) {
      throw new Error('ElevenLabs did not create a usable voice profile');
    }
    if (req.file) {
      const previewText = `Bonjour, je suis ${name}. Je suis prêt à te raconter une merveilleuse histoire.`;
      await assertVoiceUsageWithinLimit(pool, req.user.id, previewText.length);
      const previewSynthesis = await voiceCloneService.synthesizeSpeech({
        providerVoiceId: newProviderVoiceId,
        text: previewText
      });
      const previewFile = createAudioUploadFromSynthesis(previewSynthesis, 'voice-preview.mp3');
      if (!previewFile) throw new Error('ElevenLabs returned no preview audio');
      newSamplePath = await saveAudioFile(req.file, req.user.id, 'sample', validatedAudio);
      newPreviewPath = await saveAudioFile(previewFile, req.user.id, 'preview');
    }
    const status = req.file
      ? (quality.quality_status === 'low' ? 'needs_new_sample' : clonePreparation?.status || 'sample_received')
      : (req.body.status || profile.status);

    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE voice_profiles
       SET name = $1, relation = $2, language = $3, sample_audio_path = $4,
           preview_audio_path = $5,
           status = $6, provider = $7, provider_voice_id = $8,
           quality_score = $9, quality_status = $10,
           quality_notes = $11,
           consent_given = CASE WHEN $12 THEN TRUE ELSE consent_given END,
           consent_at = CASE WHEN $12 THEN NOW() ELSE consent_at END,
           updated_at = NOW()
       WHERE id = $13 AND user_id = $14 AND deleted_at IS NULL
       RETURNING *`,
      [
        name,
        relation,
        language,
        newSamplePath || profile.sample_audio_path,
        newPreviewPath || profile.preview_audio_path,
        status,
        clonePreparation?.provider || profile.provider,
        newProviderVoiceId || profile.provider_voice_id,
        quality.quality_score,
        quality.quality_status,
        quality.quality_notes,
        Boolean(req.file),
        req.params.id,
        req.user.id,
      ]
    );

    if (req.file) {
      await recordConsent(client, { req, voiceProfileId: req.params.id, locale: language });
      await recordVoiceUsage(client, {
        userId: req.user.id,
        voiceProfileId: req.params.id,
        operation: 'voice_preview',
        characterCount: `Bonjour, je suis ${name}. Je suis prêt à te raconter une merveilleuse histoire.`.length,
        requestHash: crypto.createHash('sha256').update(`preview|${newProviderVoiceId}|${Date.now()}`).digest('hex')
      });
    }

    await logVoiceAction(client, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: req.file ? 'voice_profile_sample_updated' : 'voice_profile_updated',
      metadata: clonePreparation ? { provider: clonePreparation.provider, status } : {},
    });
    await client.query('COMMIT');

    if (req.file) {
      const committedProviderVoiceId = newProviderVoiceId;
      newSamplePath = null;
      newPreviewPath = null;
      newProviderVoiceId = null;
      await deleteStoredVoiceFiles([profile.sample_audio_path, profile.preview_audio_path]);
      if (profile.provider_voice_id && profile.provider_voice_id !== committedProviderVoiceId) {
        await voiceCloneService.deleteVoiceProfile({ providerVoiceId: profile.provider_voice_id }).catch((error) => {
          console.warn('Previous provider voice could not be deleted:', error.message);
          return enqueueProviderDeletion(pool, {
            userId: req.user.id,
            providerVoiceId: profile.provider_voice_id,
            error
          }).catch((queueError) => {
            console.error('Provider deletion could not be queued:', queueError.message);
          });
        });
      }
    }

    res.json(mapVoiceProfile(result.rows[0]));
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    await deleteStoredVoiceFiles([newSamplePath, newPreviewPath]);
    if (newProviderVoiceId) {
      await voiceCloneService.deleteVoiceProfile({ providerVoiceId: newProviderVoiceId }).catch(() => {});
    }
    console.error('Error updating voice profile:', err);
    if (err?.isAIError) return sendAIError(res, err);
    res.status(err?.status || 500).json({ error: err?.status ? err.message : 'Could not update voice profile' });
  } finally {
    client?.release();
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
           status = CASE WHEN $3 THEN 'consent_revoked' ELSE 'provider_deletion_pending' END,
           provider_voice_id = CASE WHEN $3 THEN NULL ELSE provider_voice_id END,
           sample_audio_path = NULL,
           preview_audio_path = NULL,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.id, providerDeletion?.deleted !== false]
    );

    await deleteStoredVoiceFiles([profile.sample_audio_path, profile.preview_audio_path]);
    await deleteNarrationFiles(pool, req.user.id, req.params.id);
    await pool.query(
      `DELETE FROM voice_narrations
       WHERE voice_profile_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await revokeConsentRecord(pool, req.params.id);

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
      providerDeletion = await voiceCloneService.deleteVoiceProfile({
        providerVoiceId: profile.provider_voice_id,
      });
    }

    await deleteStoredVoiceFile(profile.sample_audio_path);
    await deleteStoredVoiceFile(profile.preview_audio_path);
    const messageFiles = await pool.query(
      `SELECT audio_path FROM voice_messages
       WHERE voice_profile_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );
    await Promise.all(messageFiles.rows.map((row) => deleteStoredVoiceFile(row.audio_path)));
    await deleteNarrationFiles(pool, req.user.id, req.params.id);

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
    await revokeConsentRecord(pool, req.params.id);
    await logVoiceAction(pool, {
      userId: req.user.id,
      voiceProfileId: req.params.id,
      action: 'voice_profile_permanently_deleted',
      metadata: { provider_deletion: providerDeletion },
    });

    res.json({ message: 'Voice profile deleted permanently' });
  } catch (err) {
    console.error('Error deleting voice profile:', err);
    if (err?.isAIError) return sendAIError(res, err);
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

async function getKidParentUserId(pool, kidProfileId) {
  const result = await pool.query(
    'SELECT parent_id FROM kids_profiles WHERE id = $1',
    [kidProfileId]
  );
  return result.rows[0]?.parent_id || null;
}

router.get('/messages/available', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    let ownerUserId = null;

    if (['parent', 'admin'].includes(req.user?.role)) {
      ownerUserId = req.user.id;
    } else if (req.user?.role === 'kid' && req.user.kid_profile_id) {
      ownerUserId = await getKidParentUserId(pool, req.user.kid_profile_id);
    }

    if (!ownerUserId) {
      return res.status(403).json({ error: 'Voice message access denied' });
    }

    const result = await pool.query(
      `SELECT * FROM voice_messages
       WHERE user_id = $1 AND deleted_at IS NULL AND audio_path IS NOT NULL
       ORDER BY created_at DESC`,
      [ownerUserId]
    );
    res.json(result.rows.map(mapVoiceMessage));
  } catch (err) {
    console.error('Error loading available voice messages:', err);
    res.status(500).json({ error: 'Could not load voice messages' });
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
  let audioPath = null;
  let messagePersisted = false;
  try {
    const pool = getPool();
    const validatedAudio = req.file ? validateAudioUpload(req.file, { required: false }) : null;
    const voiceProfileId = req.body.voice_profile_id || null;
    let profile = null;

    if (voiceProfileId) {
      profile = await getOwnedVoiceProfile(pool, req.user.id, voiceProfileId);
      if (!profile) return res.status(404).json({ error: 'Voice profile not found' });
    }

    const title = sanitizeText(req.body.title);
    if (!title) return res.status(400).json({ error: 'Message title is required' });

    const messageText = sanitizeText(req.body.message_text);
    audioPath = req.file ? await saveAudioFile(req.file, req.user.id, 'message', validatedAudio) : null;
    let generatedWithProvider = false;

    if (!audioPath && profile?.provider_voice_id && profile?.consent_given && messageText) {
      await assertVoiceUsageWithinLimit(pool, req.user.id, messageText.length);
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
    messagePersisted = true;
    if (generatedWithProvider) {
      await recordVoiceUsage(pool, {
        userId: req.user.id,
        voiceProfileId,
        operation: 'voice_message',
        characterCount: messageText.length,
        requestHash: crypto.createHash('sha256').update(`message|${result.rows[0].id}|${profile.provider_voice_id}`).digest('hex')
      });
    }

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
    if (!messagePersisted) await deleteStoredVoiceFile(audioPath);
    console.error('Error creating voice message:', err);
    if (err?.isAIError) return sendAIError(res, err);
    res.status(500).json({ error: 'Could not create voice message' });
  }
});

router.get('/messages/:id/audio', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    let ownerUserId = null;

    if (['parent', 'admin'].includes(req.user?.role)) {
      ownerUserId = req.user.id;
    } else if (req.user?.role === 'kid' && req.user.kid_profile_id) {
      ownerUserId = await getKidParentUserId(pool, req.user.kid_profile_id);
    }

    if (!ownerUserId) {
      return res.status(403).json({ error: 'Voice message access denied' });
    }

    const result = await pool.query(
      `SELECT audio_path FROM voice_messages
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, ownerUserId]
    );

    const audioPath = result.rows[0]?.audio_path;
    if (!audioPath) return res.status(404).json({ error: 'Message audio not found' });

    const allowed = await canAccessVoiceFile(pool, req, audioPath);
    if (!allowed) return res.status(404).json({ error: 'Message audio not found' });

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
      await assertVoiceUsageWithinLimit(pool, req.user.id, narrationText.length);
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
        DO NOTHING
        RETURNING *`,
        [
          req.user.id,
          profile.id,
          book.id,
          profile.provider || 'elevenlabs',
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
      let storedNarration = insertResult.rows[0] || null;
      if (!storedNarration) {
        await deleteStoredVoiceFile(audioPath);
        const winner = await pool.query(
          `SELECT * FROM voice_narrations
           WHERE voice_profile_id = $1 AND book_id = $2 AND text_hash = $3
           LIMIT 1`,
          [profile.id, book.id, textHash]
        );
        storedNarration = winner.rows[0] || null;
      } else {
        await recordVoiceUsage(pool, {
          userId: req.user.id,
          voiceProfileId: profile.id,
          operation: 'book_narration',
          characterCount: narrationText.length,
          requestHash: `narration|${profile.id}|${book.id}|${textHash}`
        });
      }

      await logVoiceAction(pool, {
        userId: req.user.id,
        voiceProfileId: profile.id,
        action: 'voice_narration_generated',
        metadata: { book_id: book.id, provider: profile.provider, cached: false },
      });

      return storedNarration;
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

router.post('/narrations/stream', verifyToken, async (req, res) => {
  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abortController.abort();
  });

  try {
    const pool = getPool();
    const bookId = Number.parseInt(req.body.book_id, 10);
    const voiceProfileId = Number.parseInt(req.body.voice_profile_id, 10);
    if (!Number.isInteger(bookId) || bookId <= 0 || !Number.isInteger(voiceProfileId) || voiceProfileId <= 0) {
      return res.status(400).json({ error: 'Valid book_id and voice_profile_id are required' });
    }

    const book = await getAccessibleBook(pool, req, bookId);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (req.user.role === 'kid') {
      const policy = await loadChildAccessPolicy({ user: req.user, pool });
      const violation = getContentAccessViolation(policy, book);
      if (violation) return sendParentalAccessError(res, violation);
    }

    const profile = await getAccessibleVoiceProfile(pool, req, voiceProfileId);
    if (!profile || !profile.consent_given || !profile.provider_voice_id) {
      return res.status(409).json({ error: 'Cloned voice is unavailable' });
    }
    const narrationText = await getBookNarrationText(pool, book);
    if (!narrationText) return res.status(422).json({ error: 'No readable text available for narration' });

    const textHash = hashNarration({
      text: narrationText,
      voiceProfileId: profile.id,
      providerVoiceId: profile.provider_voice_id
    });
    const cachedResult = await pool.query(
      `SELECT * FROM voice_narrations
       WHERE voice_profile_id = $1 AND book_id = $2 AND text_hash = $3
       LIMIT 1`,
      [profile.id, book.id, textHash]
    );
    const cachedPath = cachedResult.rows[0]?.audio_path;
    if (cachedPath) {
      const absolutePath = path.join(voiceStorageDir, path.basename(cachedPath));
      if (fs.existsSync(absolutePath)) {
        res.set({
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Voice-Cache': 'hit',
          'X-Content-Type-Options': 'nosniff'
        });
        await logVoiceAction(pool, {
          userId: req.user.id,
          voiceProfileId: profile.id,
          action: 'voice_narration_stream_cache_hit',
          metadata: { book_id: book.id, provider: profile.provider }
        });
        return fs.createReadStream(absolutePath).pipe(res);
      }
    }

    await assertVoiceUsageWithinLimit(pool, req.user.id, narrationText.length);
    res.status(200);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Voice-Cache': 'miss',
      'X-Content-Type-Options': 'nosniff'
    });
    res.flushHeaders();

    const synthesis = await voiceCloneService.synthesizeSpeechStream({
      providerVoiceId: profile.provider_voice_id,
      text: narrationText,
      signal: abortController.signal,
      onChunk: async (chunk) => {
        if (abortController.signal.aborted || res.destroyed) return;
        if (!res.write(chunk)) {
          await new Promise((resolve) => {
            const done = () => {
              res.off('drain', done);
              res.off('close', done);
              resolve();
            };
            res.once('drain', done);
            res.once('close', done);
          });
        }
      }
    });

    if (!abortController.signal.aborted && synthesis?.audioBuffer?.length) {
      const synthesizedFile = createAudioUploadFromSynthesis(synthesis, `book-${book.id}-stream.mp3`);
      const audioPath = await saveAudioFile(synthesizedFile, req.user.id, 'narration');
      const insertResult = await pool.query(
        `INSERT INTO voice_narrations (
           user_id, voice_profile_id, book_id, provider, provider_voice_id,
           text_hash, audio_path, duration_seconds, metadata
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (voice_profile_id, book_id, text_hash) DO NOTHING
         RETURNING id`,
        [
          req.user.id,
          profile.id,
          book.id,
          profile.provider || 'elevenlabs',
          profile.provider_voice_id,
          textHash,
          audioPath,
          Math.max(0, Number.parseInt(book.duration_seconds || '0', 10) || 0),
          {
            text_length: narrationText.length,
            streamed: true,
            provider_metadata: synthesis.provider_metadata || {}
          }
        ]
      );
      if (insertResult.rows.length === 0) {
        await deleteStoredVoiceFile(audioPath);
      } else {
        await recordVoiceUsage(pool, {
          userId: req.user.id,
          voiceProfileId: profile.id,
          operation: 'book_narration_stream',
          characterCount: narrationText.length,
          requestHash: `narration|${profile.id}|${book.id}|${textHash}`
        });
      }
    }

    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error('Error streaming voice narration:', err);
    if (res.headersSent) {
      if (!res.writableEnded) res.destroy(err);
      return;
    }
    if (err?.isAIError) return sendAIError(res, err);
    res.status(err?.status || 500).json({ error: err?.status ? err.message : 'Could not stream voice narration' });
  }
});

export default router;
