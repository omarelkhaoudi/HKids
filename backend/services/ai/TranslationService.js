import { AIProviderFactory } from './AIProviderFactory.js';
import { normalizeAIError } from './errors.js';

export class TranslationService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  async translate({ text, sourceLanguage = null, targetLanguage, context = {} }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    try {
      return await aiProvider.translate({ text, sourceLanguage, targetLanguage, context });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'Translation service failed'
      });
    }
  }
}
