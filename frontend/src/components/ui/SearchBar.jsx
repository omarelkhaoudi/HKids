import React from 'react';

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  className = '',
  'aria-label': ariaLabel = 'Search',
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={[
        'flex items-center gap-space-12 w-full min-h-touch-kids',
        'rounded-24 bg-surface border-2 border-border shadow-soft',
        'px-space-16 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
        className,
      ].join(' ')}
    >
      <span className="text-foreground-muted shrink-0" aria-hidden="true">
        <svg className="w-space-24 h-space-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 bg-transparent text-body text-foreground placeholder:text-foreground-muted outline-none py-space-12"
      />
    </form>
  );
}
