import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'home', icon: '🏠', route: '/kids' },
  { id: 'stories', icon: '📚', route: '/kids/library' },
  { id: 'games', icon: '🎮', route: '/kids/games' },
  { id: 'explore', icon: '🌍', route: '/kids/explore' },
  { id: 'profile', icon: '👤', route: '/kids/profile' },
];

const FloatingNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
      className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-floating px-6 py-4 rounded-full flex items-center gap-6 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route || (item.route === '/kids' && location.pathname === '/kids/home');
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.route)}
              className={`relative w-14 h-14 flex items-center justify-center rounded-full text-3xl transition-colors duration-300 ${
                isActive ? 'bg-yellow-100 text-yellow-600 shadow-inner' : 'hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 drop-shadow-sm">{item.icon}</span>
              
              {isActive && (
                <motion.div 
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-yellow-200 border-2 border-yellow-300 rounded-full z-0"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FloatingNavBar;
