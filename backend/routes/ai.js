import express from 'express';
import multer from 'multer';
import { verifyToken } from './auth.js';
import {
  getVoiceAssistantReply,
  streamVoiceAssistantReply
} from '../services/ai/voiceAssistantService.js';
import { transcribeAudio } from '../services/ai/SpeechToTextService.js';
import { aiErrorResponse, AIQuotaExceededError } from '../services/ai/errors.js';
import { isAllowedAudioMetadata, validateAudioUpload } from '../services/voice/audioValidation.js';
import { voiceConfig } from '../services/voice/voiceConfig.js';
import { aiConfig } from '../services/ai/aiConfig.js';
import { getDatabase } from '../database/init.js';
import {
  loadVoiceAssistantContext,
  normalizeConversation
} from '../services/ai/voiceAssistantContextService.js';
import { enforceParentalAccess } from '../middleware/parentalAccess.js';
import {
  getTextAccessViolation,
  loadChildAccessPolicy,
  sendParentalAccessError
} from '../services/parental/parentalAccessService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (isAllowedAudioMetadata(file)) return cb(null, true);
    const error = new Error('Unsupported audio format');
    error.status = 415;
    cb(error);
  }
});

function canUseAI(user) {
  return ['kid', 'parent', 'admin'].includes(user?.role);
}

async function assertElevenLabsSttQuota(userId, audioBytes) {
  if (aiConfig.transcriptionProvider !== 'elevenlabs' || !voiceConfig.monthlySttBytesLimit) return;
  const pool = getDatabase();
  const result = await pool.query(
    `SELECT COALESCE(SUM(character_count), 0)::bigint AS used
     FROM voice_usage_records
     WHERE user_id = $1
       AND operation = 'speech_to_text'
       AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  if (Number(result.rows[0]?.used || 0) + audioBytes > voiceConfig.monthlySttBytesLimit) {
    throw new AIQuotaExceededError('Monthly speech-to-text limit reached', {
      provider: 'elevenlabs',
      retryable: false
    });
  }
}

async function recordElevenLabsSttUsage(userId, audioBytes) {
  if (aiConfig.transcriptionProvider !== 'elevenlabs') return;
  await getDatabase().query(
    `INSERT INTO voice_usage_records (
       user_id, operation, provider, character_count
     )
     VALUES ($1, 'speech_to_text', 'elevenlabs', $2)`,
    [userId, audioBytes]
  );
}

router.post('/transcribe', verifyToken, upload.single('audio'), enforceParentalAccess(), async (req, res) => {
  try {
    if (!canUseAI(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validatedAudio = validateAudioUpload(req.file, { maxBytes: 8 * 1024 * 1024 });
    await assertElevenLabsSttQuota(req.user.id, validatedAudio.size);

    const result = await transcribeAudio({
      audioBuffer: req.file.buffer,
      mimeType: validatedAudio.mimeType,
      language: req.body.language || 'fr-FR'
    });
    await recordElevenLabsSttUsage(req.user.id, validatedAudio.size);

    if (!result.transcript) {
      return res.status(422).json({
        error: 'Could not transcribe audio',
        code: 'EMPTY_TRANSCRIPT'
      });
    }

    res.json(result);
  } catch (err) {
    if (err?.isAIError) {
      const { status, body } = aiErrorResponse(err);
      return res.status(status).json(body);
    }

    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Audio file is too large' });
    }

    console.error('Error transcribing voice assistant audio:', err);
    res.status(err.status || 500).json({ error: err.message || 'Speech transcription failed' });
  }
});

router.post('/voice-assistant', verifyToken, async (req, res) => {
  try {
    const {
      transcript,
      conversation,
      kid_profile_id: requestedKidProfileId,
      language: requestedLanguage
    } = req.body;

    if (typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }

    if (!canUseAI(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const accessPolicy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId
    });
    const restriction = getTextAccessViolation(accessPolicy, transcript);
    if (restriction) {
      return sendParentalAccessError(res, restriction);
    }

    const assistantContext = await loadVoiceAssistantContext({
      user: req.user,
      requestedKidProfileId,
      requestedLanguage,
      policy: accessPolicy
    });

    const reply = await getVoiceAssistantReply({
      transcript,
      user: req.user,
      context: assistantContext,
      conversation: normalizeConversation(conversation),
      requestedLanguage
    });

    res.json(reply);
  } catch (err) {
    if (err?.isAIError) {
      const { status, body } = aiErrorResponse(err);
      return res.status(status).json(body);
    }

    console.error('Error in voice assistant:', err);
    res.status(500).json({ error: 'AI assistant error' });
  }
});

router.post('/voice-assistant/stream', verifyToken, async (req, res) => {
  const abortController = new AbortController();
  const handleClientClose = () => {
    if (!res.writableEnded) abortController.abort();
  };

  try {
    const {
      transcript,
      conversation,
      kid_profile_id: requestedKidProfileId,
      language: requestedLanguage
    } = req.body;

    if (typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }
    if (!canUseAI(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const accessPolicy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId
    });
    const restriction = getTextAccessViolation(accessPolicy, transcript);
    if (restriction) return sendParentalAccessError(res, restriction);

    const assistantContext = await loadVoiceAssistantContext({
      user: req.user,
      requestedKidProfileId,
      requestedLanguage,
      policy: accessPolicy
    });

    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.on('close', handleClientClose);
    res.flushHeaders?.();

    const reply = await streamVoiceAssistantReply({
      transcript,
      user: req.user,
      context: assistantContext,
      conversation: normalizeConversation(conversation),
      requestedLanguage
    }, {
      onChunk: async (chunk) => {
        if (!res.writableEnded) {
          res.write(`event: delta\ndata: ${JSON.stringify({ field: 'reply_text', chunk })}\n\n`);
        }
      },
      signal: abortController.signal
    });

    if (!res.writableEnded) {
      res.off('close', handleClientClose);
      res.write(`event: done\ndata: ${JSON.stringify(reply)}\n\n`);
      res.end();
    }
  } catch (err) {
    res.off('close', handleClientClose);
    const { status, body } = aiErrorResponse(err);
    if (!res.headersSent) return res.status(status).json(body);
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify(body)}\n\n`);
      res.end();
    }
  }
});

export default router;
