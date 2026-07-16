import { motion } from 'framer-motion';

export function KidsBookCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="kids-story-card relative w-52 h-[17rem] md:w-60 md:h-80 shrink-0 animate-pulse"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-secondary-50 to-accent-100" />
      <div className="absolute bottom-4 left-4 right-4 h-4 rounded-full bg-white/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/60" />
    </motion.div>
  );
}

export function BookCardSkeleton({ viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-3xl shadow-md overflow-hidden animate-pulse">
        <div className="flex">
          <div className="w-32 h-40 bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 p-5">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
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
      className="kids-story-card overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-primary-100 via-secondary-50 to-accent-100 animate-pulse" />
      <div className="p-5">
        <div className="h-6 bg-surface-200 rounded w-3/4 mb-3 animate-pulse" />
        <div className="h-4 bg-surface-200 rounded w-1/2 mb-4 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 bg-surface-200 rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-surface-200 rounded-full w-24 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

export function BookGridSkeleton({ count = 8, viewMode = 'grid', variant = 'grid' }) {
  if (variant === 'carousel') {
    return (
      <div className="flex gap-5 overflow-hidden px-2">
        {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
          <KidsBookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}>
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
}
