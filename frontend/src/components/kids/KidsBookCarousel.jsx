import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { KidsMediaCard } from './KidsMediaCard';
import { getKidsModality } from '../../constants/kidsModality';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCarouselReveal } from '../../constants/kidsMotion';

export function KidsSectionHeader({
  title,
  subtitle,
  icon: Icon,
  emoji,
  isRtl = false,
  modality,
  onScrollLeft,
  onScrollRight,
  hideTitle = false,
  seeAllLabel,
  onSeeAll,
}) {
  const theme = getKidsModality(modality || 'books');

  return (
    <div className="mb-space-16 flex items-end justify-between gap-space-12 px-space-8 md:px-space-16">
      <div className="min-w-0 flex-1">
        <h2 className="kids-shelf-title !mb-0">
          {emoji && <span className="text-4xl md:text-5xl drop-shadow-sm" aria-hidden="true">{emoji}</span>}
          {Icon && <Icon className={`h-9 w-9 ${theme.shelfTint}`} />}
          {!hideTitle && title && (
            <span className={theme.shelfTint}>{title}</span>
          )}
        </h2>
        {subtitle && (
          <p className="mt-space-4 text-caption md:text-body font-bold text-foreground-muted line-clamp-1 px-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-space-8">
        {seeAllLabel && onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="kids-touch-target inline-flex min-h-touch items-center rounded-full border-2 border-border bg-card px-space-16 py-space-8 text-caption font-black text-primary-600 shadow-soft hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
          >
            {seeAllLabel}
          </button>
        )}
        {(onScrollLeft || onScrollRight) && (
          <div className="hidden md:flex items-center gap-space-8">
            <button
              type="button"
              onClick={onScrollLeft}
              className={`kids-touch-target p-3 rounded-full bg-card shadow-soft border-2 border-border ${theme.borderHover} hover:scale-105 transition-transform ${theme.shelfTint} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onScrollRight}
              className={`kids-touch-target p-3 rounded-full bg-card shadow-soft border-2 border-border ${theme.borderHover} hover:scale-105 transition-transform ${theme.shelfTint} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
              aria-label="Scroll right"
            >
              <ChevronRightIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function KidsBookCarousel({
  title,
  subtitle,
  icon,
  emoji,
  books = [],
  isRtl = false,
  favorites = [],
  offlineContent,
  onPlay,
  onFavorite,
  onDownload,
  showActions = true,
  hideTitle = true,
  hideSectionTitle = false,
  modality = 'books',
  seeAllLabel,
  onSeeAll,
}) {
  const carouselRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const visualDirection = isRtl ? (direction === 'left' ? 'right' : 'left') : direction;
    const scrollAmount = visualDirection === 'left' ? -640 : 640;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!books.length) return null;

  return (
    <motion.section className="kids-shelf-rail mb-space-8 relative" {...getMotionProps(reducedMotion, kidsCarouselReveal)}>
      <KidsSectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        emoji={emoji}
        isRtl={isRtl}
        modality={modality}
        hideTitle={hideSectionTitle}
        seeAllLabel={seeAllLabel}
        onSeeAll={onSeeAll}
        onScrollLeft={() => scroll('left')}
        onScrollRight={() => scroll('right')}
      />
      <div
        ref={carouselRef}
        className="kids-discovery-rail !gap-space-20 md:!gap-space-24"
      >
        {books.map((book) => (
          <div key={book.id} className="snap-start shrink-0">
            <KidsMediaCard
              book={book}
              variant={showActions ? 'poster' : 'carousel'}
              hideTitle={hideTitle}
              showActions={showActions}
              isFavorite={favorites.includes(book.id)}
              offlineReady={offlineContent?.getBookStatus?.(book.id)?.status === 'downloaded'}
              themeEmoji={book._themeEmoji}
              discoveryReason={book._discoveryReason}
              onPlay={onPlay}
              onFavorite={onFavorite}
              onDownload={onDownload}
              isRtl={isRtl}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
