import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getFloatMotion, getMotionProps, kidsBadgePop } from '../../constants/kidsMotion';
import LitMascot from './LitMascot';

/**
 * Reusable HKids mascot — friendly, gender-neutral, never blocks taps (pointer-events-none by default).
 * mood: idle | wave | celebrate | encourage
 */
const MOOD_MESSAGES = {
  wave: 'kidsMascotWave',
  celebrate: 'kidsMascotCelebrate',
  encourage: 'kidsMascotEncourage',
  idle: null,
};

export const KidsMascot = memo(function KidsMascot({
  mood = 'idle',
  size = 'default',
  showBubble = false,
  message,
  className = '',
  interactive = false,
}) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const moodKey = MOOD_MESSAGES[mood];
  const bubbleText = message || (moodKey ? t(moodKey) : undefined);
  const shouldShowBubble = showBubble || Boolean(bubbleText && mood !== 'idle');

  const floatProps = getFloatMotion(reducedMotion);
  const waveProps = !reducedMotion && mood === 'wave'
    ? { animate: { rotate: [0, 8, -6, 8, 0], y: [0, -6, 0] }, transition: { duration: 1.8, ease: 'easeInOut' } }
    : floatProps;
  const celebrateProps = !reducedMotion && mood === 'celebrate'
    ? { animate: { scale: [1, 1.08, 1], y: [0, -12, 0] }, transition: { duration: 0.9, ease: 'easeOut' } }
    : waveProps;

  return (
    <motion.div
      className={`${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
      {...(mood === 'celebrate' ? celebrateProps : mood === 'wave' ? waveProps : floatProps)}
      aria-hidden={!interactive}
    >
      <AnimatePresence>
        {mood === 'celebrate' && !reducedMotion && (
          <motion.div
            className="absolute -inset-4 flex items-center justify-center gap-2 text-2xl"
            {...getMotionProps(false, kidsBadgePop)}
          >
            <span className="absolute -top-2 left-2" aria-hidden="true">⭐</span>
            <span className="absolute -top-1 right-4" aria-hidden="true">✨</span>
            <span className="absolute bottom-0 left-6" aria-hidden="true">🌟</span>
          </motion.div>
        )}
      </AnimatePresence>
      <LitMascot
        size={size}
        showBubble={shouldShowBubble}
        message={bubbleText}
        className={mood === 'wave' ? 'origin-bottom' : ''}
      />
    </motion.div>
  );
});

export default KidsMascot;
