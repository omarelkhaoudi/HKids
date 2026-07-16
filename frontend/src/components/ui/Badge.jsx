import React from 'react';

const VARIANTS = {
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-800',
  orange: 'bg-orange-100 text-orange-700',
  success: 'bg-success-100 text-success-700',
  magic: 'bg-magic-100 text-magic-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  neutral: 'bg-surface-secondary text-foreground-secondary',
  premium: 'bg-gradient-to-r from-secondary-400 to-orange-500 text-white shadow-soft',
};

const SIZES = {
  sm: 'px-space-8 py-space-4 text-caption',
  md: 'px-space-12 py-space-4 text-sm font-bold',
  lg: 'px-space-16 py-space-8 text-body font-bold',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
}) {
  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full',
        VARIANTS[variant] || VARIANTS.neutral,
        SIZES[size] || SIZES.md,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
