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
        className={`group relative flex h-full min-h-48 md:min-h-56 flex-col justify-between overflow-hidden rounded-[2.25rem] bg-gradient-to-br ${category.gradient} p-5 md:p-6 text-white shadow-xl ring-4 ${category.ring} transition focus:outline-none focus:ring-8 kids-touch-target`}
      >
        <motion.span
          aria-hidden="true"
          animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-5 top-5 h-3.5 w-3.5 rounded-full bg-white/80 shadow-[0_0_24px_rgba(255,255,255,0.95)]"
        />
        <span className="grid h-24 w-24 md:h-28 md:w-28 place-items-center rounded-[1.85rem] bg-white/30 text-6xl md:text-7xl shadow-inner backdrop-blur-sm transition group-hover:scale-110">
          {category.pictogram}
        </span>
        <div className="mt-4 md:mt-5">
          <span className="mb-2 inline-flex min-h-9 items-center rounded-full bg-white/25 px-4 text-sm md:text-base font-black backdrop-blur">
            {category.cue}
          </span>
          <span className="block text-2xl md:text-3xl font-black leading-tight drop-shadow-sm">
            {category.shortLabel || category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
