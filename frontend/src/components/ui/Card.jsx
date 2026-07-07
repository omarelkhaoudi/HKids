import React from 'react';
import { motion } from 'framer-motion';

export function Card({ 
  variant = 'default',
  hover = true,
  className = '', 
  children,
  ...props 
}) {
  const baseStyles = "rounded-3xl overflow-hidden relative";
  
  const variants = {
    default: "bg-white dark:bg-surface-800 shadow-soft border border-surface-100 dark:border-surface-700",
    glass: "glass-panel text-white border border-white/20",
    elevated: "bg-white dark:bg-surface-800 shadow-medium border-none",
    premium: "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-large",
  };

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`${baseStyles} ${variants[variant]} transition-all hover:shadow-floating ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
