import React from 'react';
import { motion } from 'framer-motion';

const TONE_FILL = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  orange: 'bg-orange-500',
  success: 'bg-success-500',
  magic: 'bg-magic-500',
};

export function ProgressBar({
  progress,
  label,
  tone = 'primary',
  className = '',
  size = 'md',
}) {
  const clamped = Math.min(100, Math.max(0, Number(progress) || 0));
  const height = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-8' : 'h-10';

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="flex justify-between mb-8">
          <span className="text-caption text-foreground-secondary">{label}</span>
          <span className="text-caption text-foreground-secondary">{Math.round(clamped)}%</span>
        </div>
      ) : null}
      <div
        className={`w-full bg-surface-200 rounded-full overflow-hidden ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <motion.div
          className={`${height} rounded-full ${TONE_FILL[tone] || TONE_FILL.primary}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
