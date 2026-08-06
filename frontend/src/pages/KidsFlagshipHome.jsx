import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleEffect from '../components/kids/flagship/ParticleEffect';
import { PlayIcon } from '../components/Icons';
import { playKidsUiSound } from '../utils/kidsUiSound';

const KidsFlagshipHome = () => {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    playKidsUiSound('tap');
    navigate('/kids/library');
  };

  return (
    <div className="relative min-h-screen bg-sky-100 overflow-hidden font-sans select-none flex items-center justify-center">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 opacity-90" />
      
      {/* Magic Particles */}
      <ParticleEffect />

      {/* Decorative magical elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <span className="kids-home-cloud" style={{ width: '12rem', top: '10%', left: '5%' }} />
        <span className="kids-home-cloud" style={{ width: '8rem', top: '25%', right: '10%' }} />
        <span className="kids-home-star" style={{ top: '15%', left: '40%' }} />
        <span className="kids-home-star" style={{ top: '30%', right: '25%' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, y: [0, -20, 0] }}
          transition={{ 
            scale: { type: "spring", bounce: 0.5, duration: 0.8 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
          }}
          className="text-center"
        >
          <img 
            src="/illustrations/avatar_lion.jpg" 
            alt="HKids Mascot" 
            className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white mx-auto"
          />
        </motion.div>

        <motion.button
          onClick={handlePlayClick}
          whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            y: [0, -15, 0],
            boxShadow: ["0px 10px 30px rgba(249, 115, 22, 0.4)", "0px 25px 40px rgba(249, 115, 22, 0.6)", "0px 10px 30px rgba(249, 115, 22, 0.4)"]
          }}
          transition={{ 
            y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 0.5 }
          }}
          className="bg-gradient-to-br from-yellow-300 via-orange-400 to-orange-500 text-white rounded-full p-8 md:p-12 border-4 border-white/40 flex items-center justify-center focus:outline-none focus:ring-8 focus:ring-orange-300 transition-all"
          aria-label="Play"
        >
          <PlayIcon className="w-24 h-24 md:w-32 md:h-32 ml-4 drop-shadow-md" />
        </motion.button>
      </div>
    </div>
  );
};

export default KidsFlagshipHome;
