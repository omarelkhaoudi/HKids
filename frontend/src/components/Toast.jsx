import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { CheckIcon, XCircleIcon, InfoIcon, AlertIcon, XIcon } from './Icons';

const TYPE_STYLES = {
  success: 'bg-success-600 text-white',
  error: 'bg-danger-600 text-white',
  info: 'bg-primary-600 text-white',
  warning: 'bg-secondary-600 text-white',
};

function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: <CheckIcon className="w-space-20 h-space-20" />,
    error: <XCircleIcon className="w-space-20 h-space-20" />,
    info: <InfoIcon className="w-space-20 h-space-20" />,
    warning: <AlertIcon className="w-space-20 h-space-20" />,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          className={`fixed top-space-16 left-1/2 z-50 ${TYPE_STYLES[type] || TYPE_STYLES.info} px-space-24 py-space-16 rounded-20 shadow-floating flex items-center gap-space-12 min-w-[280px] max-w-[90vw]`}
        >
          <div className="shrink-0">{icons[type] || icons.info}</div>
          <p className="flex-1 font-bold text-body">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-white/80 hover:text-white transition-colors min-h-touch min-w-touch grid place-items-center"
            aria-label="Close"
          >
            <XIcon className="w-space-16 h-space-16" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;

