import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  TagIcon,
} from '../Icons';

export function ContentCard({ content }) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-neutral-100 transition hover:shadow-lg dark:bg-neutral-800 dark:ring-neutral-700"
    >
      <Link to={`/book-details/${content.id}`} className="block">
        <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-700">
          {content.cover_url ? (
            <img
              src={content.cover_url}
              alt={content.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center text-neutral-400">
              <BookIcon className="h-14 w-14" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {content.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow">
                <LockIcon className="h-3.5 w-3.5" />
                Premium
              </span>
            )}
            {content.is_downloaded && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow">
                <CheckIcon className="h-3.5 w-3.5" />
                Telecharge
              </span>
            )}
          </div>

          <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-rose-500 shadow">
            <HeartIcon className="h-5 w-5" filled={content.is_favorite} />
          </span>
        </div>

        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-200">
              <TagIcon className="h-3.5 w-3.5" />
              {content.library_category_label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
              <GlobeIcon className="h-3.5 w-3.5" />
              {content.language_label}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-black text-neutral-900 dark:text-neutral-100">
            {content.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
            {content.short_description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-300">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {content.duration_label}
            </span>
            <span>{content.age_range_label}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
