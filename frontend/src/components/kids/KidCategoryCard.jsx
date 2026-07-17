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
          compact ? 'w-[7.5rem] sm:w-[8.25rem]' : 'w-full min-h-[10rem]'
        }`}
      >
        <span className="kids-world-pictogram" aria-hidden="true">
          {category.pictogram}
        </span>
        <div className="relative z-10 text-center w-full">
          <h3 className="text-body font-semibold text-foreground leading-snug line-clamp-2">
            {category.shortLabel || category.label}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
