import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../../api/books';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import { pickRelatedBooks } from '../../utils/readerRecommendations';
import { collectFavoriteThemes, getThemeLabel } from '../../utils/parentInsights';
import { KidsBookCover } from '../kids/KidsBookCover';
import { ParentEmptyState } from './ParentEmptyState';

/**
 * Suggest stories from existing catalog metadata + child dashboard signals.
 */
export const ParentRecommendations = memo(function ParentRecommendations({
  data,
  kid,
  t,
  language = 'fr',
}) {
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const progressItems = data?.progress?.items || [];
    const favoriteItems = data?.favorites?.items || [];
    const favoriteThemes = collectFavoriteThemes(data, 2);
    const topThemeId = favoriteThemes[0]?.id;
    const continueBook = progressItems.find(
      (item) => (item.progress_percent || 0) > 0 && (item.progress_percent || 0) < 100,
    );
    const seed = continueBook || favoriteItems[0] || {
      id: 'seed',
      age_group_min: kid?.age ? Math.max(0, kid.age - 1) : 3,
      age_group_max: kid?.age ? kid.age + 2 : 8,
      theme: topThemeId,
    };

    booksAPI.getPublishedBooks({ language: language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr' })
      .then((response) => {
        if (cancelled) return;
        const catalog = response.data || [];
        const excludeIds = new Set(
          [
            ...progressItems.filter((b) => b.completed).map((b) => b.book_id || b.id),
            ...favoriteItems.map((b) => b.book_id || b.id),
          ].filter(Boolean).map(String),
        );

        const ageFiltered = catalog.filter((book) => {
          if (excludeIds.has(String(book.id))) return false;
          if (!kid?.age) return true;
          const min = Number(book.age_group_min);
          const max = Number(book.age_group_max);
          if (!Number.isFinite(min) && !Number.isFinite(max)) return true;
          const lo = Number.isFinite(min) ? min : max;
          const hi = Number.isFinite(max) ? max : min;
          return kid.age >= lo && kid.age <= hi;
        });

        const ranked = pickRelatedBooks(
          {
            ...seed,
            id: seed.book_id || seed.id || 'seed',
            age_group_min: kid?.age ? kid.age - 1 : seed.age_group_min,
            age_group_max: kid?.age ? kid.age + 2 : seed.age_group_max,
            theme: seed.theme || topThemeId,
          },
          ageFiltered.length > 0 ? ageFiltered : catalog.filter((b) => !excludeIds.has(String(b.id))),
          4,
        );

        if (ranked.length === 0) {
          setBooks(
            progressItems
              .filter((b) => !b.completed)
              .slice(0, 4)
              .map((b) => ({ ...b, id: b.book_id || b.id })),
          );
        } else {
          setBooks(ranked);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBooks(
          progressItems
            .filter((b) => !b.completed)
            .slice(0, 4)
            .map((b) => ({ ...b, id: b.book_id || b.id })),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, kid?.age, kid?.id, language]);

  return (
    <section className="parent-section" aria-labelledby="parent-recs-heading">
      <header className="mb-space-24">
        <h2 id="parent-recs-heading" className="text-heading-xl font-black text-foreground">
          {t('parentRecsTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">
          {t('parentRecsSubtitle', { name: kid?.name || t('parentChild') })}
        </p>
      </header>

      {loading ? (
        <div className="parent-discovery-rail flex gap-space-16 overflow-x-auto pb-space-8" aria-busy="true">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="shrink-0 w-36 sm:w-40 aspect-[3/4] rounded-2xl bg-surface-secondary/80 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <ParentEmptyState
          emoji="📚"
          title={t('parentRecsEmpty')}
          description={t('parentRecsEmptyDesc')}
          compact
        />
      ) : (
        <div className="parent-discovery-rail flex gap-space-16 overflow-x-auto pb-space-8 snap-x snap-mandatory">
          {books.map((book, index) => (
            <motion.button
              key={book.id || book.book_id || index}
              type="button"
              {...getMotionProps(reducedMotion, {
                ...kidsCardAppear,
                transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
              })}
              className="snap-start shrink-0 w-36 sm:w-40 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-2xl"
              onClick={() => navigate(`/book-details/${book.id || book.book_id}`)}
              aria-label={book.title}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-card bg-surface-secondary mb-space-8 parent-rec-cover">
                <KidsBookCover
                  book={book}
                  alt=""
                  imgClassName="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">
                {book.theme ? getThemeLabel(book.theme) : (kid?.age ? t('parentKidAgeYears', { age: kid.age }) : t('featured'))}
              </p>
              <p className="kids-book-title text-sm line-clamp-2 leading-snug">{book.title}</p>
              <p className="text-xs font-semibold text-foreground-secondary mt-1">
                {t('readAction')}
              </p>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
});

export default ParentRecommendations;
