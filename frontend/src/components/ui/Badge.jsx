import React from 'react';

export function Badge({ 
  variant = 'neutral', 
  size = 'md',
  className = '', 
  children 
}) {
  const baseStyles = "inline-flex items-center font-bold rounded-full";
  
  const variants = {
    primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    secondary: "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300",
    success: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300",
    warning: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300",
    danger: "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300",
    neutral: "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300",
    premium: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm",
    glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
