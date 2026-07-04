import { AIProviderUnavailableError } from '../ai/errors.js';
import { voiceConfig } from './voiceConfig.js';
import { ElevenLabsProvider } from './providers/ElevenLabsProvider.js';
import { MockVoiceProvider } from './providers/MockVoiceProvider.js';

const providers = new Map();

function createProvider(providerName) {
  if (providerName === 'mock') return new MockVoiceProvider();
  if (providerName === 'elevenlabs') return new ElevenLabsProvider(voiceConfig.providers.elevenlabs);

  throw new AIProviderUnavailableError(`Unknown voice provider: ${providerName}`, {
    provider: providerName
  });
}

export class VoiceProviderFactory {
  static getProvider(providerName = voiceConfig.provider) {
    const normalizedName = String(providerName || 'mock').toLowerCase();
    if (!providers.has(normalizedName)) {
      providers.set(normalizedName, createProvider(normalizedName));
    }
    return providers.get(normalizedName);
  }

  static getActiveProviderName() {
    return voiceConfig.provider;
  }
}
