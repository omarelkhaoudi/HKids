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
        className={`group flex min-h-44 h-full flex-col justify-between rounded-[2rem] bg-gradient-to-br ${category.gradient} p-5 text-white shadow-xl ring-4 ${category.ring} transition focus:outline-none focus:ring-8 sm:min-h-52`}
      >
        <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white/25 text-5xl shadow-inner backdrop-blur-sm transition group-hover:scale-105 sm:h-24 sm:w-24 sm:text-6xl">
          {category.pictogram}
        </span>
        <span className="mt-6 block text-2xl font-black leading-tight sm:text-3xl">
          {category.label}
        </span>
      </Link>
    </motion.div>
  );
}
