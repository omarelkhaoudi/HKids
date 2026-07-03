import { AIProviderMethodNotImplementedError } from './errors.js';

export class AIProvider {
  constructor({ name }) {
    this.name = name;
  }

  async generateStory() {
    throw new AIProviderMethodNotImplementedError('generateStory', { provider: this.name });
  }

  async chat() {
    throw new AIProviderMethodNotImplementedError('chat', { provider: this.name });
  }

  async recommendContent() {
    throw new AIProviderMethodNotImplementedError('recommendContent', { provider: this.name });
  }

  async cloneVoice() {
    throw new AIProviderMethodNotImplementedError('cloneVoice', { provider: this.name });
  }

  async translate() {
    throw new AIProviderMethodNotImplementedError('translate', { provider: this.name });
  }
}
