import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';

export function KidCategoryCard({ category, to, compact = false }) {
  const destination = to || `/kids/library?theme=${category.id}`;
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...getHoverMotion(reducedMotion, { whileHover: { y: -3 }, whileTap: { scale: 0.98 } })}
      className={`h-full ${compact ? 'shrink-0 w-40 sm:w-48' : ''}`}
    >
      <Link
        to={destination}
        aria-label={category.label}
        className={`group relative flex h-full ${compact ? 'min-h-36' : 'min-h-44 md:min-h-52'} flex-col justify-between overflow-hidden rounded-32 bg-card border border-border/70 ${compact ? 'p-space-16' : 'p-space-20 md:p-space-24'} text-foreground shadow-soft hover:shadow-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 kids-touch-target`}
      >
        <span
          className={`absolute inset-0 opacity-90 bg-gradient-to-br ${category.gradient}`}
          style={{ opacity: 0.12 }}
          aria-hidden="true"
        />
        <span className={`relative grid place-items-center rounded-24 bg-surface-secondary/80 transition group-hover:scale-105 ${compact ? 'h-14 w-14 text-3xl' : 'h-20 w-20 md:h-24 md:w-24 text-5xl md:text-6xl'}`}>
          {category.pictogram}
        </span>
        <div className={`relative ${compact ? 'mt-space-12' : 'mt-space-16'}`}>
          <span className={`mb-space-8 inline-flex min-h-[40px] items-center rounded-full bg-primary-50 text-primary-700 font-bold ${compact ? 'px-space-12 text-caption' : 'px-space-16 text-caption'}`}>
            {category.cue}
          </span>
          <span className={`block text-foreground leading-snug ${compact ? 'text-body font-bold line-clamp-2' : 'text-heading-m font-bold'}`}>
            {category.shortLabel || category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
