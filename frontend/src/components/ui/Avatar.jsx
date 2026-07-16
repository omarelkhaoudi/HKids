import React from 'react';

const SIZES = {
  sm: 'w-space-32 h-space-32 text-caption',
  md: 'w-space-48 h-space-48 text-body',
  lg: 'w-space-64 h-space-64 text-heading-m',
  xl: 'w-[96px] h-[96px] text-heading-l',
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
