import React from 'react';
import { motion } from 'framer-motion';

export function HeroBanner({ 
  title, 
  subtitle, 
  image, 
  actions, 
  badge,
  className = '' 
}) {
  return (
    <div className={`relative w-full rounded-4xl overflow-hidden shadow-large bg-surface-900 ${className}`}>
      {image && (
        <>
          <div className="absolute inset-0">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/60 to-transparent" />
        </>
      )}
      
      <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-24 flex flex-col items-start justify-end h-full min-h-[400px]">
        {badge && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            {badge}
          </motion.div>
        )}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4 max-w-3xl text-shadow-sm"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl text-shadow-sm font-medium"
          >
            {subtitle}
          </motion.p>
        )}
        {actions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );
}
