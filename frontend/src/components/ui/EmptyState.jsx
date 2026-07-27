import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear, kidsFloat } from '../../constants/kidsMotion';

export function EmptyState({
  icon: Icon,
  emoji = null,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  compact = false,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      role="status"
      aria-live="polite"
      className={[
        'relative flex flex-col items-center justify-center text-center overflow-hidden',
        'rounded-32 border border-dashed border-border/80 bg-surface-secondary/50 shadow-soft',
        compact ? 'p-space-24' : 'p-space-32 md:p-space-48',
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 kids-shimmer opacity-20 pointer-events-none" aria-hidden="true" />
      {(Icon || emoji) && (
        <motion.div
          className={[
            'relative mb-space-20 grid place-items-center rounded-full bg-card shadow-card border border-border',
            compact ? 'h-16 w-16 text-3xl' : 'h-20 w-20 md:h-24 md:w-24 text-4xl md:text-5xl',
          ].join(' ')}
          {...(reducedMotion ? {} : kidsFloat)}
          aria-hidden="true"
        >
          {emoji || (Icon ? <Icon className="w-10 h-10 text-primary-500" /> : null)}
        </motion.div>
      )}
      {title ? (
        <h3 className={`relative font-black text-foreground mb-space-8 ${compact ? 'text-heading-m' : 'text-heading-l'}`}>
          {title}
        </h3>
      ) : null}
      {description ? (
        <p className={`relative text-foreground-muted max-w-md mb-space-24 ${compact ? 'text-body' : 'text-body-lg'}`}>
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="primary" className="relative min-h-touch">
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  );
}
