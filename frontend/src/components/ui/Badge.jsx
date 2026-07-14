import React from 'react';

export function Badge({ 
 variant = 'neutral', 
 size = 'md',
 className = '', 
 children 
}) {
 const baseStyles ="inline-flex items-center font-bold rounded-full";
 
 const variants = {
 primary:"bg-primary-100 text-foreground-700 /30",
 secondary:"bg-secondary-100 text-foreground-secondary-700 /30",
 success:"bg-success-100 text-success-700 /30",
 warning:"bg-warning-100 text-warning-700 /30",
 danger:"bg-danger-100 text-danger-700 /30",
 neutral:"bg-surface-secondary text-foreground-secondary",
 premium:"bg-gradient-to-r from-accent-400 to-accent-500 text-white shadow-sm",
 glass:"bg-card/20 backdrop-blur-md border border-white/30 text-white",
 };

 const sizes = {
 sm:"px-2.5 py-0.5 text-xs",
 md:"px-3 py-1 text-sm",
 lg:"px-4 py-1.5 text-base",
 };

 return (
 <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
 {children}
 </span>
 );
}
