import { motion } from 'framer-motion';

export function KidsThemePill({ theme, isActive, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`snap-start shrink-0 flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-4 rounded-[2rem] font-black text-lg shadow-lg border-4 transition-all ${
        isActive
          ? `bg-gradient-to-r ${theme.gradient} text-white border-white/50 scale-105 shadow-xl`
          : 'bg-white dark:bg-surface-800 text-foreground-secondary border-transparent hover:bg-surface-50 hover:text-primary-500'
      }`}
      aria-label={theme.shortLabel || theme.label}
      aria-pressed={isActive}
    >
      <span className="text-4xl md:text-3xl filter drop-shadow-sm">{theme.pictogram}</span>
      <span className="hidden md:inline">{theme.shortLabel || theme.label}</span>
    </motion.button>
  );
}
