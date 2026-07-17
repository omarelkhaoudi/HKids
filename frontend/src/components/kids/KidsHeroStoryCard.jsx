import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCardAppear, kidsHoverLift, kidsProgressFill } from '../../constants/kidsMotion';
import { PlayIcon, AudioIcon } from '../Icons';
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
  emptyLabel,
  onEmptyAction,
  badgeLabel,
}) {
  const reducedMotion = useReducedMotion();
  const progress = Math.min(100, Math.max(0, Number(book?.progress || book?.kid_progress_percent || 0)));
  const ageLabel = formatAge(book, t);
  const durationLabel = formatDuration(book, t);
  const subtitle = book?.description || book?.author || t('kidsDiscoverToday');
  const readLabel = book?.isInProgress ? t('resume') : t('readAction');
  const cover = book?.cover_image ? getImageUrl(book.cover_image, 'book') : null;

  if (!book) {
    return (
      <motion.section
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="kids-hero-story relative overflow-hidden rounded-32 border-4 border-border shadow-card"
        aria-label={emptyLabel || t('goToLibrary')}
      >
        <div className="kids-hero-story-atmosphere" aria-hidden="true">
          <span className="kids-hero-star kids-hero-star-a" />
          <span className="kids-hero-star kids-hero-star-b" />
          <span className="kids-hero-star kids-hero-star-c" />
          <span className="kids-hero-star kids-hero-star-d" />
        </div>
        <div className="relative z-10 flex flex-col items-start justify-center gap-space-16 p-space-24 md:p-space-32 min-h-[12rem] md:min-h-[14rem]">
          <h2 className="text-heading-l text-foreground">{emptyLabel || t('emptyBooksTitle')}</h2>
          <KidsButton variant="primary" size="sm" onClick={onEmptyAction} aria-label={t('goToLibrary')}>
            {t('goToLibrary')}
          </KidsButton>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className="kids-hero-story relative overflow-hidden rounded-32 border-4 border-border shadow-card"
      aria-label={book.title}
    >
      <div className="kids-hero-story-atmosphere" aria-hidden="true">
        <span className="kids-hero-star kids-hero-star-a" />
        <span className="kids-hero-star kids-hero-star-b" />
        <span className="kids-hero-star kids-hero-star-c" />
        <span className="kids-hero-star kids-hero-star-d" />
      </div>
      {cover ? (
        <div
          className="kids-hero-story-bleed"
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative z-10 flex flex-row items-stretch gap-space-16 md:gap-space-24 p-space-16 md:p-space-24 min-h-[12rem] md:min-h-[14rem]">
        <motion.div
          {...getHoverMotion(reducedMotion, kidsHoverLift)}
          className="relative shrink-0 w-[6.5rem] sm:w-32 md:w-36 self-center"
        >
          <div className="kids-hero-cover aspect-[3/4] rounded-24 overflow-hidden border-4 border-white/70 shadow-floating bg-surface-secondary">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-4xl bg-gradient-to-br from-primary-300 to-magic-400" aria-hidden="true">
                📖
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-1 flex-col justify-center min-w-0 gap-space-8 md:gap-space-12 py-space-4">
          <div className="min-w-0">
            <p className="text-caption font-black uppercase tracking-wide text-primary-700/90 mb-space-4">
              {badgeLabel || (book.isInProgress ? t('continueReading') : t('forYou'))}
            </p>
            <h2 className="text-heading-l md:text-heading-xl text-foreground line-clamp-2 drop-shadow-sm">
              {book.title}
            </h2>
            {subtitle ? (
              <p className="mt-space-4 text-body text-foreground-secondary line-clamp-2 max-w-xl">
                {subtitle}
              </p>
            ) : null}
          </div>

          {(ageLabel || durationLabel) && (
            <div className="flex flex-wrap items-center gap-space-8 text-caption font-bold text-foreground-secondary">
              {ageLabel ? (
                <span className="inline-flex min-h-touch items-center rounded-full bg-surface/80 px-space-12 border border-border">
                  {ageLabel}
                </span>
              ) : null}
              {durationLabel ? (
                <span className="inline-flex min-h-touch items-center rounded-full bg-surface/80 px-space-12 border border-border">
                  {durationLabel}
                </span>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-space-12 pt-space-4">
            <KidsButton
              variant="primary"
              size="sm"
              icon={PlayIcon}
              onClick={() => onRead?.(book)}
              aria-label={readLabel}
            >
              {readLabel}
            </KidsButton>
            <KidsButton
              variant="glass"
              size="sm"
              icon={AudioIcon}
              onClick={() => onListen?.(book)}
              aria-label={t('listenAction')}
            >
              {t('listenAction')}
            </KidsButton>
          </div>

          <div className="w-full max-w-md pt-space-4">
            <div className="flex items-center justify-between mb-space-4">
              <span className="text-caption font-bold text-foreground-secondary">{t('continueReading')}</span>
              <span className="text-caption font-black text-primary-700">{Math.round(progress)}%</span>
            </div>
            <div
              className="h-space-12 w-full overflow-hidden rounded-full bg-surface-900/15 border border-border/60"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={book.title}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 via-secondary-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default KidsHeroStoryCard;
