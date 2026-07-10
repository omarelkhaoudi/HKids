import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function KidsStoryCard({ 
  title, 
  image, 
  duration, 
  onClick, 
  color = 'primary' 
}) {
  const colorMap = {
    primary: "bg-primary-50 border-primary-200 hover:border-primary-400 hover:shadow-[0_10px_30px_-10px_rgba(123,62,184,0.3)]",
    secondary: "bg-secondary-50 border-secondary-200 hover:border-secondary-400 hover:shadow-[0_10px_30px_-10px_rgba(56,157,133,0.3)]",
    accent: "bg-accent-50 border-accent-200 hover:border-accent-400 hover:shadow-[0_10px_30px_-10px_rgba(247,98,25,0.3)]",
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${colorMap[color]} min-h-[48px]`}
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover rounded-t-[1.8rem]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Play Button Overlay */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-lg">
          <Play className="w-8 h-8 text-primary-500 fill-primary-500 ml-1" />
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-extrabold text-xl text-surface-900 mb-1 truncate">{title}</h3>
        {duration && (
          <p className="text-surface-500 font-bold text-sm">{duration}</p>
        )}
      </div>
    </motion.div>
  );
}
