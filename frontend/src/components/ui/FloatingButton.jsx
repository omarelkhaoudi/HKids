import React from 'react';
import { motion } from 'framer-motion';

const TONES = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-floating',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-foreground shadow-floating',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white shadow-floating',
  magic: 'bg-magic-500 hover:bg-magic-600 text-white shadow-floating',
  success: 'bg-success-500 hover:bg-success-600 text-white shadow-floating',
};

export function FloatingButton({
  onClick,
  label,
  icon,
  tone = 'primary',
  className = '',
  position = 'bottom-right',
  ...props
}) {
  const pos =
    position === 'bottom-left'
      ? 'left-space-24 bottom-space-24'
      : 'right-space-24 bottom-space-24';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      className={[
        'fixed z-40 kids-touch-target',
        'flex items-center justify-center gap-space-8',
        'min-h-touch-kids min-w-touch-kids rounded-full px-space-20',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300',
        TONES[tone] || TONES.primary,
        pos,
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
      {label && icon ? <span className="sr-only sm:not-sr-only font-bold text-body">{label}</span> : null}
      {!icon && label ? <span className="font-bold text-body">{label}</span> : null}
    </motion.button>
  );
}
