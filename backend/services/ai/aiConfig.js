export const aiConfig = {
  provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  timeoutMs: Math.max(3000, Number.parseInt(process.env.AI_TIMEOUT_MS || '15000', 10)),
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || ''
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
