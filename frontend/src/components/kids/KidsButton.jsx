import React from 'react';
import { motion } from 'framer-motion';

export default function KidsButton({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
  size = 'md',
  'aria-label': ariaLabel,
  type = 'button',
}) {
  const baseClasses = "relative flex items-center justify-center font-extrabold select-none transition-all duration-150 touch-manipulation";
  
  const sizeClasses = {
    sm: "px-4 py-3 min-h-[48px] text-lg rounded-2xl",
    md: "px-6 py-4 min-h-[64px] text-xl rounded-3xl",
    lg: "px-8 py-6 min-h-[80px] text-2xl rounded-[2rem]",
  };

  const variants = {
    primary: "bg-primary-500 text-white border-b-4 border-primary-700 active:border-b-0 active:translate-y-[4px]",
    secondary: "bg-secondary-500 text-white border-b-4 border-secondary-700 active:border-b-0 active:translate-y-[4px]",
    accent: "bg-accent-500 text-white border-b-4 border-accent-700 active:border-b-0 active:translate-y-[4px]",
    ghost: "bg-surface-50 text-surface-900 border-2 border-surface-200 active:bg-surface-100",
    glass: "bg-white/60 backdrop-blur-md border border-white/80 text-primary-900 shadow-glass",
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 shrink-0" strokeWidth={2.5} />}
      {children}
    </motion.button>
  );
}
