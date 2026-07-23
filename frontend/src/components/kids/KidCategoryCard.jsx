import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';
import { LOCAL_BOOK_COVERS_BASE } from '../../utils/bookCover';
import { playKidsUiSound } from '../../utils/kidsUiSound';

const WORLD_TONE = {
  animals: 'kids-world-destination--animals',
  space: 'kids-world-destination--space',
  bedtime: 'kids-world-destination--bedtime',
  princesses: 'kids-world-destination--princesses',
  dinosaurs: 'kids-world-destination--dinosaurs',
  ocean: 'kids-world-destination--ocean',
  world: 'kids-world-destination--world',
  colors: 'kids-world-destination--colors',
  rhymes: 'kids-world-destination--default',
  alphabet: 'kids-world-destination--default',
  numbers: 'kids-world-destination--default',
  jobs: 'kids-world-destination--default',
  spirituality: 'kids-world-destination--bedtime',
  vehicles: 'kids-world-destination--default',
};

const WORLD_ART = {
  animals: 'animals',
  space: 'space',
  bedtime: 'bedtime',
  princesses: 'princesses',
  dinosaurs: 'dinosaurs',
  ocean: 'ocean',
  world: 'world',
  colors: 'colors',
  rhymes: 'rhymes',
  alphabet: 'alphabet',
  numbers: 'numbers',
  jobs: 'jobs',
  spirituality: 'bedtime',
  vehicles: 'jobs',
  magic: 'princesses',
};

const OBJECT_POSITION = {
  animals: '50% 40%',
  space: '50% 30%',
  bedtime: '50% 35%',
  princesses: '50% 40%',
  dinosaurs: '50% 45%',
  ocean: '50% 60%',
  world: '50% 45%',
  colors: '50% 40%',
  rhymes: '50% 40%',
  alphabet: '50% 40%',
  numbers: '50% 40%',
  jobs: '50% 45%',
};

export function KidCategoryCard({ category, to, compact = false, onSelect }) {
  const destination = to || `/kids/library?theme=${category.id}`;
  const reducedMotion = useReducedMotion();
  const toneClass = WORLD_TONE[category.id] || 'kids-world-destination--default';
  const artTheme = WORLD_ART[category.id] || 'default';
  const artSrc = `${LOCAL_BOOK_COVERS_BASE}/themes/${artTheme}.webp`;
  const objectPosition = OBJECT_POSITION[artTheme] || '50% 45%';

  return (
    <motion.div
      {...getHoverMotion(reducedMotion, { whileHover: { y: -4, scale: 1.02 }, whileTap: { scale: 0.98 } })}
      className={`h-full ${compact ? 'shrink-0' : ''}`}
    >
      <Link
        to={destination}
        aria-label={category.label}
        title={category.label}
        onClick={() => {
          playKidsUiSound('tap');
          onSelect?.(category);
        }}
        className={`kids-world-destination kids-world-destination--pictogram ${toneClass} group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 kids-touch-target ${
          compact ? 'w-[8.5rem] sm:w-[9.5rem]' : 'w-full min-h-[12rem]'
        }`}
      >
        <img
          src={artSrc}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="kids-world-destination-art"
          style={{ objectPosition }}
        />
        <span className="kids-world-destination-veil" aria-hidden="true" />
        <span className="kids-world-pictogram kids-world-pictogram--hero" aria-hidden="true">
          {category.pictogram}
        </span>
        <span className="sr-only">{category.shortLabel || category.label}</span>
      </Link>
    </motion.div>
  );
}
