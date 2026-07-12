import { AIProviderUnavailableError } from './errors.js';
import { voiceConfig } from '../voice/voiceConfig.js';
import { VoiceProviderFactory } from '../voice/VoiceProviderFactory.js';

const DEFAULT_VOICE_BY_LANGUAGE = {
  fr: process.env.ELEVENLABS_DEFAULT_VOICE_FR || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
  en: process.env.ELEVENLABS_DEFAULT_VOICE_EN || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
  ar: process.env.ELEVENLABS_DEFAULT_VOICE_AR || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
};

function normalizeLanguage(language = 'fr') {
  const value = String(language || 'fr').toLowerCase();
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('ar')) return 'ar';
  return 'fr';
}

function resolveVoiceId(language) {
  const voiceId = DEFAULT_VOICE_BY_LANGUAGE[normalizeLanguage(language)];
  if (!voiceId) {
    throw new AIProviderUnavailableError('Server text-to-speech voice is not configured', {
      provider: voiceConfig.provider,
      retryable: false,
    });
  }
  return voiceId;
}

export function isServerTextToSpeechConfigured() {
  return Boolean(
    voiceConfig.providers?.elevenlabs?.apiKey
    && (process.env.ELEVENLABS_DEFAULT_VOICE_ID
      || process.env.ELEVENLABS_DEFAULT_VOICE_FR
      || process.env.ELEVENLABS_DEFAULT_VOICE_EN
      || process.env.ELEVENLABS_DEFAULT_VOICE_AR)
  );
}

export async function synthesizeAssistantSpeech({ text, language = 'fr' }) {
  const cleanText = String(text || '').trim().slice(0, 1200);
  if (!cleanText) {
    throw new AIProviderUnavailableError('Text is required for synthesis', { retryable: false });
  }

  const provider = VoiceProviderFactory.getProvider();
  const result = await provider.synthesizeSpeech({
    providerVoiceId: resolveVoiceId(language),
    text: cleanText,
  });

  return {
    audioBuffer: result.audioBuffer,
    mimeType: result.mimeType || 'audio/mpeg',
    provider: VoiceProviderFactory.getActiveProviderName(),
    text_length: cleanText.length,
  };
}
