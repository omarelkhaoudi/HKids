export const aiConfig = {
  provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  timeoutMs: Math.max(3000, Number.parseInt(process.env.AI_TIMEOUT_MS || '15000', 10)),
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
      maxRetries: Math.max(0, Number.parseInt(process.env.OPENAI_MAX_RETRIES || '2', 10)),
      cacheTtlMs: Math.max(0, Number.parseInt(process.env.OPENAI_CACHE_TTL_MS || '300000', 10)),
      maxCacheEntries: Math.max(20, Number.parseInt(process.env.OPENAI_MAX_CACHE_ENTRIES || '200', 10))
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || ''
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      model: process.env.CLAUDE_MODEL || ''
    }
  }
};
