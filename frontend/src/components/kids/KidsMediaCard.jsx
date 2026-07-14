import { memo } from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PlayIcon, HeartIcon, DownloadIcon, SparklesIcon, ClockIcon, ShieldIcon } from '../Icons';

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

const SIZE_MAP = {
  carousel: 'relative w-48 h-64 md:w-56 md:h-72',
  poster: 'relative h-80 w-56 md:h-96 md:w-64 shrink-0',
};

export const KidsMediaCard = memo(function KidsMediaCard({
  book,
  variant = 'carousel',
  hideTitle = true,
  isRtl = false,
  isFavorite = false,
  offlineReady = false,
  showActions = false,
  onPlay,
  onFavorite,
  onDownload,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const sizeClass = SIZE_MAP[variant] || SIZE_MAP.carousel;
  const hoverMotion = reducedMotion ? {} : {
    whileHover: { y: -10, scale: variant === 'poster' ? 1.02 : 1 },
    whileTap: { scale: 0.98 },
  };

  return (
    <motion.div
      {...hoverMotion}
      className={`group cursor-pointer overflow-hidden rounded-[2rem] bg-surface-secondary shadow-lg transition-shadow hover:shadow-2xl border-4 border-white/30 dark:border-white/10 ${sizeClass} ${className}`}
      onClick={() => onPlay?.(book)}
      aria-label={book.title}
    >
      <img
        src={getImageUrl(book.cover_image, 'book')}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${variant === 'poster' ? 'from-black/90 via-black/30' : 'from-black/50 via-transparent'} to-transparent`} />

      {book.is_premium && (
        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-3 py-1 text-xs font-black text-white shadow-md border-2 border-white/50">
            <SparklesIcon className="h-4 w-4" /> PRO
          </span>
        </div>
      )}

      {showActions && (
        <div className="absolute right-3 top-3 flex flex-col gap-3 z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onFavorite?.(book.id); }}
            className="rounded-full bg-white/20 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/30 hover:bg-rose-500 hover:border-rose-400 transition-colors"
            aria-label="Favorite"
          >
            <HeartIcon className="h-6 w-6" filled={isFavorite} />
          </motion.button>
          {!offlineReady ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onDownload?.(book); }}
              className="rounded-full bg-white/20 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/30 hover:bg-secondary-500 hover:border-secondary-400 transition-colors"
              aria-label="Download"
            >
              <DownloadIcon className="h-6 w-6" />
            </motion.button>
          ) : (
            <div className="rounded-full bg-secondary-500 p-3 text-white shadow-xl border-2 border-secondary-400">
              <DownloadIcon className="h-6 w-6" />
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white border-4 border-white/50 transition-all duration-300 ${
            variant === 'poster'
              ? 'h-20 w-20 shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:scale-110 group-hover:bg-primary-500 group-hover:border-primary-400'
              : 'h-16 w-16 opacity-80 group-hover:opacity-100 group-hover:scale-110'
          }`}
          onClick={(e) => { e.stopPropagation(); onPlay?.(book); }}
        >
          <PlayIcon className={`drop-shadow-md ${variant === 'poster' ? `h-10 w-10 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}` : `h-8 w-8 ${isRtl ? 'mr-1 rotate-180' : 'ml-1'}`}`} filled />
        </motion.div>
      </div>

      {(variant === 'poster' || !hideTitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {!hideTitle && (
            <h3 className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow-lg mb-2">
              {book.title}
            </h3>
          )}
          <div className="flex items-center gap-3 text-sm font-black text-white/90">
            {book.duration_seconds > 0 && (
              <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                <ClockIcon className="h-4 w-4 text-accent-400" />
                {formatDuration(book.duration_seconds)}
              </span>
            )}
            {book.age_level && (
              <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                <ShieldIcon className="h-4 w-4 text-secondary-400" />
                {book.age_level}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});
