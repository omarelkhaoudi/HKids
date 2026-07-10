import { aiConfig } from './aiConfig.js';
import { AIProviderUnavailableError } from './errors.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { GeminiProvider } from './providers/GeminiProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

const providers = new Map();

function createProvider(providerName) {
  if (providerName === 'openai') return new OpenAIProvider(aiConfig.providers.openai);
  if (providerName === 'gemini') return new GeminiProvider(aiConfig.providers.gemini);
  if (providerName === 'anthropic') return new AnthropicProvider(aiConfig.providers.anthropic);

  throw new AIProviderUnavailableError(`Unknown AI provider: ${providerName}`, {
    provider: providerName,
    retryable: false
  });
}

export class AIProviderFactory {
  static getProvider(providerName = aiConfig.provider) {
    const requestedName = String(providerName || aiConfig.provider).toLowerCase();
    // Keep the former environment value working while exposing Anthropic consistently.
    const normalizedName = requestedName === 'claude' ? 'anthropic' : requestedName;

    if (!providers.has(normalizedName)) {
      providers.set(normalizedName, createProvider(normalizedName));
    }

    return providers.get(normalizedName);
  }

  static getActiveProviderName() {
    return aiConfig.provider;
  }
}
