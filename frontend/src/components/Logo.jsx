import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookIcon } from './Icons';

/**
 * Logo component for HKids
 * Uses the magical reading child illustration as the logo
 * Falls back to BookIcon if image is not found
 */
export function Logo({ className = "", showText = true, size = "default", isLink = true }) {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-12 h-12",
    large: "w-16 h-16"
  };

  const textSizes = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-3xl"
  };

  const logoContent = (
    <motion.div 
      className={`${sizeClasses[size]} relative rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all flex items-center justify-center`}
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src="/HKidsimg.webp"
        alt="HKids Logo - Enfant lisant un livre magique"
        className="w-full h-full object-cover rounded-xl"
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
      <div className="hidden w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
        <BookIcon className="w-2/3 h-2/3 text-white" />
      </div>
    </motion.div>
  );

  const textContent = showText && (
    <motion.h1 
      className={`font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent tracking-tight ${textSizes[size]}`}
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
