import { motion } from 'framer-motion';
import { Button } from '../ui';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear, kidsFloat } from '../../constants/kidsMotion';

export function ParentEmptyState({
  emoji = '📖',
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
      className={`parent-empty-state rounded-32 shadow-card bg-surface-secondary/60 border border-border/60 p-space-24 text-center ${className}`}
      role="status"
    >
      <motion.div
        className={`inline-flex mb-space-16 ${compact ? 'text-4xl' : 'text-5xl md:text-6xl'}`}
        {...(reducedMotion ? {} : kidsFloat)}
        aria-hidden="true"
      >
        {emoji}
      </motion.div>
      {title && (
        <h3 className={`font-black text-foreground mb-2 ${compact ? 'text-heading-m' : 'text-heading-l'}`}>
          {title}
        </h3>
      )}
      {description && (
        <p className={`text-foreground-secondary font-medium max-w-sm mx-auto mb-space-16 ${compact ? 'text-body' : 'text-body-lg'}`}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="min-h-touch font-bold">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

export default ParentEmptyState;
