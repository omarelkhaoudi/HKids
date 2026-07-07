import React from 'react';
import { motion } from 'framer-motion';

export function SectionHeader({ title, subtitle, action, className = '' }) {
 return (
 <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 ${className}`}>
 <div>
 <h2 className="text-2xl font-black text-foreground tracking-tight">
 {title}
 </h2>
 {subtitle && (
 <p className="mt-1 text-foreground-muted font-medium text-sm">
 {subtitle}
 </p>
 )}
 </div>
 {action && (
 <div className="shrink-0">
 {action}
 </div>
 )}
 </div>
 );
}
