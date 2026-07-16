import { motion } from 'framer-motion';

export function KidsThemePill({ theme, isActive, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`kids-chip snap-start shrink-0 min-h-[56px] ${
        isActive
          ? `bg-gradient-to-r ${theme.gradient} text-white border-white/60 scale-105 shadow-xl`
          : 'bg-white dark:bg-surface-800 text-foreground-secondary border-transparent hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100'
      }`}
      aria-label={theme.shortLabel || theme.label}
      aria-pressed={isActive}
    >
      <span className="text-4xl md:text-5xl filter drop-shadow-sm leading-none">{theme.pictogram}</span>
      <span className="hidden md:inline text-lg">{theme.shortLabel || theme.label}</span>
    </motion.button>
  );
}
