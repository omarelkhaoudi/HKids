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

export const KidsMediaCard = memo(function KidsMediaCard({
  book,
  variant = 'carousel',
  hideTitle = false,
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
  const durationLabel = formatDuration(book.duration_seconds);
  const audioReady = hasAudio(book);
  const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));
  const ageLabel = book.age_level || (book.age_group_min != null && book.age_group_max != null
    ? `${book.age_group_min}–${book.age_group_max}`
    : null);
  const isPoster = variant === 'poster';

  const flashFeedback = (type) => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 700);
  };

  return (
    <motion.article
      className={`kids-book-collectible group ${isPoster ? '!w-64 md:!w-72' : ''} ${className}`}
    >
      <motion.button
        type="button"
        {...getHoverMotion(reducedMotion, {
          whileHover: { y: -2 },
          whileTap: { scale: 0.98 },
        })}
        className="kids-book-collectible-cover w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
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
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent pointer-events-none" />

        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 max-w-[80%]">
          {(discoveryReason || book._discoveryReason) && (
            <span className="inline-flex items-center rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-semibold text-primary-700 shadow-soft border border-border/50 line-clamp-1">
              {discoveryReason || book._discoveryReason}
            </span>
          )}
          {book.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-600/95 px-2 py-0.5 text-[10px] font-semibold text-white">
              <SparklesIcon className="h-3 w-3" /> PRO
            </span>
          )}
          {progress > 0 && progress < 100 && (
            <span className="inline-flex items-center rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-semibold text-primary-700 shadow-soft">
              {Math.round(progress)}%
            </span>
          )}
        </div>

        {(isFavorite || showActions) && (
          <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { scale: 1.05 }}
              whileTap={reducedMotion ? undefined : { scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                if (showActions) {
                  onFavorite?.(book.id);
                  flashFeedback('favorite');
                }
              }}
              className={`kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full p-2.5 text-white shadow-card border transition-colors ${
                isFavorite
                  ? 'bg-rose-500 border-rose-300'
                  : 'bg-card/35 border-white/40 opacity-0 group-hover:opacity-100'
              }`}
              aria-label="Favorite"
              aria-pressed={isFavorite}
              tabIndex={showActions ? 0 : -1}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={isFavorite ? 'on' : 'off'} {...(reducedMotion ? {} : kidsBadgePop)} className="inline-flex">
                  <HeartIcon className="h-5 w-5" filled={isFavorite} />
                </motion.span>
              </AnimatePresence>
            </motion.button>
            {showActions && (
              !offlineReady ? (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.(book);
                    flashFeedback('download');
                  }}
                  className="kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full bg-card/35 p-2.5 text-white shadow-card border border-white/40 opacity-0 group-hover:opacity-100"
                  aria-label="Download"
                >
                  <DownloadIcon className="h-5 w-5" />
                </motion.button>
              ) : (
                <div className="kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full bg-primary-500 p-2.5 text-white shadow-card" aria-label="Downloaded">
                  <DownloadIcon className="h-5 w-5" />
                </div>
              )
            )}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card/80 text-primary-700 shadow-card opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
            <PlayIcon className={`h-6 w-6 ${isRtl ? 'mr-0.5 rotate-180' : 'ml-0.5'}`} filled />
          </span>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20">
            <div className="h-full bg-primary-400" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.button>

      {!hideTitle && (
        <div className="mt-space-12 px-0.5 space-y-1.5">
          <h3 className="text-body font-semibold text-foreground leading-snug line-clamp-2">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-caption font-medium text-foreground-muted line-clamp-1">{book.author}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {ageLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground-secondary">
                <ShieldIcon className="h-3 w-3" />
                {ageLabel}
              </span>
            )}
            {durationLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground-secondary">
                <ClockIcon className="h-3 w-3" />
                {durationLabel}
              </span>
            )}
            {audioReady && (
              <span className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-[10px] font-semibold" aria-label="Audio">
                <AudioIcon className="h-3 w-3" />
              </span>
            )}
            {themeEmoji && (
              <span className="text-sm" aria-hidden="true">{themeEmoji}</span>
            )}
          </div>
        </div>
      )}
    </motion.article>
  );
});
