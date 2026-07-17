import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import { getFileUrl } from '../../utils/fileUrl';
import { ParentEmptyState } from './ParentEmptyState';

function LibraryRail({ title, subtitle, items, emptyEmoji, emptyTitle, emptyDesc, t, renderItem }) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="parent-library-rail" aria-label={title}>
      <header className="flex items-end justify-between gap-space-16 mb-space-16 px-space-4">
        <div className="min-w-0">
          <h3 className="text-heading-m font-black text-foreground truncate">{title}</h3>
          {subtitle && <p className="text-body text-foreground-secondary font-medium mt-0.5">{subtitle}</p>}
        </div>
      </header>

      {items.length === 0 ? (
        <ParentEmptyState emoji={emptyEmoji} title={emptyTitle} description={emptyDesc} compact className="!p-space-16" />
      ) : (
        <div className="parent-discovery-rail flex gap-space-16 overflow-x-auto pb-space-8 -mx-space-4 px-space-4 snap-x snap-mandatory scroll-smooth">
          {items.map((item, index) => (
            <motion.div
              key={item.book_id || item.id || index}
              {...getMotionProps(reducedMotion, {
                ...kidsCardAppear,
                transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
              })}
              {...getHoverMotion(reducedMotion)}
              className="snap-start shrink-0 w-36 sm:w-40"
            >
              {renderItem(item)}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function BookCoverCard({ book, badge }) {
  return (
    <article className="group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-card bg-surface-secondary mb-space-8">
        {book.cover_image ? (
          <img
            src={getFileUrl(book.cover_image)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary-100 to-magic-100" aria-hidden="true">
            📚
          </div>
        )}
        {badge && (
          <span className="absolute top-2 inset-inline-end-2 rounded-full bg-card/90 backdrop-blur-sm px-2 py-0.5 text-caption font-bold text-foreground shadow-soft">
            {badge}
          </span>
        )}
        {book.progress_percent > 0 && book.progress_percent < 100 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-surface-secondary/80">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${book.progress_percent}%` }}
              role="progressbar"
              aria-valuenow={book.progress_percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>
      <p className="text-body font-bold text-foreground line-clamp-2 leading-snug">{book.title}</p>
    </article>
  );
}

export function ParentLibraryRails({ data, t }) {
  const progress = data?.progress?.items || [];
  const favorites = data?.favorites?.items || [];
  const history = data?.history?.items || [];

  const continueReading = progress.filter((b) => (b.progress_percent || 0) > 0);
  const recentlyAdded = history.slice(0, 12);

  return (
    <section className="parent-section space-y-space-32" aria-labelledby="parent-library-heading">
      <header>
        <h2 id="parent-library-heading" className="text-heading-xl font-black text-foreground">
          {t('parentLibraryTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">{t('parentLibrarySubtitle')}</p>
      </header>

      <LibraryRail
        title={t('parentLibraryContinue')}
        subtitle={t('parentLibraryContinueDesc')}
        items={continueReading}
        emptyEmoji="📖"
        emptyTitle={t('parentLibraryContinueEmpty')}
        emptyDesc={t('parentLibraryContinueEmptyDesc')}
        t={t}
        renderItem={(book) => (
          <BookCoverCard book={book} badge={book.progress_percent ? `${book.progress_percent}%` : null} />
        )}
      />

      <LibraryRail
        title={t('parentLibraryFavorites')}
        subtitle={t('parentLibraryFavoritesDesc')}
        items={favorites}
        emptyEmoji="💛"
        emptyTitle={t('parentAnalyticsNoFavorites')}
        emptyDesc={t('parentLibraryFavoritesEmptyDesc')}
        t={t}
        renderItem={(book) => <BookCoverCard book={book} />}
      />

      <LibraryRail
        title={t('parentLibraryRecent')}
        subtitle={t('parentLibraryRecentDesc')}
        items={recentlyAdded}
        emptyEmoji="🌟"
        emptyTitle={t('parentAnalyticsNoHistory')}
        emptyDesc={t('parentLibraryRecentEmptyDesc')}
        t={t}
        renderItem={(book) => (
          <BookCoverCard
            book={book}
            badge={book.last_page ? t('parentAnalyticsPage', { page: book.last_page }) : null}
          />
        )}
      />
    </section>
  );
}

export default ParentLibraryRails;
