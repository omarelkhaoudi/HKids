import { VoiceProviderFactory } from '../voice/VoiceProviderFactory.js';
import { voiceConfig } from '../voice/voiceConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

export class VoiceCloneService {
  constructor({ voiceProvider = VoiceProviderFactory.getProvider(), timeoutMs = voiceConfig.timeoutMs } = {}) {
    this.voiceProvider = voiceProvider;
    this.timeoutMs = timeoutMs;
  }

  async cloneVoice({ audioSample, mimeType, consent, metadata = {} }) {
    try {
      return await withAITimeout(
        this.voiceProvider.createVoiceProfile({ audioSample, mimeType, consent, metadata }),
        this.timeoutMs,
        {
          provider: this.voiceProvider.name,
          message: 'Voice clone request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.voiceProvider.name,
        fallbackMessage: 'Voice clone service failed'
      });
    }
  }

  async getVoiceStatus({ providerVoiceId }) {
    try {
      return await withAITimeout(
        this.voiceProvider.getVoiceStatus({ providerVoiceId }),
        this.timeoutMs,
        {
          provider: this.voiceProvider.name,
          message: 'Voice status request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.voiceProvider.name,
        fallbackMessage: 'Voice status service failed'
      });
    }
  }

  async synthesizeSpeech({ providerVoiceId, text }) {
    try {
      return await withAITimeout(
        this.voiceProvider.synthesizeSpeech({ providerVoiceId, text }),
        this.timeoutMs,
        {
          provider: this.voiceProvider.name,
          message: 'Voice synthesis request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.voiceProvider.name,
        fallbackMessage: 'Voice synthesis service failed'
      });
    }
  }

  async deleteVoiceProfile({ providerVoiceId }) {
    try {
      return await withAITimeout(
        this.voiceProvider.deleteVoiceProfile({ providerVoiceId }),
        this.timeoutMs,
        {
          provider: this.voiceProvider.name,
          message: 'Voice deletion request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.voiceProvider.name,
        fallbackMessage: 'Voice deletion service failed'
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
    if (!consent) {
      return {
        status: 'consent_required',
        provider_voice_id: null,
        provider: this.voiceProvider.name,
        provider_metadata: {},
      };
    }

    try {
      const result = await this.cloneVoice({ audioSample, mimeType, consent, metadata });
      return {
        status: result?.status || 'ready',
        provider_voice_id: result?.voice_id || result?.provider_voice_id || null,
        provider: this.voiceProvider.name,
        provider_metadata: result?.provider_metadata || {},
      };
    } catch (error) {
      return {
        status: 'sample_received',
        provider_voice_id: null,
        provider: this.voiceProvider.name,
        provider_metadata: {
          fallback: true,
          reason: error?.code || error?.message || 'provider_unavailable',
        },
      };
    }
  }
}
