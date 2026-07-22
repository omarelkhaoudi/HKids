import { Skeleton } from '../ui';

export function AdminListSkeleton({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-3 p-4 ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="p-4 space-y-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-10 w-full rounded-xl" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}
