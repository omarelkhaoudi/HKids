import { motion } from 'framer-motion';

export function KidsErrorBanner({ message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`kids-premium-panel flex items-start gap-3 p-4 md:p-5 border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 ${className}`}
      role="alert"
    >
      <span className="text-3xl shrink-0" aria-hidden="true">⚠️</span>
      <p className="flex-1 kids-type-body text-rose-800 dark:text-rose-200 text-left">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="kids-touch-target kids-type-button shrink-0 rounded-full bg-white/80 px-3 py-1 text-sm text-rose-700"
        >
          OK
        </button>
      )}
    </motion.div>
  );
}

export default KidsErrorBanner;
