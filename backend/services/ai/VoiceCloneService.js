import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

export class VoiceCloneService {
  constructor({ aiProvider = AIProviderFactory.getProvider(), timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async cloneVoice({ audioSample, consent, metadata = {} }) {
    try {
      return await withAITimeout(
        this.aiProvider.cloneVoice({ audioSample, consent, metadata }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Voice clone request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'Voice clone service failed'
      });
    }
  }
}
