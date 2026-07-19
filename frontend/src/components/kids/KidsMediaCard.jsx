import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsBadgePop, kidsTouchFeedback } from '../../constants/kidsMotion';
import { KidsFeedbackBurst } from './KidsFeedbackBurst';
import { KidsBookCover } from './KidsBookCover';
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
  const isNew = book.is_new === true || book.is_new === 1;
  const showContinue = progress > 0 && progress < 100;
  const reason = discoveryReason || book._discoveryReason;

  const flashFeedback = (type) => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 700);
  };

  return (
    <motion.article
      className={`kids-book-collectible group ${isPoster ? 'kids-book-collectible--poster' : ''} ${className}`}
    >
      <motion.div
        role="button"
        tabIndex={0}
        {...getHoverMotion(reducedMotion, kidsTouchFeedback)}
        className="kids-book-collectible-cover kids-book-collectible-cover--hero w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        onClick={() => onPlay?.(book)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlay?.(book);
          }
        }}
        aria-label={book.title}
      >
        <KidsFeedbackBurst type={feedback} active={Boolean(feedback)} />
        <KidsBookCover
          book={book}
          imgClassName="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
        />

        <div className="absolute inset-inline-start-2 top-2 z-10 flex flex-col gap-1 max-w-[78%]">
          {reason && (
            <span className="kids-book-meta-chip line-clamp-1">
              {reason}
            </span>
          )}
          {isNew && (
            <span className="kids-book-meta-chip kids-book-meta-chip--accent">Nouveau</span>
          )}
          {showContinue && (
            <span className="kids-book-meta-chip kids-book-meta-chip--continue">Continue</span>
          )}
          {isFavorite && (
            <span className="kids-book-meta-chip kids-book-meta-chip--favorite">Favori</span>
          )}
          {book.is_premium && (
            <span className="kids-book-meta-chip kids-book-meta-chip--accent">
              <SparklesIcon className="h-3 w-3" /> PRO
            </span>
          )}
        </div>

        {(isFavorite || showActions) && (
          <div className="absolute inset-inline-end-1.5 top-1.5 z-10 flex flex-col gap-1.5">
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                if (showActions) {
                  onFavorite?.(book.id);
                  flashFeedback('favorite');
                }
              }}
              className={`kids-book-action ${
                isFavorite ? 'kids-book-action--favorite-on' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
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
                  className="kids-book-action opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-label="Download"
                >
                  <DownloadIcon className="h-5 w-5" />
                </motion.button>
              ) : (
                <div className="kids-book-action" aria-label="Downloaded">
                  <DownloadIcon className="h-5 w-5" />
                </div>
              )
            )}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="kids-book-play-hint">
            <PlayIcon className={`h-5 w-5 ${isRtl ? 'me-0.5 rotate-180' : 'ms-0.5'}`} filled />
          </span>
        </div>

        {showContinue && (
          <div className="kids-book-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="kids-book-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>

      {!hideTitle && (
        <div className="kids-book-collectible-meta">
          <h3 className="kids-book-title">
            {book.title}
          </h3>
          {book.author && (
            <p className="kids-book-author">{book.author}</p>
          )}
          <div className="kids-book-meta-row">
            {ageLabel && (
              <span className="kids-book-meta-pill">
                <ShieldIcon className="h-2.5 w-2.5" />
                {ageLabel}
              </span>
            )}
            {durationLabel && (
              <span className="kids-book-meta-pill">
                <ClockIcon className="h-2.5 w-2.5" />
                {durationLabel}
              </span>
            )}
            {audioReady && (
              <span className="kids-book-meta-pill kids-book-meta-pill--audio" aria-label="Audio">
                <AudioIcon className="h-2.5 w-2.5" />
              </span>
            )}
            {showContinue && (
              <span className="kids-book-meta-pill kids-book-meta-pill--progress">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>
      )}
    </motion.article>
  );
});
