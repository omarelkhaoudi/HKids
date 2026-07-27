import React from 'react';

/**
 * Soft shimmer skeleton — uses design tokens (no hard-coded white).
 */
export function Skeleton({
  className = '',
  rounded = 'rounded-24',
  shimmer = true,
  ...props
}) {
  return (
    <div
      className={`relative overflow-hidden bg-surface-200/90 dark:bg-surface-700/60 ${rounded} ${className}`}
      aria-hidden="true"
      {...props}
    >
      {shimmer ? (
        <div className="absolute inset-0 kids-shimmer opacity-70 pointer-events-none" />
      ) : null}
    </div>
  );
}
