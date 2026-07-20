import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsReaderBookOpening } from '../../constants/kidsMotion';
import { KidsBookCover } from './KidsBookCover';

/**
 * Magical picture-book opening — cover gently opens into the reading page.
 */
export const KidsStoryOpening = memo(function KidsStoryOpening({
  active = false,
  coverUrl,
  book,
  title,
  mood = 'warm',
  onDone,
}) {
  const reducedMotion = useReducedMotion();
  const coverBook = book || { cover_image: coverUrl, title };
  const openingMotion = kidsReaderBookOpening(reducedMotion);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`fixed inset-0 z-[70] flex items-center justify-center kids-reader-opening kids-reader-opening--${mood}`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <motion.div
            className="kids-reader-opening-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.45 }}
          />
          <motion.div
            className="kids-reader-opening-book"
            {...openingMotion}
            onAnimationComplete={() => {
              if (typeof onDone === 'function') {
                window.setTimeout(onDone, reducedMotion ? 80 : 420);
              }
            }}
          >
            <div className="kids-reader-opening-spine" aria-hidden="true" />
            <KidsBookCover
              book={coverBook}
              alt={title || ''}
              imgClassName="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
          {title && (
            <motion.p
              className="kids-reader-opening-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default KidsStoryOpening;
