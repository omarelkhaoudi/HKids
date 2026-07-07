import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

export function EmptyState({ 
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '' 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-700 ${className}`}
    >
      {Icon && (
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6 text-surface-400">
          <Icon className="w-10 h-10" />
        </div>
      )}
      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-surface-500 dark:text-surface-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
