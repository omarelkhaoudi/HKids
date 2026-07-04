import { AIProviderMethodNotImplementedError } from '../ai/errors.js';

export class VoiceProvider {
  constructor({ name }) {
    this.name = name;
  }

  async createVoiceProfile() {
    throw new AIProviderMethodNotImplementedError('createVoiceProfile', { provider: this.name });
  }

  async getVoiceStatus() {
    throw new AIProviderMethodNotImplementedError('getVoiceStatus', { provider: this.name });
  }

  async synthesizeSpeech() {
    throw new AIProviderMethodNotImplementedError('synthesizeSpeech', { provider: this.name });
  }

  async deleteVoiceProfile() {
    throw new AIProviderMethodNotImplementedError('deleteVoiceProfile', { provider: this.name });
  }
}
