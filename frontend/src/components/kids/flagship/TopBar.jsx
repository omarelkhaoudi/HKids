import React from 'react';
import { motion } from 'framer-motion';

const TopBar = () => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center justify-between w-full p-6 pt-10 relative z-20"
    >
      <div className="flex items-center gap-4">
        {/* Animated Avatar */}
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [-2, 2, -2, 0] }}
          className="relative w-20 h-20 rounded-full border-4 border-white shadow-card overflow-hidden bg-white"
        >
          <img 
            src="/illustrations/hkids_avatar_1785859297185.jpg" 
            alt="Child Avatar" 
            className="w-full h-full object-cover"
          />
          {/* Level Badge Overlay */}
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-sm z-10 transform rotate-12">
            Lv.3
          </div>
        </motion.div>

        {/* Greeting & XP */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-white drop-shadow-md tracking-wide">
            Hi, Leo! 👋
          </h1>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-4 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/30 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-white drop-shadow-sm">650 XP</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sun/Moon & Streak */}
      <div className="flex flex-col items-end gap-2">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 flex items-center justify-center text-4xl drop-shadow-lg"
        >
          ☀️
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex items-center gap-1 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40 shadow-sm"
        >
          <span className="text-xl">🔥</span>
          <span className="font-bold text-white drop-shadow-sm">5 Days</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TopBar;
