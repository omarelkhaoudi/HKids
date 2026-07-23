import { useCallback, useEffect, useRef, useState } from 'react';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import { speechLocale } from '../utils/kidsGuidePhrases';

const MUTE_KEY = 'hkids_kids_voice_guide';
const COOLDOWN_MS = 2200;

export function isKidsVoiceGuideEnabled() {
  try {
    const raw = localStorage.getItem(MUTE_KEY);
    if (raw === null) return true;
    return raw !== '0' && raw !== 'false';
  } catch {
    return true;
  }
}

export function setKidsVoiceGuideEnabled(enabled) {
  try {
    localStorage.setItem(MUTE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
  if (!enabled) stopSpeaking();
}

/**
 * Optional spoken guidance for Kids Mode — browser TTS first, no backend rewrite.
 */
export function useKidsVoiceGuide(language = 'fr') {
  const [enabled, setEnabledState] = useState(() => isKidsVoiceGuideEnabled());
  const lastSpokenRef = useRef({ text: '', at: 0 });
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const setEnabled = useCallback((next) => {
    const value = Boolean(next);
    setKidsVoiceGuideEnabled(value);
    setEnabledState(value);
  }, []);

  const speakGuide = useCallback(async (text, { force = false } = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    if (!force && !isKidsVoiceGuideEnabled()) return false;

    const now = Date.now();
    if (
      !force
      && lastSpokenRef.current.text === clean
      && now - lastSpokenRef.current.at < COOLDOWN_MS
    ) {
      return false;
    }

    lastSpokenRef.current = { text: clean, at: now };
    try {
      await speakText(clean, {
        language: speechLocale(languageRef.current),
        preferServer: false,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopGuide = useCallback(() => {
    stopSpeaking();
  }, []);

  return {
    enabled,
    setEnabled,
    speakGuide,
    stopGuide,
  };
}

export default useKidsVoiceGuide;
