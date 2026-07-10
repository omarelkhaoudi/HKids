export const voiceConfig = {
  provider: (process.env.VOICE_PROVIDER || 'elevenlabs').toLowerCase(),
  timeoutMs: Math.max(3000, Number.parseInt(process.env.VOICE_TIMEOUT_MS || '30000', 10)),
  monthlyCharacterLimit: Math.max(0, Number.parseInt(process.env.ELEVENLABS_MONTHLY_CHARACTER_LIMIT || '200000', 10)),
  monthlySttBytesLimit: Math.max(0, Number.parseInt(process.env.ELEVENLABS_MONTHLY_STT_BYTES_LIMIT || String(100 * 1024 * 1024), 10)),
  providers: {
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      baseUrl: (process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1').replace(/\/+$/, ''),
      model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
      speechToTextModel: process.env.ELEVENLABS_STT_MODEL || 'scribe_v1',
      outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128',
      timeoutMs: Math.max(3000, Number.parseInt(process.env.VOICE_TIMEOUT_MS || '30000', 10)),
      maxRetries: Math.max(0, Number.parseInt(process.env.ELEVENLABS_MAX_RETRIES || '2', 10))
    }
  }
};
