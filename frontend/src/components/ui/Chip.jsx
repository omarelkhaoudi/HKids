import React from 'react';

const TONES = {
  primary: {
    idle: 'bg-card text-foreground border-border/70 hover:border-primary-300 hover:bg-primary-50/50',
    active: 'bg-primary-50 text-primary-800 border-primary-300 shadow-soft',
  },
  secondary: {
    idle: 'bg-card text-foreground border-border/70 hover:border-secondary-300',
    active: 'bg-secondary-50 text-secondary-800 border-secondary-300 shadow-soft',
  },
  orange: {
    idle: 'bg-card text-foreground border-border/70 hover:border-orange-300',
    active: 'bg-orange-50 text-orange-800 border-orange-300 shadow-soft',
  },
  success: {
    idle: 'bg-card text-foreground border-border/70 hover:border-success-300',
    active: 'bg-success-50 text-success-800 border-success-300 shadow-soft',
  },
  magic: {
    idle: 'bg-card text-foreground border-border/70 hover:border-magic-300',
    active: 'bg-magic-50 text-magic-800 border-magic-300 shadow-soft',
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
