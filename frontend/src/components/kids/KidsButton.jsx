import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsTouchFeedback } from '../../constants/kidsMotion';

const TONE_VARIANTS = {
  primary: 'bg-primary-500 text-white shadow-soft hover:bg-primary-600',
  secondary: 'bg-secondary-400 text-foreground shadow-soft hover:bg-secondary-500',
  accent: 'bg-orange-400 text-white shadow-soft hover:bg-orange-500',
  orange: 'bg-orange-400 text-white shadow-soft hover:bg-orange-500',
  success: 'bg-success-500 text-white shadow-soft hover:bg-success-600',
  magic: 'bg-magic-500 text-white shadow-soft hover:bg-magic-600',
  violet: 'bg-magic-500 text-white shadow-soft hover:bg-magic-600',
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
    'relative flex items-center justify-center kids-type-button select-none transition-all duration-200 touch-manipulation kids-btn-ripple kids-touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2';

  const sizeClasses = {
    sm: 'px-space-16 py-space-12 min-h-touch-kids text-base rounded-24',
    md: 'px-space-24 py-space-16 min-h-[56px] text-lg rounded-32',
    lg: 'px-space-32 py-space-20 min-h-[64px] text-xl rounded-32',
  };

  const variants = {
    primary: TONE_VARIANTS.primary,
    secondary: 'bg-transparent text-primary-700 border-2 border-primary-300 hover:bg-primary-50',
    accent: TONE_VARIANTS.accent,
    orange: TONE_VARIANTS.orange,
    success: TONE_VARIANTS.success,
    magic: TONE_VARIANTS.magic,
    violet: TONE_VARIANTS.violet,
    ghost: 'bg-transparent text-foreground-secondary hover:bg-surface-secondary',
    glass: 'bg-card/80 backdrop-blur-sm border border-border text-primary-800 shadow-soft',
  };

  const resolvedVariant =
    tone && variants[variant] !== variants.ghost && variants[variant] !== variants.glass && variants[variant] !== variants.secondary
      ? TONE_VARIANTS[tone] || variants.primary
      : variants[variant] || variants.primary;

  const hoverMotion = getHoverMotion(reducedMotion, {
    whileHover: { y: -2, scale: 1.01 },
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
      {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 mr-space-8 md:mr-space-12 shrink-0" strokeWidth={2} />}
      {children}
    </motion.button>
  );
}
