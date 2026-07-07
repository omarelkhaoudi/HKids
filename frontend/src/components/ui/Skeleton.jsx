import React from 'react';

export function Skeleton({ className = '', rounded = 'rounded-2xl', ...props }) {
 return (
 <div 
 className={`animate-pulse bg-surface-200 ${rounded} ${className}`}
 {...props}
 />
 );
}
