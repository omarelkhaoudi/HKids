import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsBookOpen } from '../../constants/kidsMotion';
import { KidsBookCover } from './KidsBookCover';

/**
 * Soft story-opening cover fade — presentation only.
 */
export const KidsStoryOpening = memo(function KidsStoryOpening({
  active = false,
  coverUrl,
  book,
  title,
  onDone,
}) {
  const reducedMotion = useReducedMotion();
  const coverBook = book || { cover_image: coverUrl, title };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center kids-bedtime-opening"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.45 }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.5 }}
          />
          <motion.div
            className="relative z-10 w-48 md:w-64 aspect-[3/4] rounded-[1.75rem] overflow-hidden border-4 border-white/50 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            {...getMotionProps(reducedMotion, kidsBookOpen)}
            onAnimationComplete={() => {
              if (typeof onDone === 'function') {
                window.setTimeout(onDone, reducedMotion ? 100 : 500);
              }
            }}
          >
            <KidsBookCover
              book={coverBook}
              alt={title || ''}
              imgClassName="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
          {title && (
            <motion.p
              className="absolute bottom-16 inset-x-0 text-center text-white font-black text-xl md:text-2xl drop-shadow-lg line-clamp-2 px-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
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
