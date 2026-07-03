import { AIProvider } from '../AIProvider.js';
import { AIProviderUnavailableError } from '../errors.js';

export class GeminiProvider extends AIProvider {
  constructor({ apiKey, model } = {}) {
    super({ name: 'gemini' });
    this.apiKey = apiKey;
    this.model = model;
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('Gemini provider is not configured', { provider: this.name });
    }
  }

  async generateStory() {
    this.assertConfigured();
    throw new AIProviderUnavailableError('Gemini story generation adapter is not implemented yet', { provider: this.name });
  }
}
