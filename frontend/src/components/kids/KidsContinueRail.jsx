import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCarouselReveal, kidsHoverLift } from '../../constants/kidsMotion';
import { PlayIcon } from '../Icons';

export function KidsContinueRail({
  books = [],
  title,
  emoji = '⭐',
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
      <h2 className="kids-shelf-title mb-space-16 px-space-8">
        <span aria-hidden="true">{emoji}</span>
        <span>{title || t('continueReading')}</span>
      </h2>

      <div className="flex gap-space-16 md:gap-space-20 overflow-x-auto px-space-8 pb-space-16 snap-x snap-mandatory custom-scrollbar kids-scroll-smooth">
        {books.map((book) => {
          const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));
          const cover = book.cover_image ? getImageUrl(book.cover_image, 'book') : null;

          return (
            <motion.article
              key={book.id}
              {...getHoverMotion(reducedMotion, kidsHoverLift)}
              className="snap-start shrink-0 w-[16.5rem] md:w-[18rem] rounded-24 bg-card border-4 border-border shadow-card overflow-hidden flex flex-col"
            >
              <div className="relative h-28 md:h-32 overflow-hidden bg-surface-secondary">
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-secondary-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/55 to-transparent" />
                <span className="absolute bottom-space-8 left-space-12 right-space-12 text-body font-black text-white line-clamp-1 drop-shadow-md">
                  {book.title}
                </span>
              </div>

              <div className="p-space-16 flex flex-col gap-space-12 grow">
                <div>
                  <div className="flex items-center justify-between mb-space-4">
                    <span className="text-caption font-bold text-foreground-muted">{Math.round(progress)}%</span>
                  </div>
                  <div
                    className="h-space-8 w-full overflow-hidden rounded-full bg-surface-secondary"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={book.title}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onResume?.(book)}
                  className="kids-touch-target mt-auto inline-flex min-h-[56px] w-full items-center justify-center gap-space-8 rounded-20 bg-primary-500 px-space-16 text-body font-black text-white shadow-soft hover:bg-primary-600 hover:shadow-card transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
                  aria-label={`${t('resume')} — ${book.title}`}
                >
                  <PlayIcon className={`h-6 w-6 ${isRtl ? 'rotate-180' : ''}`} filled />
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
