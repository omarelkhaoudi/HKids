import React, { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trapFocus } from '../../utils/a11y';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLanguage } from '../../context/LanguageContext';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return undefined;
    return trapFocus(panelRef.current, onClose);
  }, [isOpen, onClose]);

  const motionProps = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        transition: { type: 'spring', bounce: 0, duration: 0.4 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-900/56 backdrop-blur-md"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            {...motionProps}
            className={`hkids-modal relative w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-primary-50/40 px-6 py-5">
                <h3 id={titleId} className="text-xl font-black text-foreground">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-foreground-muted transition-colors hover:bg-white hover:text-primary-700"
                  aria-label={t('close')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
