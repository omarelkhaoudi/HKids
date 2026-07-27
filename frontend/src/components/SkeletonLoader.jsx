import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../constants/kidsMotion';

export function KidsBookCardSkeleton() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className="kids-story-card relative w-52 h-[17rem] md:w-60 md:h-80 shrink-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-secondary-50 to-magic-100 dark:from-primary-900/40 dark:via-surface-800 dark:to-magic-900/30" />
      {!reducedMotion && <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />}
      <div className="absolute bottom-4 left-4 right-4 h-4 rounded-full bg-card/55" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-card/65 border-4 border-card/40" />
    </motion.div>
  );
}

export function BookCardSkeleton({ viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-24 shadow-card border border-border overflow-hidden">
        <div className="flex">
          <div className="w-32 h-40 bg-gradient-to-br from-primary-100 to-secondary-50 dark:from-primary-900/40 dark:to-surface-800 flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
          </div>
          <div className="flex-1 p-space-20 space-y-space-12">
            <div className="h-6 bg-surface-200 rounded-full w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
            </div>
            <div className="h-4 bg-surface-200 rounded-full w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
            </div>
            <div className="h-4 bg-surface-200 rounded-full w-full relative overflow-hidden">
              <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
            </div>
            <div className="flex gap-space-8 mt-space-16">
              <div className="h-6 bg-surface-200 rounded-full w-20" />
              <div className="h-6 bg-surface-200 rounded-full w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="kids-story-card overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-primary-100 via-secondary-50 to-magic-100 dark:from-primary-900/40 dark:via-surface-800 dark:to-magic-900/30 relative overflow-hidden">
        <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
      </div>
      <div className="p-space-20 space-y-space-12">
        <div className="h-6 bg-surface-200 rounded-full w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
        </div>
        <div className="h-4 bg-surface-200 rounded-full w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 kids-shimmer" aria-hidden="true" />
        </div>
        <div className="flex gap-space-8">
          <div className="h-6 bg-surface-200 rounded-full w-20" />
          <div className="h-6 bg-surface-200 rounded-full w-24" />
        </div>
      </div>
    </motion.div>
  );
}

export function BookGridSkeleton({ count = 8, viewMode = 'grid', variant = 'grid' }) {
  if (variant === 'carousel') {
    return (
      <div
        className="flex gap-space-20 overflow-hidden px-space-8"
        aria-busy="true"
        aria-label="Loading"
        role="status"
      >
        {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
          <KidsBookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'list'
          ? 'space-y-space-16'
          : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-24'
      }
      aria-busy="true"
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
}

/** Dashboard / reader soft fade placeholder */
export function PanelSkeleton({ className = '', lines = 3 }) {
  return (
    <div
      className={`kids-premium-panel relative overflow-hidden p-space-24 ${className}`}
      aria-busy="true"
      role="status"
    >
      <div className="absolute inset-0 kids-shimmer opacity-30 pointer-events-none" aria-hidden="true" />
      <div className="relative space-y-space-16">
        <div className="h-8 w-2/5 max-w-xs rounded-full bg-surface-200" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-full bg-surface-200"
            style={{ width: `${88 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
