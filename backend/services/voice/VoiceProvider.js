import { AIProvider } from '../ai/AIProvider.js';
import { AIProviderMethodNotImplementedError } from '../ai/errors.js';

export class VoiceProvider extends AIProvider {
  constructor(options) {
    super(options);
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

  async synthesizeSpeechStream() {
    throw new AIProviderMethodNotImplementedError('synthesizeSpeechStream', { provider: this.name });
  }

  async transcribeAudio() {
    throw new AIProviderMethodNotImplementedError('transcribeAudio', { provider: this.name });
  }

  async deleteVoiceProfile() {
    throw new AIProviderMethodNotImplementedError('deleteVoiceProfile', { provider: this.name });
  }
}
