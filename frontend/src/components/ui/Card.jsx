import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';

const VARIANTS = {
  default: 'hkids-card',
  elevated: 'hkids-card shadow-floating',
  soft: 'bg-hkids-green-soft shadow-soft border border-hkids-green-light',
  premium: 'bg-hkids-brown-soft text-foreground shadow-floating border border-hkids-brown-light',
  glass: 'bg-surface/80 backdrop-blur-md border border-border shadow-soft',
};

export function Card({
  variant = 'default',
  hover = true,
  className = '',
  children,
  as: As = 'div',
  ...props
}) {
  const reducedMotion = useReducedMotion();
  const base = `rounded-24 overflow-hidden relative ${VARIANTS[variant] || VARIANTS.default}`;

  if (hover) {
    return (
      <motion.div
        {...getHoverMotion(reducedMotion, {
          whileHover: { y: -4, scale: 1.01 },
          transition: { duration: 0.2 },
        })}
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
