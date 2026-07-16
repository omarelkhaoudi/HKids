import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { kidsBadgePop } from '../../constants/kidsMotion';

const FEEDBACK_EMOJI = {
  favorite: '❤️',
  download: '✅',
  play: '▶️',
  done: '🌟',
  profile: '✨',
};

/**
 * Subtle interaction reward burst — presentation only.
 */
export const KidsFeedbackBurst = memo(function KidsFeedbackBurst({
  type = 'done',
  active = false,
  label,
}) {
  const reducedMotion = useReducedMotion();
  const emoji = FEEDBACK_EMOJI[type] || '✨';

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="kids-feedback-burst"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.28 }}
          aria-hidden="true"
        >
          <motion.span
            className="inline-flex flex-col items-center gap-1 rounded-full bg-white/95 px-4 py-3 shadow-kids-soft border-4 border-white text-3xl"
            {...(reducedMotion ? {} : kidsBadgePop)}
          >
            <span>{emoji}</span>
            {label && <span className="text-xs font-black text-foreground">{label}</span>}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default KidsFeedbackBurst;
