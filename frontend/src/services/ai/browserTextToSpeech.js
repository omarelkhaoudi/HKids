import { buildApiUrl } from '../../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function isTextToSpeechSupported() {
  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

let activeServerAudio = null;

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (activeServerAudio) {
    activeServerAudio.pause();
    activeServerAudio = null;
  }
}

function speakWithBrowser(text, language) {
  if (!isTextToSpeechSupported()) {
    throw new Error('Browser speech synthesis is unavailable');
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.92;
  utterance.pitch = 1.05;

  return new Promise((resolve, reject) => {
    utterance.onend = resolve;
    utterance.onerror = () => reject(new Error('Browser speech synthesis failed'));
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithServer(text, language) {
  const response = await fetch(buildApiUrl('/ai/speak'), {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg,audio/*'
    },
    body: JSON.stringify({ text, language })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || `Server TTS failed (${response.status})`);
    error.code = data.code || 'TTS_FAILED';
    throw error;
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  activeServerAudio = audio;

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      activeServerAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      activeServerAudio = null;
      reject(new Error('Server audio playback failed'));
    };
    audio.play().catch(reject);
  });
}

export async function speakText(text, { language = 'fr-FR', preferServer = false } = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  const shortLanguage = language.startsWith('en') ? 'en' : language.startsWith('ar') ? 'ar' : 'fr';

  if (preferServer) {
    try {
      await speakWithServer(cleanText, shortLanguage);
      return { provider: 'server' };
    } catch (serverError) {
      if (isTextToSpeechSupported()) {
        await speakWithBrowser(cleanText, language);
        return { provider: 'browser', fallback: true };
      }
      throw serverError;
    }
  }

  if (isTextToSpeechSupported()) {
    try {
      await speakWithBrowser(cleanText, language);
      return { provider: 'browser' };
    } catch {
      // Fall through to server synthesis.
    }
  }

  await speakWithServer(cleanText, shortLanguage);
  return { provider: 'server', fallback: true };
}

// Backward-compatible alias
export const speakTextWithFallback = speakText;
