import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps } from '../../constants/kidsMotion';

export function KidsErrorBanner({ message, onDismiss, className = '' }) {
  const reducedMotion = useReducedMotion();

  if (!message) return null;

  return (
    <motion.div
      {...getMotionProps(reducedMotion, {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
      })}
      className={`relative w-full max-w-md mx-auto aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/60 bg-gradient-to-br from-indigo-200 to-purple-300 flex flex-col items-center justify-center p-6 ${className}`}
      role="alert"
    >
      <div className="absolute inset-0 kids-shimmer opacity-20 pointer-events-none" aria-hidden="true" />
      <span className="text-8xl drop-shadow-md mb-6" aria-hidden="true">💫</span>
      {onDismiss && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ rotate: { duration: 0.4 } }}
          type="button"
          onClick={onDismiss}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 text-white flex flex-col items-center justify-center shadow-xl border-4 border-white/60 focus:outline-none transition-shadow"
          aria-label="Retry"
        >
          <span className="text-4xl drop-shadow-md" aria-hidden="true">🔄</span>
        </motion.button>
      )}
    </motion.div>
  );
}

export default KidsErrorBanner;
