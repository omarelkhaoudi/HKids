import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';

const VARIANTS = {
  primary:
    'hkids-button-primary focus-visible:ring-hkids-green',
  secondary:
    'hkids-button-secondary focus-visible:ring-hkids-green',
  ghost:
    'bg-transparent text-foreground-secondary hover:bg-hkids-green-soft hover:text-hkids-green-darker focus-visible:ring-hkids-green',
  outline:
    'hkids-button-outline focus-visible:ring-hkids-brown',
  orange:
    'hkids-button-outline focus-visible:ring-hkids-brown',
  magic:
    'hkids-button-outline focus-visible:ring-hkids-brown',
  success:
    'hkids-button-primary focus-visible:ring-hkids-green',
  danger:
    'bg-hkids-brown-dark text-white hover:bg-hkids-brown-darker focus-visible:ring-hkids-brown shadow-soft',
};

const SIZES = {
  sm: 'min-h-touch px-space-16 py-space-8 text-sm rounded-12',
  md: 'min-h-touch px-space-24 py-space-12 text-body rounded-16',
  lg: 'min-h-touch-kids px-space-32 py-space-16 text-body-lg rounded-20',
  icon: 'min-h-touch min-w-touch p-space-12 rounded-16',
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
  const reducedMotion = useReducedMotion();
  return (
    <motion.button
      {...getHoverMotion(reducedMotion, {
        whileHover: { scale: 1.02, y: -1 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 },
      })}
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
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg className={`${reducedMotion ? '' : 'animate-spin'} -ml-space-4 mr-space-8 h-space-20 w-space-20 text-current`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}
