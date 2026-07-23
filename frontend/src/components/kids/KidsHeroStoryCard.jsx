import { motion } from 'framer-motion';
import { resolveBookCoverUrl } from '../../utils/bookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCardAppear, kidsHoverLift, kidsProgressFill } from '../../constants/kidsMotion';
import KidsButton from './KidsButton';
import { KidsBookCover } from './KidsBookCover';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { KIDS_PICTOGRAMS } from '../../utils/kidsGuidePhrases';

function formatAge(book) {
  if (book?.age_level) return book.age_level;
  const min = book?.age_group_min;
  const max = book?.age_group_max;
  if (min != null && max != null) return `${min}–${max}`;
  if (book?.age_group) return String(book.age_group);
  return null;
}

function formatDurationMinutes(book) {
  if (book?.duration_minutes) return `${book.duration_minutes}'`;
  const seconds = Number(book?.duration_seconds || 0);
  if (seconds > 0) return `${Math.max(1, Math.round(seconds / 60))}'`;
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
  const ageLabel = formatAge(book);
  const durationLabel = formatDurationMinutes(book);
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
        <div className="relative z-10 flex flex-col items-center justify-center gap-space-20 p-space-32 md:p-space-48 min-h-[16rem]">
          <span className="text-6xl" aria-hidden="true">{KIDS_PICTOGRAMS.library}</span>
          <span className="sr-only">{emptyLabel || t('emptyBooksTitle')}</span>
          <KidsButton
            variant="primary"
            size="lg"
            onClick={() => {
              playKidsUiSound('tap');
              onEmptyAction?.();
            }}
            aria-label={t('goToLibrary')}
            className="!min-w-[4.5rem] !rounded-full"
          >
            <span aria-hidden="true">{KIDS_PICTOGRAMS.continue}</span>
          </KidsButton>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className="kids-hero-story kids-hero-story--nonreader relative overflow-hidden"
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
            <p className="kids-type-caption uppercase tracking-[0.14em] flex items-center justify-center md:justify-start gap-2">
              <span aria-hidden="true">⭐</span>
              <span className="sr-only">{badgeLabel || t('kidsStoriesToday')}</span>
            </p>
            <h2 className="sr-only">{book.title}</h2>
            {(ageLabel || durationLabel) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-space-8">
                {ageLabel ? (
                  <span className="kids-book-meta-chip kids-book-meta-chip--pictogram" title={ageLabel}>
                    🧒 {ageLabel}
                  </span>
                ) : null}
                {durationLabel ? (
                  <span className="kids-book-meta-chip kids-book-meta-chip--pictogram" title={durationLabel}>
                    ⏱️ {durationLabel}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {hasProgress && (
            <div className="w-full max-w-md mx-auto md:mx-0 space-y-space-8">
              <div
                className="kids-book-progress !static !inset-auto h-2.5"
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

          <div className="flex flex-row flex-wrap items-center justify-center md:justify-start gap-space-12 pt-space-4">
            <KidsButton
              variant="primary"
              size="lg"
              onClick={() => {
                playKidsUiSound('play');
                onRead?.(book);
              }}
              aria-label={t('kidsHeroPlay')}
              title={t('kidsHeroPlay')}
              className="!min-w-[4.75rem] !rounded-full !px-6"
            >
              <span className="text-2xl leading-none" aria-hidden="true">{KIDS_PICTOGRAMS.read}</span>
            </KidsButton>
            <KidsButton
              variant="secondary"
              size="lg"
              onClick={() => {
                playKidsUiSound('play');
                onListen?.(book);
              }}
              aria-label={t('kidsHeroListen')}
              title={t('kidsHeroListen')}
              className="!min-w-[4.75rem] !rounded-full !px-6"
            >
              <span className="text-2xl leading-none" aria-hidden="true">{KIDS_PICTOGRAMS.listen}</span>
            </KidsButton>
            {hasProgress && (
              <KidsButton
                variant="ghost"
                size="lg"
                onClick={() => {
                  playKidsUiSound('tap');
                  (onContinue || onRead)?.(book);
                }}
                aria-label={t('resume')}
                title={t('resume')}
                className="!min-w-[4.75rem] !rounded-full !px-6"
              >
                <span className="text-2xl leading-none" aria-hidden="true">{KIDS_PICTOGRAMS.continue}</span>
              </KidsButton>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default KidsHeroStoryCard;
