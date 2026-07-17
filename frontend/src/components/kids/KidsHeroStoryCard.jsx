import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCardAppear, kidsProgressFill } from '../../constants/kidsMotion';
import { PlayIcon, AudioIcon, BookIcon } from '../Icons';
import KidsButton from './KidsButton';

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
  const subtitle = book?.description || book?.author || t('kidsDiscoverToday');
  const hasProgress = progress > 0 && progress < 100;
  const cover = book?.cover_image ? getImageUrl(book.cover_image, 'book') : null;

  if (!book) {
    return (
      <motion.section
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="kids-hero-story relative overflow-hidden rounded-32"
        aria-label={emptyLabel || t('goToLibrary')}
      >
        <div className="kids-hero-story-atmosphere" aria-hidden="true">
          <span className="kids-hero-star kids-hero-star-a" />
          <span className="kids-hero-star kids-hero-star-b" />
        </div>
        <div className="relative z-10 flex flex-col items-start justify-center gap-space-16 p-space-32 md:p-space-40 min-h-[14rem]">
          <p className="text-caption font-semibold uppercase tracking-widest text-primary-600/80">
            {badgeLabel || t('kidsStoriesToday')}
          </p>
          <h2 className="text-heading-xl font-semibold text-foreground max-w-lg leading-snug">
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
      className="kids-hero-story relative overflow-hidden rounded-32"
      aria-label={book.title}
    >
      <div className="kids-hero-story-atmosphere" aria-hidden="true">
        <span className="kids-hero-star kids-hero-star-a" />
        <span className="kids-hero-star kids-hero-star-b" />
        <span className="kids-hero-star kids-hero-star-c" />
      </div>
      {cover ? (
        <div
          className="kids-hero-story-bleed"
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-space-24 md:gap-space-32 p-space-24 md:p-space-32 lg:p-space-40">
        <motion.div
          {...getHoverMotion(reducedMotion)}
          className="kids-hero-cover shrink-0 w-44 sm:w-52 md:w-56 lg:w-64 self-center"
        >
          <div className="aspect-[3/4] bg-surface-secondary">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-5xl bg-gradient-to-br from-primary-100 to-primary-50" aria-hidden="true">
                📖
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-1 flex-col justify-center min-w-0 gap-space-16 text-center md:text-start py-space-4">
          <div className="min-w-0 space-y-space-8">
            <p className="text-caption font-semibold uppercase tracking-widest text-primary-600/80">
              {badgeLabel || t('kidsStoriesToday')}
            </p>
            <h2 className="text-heading-xl md:text-hero font-semibold text-foreground leading-tight line-clamp-3">
              {book.title}
            </h2>
            {subtitle ? (
              <p className="text-body-lg text-foreground-secondary font-medium leading-relaxed line-clamp-3 max-w-xl mx-auto md:mx-0">
                {subtitle}
              </p>
            ) : null}
          </div>

          {(ageLabel || durationLabel) && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-space-8">
              {ageLabel ? (
                <span className="inline-flex min-h-[44px] items-center rounded-full bg-primary-50 text-primary-700 px-space-16 text-caption font-semibold border border-primary-100">
                  {ageLabel}
                </span>
              ) : null}
              {durationLabel ? (
                <span className="inline-flex min-h-[44px] items-center rounded-full bg-surface-secondary text-foreground-secondary px-space-16 text-caption font-semibold border border-border/60">
                  {durationLabel}
                </span>
              ) : null}
            </div>
          )}

          {hasProgress && (
            <div className="w-full max-w-md mx-auto md:mx-0">
              <div className="flex items-center justify-between mb-space-8">
                <span className="text-caption font-medium text-foreground-muted">{t('continueReading')}</span>
                <span className="text-caption font-semibold text-primary-600">{Math.round(progress)}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={book.title}
              >
                <motion.div
                  className="h-full rounded-full bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-space-12 pt-space-4">
            <KidsButton
              variant="primary"
              size="md"
              icon={PlayIcon}
              onClick={() => onRead?.(book)}
              aria-label={t('readAction')}
              className="min-w-[8.5rem]"
            >
              {t('readAction')}
            </KidsButton>
            <KidsButton
              variant="secondary"
              size="md"
              icon={AudioIcon}
              onClick={() => onListen?.(book)}
              aria-label={t('listenAction')}
              className="min-w-[8.5rem]"
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
                className="min-w-[8.5rem]"
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
