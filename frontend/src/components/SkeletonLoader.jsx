import { motion } from 'framer-motion';

export function BookCardSkeleton({ viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
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
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function BookGridSkeleton({ count = 8, viewMode = 'grid' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </>
  );
}

