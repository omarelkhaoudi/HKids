import React from 'react';
import { motion } from 'framer-motion';

const TONE_GRADIENT = {
  primary: 'from-primary-400 to-primary-600',
  secondary: 'from-secondary-400 to-secondary-600',
  orange: 'from-orange-400 to-orange-600',
  success: 'from-success-400 to-success-600',
  magic: 'from-magic-400 to-magic-600',
};

export function CategoryCard({
  emoji,
  title,
  subtitle,
  tone = 'primary',
  onClick,
  className = '',
  selected = false,
}) {
  const gradient = TONE_GRADIENT[tone] || TONE_GRADIENT.primary;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'kids-touch-target relative overflow-hidden text-left',
        'min-h-[10rem] w-full rounded-24 p-20',
        `bg-gradient-to-br ${gradient} text-white shadow-card`,
        'border-4 border-white/40',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300',
        selected ? 'ring-4 ring-secondary-400' : '',
        className,
      ].join(' ')}
    >
      <span className="absolute -right-8 -top-8 text-[7rem] opacity-20 pointer-events-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="relative text-5xl md:text-6xl block mb-12" aria-hidden="true">{emoji}</span>
      {title ? <span className="relative text-heading-m text-white line-clamp-2">{title}</span> : null}
      {subtitle ? <span className="relative mt-4 block text-caption text-white/90 line-clamp-2">{subtitle}</span> : null}
    </motion.button>
  );
}
