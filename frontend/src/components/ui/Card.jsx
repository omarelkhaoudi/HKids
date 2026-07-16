import React from 'react';
import { motion } from 'framer-motion';

const VARIANTS = {
  default: 'bg-surface shadow-card border border-border',
  elevated: 'bg-surface shadow-floating border border-border',
  soft: 'bg-surface-secondary shadow-soft border border-border',
  premium: 'bg-gradient-to-br from-primary-500 to-magic-500 text-white shadow-floating border-0',
  glass: 'bg-surface/70 backdrop-blur-md border border-border shadow-soft',
};

export function Card({
  variant = 'default',
  hover = true,
  className = '',
  children,
  as: As = 'div',
  ...props
}) {
  const base = `rounded-24 overflow-hidden relative ${VARIANTS[variant] || VARIANTS.default}`;

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`${base} transition-shadow hover:shadow-floating ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <As className={`${base} ${className}`} {...props}>
      {children}
    </As>
  );
}
