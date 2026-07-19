import React from 'react';

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  className = '',
  variant = 'default',
  'aria-label': ariaLabel = 'Search',
}) {
  const isPremium = variant === 'premium';

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={[
        'flex items-center gap-space-12 w-full min-h-[56px]',
        isPremium
          ? 'kids-library-search rounded-full bg-card/80 border border-border/40 shadow-soft px-space-20 backdrop-blur-md focus-within:border-primary-300/70 focus-within:ring-2 focus-within:ring-primary-200/60'
          : 'rounded-24 bg-surface border-2 border-border shadow-soft px-space-16 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
        className,
      ].join(' ')}
    >
      <span className="text-foreground-muted shrink-0 opacity-70" aria-hidden="true">
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`flex-1 min-w-0 bg-transparent outline-none py-space-12 placeholder:text-foreground-muted ${
          isPremium ? 'kids-type-body text-foreground' : 'text-body text-foreground'
        }`}
      />
    </form>
  );
}
