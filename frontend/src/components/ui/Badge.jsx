import React from 'react';

const VARIANTS = {
  primary: 'hkids-badge',
  secondary: 'hkids-badge-secondary',
  orange: 'hkids-badge-secondary',
  success: 'hkids-badge',
  magic: 'hkids-badge-secondary',
  warning: 'hkids-badge-secondary',
  danger: 'hkids-badge-secondary',
  neutral: 'bg-surface-secondary text-foreground-secondary',
  premium: 'hkids-badge-premium shadow-soft',
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
