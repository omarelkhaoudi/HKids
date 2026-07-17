import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';

const WORLD_TONE = {
  animals: 'kids-world-destination--animals',
  space: 'kids-world-destination--space',
  bedtime: 'kids-world-destination--bedtime',
  princesses: 'kids-world-destination--princesses',
  dinosaurs: 'kids-world-destination--dinosaurs',
  ocean: 'kids-world-destination--ocean',
  world: 'kids-world-destination--world',
  colors: 'kids-world-destination--colors',
};

export function KidCategoryCard({ category, to, compact = false }) {
  const destination = to || `/kids/library?theme=${category.id}`;
  const reducedMotion = useReducedMotion();
  const toneClass = WORLD_TONE[category.id] || 'kids-world-destination--default';

  return (
    <motion.div
      {...getHoverMotion(reducedMotion, { whileHover: { y: -2 }, whileTap: { scale: 0.98 } })}
      className={`h-full ${compact ? 'shrink-0' : ''}`}
    >
      <Link
        to={destination}
        aria-label={category.label}
        className={`kids-world-destination ${toneClass} group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 kids-touch-target ${
          compact ? 'w-[11.5rem] sm:w-[12.5rem]' : 'w-full min-h-[12rem]'
        }`}
      >
        <span
          className="absolute top-space-16 inset-inline-end-space-16 text-5xl md:text-6xl opacity-90 drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          {category.pictogram}
        </span>
        <div className="relative z-10 pe-12">
          <p className="text-caption font-semibold uppercase tracking-wide text-foreground-muted mb-space-8">
            {category.cue}
          </p>
          <h3 className="text-heading-m font-semibold text-foreground leading-snug">
            {category.shortLabel || category.label}
          </h3>
          <p className="mt-space-8 text-caption font-medium text-foreground-secondary line-clamp-2">
            {category.label}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
