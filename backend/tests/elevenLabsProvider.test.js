import test from 'node:test';
import assert from 'node:assert/strict';
import { ElevenLabsProvider } from '../services/voice/providers/ElevenLabsProvider.js';

test('ElevenLabsProvider rejects successful non-audio synthesis payloads', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(Buffer.from('{"error":"not audio"}'), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

  try {
    const provider = new ElevenLabsProvider({
      apiKey: 'test-key',
      baseUrl: 'https://elevenlabs.test',
      maxRetries: 0
    });

    await assert.rejects(
      () => provider.synthesizeSpeech({ providerVoiceId: 'voice-1', text: 'hello' }),
      (error) => error.code === 'AI_PROVIDER_UNAVAILABLE'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ElevenLabsProvider treats missing remote voice as already deleted', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', {
    status: 404,
    headers: { 'content-type': 'application/json' }
  });

  try {
    const provider = new ElevenLabsProvider({
      apiKey: 'test-key',
      baseUrl: 'https://elevenlabs.test',
      maxRetries: 0
    });

    const result = await provider.deleteVoiceProfile({ providerVoiceId: 'voice-1' });
    assert.equal(result.deleted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
