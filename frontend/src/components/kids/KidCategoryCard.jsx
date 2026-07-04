import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function KidCategoryCard({ category }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="h-full"
    >
      <Link
        to={`/kids/category/${category.id}`}
        aria-label={category.label}
        className={`group relative flex h-full min-h-52 flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br ${category.gradient} p-5 text-white shadow-xl ring-4 ${category.ring} transition focus:outline-none focus:ring-8 sm:min-h-60`}
      >
        <motion.span
          aria-hidden="true"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-5 top-5 h-3 w-3 rounded-full bg-white/70 shadow-[0_0_20px_rgba(255,255,255,0.9)]"
        />
        <span className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-white/25 text-6xl shadow-inner backdrop-blur-sm transition group-hover:scale-105 sm:h-28 sm:w-28 sm:text-7xl">
          {category.pictogram}
        </span>
        <div className="mt-6">
          <span className="mb-2 inline-flex min-h-10 items-center rounded-full bg-white/20 px-4 text-base font-black backdrop-blur">
            {category.cue}
          </span>
          <span className="block text-3xl font-black leading-tight sm:text-4xl">
            {category.shortLabel || category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
