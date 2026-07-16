import { AnimatePresence, motion } from 'framer-motion';
import KidsButton from './KidsButton';

export function KidsModal({
  isOpen,
  onClose,
  emoji = '✨',
  title,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="kids-premium-panel w-full max-w-md p-8 text-center shadow-kids-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kids-modal-title"
          >
            <div className="text-6xl mb-4" aria-hidden="true">{emoji}</div>
            {title && (
              <h2 id="kids-modal-title" className="text-2xl font-black text-foreground mb-4">
                {title}
              </h2>
            )}
            <div className="text-foreground-secondary font-bold mb-6">{children}</div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {secondaryLabel && onSecondary && (
                <KidsButton variant="ghost" onClick={onSecondary} className="!min-h-[56px] flex-1">
                  {secondaryLabel}
                </KidsButton>
              )}
              {primaryLabel && onPrimary && (
                <KidsButton onClick={onPrimary} className="!min-h-[56px] flex-1">
                  {primaryLabel}
                </KidsButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default KidsModal;
