import { AIProvider } from '../AIProvider.js';
import { AIProviderUnavailableError } from '../errors.js';

export class ClaudeProvider extends AIProvider {
  constructor({ apiKey, model } = {}) {
    super({ name: 'claude' });
    this.apiKey = apiKey;
    this.model = model;
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('Claude provider is not configured', { provider: this.name });
    }
  }

  async generateStory() {
    this.assertConfigured();
    throw new AIProviderUnavailableError('Claude story generation adapter is not implemented yet', { provider: this.name });
  }
}
