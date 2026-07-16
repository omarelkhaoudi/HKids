import React from 'react';
import { Link } from 'react-router-dom';

export function Navbar({
  title,
  emoji,
  backTo,
  onBack,
  trailing,
  className = '',
  brand,
}) {
  const BackIcon = (
    <svg className="h-28 w-28" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  );

  return (
    <header
      className={[
        'relative z-20 flex items-center justify-between gap-space-16',
        'px-space-16 sm:px-space-24 py-space-16',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-space-12 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="kids-icon-action"
            aria-label="Back"
          >
            {BackIcon}
          </button>
        ) : backTo ? (
          <Link to={backTo} className="kids-icon-action" aria-label="Back">
            {BackIcon}
          </Link>
        ) : null}
        {brand}
        {emoji ? <span className="text-3xl shrink-0" aria-hidden="true">{emoji}</span> : null}
        {title ? <h1 className="text-heading-m truncate">{title}</h1> : null}
      </div>
      {trailing ? <div className="shrink-0 flex items-center gap-space-8">{trailing}</div> : null}
    </header>
  );
}
