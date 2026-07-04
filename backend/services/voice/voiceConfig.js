export const voiceConfig = {
  provider: (process.env.VOICE_PROVIDER || 'mock').toLowerCase(),
  timeoutMs: Math.max(3000, Number.parseInt(process.env.VOICE_TIMEOUT_MS || process.env.AI_TIMEOUT_MS || '15000', 10)),
  providers: {
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      baseUrl: (process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1').replace(/\/+$/, ''),
      model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
      maxRetries: Math.max(0, Number.parseInt(process.env.ELEVENLABS_MAX_RETRIES || '2', 10))
    }
  }
};
