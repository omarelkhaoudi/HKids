import { VoiceProviderFactory } from '../voice/VoiceProviderFactory.js';
import { inspectAudioBuffer } from '../voice/audioValidation.js';
import { normalizeAIError } from './errors.js';

export function buildVoicePreviewText({ name, language = 'fr' } = {}) {
  const safeName = String(name || 'Parent').trim().slice(0, 80) || 'Parent';
  const normalizedLanguage = String(language || 'fr').toLowerCase();

  if (normalizedLanguage.startsWith('en')) {
    return `Hello, I am ${safeName}. I am ready to tell you a wonderful story.`;
  }

  if (normalizedLanguage.startsWith('ar')) {
    return `\u0645\u0631\u062d\u0628\u0627\u060c \u0623\u0646\u0627 ${safeName}. \u0623\u0646\u0627 \u0645\u0633\u062a\u0639\u062f \u0644\u0623\u062d\u0643\u064a \u0644\u0643 \u0642\u0635\u0629 \u0631\u0627\u0626\u0639\u0629.`;
  }

  return `Bonjour, je suis ${safeName}. Je suis pret a te raconter une merveilleuse histoire.`;
}

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
    const inspection = inspectAudioBuffer(audioBuffer);
    let score = 0;
    const notes = [];

    if (size === 0) {
      notes.push('Aucun fichier audio recu.');
    } else if (supportedMimeType) {
      score += 35;
    } else {
      notes.push('Format audio non reconnu.');
    }

    if (size >= 320000) {
      score += 38;
    } else if (size >= 120000) {
      score += 30;
    } else if (size >= 40000) {
      score += 20;
      notes.push('Echantillon court, utilisable mais a ameliorer.');
    } else if (size > 0) {
      score += 8;
      notes.push('Echantillon trop court pour un clonage fiable.');
    }

    if (size === 0) {
      score = 0;
    } else if (inspection.likelySilent) {
      score = Math.min(score, 25);
      notes.push('Le signal audio semble silencieux ou corrompu.');
    }

    if (size === 0) {
      score += 0;
    } else if (inspection.wav?.durationSeconds) {
      if (inspection.wav.durationSeconds >= 20) {
        score += 22;
      } else if (inspection.wav.durationSeconds >= 8) {
        score += 14;
        notes.push('La duree est acceptable; 20 a 30 secondes ameliorent la stabilite.');
      } else {
        score += 4;
        notes.push('La duree detectee est courte pour une voix stable.');
      }

      if (inspection.wav.sampleRate && inspection.wav.sampleRate < 16000) {
        score -= 10;
        notes.push('Frequence d echantillonnage faible.');
      }

      if (inspection.wav.clippingRatio > 0.08) {
        score -= 15;
        notes.push('Le signal semble sature; eloignez-vous legerement du micro.');
      }
    } else {
      score += 16;
    }

    const qualityScore = Math.max(0, Math.min(100, score));
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
