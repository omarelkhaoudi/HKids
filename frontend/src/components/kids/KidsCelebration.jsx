import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLanguage } from '../../context/LanguageContext';
import { booksAPI } from '../../api/books';
import KidsButton from './KidsButton';
import { KidsBookCover } from './KidsBookCover';
import { KidsMediaCard } from './KidsMediaCard';
import { getMotionProps, kidsPageEnter, kidsBadgePop } from '../../constants/kidsMotion';

/**
 * Gentle story-complete overlay — calm celebration with similar books.
 */
export const KidsCelebration = memo(function KidsCelebration({
  active = false,
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
  onComplete,
  durationMs = 1800,
  autoDismiss = false,
  variant = 'default',
  coverUrl = null,
  bookTitle = '',
  book = null,
  progressPercent = 100,
  isFavorite = false,
  onFavorite,
  relatedLimit = 3,
  onPlayBook,
}) {
  const reducedMotion = useReducedMotion();
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const isStory = variant === 'story';
  const isBedtime = variant === 'bedtime';
  const [relatedBooks, setRelatedBooks] = useState([]);

  useEffect(() => {
    if (!active || !autoDismiss) return undefined;
    const timer = setTimeout(() => onComplete?.(), durationMs);
    return () => clearTimeout(timer);
  }, [active, autoDismiss, durationMs, onComplete]);

  useEffect(() => {
    if (!active || !book?.id) {
      setRelatedBooks([]);
      return undefined;
    }
    let cancelled = false;
    booksAPI.getPublishedBooks({ category_id: book.category_id || undefined })
      .then((response) => {
        if (cancelled) return;
        const next = (response.data || [])
          .filter((item) => item.id !== book.id)
          .slice(0, Math.max(1, relatedLimit));
        setRelatedBooks(next);
      })
      .catch(() => {
        if (!cancelled) setRelatedBooks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [active, book?.id, book?.category_id, relatedLimit]);

  const shellClass = isStory
    ? 'kids-reader-celebration-backdrop'
    : isBedtime
      ? 'bg-[#121826]/72'
      : 'bg-[#24324a]/35';

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`fixed inset-0 z-[60] overflow-y-auto kids-scroll-smooth ${shellClass} backdrop-blur-sm`}
          {...getMotionProps(reducedMotion, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.28 },
          })}
          role="dialog"
          aria-modal="true"
          aria-label={title || t('kidBookDone')}
        >
          {!reducedMotion && !isStory && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span
                  key={`glow-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 4 + (i % 3),
                    height: 4 + (i % 3),
                    left: `${12 + (i * 14) % 76}%`,
                    top: `${14 + (i * 17) % 50}%`,
                    background: 'color-mix(in srgb, white 55%, transparent)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.45, 0.15] }}
                  transition={{ duration: 2.4, delay: i * 0.12 }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10 mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-space-24 px-space-16 py-space-32">
            <motion.div
              className={`kids-reader-celebration-panel w-full max-w-md p-space-32 text-center shadow-floating rounded-32 ${isStory ? 'kids-premium-panel' : 'kids-premium-panel'}`}
              {...getMotionProps(reducedMotion, kidsPageEnter)}
            >
              {(coverUrl || book) && (
                <motion.div
                  className="mx-auto mb-space-20 w-40 sm:w-44"
                  {...getMotionProps(reducedMotion, kidsBadgePop)}
                >
                  <div className="kids-book-collectible-cover aspect-[3/4] relative overflow-hidden kids-reader-celebration-cover">
                    {book ? (
                      <KidsBookCover
                        book={book}
                        imgClassName="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </div>
                </motion.div>
              )}

              <p className="kids-type-caption uppercase tracking-[0.14em] text-primary-600/80 mb-space-8">
                {isStory ? t('kidReaderStoryFinished') : t('kidBookDone')}
              </p>
              <h2 className="kids-type-h1 mb-space-8">
                {title || t('kidReaderBravo')}
              </h2>
              {subtitle ? (
                <p className="kids-shelf-subtitle !mx-auto mb-space-16 line-clamp-3">{subtitle}</p>
              ) : bookTitle ? (
                <p className="kids-book-title mb-space-8 mx-auto max-w-sm">{bookTitle}</p>
              ) : null}

              {!isStory && (
                <div className="mb-space-20 mx-auto w-full max-w-xs">
                  <p className="kids-type-meta text-foreground-muted mb-space-8">
                    {t('kidReaderProgressLabel', { percent: Math.round(progressPercent) })}
                  </p>
                  <div className="kids-book-progress !static !inset-auto h-2" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="kids-book-progress-fill" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-space-12">
                {onFavorite && !isStory && (
                  <KidsButton
                    onClick={onFavorite}
                    variant="ghost"
                    className="!min-h-[56px] !w-full"
                    tone={isFavorite ? 'accent' : 'primary'}
                  >
                    {isFavorite ? t('yourFavorites') : t('addToFavorites')}
                  </KidsButton>
                )}
                {secondaryLabel && onSecondary && (
                  <KidsButton onClick={onSecondary} variant="secondary" className="!min-h-[56px] !w-full">
                    {secondaryLabel}
                  </KidsButton>
                )}
                {primaryLabel && onPrimary && (
                  <KidsButton onClick={onPrimary} className="!min-h-[56px] !w-full" tone="primary">
                    {primaryLabel}
                  </KidsButton>
                )}
                {tertiaryLabel && onTertiary && (
                  <KidsButton onClick={onTertiary} variant="ghost" className="!min-h-[56px] !w-full !text-foreground-muted">
                    {tertiaryLabel}
                  </KidsButton>
                )}
              </div>
            </motion.div>

            {relatedBooks.length > 0 ? (
              <section className="kids-celebration-related w-full" aria-label={t('kidReaderSimilarStories')}>
                <h3 className="kids-shelf-title px-space-8 mb-space-16">{t('kidReaderSimilarStories')}</h3>
                <div className="flex gap-space-24 overflow-x-auto px-space-8 pb-space-12 snap-x snap-mandatory kids-scroll-smooth custom-scrollbar justify-center md:justify-start">
                  {relatedBooks.map((related) => (
                    <div key={related.id} className="snap-start shrink-0">
                      <KidsMediaCard
                        book={related}
                        showActions={false}
                        isRtl={isRtl}
                        onPlay={() => {
                          onComplete?.();
                          if (onPlayBook) {
                            onPlayBook(related);
                          } else {
                            navigate(`/book-details/${related.id}`);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default KidsCelebration;
