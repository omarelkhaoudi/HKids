import { motion } from 'framer-motion';
import { BRAND_HERO_GRADIENT } from '../../constants/brandTheme';
import { getKidsModality } from '../../constants/kidsModality';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsPageEnter } from '../../constants/kidsMotion';

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
  const reducedMotion = useReducedMotion();
  const modalityTheme = modality ? getKidsModality(modality) : null;
  const resolvedGradient = gradient || modalityTheme?.gradient || BRAND_HERO_GRADIENT;

  return (
    <motion.section
      {...getMotionProps(reducedMotion, kidsPageEnter)}
      className={`relative overflow-hidden rounded-32 bg-gradient-to-br ${resolvedGradient} p-space-24 md:p-space-32 text-white shadow-card border border-white/20 ${className}`}
    >
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full pointer-events-none" aria-hidden="true" />
      {emoji && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[6rem] md:text-[8rem] opacity-10 pointer-events-none" aria-hidden="true">
          {emoji}
        </div>
      )}
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/25 px-4 py-2 text-sm font-bold mb-space-16">
            {badge}
          </div>
        )}
        {title && <h1 className="text-heading-xl md:text-hero font-bold leading-tight mb-space-12">{title}</h1>}
        {subtitle && <p className="text-body-lg md:text-xl font-medium text-white/90 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </motion.section>
  );
}

export default KidsHero;
