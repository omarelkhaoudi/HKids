import { AIProvider } from '../AIProvider.js';
import { AIProviderUnavailableError } from '../errors.js';

export class OpenAIProvider extends AIProvider {
  constructor({ apiKey, model } = {}) {
    super({ name: 'openai' });
    this.apiKey = apiKey;
    this.model = model;
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('OpenAI provider is not configured', { provider: this.name });
    }
  }

  async generateStory() {
    this.assertConfigured();
    throw new AIProviderUnavailableError('OpenAI story generation adapter is not implemented yet', { provider: this.name });
  }
}
