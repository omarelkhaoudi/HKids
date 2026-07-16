import React from 'react';
import { motion } from 'framer-motion';

const VARIANTS = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-soft',
  secondary:
    'bg-secondary-500 text-foreground hover:bg-secondary-600 focus-visible:ring-secondary-500 shadow-soft',
  ghost:
    'bg-transparent text-foreground-secondary hover:bg-surface-secondary focus-visible:ring-primary-400',
  outline:
    'bg-surface text-primary-600 border-2 border-primary-200 hover:bg-primary-50 focus-visible:ring-primary-500',
  orange:
    'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-soft',
  magic:
    'bg-magic-500 text-white hover:bg-magic-600 focus-visible:ring-magic-500 shadow-soft',
  success:
    'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500 shadow-soft',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-500 shadow-soft',
};

const SIZES = {
  sm: 'min-h-touch px-16 py-8 text-sm rounded-12',
  md: 'min-h-touch px-24 py-12 text-body rounded-16',
  lg: 'min-h-touch-kids px-32 py-16 text-body-lg rounded-20',
  icon: 'min-h-touch min-w-touch p-12 rounded-16',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  fullWidth = false,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={[
        'inline-flex items-center justify-center font-bold transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-4 mr-8 h-20 w-20 text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}
