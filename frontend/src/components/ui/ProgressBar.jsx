import React from 'react';
import { motion } from 'framer-motion';

export function ProgressBar({ progress, label, color = 'bg-primary-500', className = '' }) {
 const clampedProgress = Math.min(100, Math.max(0, progress));

 return (
 <div className={`w-full ${className}`}>
 {label && (
 <div className="flex justify-between mb-1">
 <span className="text-xs font-bold text-foreground-secondary">{label}</span>
 <span className="text-xs font-bold text-foreground-secondary">{Math.round(clampedProgress)}%</span>
 </div>
 )}
 <div className="w-full bg-surface-200 rounded-full h-2.5 overflow-hidden">
 <motion.div
 className={`h-2.5 rounded-full ${color}`}
 initial={{ width: 0 }}
 animate={{ width: `${clampedProgress}%` }}
 transition={{ duration: 0.5, ease:"easeOut" }}
 />
 </div>
 </div>
 );
}
