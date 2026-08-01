import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Logo component for HKids.
 * Uses the HKids wordmark for visible app branding.
 */
export function Logo({ className = "", showText = true, size = "default", isLink = true }) {
  const logoSizes = {
    small: {
      wordmark: "w-[9.75rem]",
      icon: "w-[4.75rem]"
    },
    default: {
      wordmark: "w-[14.5rem]",
      icon: "w-[6rem]"
    },
    large: {
      wordmark: "w-[19rem]",
      icon: "w-[7.5rem]"
    }
  };
  const activeSize = logoSizes[size] || logoSizes.default;
  const svgSize = showText ? activeSize.wordmark : activeSize.icon;
  const viewBox = showText ? "0 0 458 143" : "45 5 180 115";

  const logoContent = (
    <motion.div
      className="inline-flex shrink-0 items-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="HKids"
    >
      <svg
        className={`block h-auto shrink-0 ${svgSize}`}
        viewBox={viewBox}
        fill="none"
        aria-hidden="true"
      >
        <g stroke="var(--hkids-green)" strokeWidth="13.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M62 18V104" />
          <path d="M62 77.5H199" />
          <path d="M199 49V104" />
        </g>
        {showText && (
          <>
            <g stroke="var(--hkids-brown)" strokeWidth="13.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M247 51.5V102.5" />
              <path d="M274 68L250.5 86L274.8 102.5" />
              <path d="M294 71V102" />
              <path d="M348 51.5V102.5" />
              <path d="M348 86.5C348 95.6 340.6 103 331.5 103C322.4 103 315 95.6 315 86.5C315 77.4 322.4 70 331.5 70C340.6 70 348 77.4 348 86.5Z" />
              <path d="M394.2 72.5C388.5 69.8 374.4 68.6 370.2 76.5C364.8 86.8 394.6 82.3 394.8 96.4C395 106.7 376.3 106.5 369.3 101.3" />
            </g>
            <path fill="var(--hkids-brown)" d="M294 45.1C298.1 45.1 301.4 48.4 301.4 52.5C301.4 56.6 298.1 59.9 294 59.9C289.9 59.9 286.6 56.6 286.6 52.5C286.6 48.4 289.9 45.1 294 45.1Z" />
          </>
        )}
      </svg>
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
