import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCarouselReveal, kidsTouchFeedback, kidsProgressFill } from '../../constants/kidsMotion';
import { PlayIcon } from '../Icons';
import { KidsBookCover } from './KidsBookCover';
import KidsButton from './KidsButton';

export function KidsContinueRail({
  books = [],
  title,
  subtitle,
  emoji,
  isRtl = false,
  t,
  onResume,
}) {
  const reducedMotion = useReducedMotion();

  if (!books.length) return null;

  return (
    <motion.section
      className="kids-shelf-rail"
      aria-label={title || t('continueReading')}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div className="mb-space-20 px-space-8 md:px-space-16">
        <h2 className="kids-shelf-title !mb-0">
          {emoji ? <span className="text-xl opacity-60" aria-hidden="true">{emoji}</span> : null}
          <span>{title || t('continueReading')}</span>
        </h2>
        {(subtitle || t('discoverContinueSubtitle')) && (
          <p className="kids-shelf-subtitle max-w-xl">
            {subtitle || t('discoverContinueSubtitle')}
          </p>
        )}
      </div>

      <div className="flex gap-space-28 md:gap-space-32 overflow-x-auto px-space-8 md:px-space-16 pb-space-16 snap-x snap-mandatory kids-scroll-smooth custom-scrollbar">
        {books.map((book) => {
          const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));

          return (
            <motion.article
              key={book.id}
              {...getHoverMotion(reducedMotion, kidsTouchFeedback)}
              className="kids-continue-book snap-start shrink-0 w-[10.5rem] sm:w-[11.5rem] md:w-[13rem] flex flex-col"
            >
              <button
                type="button"
                onClick={() => onResume?.(book)}
                className="kids-book-collectible-cover relative w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                aria-label={`${t('resume')} — ${book.title}`}
              >
                <KidsBookCover
                  book={book}
                  imgClassName="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
                />
                <span className="kids-book-meta-chip kids-book-meta-chip--continue absolute top-space-10 inset-inline-start-space-10 z-10">
                  {t('resume')}
                </span>
                {progress > 0 && (
                  <div
                    className="kids-book-progress"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <motion.div
                      className="kids-book-progress-fill"
                      initial={reducedMotion ? false : { width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
                    />
                  </div>
                )}
              </button>

              <div className="kids-book-collectible-meta grow">
                <h3 className="kids-book-title">
                  {book.title}
                </h3>
                <div className="kids-book-meta-row">
                  <span className="kids-book-meta-pill kids-book-meta-pill--progress">
                    {Math.round(progress)}%
                  </span>
                </div>
                <KidsButton
                  variant="primary"
                  size="md"
                  icon={PlayIcon}
                  onClick={() => onResume?.(book)}
                  className="mt-auto w-full"
                  aria-label={`${t('resume')} — ${book.title}`}
                >
                  {t('resume')}
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
