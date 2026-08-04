import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ActionCard = ({ title, imageSrc, route, bgColor, delay = 0, size = 'normal' }) => {
  const navigate = useNavigate();

  const isLarge = size === 'large';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 15, 
        delay 
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -8,
        transition: { type: 'spring', stiffness: 300, damping: 10 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(route)}
      className={`relative cursor-pointer rounded-[32px] overflow-hidden border-4 border-white shadow-floating ${bgColor} ${isLarge ? 'col-span-2 row-span-2 min-h-[220px]' : 'col-span-1 min-h-[180px]'} flex flex-col items-center justify-end p-4 group`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
      
      {/* Floating Image */}
      <motion.img 
        src={imageSrc} 
        alt={title}
        className={`absolute ${isLarge ? '-top-6 w-[120%] max-w-none' : '-top-2 w-[110%] max-w-none'} object-cover z-0`}
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.5,
        }}
      />

      {/* Card Title Container */}
      <div className="relative z-20 w-full bg-white/90 backdrop-blur-md rounded-2xl py-3 px-4 flex items-center justify-between shadow-soft">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 tracking-wide">
          {title}
        </h3>
        {/* Play Icon Button */}
        <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform">
          ▶
        </div>
      </div>
    </motion.div>
  );
};

export default ActionCard;
