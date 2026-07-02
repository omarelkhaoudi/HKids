import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function ContentCategoryCard({ category, count = 0 }) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="h-full">
      <Link
        to={`/content-library/${category.id}`}
        className={`flex h-full min-h-44 flex-col justify-between rounded-2xl bg-gradient-to-br ${category.gradient} p-5 text-white shadow-lg transition hover:shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-4xl backdrop-blur">
            {category.pictogram}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-black backdrop-blur">
            {count}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-black">{category.label}</h2>
          <p className="mt-1 text-sm font-semibold text-white/85">{category.description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
