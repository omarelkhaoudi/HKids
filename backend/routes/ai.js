import express from 'express';
import { verifyToken } from './auth.js';
import { getVoiceAssistantReply } from '../services/ai/voiceAssistantService.js';

const router = express.Router();

router.post('/voice-assistant', verifyToken, async (req, res) => {
  try {
    const { transcript } = req.body;

    if (typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }

    if (!['kid', 'parent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reply = await getVoiceAssistantReply({
      transcript,
      user: req.user,
    });

    res.json(reply);
  } catch (err) {
    console.error('Error in voice assistant:', err);
    res.status(500).json({ error: 'AI assistant error' });
  }
});

export default router;
