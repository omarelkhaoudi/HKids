import React from 'react';
import { motion } from 'framer-motion';

export const LitMascot = ({ className = '' }) => {
  return (
    <motion.div 
      className={`relative w-48 h-48 md:w-64 md:h-64 ${className}`}
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full animate-pulse-glow" />
      
      {/* Mascot Image */}
      <img 
        src="/assets/lit_mascot.png" 
        alt="Le Lit Qui Lit Mascotte" 
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
      />
      
      {/* Sparkles */}
      <motion.div 
        className="absolute top-4 right-8 w-4 h-4 bg-accent-300 rounded-full blur-[2px]"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div 
        className="absolute bottom-12 left-4 w-3 h-3 bg-secondary-300 rounded-full blur-[1px]"
        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
};

export default LitMascot;
