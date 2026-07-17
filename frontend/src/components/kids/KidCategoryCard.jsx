import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function KidCategoryCard({ category, to, compact = false }) {
  const destination = to || `/kids/library?theme=${category.id}`;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`h-full ${compact ? 'shrink-0 w-44 sm:w-52' : ''}`}
    >
      <Link
        to={destination}
        aria-label={category.label}
        className={`group relative flex h-full ${compact ? 'min-h-40' : 'min-h-48 md:min-h-56'} flex-col justify-between overflow-hidden rounded-32 bg-gradient-to-br ${category.gradient} ${compact ? 'p-space-16' : 'p-space-20 md:p-space-24'} text-white shadow-card ring-4 ${category.ring} transition focus:outline-none focus-visible:ring-8 kids-touch-target`}
      >
        <motion.span
          aria-hidden="true"
          animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-space-12 top-space-12 h-space-8 w-space-8 rounded-full bg-surface/80 shadow-soft"
        />
        <span className={`grid place-items-center rounded-24 bg-surface/30 shadow-inner backdrop-blur-sm transition group-hover:scale-110 ${compact ? 'h-16 w-16 text-4xl' : 'h-[96px] w-[96px] md:h-[7rem] md:w-[7rem] text-6xl md:text-7xl'}`}>
          {category.pictogram}
        </span>
        <div className={compact ? 'mt-space-12' : 'mt-space-16 md:mt-space-20'}>
          <span className={`mb-space-8 inline-flex min-h-touch items-center rounded-full bg-surface/25 font-black backdrop-blur text-white ${compact ? 'px-space-12 text-caption' : 'px-space-16 text-caption md:text-body'}`}>
            {category.cue}
          </span>
          <span className={`block text-white leading-tight drop-shadow-sm ${compact ? 'text-body font-black line-clamp-2' : 'text-heading-m md:text-heading-l'}`}>
            {category.shortLabel || category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
