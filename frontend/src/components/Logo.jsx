import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Logo component for HKids.
 * Uses the compact HKids mark shared by the app shell and PWA assets.
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
      className={`${sizeClasses[size]} shrink-0`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src="/hkids-logo.svg"
        alt={showText ? "" : "HKids"}
        aria-hidden={showText ? true : undefined}
        className="block h-full w-full object-contain"
      />
    </motion.div>
  );

  const textContent = showText && (
    <motion.h1
      className={`font-bold tracking-tight text-foreground-700 drop-shadow-sm ${textSizes[size]}`}
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
