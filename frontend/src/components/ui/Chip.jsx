import React from 'react';

const TONES = {
  primary: {
    idle: 'bg-surface text-foreground border-border hover:border-primary-300',
    active: 'bg-primary-500 text-white border-primary-600 shadow-soft',
  },
  secondary: {
    idle: 'bg-surface text-foreground border-border hover:border-secondary-300',
    active: 'bg-secondary-500 text-foreground border-secondary-600 shadow-soft',
  },
  orange: {
    idle: 'bg-surface text-foreground border-border hover:border-orange-300',
    active: 'bg-orange-500 text-white border-orange-600 shadow-soft',
  },
  success: {
    idle: 'bg-surface text-foreground border-border hover:border-success-300',
    active: 'bg-success-500 text-white border-success-600 shadow-soft',
  },
  magic: {
    idle: 'bg-surface text-foreground border-border hover:border-magic-300',
    active: 'bg-magic-500 text-white border-magic-600 shadow-soft',
  },
};

export function Chip({
  children,
  selected = false,
  onClick,
  tone = 'primary',
  emoji,
  className = '',
  disabled = false,
  ...props
}) {
  const palette = TONES[tone] || TONES.primary;
  const state = selected ? palette.active : palette.idle;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'inline-flex items-center justify-center gap-space-8 min-h-touch px-space-16 py-space-8',
        'rounded-full border-2 font-bold text-body transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'snap-start shrink-0',
        state,
        className,
      ].join(' ')}
      {...props}
    >
      {emoji ? <span aria-hidden="true" className="text-xl">{emoji}</span> : null}
      {children}
    </button>
  );
}
