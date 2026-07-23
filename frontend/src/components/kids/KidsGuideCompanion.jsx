import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KidsMascot } from './KidsMascot';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLanguage } from '../../context/LanguageContext';
import { playKidsUiSound, isKidsUiSoundEnabled, setKidsUiSoundEnabled } from '../../utils/kidsUiSound';
import { useKidsVoiceGuide } from '../../hooks/useKidsVoiceGuide';

/**
 * Persistent non-blocking HKids mascot guide for child screens.
 * Speaks optional welcome once per mount; never covers primary taps.
 */
export const KidsGuideCompanion = memo(function KidsGuideCompanion({
  mood = 'wave',
  message,
  speakOnMount = false,
  speakText,
  className = '',
}) {
  const { language, t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { enabled: voiceOn, setEnabled: setVoiceOn, speakGuide } = useKidsVoiceGuide(language);
  const [soundOn, setSoundOn] = useState(() => isKidsUiSoundEnabled());
  const [visibleMood, setVisibleMood] = useState(mood);
  const bubble = message || t('kidsMascotWave');

  useEffect(() => {
    setVisibleMood(mood);
  }, [mood]);

  useEffect(() => {
    if (!speakOnMount) return undefined;
    const phrase = speakText || bubble;
    const timer = window.setTimeout(() => {
      speakGuide(phrase);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [speakOnMount, speakText, bubble, speakGuide]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    playKidsUiSound(next ? 'play' : 'mute');
    if (next) speakGuide(t('kidsVoiceGuideOn'), { force: true });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setKidsUiSoundEnabled(next);
    setSoundOn(next);
    if (next) playKidsUiSound('tap');
  };

  return (
    <div className={`kids-guide-companion pointer-events-none ${className}`} aria-live="polite">
      <div className="kids-guide-companion-inner">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${visibleMood}-${bubble}`}
            initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.28 }}
            className="relative"
          >
            <KidsMascot
              mood={visibleMood}
              size="small"
              showBubble
              message={bubble}
              className="kids-guide-mascot"
            />
          </motion.div>
        </AnimatePresence>

        <div className="kids-guide-toggles pointer-events-auto flex items-center justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={toggleVoice}
            className="kids-guide-toggle kids-touch-target"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? t('kidsVoiceGuideMute') : t('kidsVoiceGuideUnmute')}
            title={voiceOn ? t('kidsVoiceGuideMute') : t('kidsVoiceGuideUnmute')}
          >
            <span aria-hidden="true">{voiceOn ? '🗣️' : '🤫'}</span>
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="kids-guide-toggle kids-touch-target"
            aria-pressed={soundOn}
            aria-label={soundOn ? t('kidsUiSoundMute') : t('kidsUiSoundUnmute')}
            title={soundOn ? t('kidsUiSoundMute') : t('kidsUiSoundUnmute')}
          >
            <span aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default KidsGuideCompanion;
