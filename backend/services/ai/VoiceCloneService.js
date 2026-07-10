import { VoiceProviderFactory } from '../voice/VoiceProviderFactory.js';
import { normalizeAIError } from './errors.js';

export class VoiceCloneService {
  constructor({ voiceProvider = null } = {}) {
    this.voiceProvider = voiceProvider;
  }

  getProvider() {
    if (!this.voiceProvider) this.voiceProvider = VoiceProviderFactory.getProvider();
    return this.voiceProvider;
  }

  async cloneVoice({ audioSample, mimeType, consent, metadata = {} }) {
    const provider = this.getProvider();
    try {
      return await provider.createVoiceProfile({ audioSample, mimeType, consent, metadata });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice clone service failed'
      });
    }
  }

  async getVoiceStatus({ providerVoiceId }) {
    const provider = this.getProvider();
    try {
      return await provider.getVoiceStatus({ providerVoiceId });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice status service failed'
      });
    }
  }

  async synthesizeSpeech({ providerVoiceId, text }) {
    const provider = this.getProvider();
    try {
      return await provider.synthesizeSpeech({ providerVoiceId, text });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice synthesis service failed'
      });
    }
  }

  async deleteVoiceProfile({ providerVoiceId }) {
    const provider = this.getProvider();
    try {
      return await provider.deleteVoiceProfile({ providerVoiceId });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice deletion service failed'
      });
    }
  }

  async synthesizeSpeechStream({ providerVoiceId, text, onChunk, signal = null }) {
    const provider = this.getProvider();
    try {
      return await provider.synthesizeSpeechStream({ providerVoiceId, text, onChunk, signal });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice streaming service failed'
      });
    }
  }

  async transcribeAudio({ audioBuffer, mimeType, language }) {
    const provider = this.getProvider();
    try {
      return await provider.transcribeAudio({ audioBuffer, mimeType, language });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: provider.name,
        fallbackMessage: 'Voice transcription service failed'
      });
    }
  }

  evaluateAudioQuality({ audioBuffer, mimeType }) {
    const size = audioBuffer?.length || 0;
    const supportedMimeType = /audio\/(webm|mpeg|mp3|wav|ogg|m4a|mp4)/i.test(String(mimeType || ''));
    let score = 0;
    const notes = [];

    if (supportedMimeType) {
      score += 35;
    } else {
      notes.push('Format audio non reconnu.');
    }

    if (size >= 120000) {
      score += 45;
    } else if (size >= 40000) {
      score += 30;
      notes.push('Echantillon court, mais utilisable pour une premiere version.');
    } else if (size > 0) {
      score += 12;
      notes.push('Echantillon trop court pour un clonage fiable.');
    } else {
      notes.push('Aucun fichier audio recu.');
    }

    score += 20;

    const qualityScore = Math.min(100, score);
    return {
      quality_score: qualityScore,
      quality_status: qualityScore >= 70 ? 'good' : qualityScore >= 45 ? 'medium' : 'low',
      quality_notes: notes.join(' ') || 'Qualite audio suffisante pour lancer la creation du profil.',
    };
  }

  async prepareVoiceProfile({ audioSample, mimeType, consent, metadata = {} }) {
    const provider = this.getProvider();
    if (!consent) {
      return {
        status: 'consent_required',
        provider_voice_id: null,
        provider: provider.name,
        provider_metadata: {},
      };
    }

    const result = await this.cloneVoice({ audioSample, mimeType, consent, metadata });
    return {
      status: result?.status || 'ready',
      provider_voice_id: result?.voice_id || result?.provider_voice_id || null,
      provider: provider.name,
      provider_metadata: result?.provider_metadata || {},
    };
  }
}
