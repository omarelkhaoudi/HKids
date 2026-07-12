import test from 'node:test';
import assert from 'node:assert/strict';
import { isServerTextToSpeechConfigured } from '../services/ai/textToSpeechService.js';

test('offline manifest route module exports a router', async () => {
  const module = await import('../routes/offline.js');
  assert.equal(typeof module.default, 'function');
});

test('isServerTextToSpeechConfigured reflects voice env configuration', () => {
  const originalKey = process.env.ELEVENLABS_API_KEY;
  const originalVoice = process.env.ELEVENLABS_DEFAULT_VOICE_ID;
  process.env.ELEVENLABS_API_KEY = '';
  process.env.ELEVENLABS_DEFAULT_VOICE_ID = '';
  assert.equal(isServerTextToSpeechConfigured(), false);
  process.env.ELEVENLABS_API_KEY = originalKey;
  process.env.ELEVENLABS_DEFAULT_VOICE_ID = originalVoice;
});
