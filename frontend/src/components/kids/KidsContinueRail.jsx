import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCarouselReveal, kidsHoverLift } from '../../constants/kidsMotion';
import { PlayIcon } from '../Icons';
import { KidsBookCover } from './KidsBookCover';

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
          <p className="mt-space-8 text-body font-medium text-foreground-muted max-w-xl">
            {subtitle || t('discoverContinueSubtitle')}
          </p>
        )}
      </div>

      <div className="flex gap-space-20 md:gap-space-28 overflow-x-auto px-space-8 md:px-space-16 pb-space-16 snap-x snap-mandatory kids-scroll-smooth custom-scrollbar">
        {books.map((book) => {
          const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));

          return (
            <motion.article
              key={book.id}
              {...getHoverMotion(reducedMotion, kidsHoverLift)}
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
                  imgClassName="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute top-space-10 inset-inline-start-space-10 inline-flex min-h-[32px] items-center rounded-full bg-card/95 px-space-10 text-[10px] font-semibold text-primary-700 shadow-soft border border-border/40">
                  {t('resume')}
                </span>
                {progress > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/15">
                    <div className="h-full bg-primary-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </button>

              <div className="mt-space-12 px-0.5 space-y-space-8 flex flex-col grow">
                <h3 className="text-body font-semibold text-foreground leading-snug line-clamp-2">
                  {book.title}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-medium text-foreground-muted">{Math.round(progress)}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => onResume?.(book)}
                  className="kids-touch-target mt-auto inline-flex min-h-[48px] w-full items-center justify-center gap-space-8 rounded-full bg-primary-500 px-space-12 text-caption font-semibold text-white shadow-soft hover:bg-primary-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  aria-label={`${t('resume')} — ${book.title}`}
                >
                  <PlayIcon className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} filled />
                  {t('resume')}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}

export default KidsContinueRail;
