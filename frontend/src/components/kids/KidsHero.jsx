import { motion } from 'framer-motion';
import { BRAND_HERO_GRADIENT } from '../../constants/brandTheme';
import { getKidsModality } from '../../constants/kidsModality';

export function KidsHero({
  emoji,
  badge,
  title,
  subtitle,
  children,
  modality,
  gradient,
  className = '',
}) {
  const modalityTheme = modality ? getKidsModality(modality) : null;
  const resolvedGradient = gradient || modalityTheme?.gradient || BRAND_HERO_GRADIENT;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${resolvedGradient} p-8 md:p-12 text-white shadow-kids-soft border-4 border-white/40 ${className}`}
    >
      <div className="absolute -right-16 -top-16 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      {emoji && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[8rem] md:text-[10rem] opacity-20 pointer-events-none" aria-hidden="true">
          {emoji}
        </div>
      )}
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/25 backdrop-blur-md border border-white/35 px-4 py-2 text-sm font-black mb-4">
            {badge}
          </div>
        )}
        {title && <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-md mb-3">{title}</h1>}
        {subtitle && <p className="text-lg md:text-xl font-bold text-white/90">{subtitle}</p>}
        {children}
      </div>
    </motion.section>
  );
}

export default KidsHero;
