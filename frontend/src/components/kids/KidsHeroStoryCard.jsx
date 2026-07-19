import { motion } from 'framer-motion';
import { resolveBookCoverUrl } from '../../utils/bookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCardAppear, kidsHoverLift, kidsProgressFill } from '../../constants/kidsMotion';
import { PlayIcon, AudioIcon, BookIcon } from '../Icons';
import KidsButton from './KidsButton';
import { KidsBookCover } from './KidsBookCover';

function formatAge(book, t) {
  if (book?.age_level) return book.age_level;
  const min = book?.age_group_min;
  const max = book?.age_group_max;
  if (min != null && max != null) return `${min}–${max} ${t('years')}`;
  if (book?.age_group) return `${book.age_group} ${t('years')}`;
  return null;
}

function formatDuration(book, t) {
  if (book?.duration_minutes) {
    return t('readingMinutes', { count: book.duration_minutes });
  }
  const seconds = Number(book?.duration_seconds || 0);
  if (seconds > 0) {
    return t('readingMinutes', { count: Math.max(1, Math.round(seconds / 60)) });
  }
  return null;
}

export function KidsHeroStoryCard({
  book,
  isRtl = false,
  t,
  onRead,
  onListen,
  onContinue,
  emptyLabel,
  onEmptyAction,
  badgeLabel,
}) {
  const reducedMotion = useReducedMotion();
  const progress = Math.min(100, Math.max(0, Number(book?.progress || book?.kid_progress_percent || 0)));
  const ageLabel = formatAge(book, t);
  const durationLabel = formatDuration(book, t);
  const hasProgress = progress > 0 && progress < 100;
  const coverUrl = resolveBookCoverUrl(book);

  if (!book) {
    return (
      <motion.section
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="kids-hero-story relative overflow-hidden"
        aria-label={emptyLabel || t('goToLibrary')}
      >
        <div className="kids-hero-story-atmosphere" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-start justify-center gap-space-20 p-space-32 md:p-space-48 min-h-[16rem]">
          <p className="kids-type-caption uppercase tracking-[0.14em]">
            {badgeLabel || t('kidsStoriesToday')}
          </p>
          <h2 className="kids-type-display max-w-lg">
            {emptyLabel || t('emptyBooksTitle')}
          </h2>
          <KidsButton variant="primary" size="md" onClick={onEmptyAction} aria-label={t('goToLibrary')}>
            {t('goToLibrary')}
          </KidsButton>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className="kids-hero-story relative overflow-hidden"
      aria-label={book.title}
    >
      <div className="kids-hero-story-atmosphere" aria-hidden="true" />
      {coverUrl ? (
        <div
          className="kids-hero-story-bleed"
          style={{ backgroundImage: `url(${coverUrl})` }}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-space-28 md:gap-space-40 lg:gap-space-48 p-space-28 md:p-space-40 lg:p-space-48">
        <motion.div
          {...getHoverMotion(reducedMotion, kidsHoverLift)}
          className="kids-hero-cover shrink-0 w-56 sm:w-64 md:w-72 lg:w-80 self-center"
        >
          <div className="aspect-[3/4] relative overflow-hidden">
            <KidsBookCover
              book={book}
              loading="eager"
              imgClassName="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </motion.div>

        <div className="flex flex-1 flex-col justify-center min-w-0 gap-space-20 text-center md:text-start">
          <div className="min-w-0 space-y-space-12">
            <p className="kids-type-caption uppercase tracking-[0.14em]">
              {badgeLabel || t('kidsStoriesToday')}
            </p>
            <h2 className="kids-type-display line-clamp-2">
              {book.title}
            </h2>
            {book.author ? (
              <p className="kids-book-author">{book.author}</p>
            ) : null}
            {book?.description ? (
              <p className="kids-shelf-subtitle line-clamp-2 max-w-xl mx-auto md:mx-0 !mt-0">
                {book.description}
              </p>
            ) : null}
          </div>

          {(ageLabel || durationLabel) && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-space-8">
              {ageLabel ? (
                <span className="kids-book-meta-chip">{ageLabel}</span>
              ) : null}
              {durationLabel ? (
                <span className="kids-book-meta-chip">{durationLabel}</span>
              ) : null}
            </div>
          )}

          {hasProgress && (
            <div className="w-full max-w-md mx-auto md:mx-0 space-y-space-8">
              <div className="flex items-center justify-between">
                <span className="kids-type-caption">{t('continueReading')}</span>
                <span className="kids-type-caption font-semibold text-primary-700">{Math.round(progress)}%</span>
              </div>
              <div
                className="kids-book-progress !static !inset-auto h-2"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={book.title}
              >
                <motion.div
                  className="kids-book-progress-fill"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-space-12 pt-space-4">
            <KidsButton
              variant="primary"
              size="lg"
              icon={PlayIcon}
              onClick={() => onRead?.(book)}
              aria-label={t('readAction')}
              className="min-w-[10rem]"
            >
              {t('readAction')}
            </KidsButton>
            <KidsButton
              variant="secondary"
              size="md"
              icon={AudioIcon}
              onClick={() => onListen?.(book)}
              aria-label={t('listenAction')}
              className="min-w-[10rem]"
            >
              {t('listenAction')}
            </KidsButton>
            {hasProgress && (
              <KidsButton
                variant="ghost"
                size="md"
                icon={BookIcon}
                onClick={() => (onContinue || onRead)?.(book)}
                aria-label={t('resume')}
                className="min-w-[10rem]"
              >
                {t('resume')}
              </KidsButton>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default KidsHeroStoryCard;
