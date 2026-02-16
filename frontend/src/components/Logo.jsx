import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookIcon, StarIcon } from './Icons';

/**
 * Logo component for HKids
 * Uses the magical reading child illustration as the logo
 * Falls back to BookIcon if image is not found
 */
export function Logo({ className = "", showText = true, size = "default", isLink = true }) {
  const sizeClasses = {
    small: "w-10 h-10",
    default: "w-14 h-14",
    large: "w-20 h-20"
  };

  const textSizes = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-3xl"
  };

  const logoContent = (
    <motion.div 
      className={`${sizeClasses[size]} relative group`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Étincelles magiques animées autour du logo (à l'extérieur) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const radius = size === 'small' ? 20 : size === 'default' ? 28 : 38;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.4, 1, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/70"></div>
          </motion.div>
        );
      })}
      
      {/* Cadre externe avec gradient rouge/rose (comme l'illustration) */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400 via-pink-400 to-orange-400 p-0.5 shadow-lg">
        {/* Cadre blanc interne (comme l'illustration) */}
        <div className="w-full h-full rounded-2xl bg-white relative overflow-hidden">
          {/* Image du logo */}
          <img
            src="/HKidsimg.webp"
            alt="HKids Logo - Enfant lisant un livre magique"
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              // Fallback si l'image n'est pas trouvée
              e.target.style.display = 'none';
              const fallback = e.target.nextElementSibling;
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
          {/* Fallback icon si l'image n'existe pas */}
          <div className="hidden w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center">
            <BookIcon className="w-2/3 h-2/3 text-orange-600" />
          </div>
          
          {/* Effet de lumière magique qui émane du livre */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity"
            style={{
              background: 'radial-gradient(circle at center, rgba(253, 224, 71, 0.2) 0%, transparent 70%)'
            }}
          ></div>
          
          {/* Points colorés supplémentaires (comme dans l'illustration) */}
          {Array.from({ length: 6 }).map((_, i) => {
            const positions = [
              { left: '20%', top: '30%' },
              { left: '75%', top: '25%' },
              { left: '15%', top: '70%' },
              { left: '80%', top: '65%' },
              { left: '45%', top: '15%' },
              { left: '55%', top: '85%' },
            ];
            const colors = ['bg-yellow-300', 'bg-orange-300', 'bg-blue-300', 'bg-pink-300', 'bg-yellow-200', 'bg-orange-200'];
            const pos = positions[i % positions.length];
            
            return (
              <motion.div
                key={`dot-${i}`}
                className={`absolute ${colors[i % colors.length]} rounded-full pointer-events-none`}
                style={{
                  ...pos,
                  width: '3px',
                  height: '3px',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const textContent = showText && (
    <motion.h1 
      className={`font-bold text-white tracking-tight ${textSizes[size]}`}
      whileHover={{ x: 2 }}
    >
      HKids
    </motion.h1>
  );

  if (isLink) {
    return (
      <Link 
        to="/" 
        className={`flex items-center gap-3 group ${className}`}
      >
        {logoContent}
        {textContent}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoContent}
      {textContent}
    </div>
  );
}

export default Logo;
