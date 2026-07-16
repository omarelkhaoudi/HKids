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
  carousel: 'relative w-52 h-[17rem] md:w-60 md:h-80',
  poster: 'relative h-[22rem] w-60 md:h-[26rem] md:w-72 shrink-0',
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
    whileHover: { y: -10, scale: variant === 'poster' ? 1.02 : 1.03 },
    whileTap: { scale: 0.97 },
  };

  return (
    <motion.div
      {...hoverMotion}
      className={`kids-story-card group cursor-pointer ${sizeClass} ${className}`}
      onClick={() => onPlay?.(book)}
      aria-label={book.title}
    >
      <img
        src={getImageUrl(book.cover_image, 'book')}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${variant === 'poster' ? 'from-black/85 via-black/25' : 'from-black/55 via-transparent'} to-transparent`} />

      {book.is_premium && (
        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-3 py-1.5 text-xs font-black text-white shadow-md border-2 border-white/50">
            <SparklesIcon className="h-4 w-4" /> PRO
          </span>
        </div>
      )}

      {showActions && (
        <div className="absolute right-3 top-3 flex flex-col gap-3 z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); onFavorite?.(book.id); }}
            className="kids-touch-target rounded-full bg-white/25 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/40 hover:bg-rose-500 hover:border-rose-400 transition-colors"
            aria-label="Favorite"
          >
            <HeartIcon className="h-7 w-7" filled={isFavorite} />
          </motion.button>
          {!offlineReady ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => { e.stopPropagation(); onDownload?.(book); }}
              className="kids-touch-target rounded-full bg-white/25 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/40 hover:bg-secondary-500 hover:border-secondary-400 transition-colors"
              aria-label="Download"
            >
              <DownloadIcon className="h-7 w-7" />
            </motion.button>
          ) : (
            <div className="kids-touch-target rounded-full bg-secondary-500 p-3 text-white shadow-xl border-2 border-secondary-400">
              <DownloadIcon className="h-7 w-7" />
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`flex items-center justify-center rounded-full bg-white/35 backdrop-blur-md text-white border-4 border-white/60 transition-all duration-300 ${
            variant === 'poster'
              ? 'h-[4.5rem] w-[4.5rem] md:h-24 md:w-24 shadow-[0_0_30px_rgba(255,255,255,0.35)] group-hover:scale-110 group-hover:bg-primary-500 group-hover:border-primary-300'
              : 'h-16 w-16 opacity-90 group-hover:opacity-100 group-hover:scale-110'
          }`}
          onClick={(e) => { e.stopPropagation(); onPlay?.(book); }}
        >
          <PlayIcon className={`drop-shadow-md ${variant === 'poster' ? `h-10 w-10 md:h-12 md:w-12 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}` : `h-9 w-9 ${isRtl ? 'mr-1 rotate-180' : 'ml-1'}`}`} filled />
        </motion.div>
      </div>

      {(variant === 'poster' || !hideTitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          {!hideTitle && (
            <h3 className="line-clamp-2 text-lg md:text-xl font-black leading-tight text-white drop-shadow-lg mb-2">
              {book.title}
            </h3>
          )}
          <div className="flex items-center gap-2 text-sm font-black text-white/95">
            {book.duration_seconds > 0 && (
              <span className="flex items-center gap-1 bg-black/45 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                <ClockIcon className="h-4 w-4 text-accent-300" />
                {formatDuration(book.duration_seconds)}
              </span>
            )}
            {book.age_level && (
              <span className="flex items-center gap-1 bg-black/45 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                <ShieldIcon className="h-4 w-4 text-secondary-300" />
                {book.age_level}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});
