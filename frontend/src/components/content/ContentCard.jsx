import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AudioIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  TagIcon,
} from '../Icons';

export function ContentCard({ content, playing = false, onToggleAudio }) {
  const hasAudio = Boolean(content.audio_url);

  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-surface-100 transition hover:shadow-lg dark:bg-surface-800 dark:ring-surface-700"
    >
      <Link to={`/book-details/${content.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] bg-surface-100 dark:bg-surface-700">
          {content.cover_url ? (
            <img
              src={content.cover_url}
              alt={content.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center text-surface-400">
              <BookIcon className="h-14 w-14" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {content.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-400 px-3 py-1 text-xs font-black text-accent-950 shadow">
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

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-foreground-600 dark:bg-primary-900/30 dark:text-foreground-200">
              <TagIcon className="h-3.5 w-3.5" />
              {content.library_category_label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
              <GlobeIcon className="h-3.5 w-3.5" />
              {content.language_label}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-black text-surface-900 dark:text-surface-100">
            {content.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-surface-600 dark:text-surface-300">
            {content.short_description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-sm font-bold text-surface-500 dark:text-surface-300">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {content.duration_label}
            </span>
            <span>{content.age_range_label}</span>
          </div>
        </div>
      </Link>

      {onToggleAudio && (
        <div className="mt-auto px-4 pb-4">
          <button
            onClick={() => onToggleAudio(content)}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-3xl text-sm font-black transition ${
              hasAudio
                ? playing
                  ? 'bg-accent-500 text-white hover:bg-accent-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-surface-100 text-surface-400 dark:bg-surface-700'
            }`}
            title={hasAudio ? 'Ecouter' : 'Audio indisponible'}
          >
            <AudioIcon className="h-5 w-5" />
            {hasAudio ? (
              playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />
            ) : null}
            <span>{hasAudio ? 'Ecouter' : 'Audio manquant'}</span>
          </button>
        </div>
      )}
    </motion.article>
  );
}
