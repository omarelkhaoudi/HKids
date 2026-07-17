import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsBadgePop } from '../../constants/kidsMotion';
import { KidsFeedbackBurst } from './KidsFeedbackBurst';
import { PlayIcon, HeartIcon, DownloadIcon, SparklesIcon, ClockIcon, ShieldIcon, AudioIcon } from '../Icons';

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function hasAudio(book) {
  return Boolean(book?.audio_url) || book?.content_type === 'song' || book?.content_type === 'audio_story';
}

const SIZE_MAP = {
  carousel: 'relative w-56 h-[18.5rem] md:w-64 md:h-[21rem] lg:w-72 lg:h-[23rem]',
  poster: 'relative h-[23rem] w-64 md:h-[27rem] md:w-72 lg:h-[28rem] lg:w-80 shrink-0',
};

export const KidsMediaCard = memo(function KidsMediaCard({
  book,
  variant = 'carousel',
  hideTitle = true,
  isRtl = false,
  isFavorite = false,
  offlineReady = false,
  showActions = false,
  themeEmoji,
  discoveryReason,
  onPlay,
  onFavorite,
  onDownload,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const [feedback, setFeedback] = useState(null);
  const sizeClass = SIZE_MAP[variant] || SIZE_MAP.carousel;
  const durationLabel = formatDuration(book.duration_seconds);
  const audioReady = hasAudio(book);
  const hoverMotion = getHoverMotion(reducedMotion, {
    whileHover: { y: -4, scale: variant === 'poster' ? 1.015 : 1.02 },
    whileTap: { scale: 0.98 },
  });
  const floatProps = {};

  const flashFeedback = (type) => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 700);
  };

  return (
    <motion.div
      {...floatProps}
      className={`inline-block ${className}`}
    >
      <motion.div
        {...hoverMotion}
        className={`kids-story-card kids-book-object group cursor-pointer ${sizeClass}`}
        onClick={() => onPlay?.(book)}
        aria-label={book.title}
      >
        <KidsFeedbackBurst type={feedback} active={Boolean(feedback)} />
        <img
          src={getImageUrl(book.cover_image, 'book')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        <div className="absolute inset-0 pointer-events-none kids-book-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${variant === 'poster' ? 'from-black/80 via-black/15' : 'from-black/50 via-transparent'} to-transparent`} />

        {/* Discovery badges — icon-first, max visual scan */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5 max-w-[78%]">
          {(discoveryReason || book._discoveryReason) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-primary-700 shadow-soft border border-border/60 line-clamp-1">
              {discoveryReason || book._discoveryReason}
            </span>
          )}
          {book.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-soft">
              <SparklesIcon className="h-3.5 w-3.5" /> PRO
            </span>
          )}
          {(book.age_level || (book.age_group_min != null && book.age_group_max != null)) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/45 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white">
              <ShieldIcon className="h-3.5 w-3.5 text-white/90" />
              {book.age_level || `${book.age_group_min}–${book.age_group_max}`}
            </span>
          )}
          {durationLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/45 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white">
              <ClockIcon className="h-3.5 w-3.5 text-white/90" />
              {durationLabel}
            </span>
          )}
          {audioReady && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-soft" aria-label="Audio">
              <AudioIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {(isFavorite || showActions) && (
          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2">
            {(isFavorite || showActions) && (
              <motion.button
                type="button"
                whileHover={reducedMotion ? undefined : { scale: 1.08 }}
                whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (showActions) {
                    onFavorite?.(book.id);
                    flashFeedback('favorite');
                  }
                }}
                className={`kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full backdrop-blur-md p-2.5 text-white shadow-card border transition-colors ${
                  isFavorite
                    ? 'bg-rose-500 border-rose-300'
                    : 'bg-card/30 border-white/40 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:border-rose-400'
                }`}
                aria-label="Favorite"
                aria-pressed={isFavorite}
                tabIndex={showActions ? 0 : -1}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={isFavorite ? 'on' : 'off'} {...(reducedMotion ? {} : kidsBadgePop)} className="inline-flex">
                    <HeartIcon className="h-6 w-6" filled={isFavorite} />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}
            {showActions && (
              !offlineReady ? (
                <motion.button
                  type="button"
                  whileHover={reducedMotion ? undefined : { scale: 1.08 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.(book);
                    flashFeedback('download');
                  }}
                  className="kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full bg-card/30 backdrop-blur-md p-2.5 text-white shadow-card border border-white/40 opacity-0 group-hover:opacity-100 hover:bg-primary-500 hover:border-primary-300 transition-all"
                  aria-label="Download"
                >
                  <DownloadIcon className="h-6 w-6" />
                </motion.button>
              ) : (
                <motion.div
                  {...(reducedMotion ? {} : kidsBadgePop)}
                  className="kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full bg-primary-500 p-2.5 text-white shadow-card border border-primary-300"
                  aria-label="Downloaded"
                >
                  <DownloadIcon className="h-6 w-6" />
                </motion.div>
              )
            )}
          </div>
        )}

        {/* Play — appears on hover / focus for emotional selection */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={`flex items-center justify-center rounded-full bg-card/50 backdrop-blur-sm text-primary-700 border border-white/60 shadow-card transition-all duration-300 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 ${
              variant === 'poster'
                ? 'h-[4.5rem] w-[4.5rem] md:h-24 md:w-24 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-200'
                : 'h-14 w-14 group-hover:bg-primary-500 group-hover:text-white'
            }`}
            onClick={(e) => { e.stopPropagation(); onPlay?.(book); }}
          >
            <PlayIcon className={`drop-shadow-md ${variant === 'poster' ? `h-10 w-10 md:h-12 md:w-12 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}` : `h-8 w-8 ${isRtl ? 'mr-1 rotate-180' : 'ml-1'}`}`} filled />
          </motion.div>
        </div>

        {!hideTitle && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <h3 className="line-clamp-2 text-base md:text-lg font-bold leading-snug text-white drop-shadow-md">
              {book.title}
            </h3>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
