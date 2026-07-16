import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { KidsMediaCard } from './KidsMediaCard';
import { getKidsModality } from '../../constants/kidsModality';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCarouselReveal } from '../../constants/kidsMotion';

export function KidsSectionHeader({
  title,
  icon: Icon,
  emoji,
  isRtl = false,
  modality,
  onScrollLeft,
  onScrollRight,
  hideTitle = false,
}) {
  const theme = getKidsModality(modality || 'books');

  return (
    <div className="mb-5 flex items-center justify-between px-2 md:px-4">
      <h2 className="kids-shelf-title">
        {emoji && <span className="text-4xl md:text-5xl drop-shadow-sm" aria-hidden="true">{emoji}</span>}
        {Icon && <Icon className={`h-9 w-9 ${theme.shelfTint}`} />}
        {!hideTitle && title && (
          <span className={`sr-only sm:not-sr-only ${theme.shelfTint}`}>{title}</span>
        )}
      </h2>
      {(onScrollLeft || onScrollRight) && (
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onScrollLeft}
            className={`kids-touch-target p-3 rounded-full bg-white dark:bg-surface-800 shadow-md border-2 border-border ${theme.borderHover} hover:scale-105 transition-transform ${theme.shelfTint}`}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onScrollRight}
            className={`kids-touch-target p-3 rounded-full bg-white dark:bg-surface-800 shadow-md border-2 border-border ${theme.borderHover} hover:scale-105 transition-transform ${theme.shelfTint}`}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}

export function KidsBookCarousel({
  title,
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
    <motion.section className="mb-10 relative" {...getMotionProps(reducedMotion, kidsCarouselReveal)}>
      <KidsSectionHeader
        title={title}
        icon={icon}
        emoji={emoji}
        isRtl={isRtl}
        modality={modality}
        hideTitle={hideSectionTitle}
        onScrollLeft={() => scroll('left')}
        onScrollRight={() => scroll('right')}
      />
      <div
        ref={carouselRef}
        className="flex gap-5 md:gap-7 overflow-x-auto px-2 md:px-4 pb-6 pt-2 snap-x snap-mandatory custom-scrollbar"
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
