import React from 'react';

const SIZES = {
  sm: 'w-32 h-32 text-caption',
  md: 'w-48 h-48 text-body',
  lg: 'w-64 h-64 text-heading-m',
  xl: 'w-96 h-96 text-heading-l',
};

export function Avatar({ src, alt, initials, size = 'md', className = '' }) {
  return (
    <div
      className={[
        'relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold shrink-0',
        'bg-primary-100 text-primary-700 shadow-soft border-2 border-border',
        SIZES[size] || SIZES.md,
        className,
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={alt || ''} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden={!initials}>{initials || '?'}</span>
      )}
    </div>
  );
}
