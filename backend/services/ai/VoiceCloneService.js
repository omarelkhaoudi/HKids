import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

export class VoiceCloneService {
  constructor({ aiProvider = AIProviderFactory.getProvider(), timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async cloneVoice({ audioSample, consent, metadata = {} }) {
    try {
      return await withAITimeout(
        this.aiProvider.cloneVoice({ audioSample, consent, metadata }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Voice clone request timed out. Please try again.'
        }
      );
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'Voice clone service failed'
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

  async prepareVoiceProfile({ audioSample, consent, metadata = {} }) {
    if (!consent) {
      return {
        status: 'consent_required',
        provider_voice_id: null,
        provider: this.aiProvider.name,
        provider_metadata: {},
      };
    }

    try {
      const result = await this.cloneVoice({ audioSample, consent, metadata });
      return {
        status: result?.status || 'ready',
        provider_voice_id: result?.voice_id || result?.provider_voice_id || null,
        provider: this.aiProvider.name,
        provider_metadata: result?.provider_metadata || {},
      };
    } catch (error) {
      return {
        status: 'sample_received',
        provider_voice_id: null,
        provider: this.aiProvider.name,
        provider_metadata: {
          fallback: true,
          reason: error?.code || error?.message || 'provider_unavailable',
        },
      };
    }
  }
}
