import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, getHoverMotion, kidsCarouselReveal, kidsHoverLift } from '../../constants/kidsMotion';
import { PlayIcon } from '../Icons';

export function KidsContinueRail({
  books = [],
  title,
  subtitle,
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
      <div className="mb-space-20 px-space-8 md:px-space-16">
        <h2 className="kids-shelf-title !mb-0">
          <span className="text-2xl opacity-80" aria-hidden="true">{emoji}</span>
          <span>{title || t('continueReading')}</span>
        </h2>
        {(subtitle || t('discoverContinueSubtitle')) && (
          <p className="mt-space-8 text-body font-medium text-foreground-muted max-w-xl">
            {subtitle || t('discoverContinueSubtitle')}
          </p>
        )}
      </div>

      <div className="flex gap-space-20 md:gap-space-24 overflow-x-auto px-space-8 md:px-space-16 pb-space-16 snap-x snap-mandatory kids-scroll-smooth custom-scrollbar">
        {books.map((book) => {
          const progress = Math.min(100, Math.max(0, Number(book.kid_progress_percent || book.progress || 0)));
          const cover = book.cover_image ? getImageUrl(book.cover_image, 'book') : null;

          return (
            <motion.article
              key={book.id}
              {...getHoverMotion(reducedMotion, kidsHoverLift)}
              className="kids-continue-card snap-start shrink-0 w-[15.5rem] md:w-[17.5rem] rounded-32 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary">
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
                <span className="absolute top-space-12 inset-inline-start-space-12 inline-flex min-h-[36px] items-center rounded-full bg-card/95 px-space-12 text-caption font-semibold text-primary-700 shadow-soft border border-border/50">
                  {t('resume')}
                </span>
                <h3 className="absolute bottom-space-12 inset-x-space-12 text-body-lg font-semibold text-white line-clamp-2 drop-shadow-md leading-snug">
                  {book.title}
                </h3>
              </div>

              <div className="p-space-20 flex flex-col gap-space-16 grow">
                <div>
                  <div className="flex items-center justify-between mb-space-8">
                    <span className="text-caption font-medium text-foreground-muted">{Math.round(progress)}%</span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={book.title}
                  >
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onResume?.(book)}
                  className="kids-touch-target mt-auto inline-flex min-h-[56px] w-full items-center justify-center gap-space-8 rounded-32 bg-primary-500 px-space-16 text-body font-semibold text-white shadow-soft hover:bg-primary-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  aria-label={`${t('resume')} — ${book.title}`}
                >
                  <PlayIcon className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} filled />
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
