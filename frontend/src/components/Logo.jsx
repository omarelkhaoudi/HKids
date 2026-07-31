import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Logo component for HKids.
 * Uses the HKids wordmark for visible app branding.
 */
export function Logo({ className = "", showText = true, size = "default", isLink = true }) {
  const sizeClasses = {
    small: "w-40 h-auto",
    default: "w-56 h-auto",
    large: "w-80 h-auto"
  };

  const logoContent = (
    <motion.div
      className={`${sizeClasses[size]} shrink-0`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src="/hkids-wordmark.svg?v=2"
        alt="HKids"
        className="block h-full w-full object-contain"
      />
    </motion.div>
  );

  if (isLink) {
    return (
      <Link
        to="/"
        className={`inline-flex items-center group ${className}`}
      >
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {logoContent}
    </div>
  );
}

export default Logo;
