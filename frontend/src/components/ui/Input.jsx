import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
 label, 
 error, 
 icon: Icon,
 className = '', 
 ...props 
}, ref) => {
 return (
 <div className="w-full">
 {label && (
 <label className="block text-sm font-bold text-foreground-secondary mb-2">
 {label}
 </label>
 )}
 <div className="relative">
 {Icon && (
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <Icon className="h-5 w-5 text-surface-400" />
 </div>
 )}
 <input
 ref={ref}
 className={`
 w-full bg-surface-secondary border border-border text-foreground text-base rounded-2xl
 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
 transition-all outline-none py-3 px-4
 ${Icon ? 'pl-11' : ''}
 ${error ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500' : ''}
 ${className}
 `}
 {...props}
 />
 </div>
 {error && (
 <p className="mt-2 text-sm font-medium text-danger-500">{error}</p>
 )}
 </div>
 );
});
Input.displayName = 'Input';
