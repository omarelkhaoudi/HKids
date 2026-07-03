import { aiConfig } from './aiConfig.js';
import { AIProviderUnavailableError } from './errors.js';
import { ClaudeProvider } from './providers/ClaudeProvider.js';
import { GeminiProvider } from './providers/GeminiProvider.js';
import { MockAIProvider } from './providers/MockAIProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

const providers = new Map();

function createProvider(providerName) {
  if (providerName === 'mock') return new MockAIProvider();
  if (providerName === 'openai') return new OpenAIProvider(aiConfig.providers.openai);
  if (providerName === 'gemini') return new GeminiProvider(aiConfig.providers.gemini);
  if (providerName === 'claude') return new ClaudeProvider(aiConfig.providers.claude);

  throw new AIProviderUnavailableError(`Unknown AI provider: ${providerName}`, {
    provider: providerName
  });
}

export class AIProviderFactory {
  static getProvider(providerName = aiConfig.provider) {
    const normalizedName = String(providerName || 'mock').toLowerCase();

    if (!providers.has(normalizedName)) {
      providers.set(normalizedName, createProvider(normalizedName));
    }

    return providers.get(normalizedName);
  }

  static getActiveProviderName() {
    return aiConfig.provider;
  }
}
