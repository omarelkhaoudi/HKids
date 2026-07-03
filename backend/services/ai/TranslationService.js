import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

export class TranslationService {
  constructor({ aiProvider = AIProviderFactory.getProvider(), timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async translate({ text, sourceLanguage = null, targetLanguage, context = {} }) {
    try {
      return await withAITimeout(
        this.aiProvider.translate({ text, sourceLanguage, targetLanguage, context }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Translation request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'Translation service failed'
      });
    }
  }
}
