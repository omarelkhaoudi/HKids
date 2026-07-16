import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsTouchFeedback } from '../../constants/kidsMotion';

const TONE_VARIANTS = {
  primary: 'bg-primary-500 text-white border-b-4 border-primary-700 active:border-b-0 active:translate-y-[4px]',
  secondary: 'bg-secondary-500 text-foreground border-b-4 border-secondary-700 active:border-b-0 active:translate-y-[4px]',
  accent: 'bg-orange-500 text-white border-b-4 border-orange-700 active:border-b-0 active:translate-y-[4px]',
  orange: 'bg-orange-500 text-white border-b-4 border-orange-700 active:border-b-0 active:translate-y-[4px]',
  success: 'bg-success-500 text-white border-b-4 border-success-700 active:border-b-0 active:translate-y-[4px]',
  magic: 'bg-magic-500 text-white border-b-4 border-magic-700 active:border-b-0 active:translate-y-[4px]',
  violet: 'bg-magic-500 text-white border-b-4 border-magic-700 active:border-b-0 active:translate-y-[4px]',
};

export default function KidsButton({
  children,
  onClick,
  variant = 'primary',
  tone,
  icon: Icon,
  className = '',
  size = 'md',
  'aria-label': ariaLabel,
  type = 'button',
}) {
  const reducedMotion = useReducedMotion();
  const baseClasses =
    'relative flex items-center justify-center font-extrabold select-none transition-all duration-150 touch-manipulation kids-btn-ripple kids-touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2';

  const sizeClasses = {
    sm: 'px-space-16 py-space-12 min-h-touch-kids text-lg rounded-16',
    md: 'px-space-24 py-space-16 min-h-[64px] text-xl rounded-24',
    lg: 'px-space-32 py-space-24 min-h-[80px] text-2xl rounded-32',
  };

  const variants = {
    primary: TONE_VARIANTS.primary,
    secondary: TONE_VARIANTS.secondary,
    accent: TONE_VARIANTS.accent,
    orange: TONE_VARIANTS.orange,
    success: TONE_VARIANTS.success,
    magic: TONE_VARIANTS.magic,
    violet: TONE_VARIANTS.violet,
    ghost: 'bg-surface text-foreground border-2 border-border active:bg-surface-secondary',
    glass: 'bg-surface/70 backdrop-blur-md border border-border text-primary-800 shadow-soft',
  };

  const resolvedVariant =
    tone && variants[variant] !== variants.ghost && variants[variant] !== variants.glass
      ? TONE_VARIANTS[tone] || variants.primary
      : variants[variant] || variants.primary;

  const hoverMotion = getHoverMotion(reducedMotion, {
    whileHover: { scale: 1.02 },
    ...kidsTouchFeedback,
  });

  const handlePointerDown = useCallback((event) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--ripple-x', `${x}%`);
    target.style.setProperty('--ripple-y', `${y}%`);
  }, []);

  return (
    <motion.button
      type={type}
      {...hoverMotion}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses[size]} ${resolvedVariant} ${className}`}
    >
      {Icon && <Icon className="w-space-24 h-space-24 md:w-space-32 md:h-space-32 mr-space-8 md:mr-space-12 shrink-0" strokeWidth={2.5} />}
      {children}
    </motion.button>
  );
}
