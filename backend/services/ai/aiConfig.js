const timeoutMs = Math.max(3000, Number.parseInt(process.env.AI_TIMEOUT_MS || '20000', 10));
const maxRetries = Math.max(0, Number.parseInt(process.env.AI_MAX_RETRIES || '2', 10));

export const aiConfig = {
  provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  transcriptionProvider: (process.env.AI_TRANSCRIPTION_PROVIDER || '').toLowerCase() || null,
  timeoutMs,
  maxRetries,
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
      timeoutMs,
      maxRetries: Math.max(0, Number.parseInt(process.env.OPENAI_MAX_RETRIES || String(maxRetries), 10)),
      cacheTtlMs: Math.max(0, Number.parseInt(process.env.OPENAI_CACHE_TTL_MS || '300000', 10)),
      maxCacheEntries: Math.max(20, Number.parseInt(process.env.OPENAI_MAX_CACHE_ENTRIES || '200', 10))
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      baseUrl: (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, ''),
      timeoutMs,
      maxRetries
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest',
      baseUrl: (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/+$/, ''),
      apiVersion: process.env.ANTHROPIC_API_VERSION || '2023-06-01',
      timeoutMs,
      maxRetries
    }
  }
};
