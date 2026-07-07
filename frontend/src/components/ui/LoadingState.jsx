import React from 'react';
import { motion } from 'framer-motion';

export function LoadingState({ message = 'Chargement...', fullScreen = false }) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-12 w-full";

  return (
    <div className={containerClass}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mb-4"
      />
      <p className="text-surface-600 dark:text-surface-300 font-bold">{message}</p>
    </div>
  );
}
