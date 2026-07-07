import React from 'react';

export function Avatar({ src, alt, initials, size = 'md', className = '' }) {
 const sizes = {
 sm:"w-8 h-8 text-xs",
 md:"w-12 h-12 text-base",
 lg:"w-16 h-16 text-xl",
 xl:"w-24 h-24 text-3xl",
 };

 const baseStyles ="relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold shadow-sm flex-shrink-0";

 return (
 <div className={`${baseStyles} ${sizes[size]} bg-primary-100 text-foreground-600 ${className}`}>
 {src ? (
 <img src={src} alt={alt} className="w-full h-full object-cover" />
 ) : (
 <span>{initials || '?'}</span>
 )}
 </div>
 );
}
