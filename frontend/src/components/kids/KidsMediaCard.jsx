import { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsBadgePop, kidsTouchFeedback } from '../../constants/kidsMotion';
import { KidsFeedbackBurst } from './KidsFeedbackBurst';
import { KidsBookCover } from './KidsBookCover';
import { PlayIcon, HeartIcon, DownloadIcon, AudioIcon } from '../Icons';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { KIDS_PICTOGRAMS } from '../../utils/kidsGuidePhrases';

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.max(1, Math.round(safeSeconds / 60));
  return `${minutes}'`;
}

function hasAudio(book) {
  return Boolean(book?.audio_url) || book?.content_type === 'song' || book?.content_type === 'audio_story';
}

function CompletionRing({ progress, reducedMotion }) {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg className="kids-book-completion-ring" viewBox="0 0 44 44" aria-hidden="true">
      <circle className="kids-book-completion-ring-track" cx="22" cy="22" r={radius} />
      <motion.circle
        className="kids-book-completion-ring-value"
        cx="22"
        cy="22"
        r={radius}
        strokeDasharray={circumference}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
      />
    </svg>
  );
}

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
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [feedback, setFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);
  const durationLabel = formatDuration(book.duration_seconds);
  const audioReady = hasAudio(book);
  const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));
  const ageLabel = book.age_level || (book.age_group_min != null && book.age_group_max != null
    ? `${book.age_group_min}–${book.age_group_max}`
    : null);
  const isPoster = variant === 'poster';
  const isNew = book.is_new === true || book.is_new === 1;
  const showContinue = progress > 0 && progress < 100;
  const isComplete = progress >= 100;
  const reason = discoveryReason || book._discoveryReason;
  const playLabel = audioReady && !book.pages?.length
    ? `${t('listen')} — ${book.title}`
    : `${t('read') || t('galleryRead')} — ${book.title}`;

  useEffect(() => () => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
  }, []);

  const flashFeedback = (type) => {
    setFeedback(type);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 700);
  };

  return (
    <motion.article
      className={`kids-book-collectible kids-book-collectible--nonreader group ${isPoster ? 'kids-book-collectible--poster' : ''} ${className}`}
    >
      <motion.div
        role="button"
        tabIndex={0}
        {...getHoverMotion(reducedMotion, kidsTouchFeedback)}
        className="kids-book-collectible-cover kids-book-collectible-cover--hero w-full cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        onClick={() => {
          playKidsUiSound('play');
          onPlay?.(book);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            playKidsUiSound('play');
            onPlay?.(book);
          }
        }}
        aria-label={playLabel}
        title={book.title}
      >
        <KidsFeedbackBurst type={feedback} active={Boolean(feedback)} />
        <KidsBookCover
          book={book}
          imgClassName="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
        />

        {(showContinue || isComplete) && (
          <div className="kids-book-completion-wrap" aria-hidden="true">
            <CompletionRing progress={isComplete ? 100 : progress} reducedMotion={reducedMotion} />
            {isComplete ? <span className="kids-book-completion-emoji">⭐</span> : null}
          </div>
        )}

        <div className="absolute inset-inline-start-2 top-2 z-10 flex flex-col gap-1 max-w-[72%]">
          {themeEmoji ? (
            <span className="kids-book-meta-chip kids-book-meta-chip--pictogram" aria-hidden="true">{themeEmoji}</span>
          ) : null}
          {reason ? (
            <span className="sr-only">{reason}</span>
          ) : null}
          {isNew && (
            <span className="kids-book-meta-chip kids-book-meta-chip--accent kids-book-meta-chip--pictogram" title={t('homeNew')}>
              <span aria-hidden="true">{KIDS_PICTOGRAMS.new}</span>
              <span className="sr-only">{t('homeNew')}</span>
            </span>
          )}
          {showContinue && (
            <span className="kids-book-meta-chip kids-book-meta-chip--continue kids-book-meta-chip--pictogram" title={t('continueReading')}>
              <span aria-hidden="true">{KIDS_PICTOGRAMS.continue}</span>
              <span className="sr-only">{t('continueReading')}</span>
            </span>
          )}
          {isFavorite && (
            <span className="kids-book-meta-chip kids-book-meta-chip--favorite kids-book-meta-chip--pictogram" title={t('yourFavorites')}>
              <span aria-hidden="true">{KIDS_PICTOGRAMS.favorites}</span>
              <span className="sr-only">{t('yourFavorites')}</span>
            </span>
          )}
          {book.is_premium && (
            <span className="kids-book-meta-chip kids-book-meta-chip--accent kids-book-meta-chip--pictogram" title="PRO">
              <span aria-hidden="true">✨</span>
              <span className="sr-only">PRO</span>
            </span>
          )}
        </div>

        {showActions && (
          <div className="absolute inset-inline-end-1.5 top-1.5 z-20 flex flex-col gap-2">
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
              whileTap={reducedMotion ? undefined : { scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                playKidsUiSound('favorite');
                onFavorite?.(book.id);
                flashFeedback('favorite');
              }}
              className={`kids-book-action kids-book-action--always ${
                isFavorite ? 'kids-book-action--favorite-on' : ''
              }`}
              aria-label={isFavorite ? t('bookRemovedFromFavorites') : t('addToFavorites')}
              aria-pressed={isFavorite}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={isFavorite ? 'on' : 'off'} {...(reducedMotion ? {} : kidsBadgePop)} className="inline-flex">
                  <HeartIcon className="h-6 w-6" filled={isFavorite} />
                </motion.span>
              </AnimatePresence>
            </motion.button>
            {!offlineReady ? (
              <motion.button
                type="button"
                whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  playKidsUiSound('unlock');
                  onDownload?.(book);
                  flashFeedback('download');
                }}
                className="kids-book-action kids-book-action--always"
                aria-label={t('offlineMode')}
              >
                <DownloadIcon className="h-6 w-6" />
              </motion.button>
            ) : (
              <div className="kids-book-action kids-book-action--always kids-book-action--downloaded" aria-label={t('downloaded')}>
                <span aria-hidden="true">{KIDS_PICTOGRAMS.downloads}</span>
              </div>
            )}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="kids-book-play-hint kids-book-play-hint--always" aria-hidden="true">
            {audioReady && !book.pages?.length ? (
              <AudioIcon className="h-7 w-7" />
            ) : (
              <PlayIcon className={`h-7 w-7 ${isRtl ? 'me-0.5 rotate-180' : 'ms-0.5'}`} filled />
            )}
          </span>
        </div>

        <div className="kids-book-visual-badges" aria-hidden="true">
          {ageLabel ? <span className="kids-book-visual-badge" title={ageLabel}>🧒 {ageLabel}</span> : null}
          {durationLabel ? <span className="kids-book-visual-badge" title={durationLabel}>⏱️ {durationLabel}</span> : null}
          {audioReady ? <span className="kids-book-visual-badge kids-book-visual-badge--audio">{KIDS_PICTOGRAMS.listen}</span> : null}
        </div>

        {showContinue && (
          <div className="kids-book-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(progress)}%`}>
            <div className="kids-book-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>

      {!hideTitle && (
        <div className="kids-book-collectible-meta">
          <h3 className="kids-book-title">
            {book.title}
          </h3>
        </div>
      )}
      {hideTitle ? <span className="sr-only">{book.title}</span> : null}
    </motion.article>
  );
});
