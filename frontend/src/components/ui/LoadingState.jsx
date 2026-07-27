import React from 'react';
import { Skeleton } from './Skeleton';

export function LoadingState({ message = 'Loading…', fullScreen = false }) {
  const content = (
    <div
      className="relative w-full max-w-sm overflow-hidden rounded-32 border border-border bg-card p-space-32 shadow-card text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 kids-shimmer opacity-25 pointer-events-none" aria-hidden="true" />
      <div className="relative space-y-space-16">
        <Skeleton className="mx-auto h-14 w-14 !rounded-full" />
        <Skeleton className="mx-auto h-4 w-3/4" />
        <Skeleton className="mx-auto h-4 w-1/2" />
        {message ? (
          <p className="kids-type-body text-foreground-secondary">{message}</p>
        ) : null}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-kids p-space-24">
        {content}
      </div>
    );
  }

  return <div className="flex w-full justify-center p-space-24">{content}</div>;
}
