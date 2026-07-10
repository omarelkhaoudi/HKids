import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { KidsMediaCard } from './KidsMediaCard';

export function KidsSectionHeader({ title, icon: Icon, emoji, isRtl = false, onScrollLeft, onScrollRight }) {
  return (
    <div className="mb-6 flex items-center justify-between px-2 md:px-4">
      <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-foreground">
        {emoji && <span className="text-3xl" aria-hidden="true">{emoji}</span>}
        {Icon && <Icon className="h-8 w-8 text-primary-500" />}
        {title}
      </h2>
      {(onScrollLeft || onScrollRight) && (
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onScrollLeft}
            className="p-3 rounded-full bg-white dark:bg-surface-800 shadow-md border-2 border-border hover:bg-surface-100 hover:scale-110 transition-transform text-primary-500"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onScrollRight}
            className="p-3 rounded-full bg-white dark:bg-surface-800 shadow-md border-2 border-border hover:bg-surface-100 hover:scale-110 transition-transform text-primary-500"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
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
}) {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const visualDirection = isRtl ? (direction === 'left' ? 'right' : 'left') : direction;
    const scrollAmount = visualDirection === 'left' ? -600 : 600;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!books.length) return null;

  return (
    <section className="mb-12 relative">
      <KidsSectionHeader
        title={title}
        icon={icon}
        emoji={emoji}
        isRtl={isRtl}
        onScrollLeft={() => scroll('left')}
        onScrollRight={() => scroll('right')}
      />
      <div
        ref={carouselRef}
        className="flex gap-4 md:gap-6 overflow-x-auto px-2 md:px-4 pb-8 pt-2 snap-x snap-mandatory custom-scrollbar"
      >
        {books.map((book) => (
          <div key={book.id} className="snap-start shrink-0">
            <KidsMediaCard
              book={book}
              variant={showActions ? 'poster' : 'carousel'}
              showActions={showActions}
              isFavorite={favorites.includes(book.id)}
              offlineReady={offlineContent?.getBookStatus?.(book.id)?.status === 'downloaded'}
              onPlay={onPlay}
              onFavorite={onFavorite}
              onDownload={onDownload}
              isRtl={isRtl}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
