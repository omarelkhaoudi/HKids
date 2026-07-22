import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getFloatMotion } from '../../constants/kidsMotion';

const SIZE_MAP = {
  small: 'w-24 h-24 md:w-28 md:h-28',
  default: 'w-48 h-48 md:w-64 md:h-64',
  large: 'w-56 h-56 md:w-72 md:h-72',
};

export function LitMascot({
  className = '',
  size = 'default',
  showBubble = true,
  message,
}) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const bubbleText = message || t('litMascotGreeting');
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.default;
  const floatProps = getFloatMotion(reducedMotion);

  return (
    <motion.div
      className={`relative ${sizeClass} ${className}`}
      {...floatProps}
    >
      <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />

      {showBubble && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 0.2, type: 'spring', stiffness: 260 }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 md:-top-4 z-20 w-[90%] max-w-xs"
        >
          <div className="relative bg-white dark:bg-surface-800 rounded-3xl px-4 py-3 shadow-lg border-4 border-primary-100 dark:border-primary-900 text-center">
            <p className="text-sm md:text-base font-black text-primary-700 dark:text-primary-300 leading-snug">
              {bubbleText}
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-surface-800 border-r-4 border-b-4 border-primary-100 dark:border-primary-900 rotate-45" />
          </div>
        </motion.div>
      )}

      <img
        src="/assets/lit_mascot.png"
        alt={t('litMascotName')}
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
        loading="lazy"
        decoding="async"
      />
    </motion.div>
  );
}

export default LitMascot;
