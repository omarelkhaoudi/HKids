import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const DISPLAY_MS = 3000;

/**
 * Gentle storyteller whispers — fade in, linger, fade out. Never chatty.
 */
export const KidsReadingCompanion = memo(function KidsReadingCompanion({
  message = '',
  messageKey = '',
  active = false,
  onDismiss,
}) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active || !message) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, reducedMotion ? 1200 : DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [active, message, messageKey, reducedMotion, onDismiss]);

  if (!message) return null;

  return (
    <div className="kids-reader-companion-wrap" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && (
          <motion.p
            key={messageKey || message}
            className="kids-reader-companion-message"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: reducedMotion ? 0.12 : 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

export default KidsReadingCompanion;
