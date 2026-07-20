import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsTouchFeedback } from '../../constants/kidsMotion';

const TONE_VARIANTS = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-[0_18px_34px_-20px_rgba(36,50,74,0.28),0_8px_18px_-12px_rgba(196,122,58,0.26)]',
  secondary: 'bg-secondary-400 text-foreground hover:bg-secondary-500 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
  accent: 'bg-orange-400 text-white hover:bg-orange-500 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
  orange: 'bg-orange-400 text-white hover:bg-orange-500 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
  success: 'bg-success-500 text-white hover:bg-success-600 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
  magic: 'bg-magic-500 text-white hover:bg-magic-600 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
  violet: 'bg-magic-500 text-white hover:bg-magic-600 shadow-[0_16px_28px_-20px_rgba(36,50,74,0.22)]',
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
    'relative flex items-center justify-center kids-type-button select-none transition-all duration-200 touch-manipulation kids-btn-ripple kids-touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] disabled:opacity-60 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-space-16 py-space-12 min-h-touch-kids text-base rounded-full',
    md: 'px-space-24 py-space-16 min-h-[56px] text-lg rounded-full',
    lg: 'px-space-32 py-space-20 min-h-[64px] text-xl rounded-full',
  };

  const variants = {
    primary: TONE_VARIANTS.primary,
    secondary: 'bg-white/72 text-primary-700 border border-primary-200/80 backdrop-blur-md shadow-[0_14px_26px_-20px_rgba(36,50,74,0.2)] hover:bg-white/88',
    accent: TONE_VARIANTS.accent,
    orange: TONE_VARIANTS.orange,
    success: TONE_VARIANTS.success,
    magic: TONE_VARIANTS.magic,
    violet: TONE_VARIANTS.violet,
    ghost: 'bg-transparent text-foreground-secondary hover:bg-white/45',
    glass: 'bg-card/78 backdrop-blur-md border border-border/80 text-primary-800 shadow-[0_14px_26px_-20px_rgba(36,50,74,0.18)] hover:bg-card/92',
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
