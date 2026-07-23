import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCarouselReveal, kidsTouchFeedback, kidsProgressFill } from '../../constants/kidsMotion';
import { KidsBookCover } from './KidsBookCover';
import KidsButton from './KidsButton';
import { estimateRemainingMinutes } from '../../utils/discoveryRails';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { KIDS_PICTOGRAMS } from '../../utils/kidsGuidePhrases';

function ProgressRing({ progress, reducedMotion }) {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg className="kids-continue-ring" viewBox="0 0 44 44" aria-hidden="true">
      <circle className="kids-continue-ring-track" cx="22" cy="22" r={radius} />
      <motion.circle
        className="kids-continue-ring-value"
        cx="22"
        cy="22"
        r={radius}
        strokeDasharray={circumference}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
      />
    </svg>
  );
}

export function KidsContinueRail({
  books = [],
  title,
  subtitle,
  emoji,
  isRtl = false,
  t,
  onResume,
  pictogramMode = true,
}) {
  const reducedMotion = useReducedMotion();

  if (!books.length) return null;

  return (
    <motion.section
      className="kids-shelf-rail kids-continue-rail"
      aria-label={title || t('continueReading')}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div className="mb-space-20 px-space-8 md:px-space-16">
        <h2 className={`kids-shelf-title !mb-0 ${pictogramMode ? 'kids-shelf-title--pictogram' : ''}`}>
          <span className="kids-shelf-emoji" aria-hidden="true">{emoji || KIDS_PICTOGRAMS.continue}</span>
          {pictogramMode ? (
            <span className="sr-only">{title || t('continueReading')}</span>
          ) : (
            <span>{title || t('continueReading')}</span>
          )}
        </h2>
        {subtitle && !pictogramMode ? (
          <p className="kids-shelf-subtitle max-w-xl">{subtitle}</p>
        ) : subtitle ? (
          <p className="sr-only">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex gap-space-28 md:gap-space-32 overflow-x-auto px-space-8 md:px-space-16 pb-space-16 snap-x snap-mandatory kids-scroll-smooth custom-scrollbar">
        {books.map((book) => {
          const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));
          const remaining = estimateRemainingMinutes(book, progress);

          return (
            <motion.article
              key={book.id}
              {...getHoverMotion(reducedMotion, kidsTouchFeedback)}
              className="kids-continue-book snap-start shrink-0 w-[11rem] sm:w-[12rem] md:w-[13.5rem] flex flex-col"
            >
              <button
                type="button"
                onClick={() => {
                  playKidsUiSound('play');
                  onResume?.(book);
                }}
                className="kids-book-collectible-cover kids-book-collectible-cover--hero relative w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                aria-label={`${t('resume')} — ${book.title}`}
                title={book.title}
              >
                <KidsBookCover
                  book={book}
                  imgClassName="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
                />
                <span className="kids-book-meta-chip kids-book-meta-chip--continue kids-book-meta-chip--pictogram absolute top-space-10 inset-inline-start-space-10 z-10">
                  <span aria-hidden="true">{KIDS_PICTOGRAMS.continue}</span>
                  <span className="sr-only">{t('resume')}</span>
                </span>
                <div className="kids-continue-ring-wrap" aria-hidden="true">
                  <ProgressRing progress={progress} reducedMotion={reducedMotion} />
                  <span className="kids-continue-ring-label">{Math.round(progress)}%</span>
                </div>
                {remaining ? (
                  <span className="kids-continue-remaining" title={t('kidsRemainingMinutes', { count: remaining })}>
                    ⏱️ {remaining}'
                  </span>
                ) : null}
              </button>

              <div className="kids-book-collectible-meta grow">
                <h3 className="sr-only">{book.title}</h3>
                <KidsButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    playKidsUiSound('play');
                    onResume?.(book);
                  }}
                  className="mt-auto w-full !rounded-full"
                  aria-label={`${t('resume')} — ${book.title}`}
                >
                  <span aria-hidden="true">{KIDS_PICTOGRAMS.continue}</span>
                </KidsButton>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}

export default KidsContinueRail;
