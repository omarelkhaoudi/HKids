import express from 'express';
import multer from 'multer';
import { verifyToken } from './auth.js';
import { getVoiceAssistantReply } from '../services/ai/voiceAssistantService.js';
import { transcribeAudio } from '../services/ai/SpeechToTextService.js';
import { aiErrorResponse } from '../services/ai/errors.js';
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
  }
});

function canUseAI(user) {
  return ['kid', 'parent', 'admin'].includes(user?.role);
}

router.post('/transcribe', verifyToken, upload.single('audio'), enforceParentalAccess(), async (req, res) => {
  try {
    if (!canUseAI(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'audio file is required' });
    }

    const result = await transcribeAudio({
      audioBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      language: req.body.language || 'fr-FR'
    });

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

export default router;
