import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { CheckIcon, XCircleIcon, InfoIcon, AlertIcon, XIcon } from './Icons';

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
    success: <CheckIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    info: <InfoIcon className="w-5 h-5" />,
    warning: <AlertIcon className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          className={`fixed top-4 left-1/2 z-50 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[90vw]`}
        >
          <div className="flex-shrink-0">{icons[type]}</div>
          <p className="flex-1 font-medium text-sm">{message}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;

