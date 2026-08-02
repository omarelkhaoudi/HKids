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
 <label className="mb-2 block text-sm font-black text-foreground-secondary">
 {label}
 </label>
 )}
 <div className="relative">
 {Icon && (
 <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
 <Icon className="h-5 w-5 text-primary-600" />
 </div>
 )}
 <input
 ref={ref}
 className={`
 hkids-input w-full bg-white text-base font-bold
 transition-all py-3.5 px-4 shadow-soft
 ${Icon ? 'ps-11' : ''}
 ${error ? 'border-hkids-brown focus:ring-hkids-brown/20 focus:border-hkids-brown' : ''}
 ${className}
 `}
 {...props}
 />
 </div>
 {error && (
 <p className="mt-2 text-sm font-bold text-hkids-brown-dark">{error}</p>
 )}
 </div>
 );
});
Input.displayName = 'Input';
