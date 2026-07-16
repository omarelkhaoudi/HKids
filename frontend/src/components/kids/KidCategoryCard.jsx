import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function KidCategoryCard({ category, to }) {
  const destination = to || `/kids/library?theme=${category.id}`;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="h-full"
    >
      <Link
        to={destination}
        aria-label={category.label}
        className={`group relative flex h-full min-h-48 md:min-h-56 flex-col justify-between overflow-hidden rounded-32 bg-gradient-to-br ${category.gradient} p-20 md:p-24 text-white shadow-card ring-4 ${category.ring} transition focus:outline-none focus-visible:ring-8 kids-touch-target`}
      >
        <motion.span
          aria-hidden="true"
          animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-20 top-20 h-12 w-12 rounded-full bg-surface/80 shadow-soft"
        />
        <span className="grid h-96 w-96 md:h-[7rem] md:w-[7rem] place-items-center rounded-24 bg-surface/30 text-6xl md:text-7xl shadow-inner backdrop-blur-sm transition group-hover:scale-110">
          {category.pictogram}
        </span>
        <div className="mt-16 md:mt-20">
          <span className="mb-8 inline-flex min-h-touch items-center rounded-full bg-surface/25 px-16 text-caption md:text-body font-black backdrop-blur text-white">
            {category.cue}
          </span>
          <span className="block text-heading-m md:text-heading-l text-white leading-tight drop-shadow-sm">
            {category.shortLabel || category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
