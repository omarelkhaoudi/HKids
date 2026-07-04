import { VoiceProvider } from '../VoiceProvider.js';

export class MockVoiceProvider extends VoiceProvider {
  constructor() {
    super({ name: 'mock' });
  }

  async createVoiceProfile({ metadata = {} }) {
    return {
      status: 'sample_received',
      provider_voice_id: null,
      provider_metadata: {
        provider: this.name,
        simulated: true,
        name: metadata.name || null
      }
    };
  }

  async getVoiceStatus() {
    return {
      status: 'sample_received',
      provider_metadata: {
        provider: this.name,
        simulated: true
      }
    };
  }

  async synthesizeSpeech() {
    return {
      audioBuffer: null,
      mimeType: null,
      provider_metadata: {
        provider: this.name,
        simulated: true
      }
    };
  }

  async deleteVoiceProfile() {
    return {
      deleted: true,
      provider_metadata: {
        provider: this.name,
        simulated: true
      }
    };
  }
}
