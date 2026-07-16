import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { getImageUrl } from '../utils/imageUrl';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsCarouselReveal } from '../constants/kidsMotion';
import { BookIcon, ChevronLeftIcon, HeartIcon, LockIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function getBookProgress(book, readingHistory = []) {
  const entry = readingHistory.find((item) => String(item.bookId) === String(book.id));
  if (!entry) return 0;
  const page = Number(entry.page || entry.currentPage || 0);
  const total = Number(book.page_count || entry.totalPages || 0);
  if (!total || page <= 0) return page > 0 ? 5 : 0;
  return Math.min(100, Math.round((page / total) * 100));
}

function StoryBookCard({
  book,
  index,
  isAuthenticated,
  showToast,
  onFavoriteChange,
  onOpenBook,
  onRequireAuth,
  progress = 0,
  variant = 'rail',
}) {
  const reducedMotion = useReducedMotion();
  const isFavorite = storage.isFavorite(book.id);
  const isRail = variant === 'rail';

  return (
    <motion.article
      {...getMotionProps(reducedMotion, {
        ...kidsCardAppear,
        transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
      })}
      className={isRail ? 'kids-gallery-card group' : 'min-w-0'}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenBook(book.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenBook(book.id);
          }
        }}
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-24"
      >
        <motion.div
          {...getHoverMotion(reducedMotion, { whileHover: { y: -6, scale: 1.02 } })}
          className="relative"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-secondary">
            {book.cover_image ? (
              <img
                src={getImageUrl(book.cover_image)}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`${book.cover_image ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-gradient-to-br from-primary-100 to-magic-100`}>
              <BookIcon className="h-16 w-16 text-magic-300" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-900/50 via-transparent to-transparent" />

            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  onRequireAuth();
                  return;
                }
                if (isFavorite) {
                  storage.removeFavorite(book.id);
                  showToast('Livre retire des favoris', 'info', 2000);
                } else {
                  storage.addFavorite(book.id);
                  showToast('Livre ajoute aux favoris', 'success', 2000);
                }
                onFavoriteChange();
              }}
              className="absolute top-space-12 right-space-12 z-20 grid h-12 w-12 min-h-touch min-w-touch place-items-center rounded-full bg-card/90 shadow-card backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <HeartIcon className={`h-6 w-6 ${isFavorite ? 'text-orange-500' : 'text-foreground-muted'}`} filled={isFavorite} />
            </motion.button>

            {!isAuthenticated && (
              <div className="absolute top-space-12 left-space-12 z-20 inline-flex items-center gap-space-8 rounded-full bg-card/90 px-space-12 py-space-8 text-caption font-bold text-foreground shadow-card backdrop-blur-sm">
                <LockIcon className="h-4 w-4 text-magic-500" />
                Prive
              </div>
            )}

            {progress > 0 && (
              <div className="absolute bottom-0 inset-x-0 p-space-12">
                <div className="h-space-8 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-space-16">
            <h3 className="text-body font-black text-foreground leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
              {book.title}
            </h3>
            {book.category_name && (
              <p className="mt-space-4 text-caption font-semibold text-foreground-muted truncate">
                {book.category_name}
              </p>
            )}
            <div className="mt-space-12 flex flex-wrap gap-space-8">
              {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                <span className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-space-12 py-space-8 text-caption font-semibold text-primary-700">
                  {book.age_group_min}-{book.age_group_max} ans
                </span>
              )}
              {book.page_count > 0 && (
                <span className="inline-flex items-center rounded-full bg-surface-secondary px-space-12 py-space-8 text-caption font-semibold text-foreground-secondary">
                  {book.page_count} {book.page_count === 1 ? 'page' : 'pages'}
                </span>
              )}
            </div>
            <div className="mt-space-12 inline-flex items-center gap-space-8 text-primary-600 font-bold text-caption">
              {isAuthenticated ? <BookIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
              <span>{isAuthenticated ? 'Lire' : 'Connexion pour lire'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.article>
  );
}

function ShelfSection({ title, emoji, books, readingHistory, ...cardProps }) {
  const reducedMotion = useReducedMotion();
  if (!books.length) return null;

  return (
    <motion.section
      className="mb-space-32"
      aria-label={title}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <h2 className="kids-shelf-title mb-space-16 px-space-8">
        <span aria-hidden="true">{emoji}</span>
        <span>{title}</span>
      </h2>
      <div className="kids-gallery-rail">
        {books.map((book, index) => (
          <StoryBookCard
            key={book.id}
            book={book}
            index={index}
            progress={getBookProgress(book, readingHistory)}
            variant="rail"
            {...cardProps}
          />
        ))}
      </div>
    </motion.section>
  );
}

function StoriesGallery() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { language, isRtl } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user || localStorage.getItem('token'));
  const readingHistory = storage.getReadingHistory();
  const favoriteIds = storage.getFavorites();

  const requireAuth = () => {
    showToast('Connectez-vous pour acceder aux histoires.', 'info', 2500);
    navigate('/parent/login');
  };

  const openBook = (bookId) => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    navigate(`/book-details/${bookId}`);
  };

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await booksAPI.getPublishedBooks({ language });
        setBooks(response.data || []);
      } catch (error) {
        console.error('Error loading stories gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [language]);

  const cardProps = {
    isAuthenticated,
    showToast,
    onFavoriteChange: () => setFavoritesVersion((value) => value + 1),
    onOpenBook: openBook,
    onRequireAuth: requireAuth,
  };

  const continueBooks = useMemo(() => {
    const withProgress = readingHistory.filter((h) => Number(h.page || h.currentPage || 0) > 0);
    return withProgress
      .map((h) => books.find((b) => String(b.id) === String(h.bookId)))
      .filter(Boolean)
      .slice(0, 10);
  }, [books, readingHistory]);

  const recommendedBooks = useMemo(() => {
    const favSet = new Set(favoriteIds.map(String));
    const favBooks = books.filter((b) => favSet.has(String(b.id)));
    if (favBooks.length >= 4) return favBooks.slice(0, 10);
    const rest = books.filter((b) => !favSet.has(String(b.id)));
    return [...favBooks, ...rest].slice(0, 10);
  }, [books, favoriteIds, favoritesVersion]);

  const categoryShelves = useMemo(() => {
    const map = new Map();
    books.forEach((book) => {
      const key = book.category_name || 'Autres histoires';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(book);
    });
    return Array.from(map.entries()).slice(0, 6);
  }, [books]);

  const decorativeStars = [
    { top: '8%', left: '7%', size: 'w-5 h-5', opacity: 'opacity-40' },
    { top: '16%', right: '13%', size: 'w-7 h-7', opacity: 'opacity-50' },
    { top: '34%', left: '4%', size: 'w-6 h-6', opacity: 'opacity-35' },
    { top: '58%', right: '5%', size: 'w-5 h-5', opacity: 'opacity-40' },
    { bottom: '10%', left: '12%', size: 'w-7 h-7', opacity: 'opacity-45' },
  ];

  return (
    <div className="min-h-screen kids-gallery-atmosphere" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 shadow-md bg-surface-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-space-16 sm:px-space-24 py-space-16 flex items-center justify-between gap-space-16">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-space-8 px-space-20 py-space-10 rounded-full bg-card text-foreground font-bold hover:bg-primary-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            to="/abonnements"
            className="hidden sm:inline-flex items-center gap-space-8 px-space-20 py-space-10 rounded-full bg-gradient-to-r from-magic-500 to-primary-500 text-white font-bold hover:shadow-floating transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-magic-300"
          >
            <BookIcon className="w-4 h-4" />
            Abonnements
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden">
        {decorativeStars.map(({ size, opacity, ...position }, index) => (
          <StarIcon
            key={index}
            className={`pointer-events-none absolute z-0 text-magic-300 ${size} ${opacity}`}
            style={position}
          />
        ))}

        <section className="relative z-10 py-space-40 md:py-space-56">
          <div className="max-w-7xl mx-auto px-space-16 sm:px-space-24">
            <div className="rounded-32 bg-gradient-to-br from-primary-50 via-magic-50 to-secondary-50 border-4 border-white shadow-floating px-space-20 py-space-40 md:px-space-40 md:py-space-48 text-center">
              <div className="inline-flex items-center gap-space-8 px-space-16 py-space-8 bg-card/80 text-magic-600 rounded-full text-body font-bold mb-space-16 border border-magic-100 shadow-soft">
                <StarIcon className="w-4 h-4" />
                Collection HKids
              </div>
              <h1 className="text-heading-xl md:text-display-s font-extrabold text-foreground mb-space-16">
                Toutes les histoires HKids
              </h1>
              <p className="text-body md:text-heading-s text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
                Parcourez les livres disponibles, ajoutez vos favoris et choisissez une histoire adaptee a l&apos;age de votre enfant.
              </p>
              <Link
                to="/abonnements"
                className="mt-space-24 inline-flex items-center justify-center gap-space-8 rounded-full bg-gradient-to-r from-magic-500 to-primary-500 px-space-24 py-space-12 text-white font-bold shadow-floating hover:shadow-glow transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-magic-300"
              >
                Voir les abonnements mensuels
              </Link>
              {!isAuthenticated && (
                <div className="mt-space-24 inline-flex items-center gap-space-8 rounded-full bg-card/90 px-space-16 py-space-8 text-body font-bold text-foreground shadow-soft border border-magic-100">
                  <LockIcon className="w-4 h-4 text-magic-500" />
                  Connectez-vous pour lire les histoires.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative z-10 pb-space-56 md:pb-space-64">
          <div className="max-w-7xl mx-auto px-space-16 sm:px-space-24">
            {loading ? (
              <div className="kids-gallery-rail">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="kids-gallery-card aspect-[3/5] animate-pulse bg-card/80 border-2 border-dashed border-primary-200" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-space-40 rounded-32 bg-card/80 border border-magic-100 shadow-soft">
                <BookIcon className="w-16 h-16 text-magic-300 mx-auto mb-space-16" />
                <p className="text-heading-s font-bold text-foreground-secondary">Aucune histoire disponible.</p>
              </div>
            ) : (
              <>
                {continueBooks.length > 0 && (
                  <ShelfSection
                    title="Continuer la lecture"
                    emoji="📖"
                    books={continueBooks}
                    readingHistory={readingHistory}
                    {...cardProps}
                  />
                )}

                <ShelfSection
                  title="Recommandes pour vous"
                  emoji="⭐"
                  books={recommendedBooks}
                  readingHistory={readingHistory}
                  {...cardProps}
                />

                {categoryShelves.map(([category, shelfBooks]) => (
                  <ShelfSection
                    key={category}
                    title={category}
                    emoji="📚"
                    books={shelfBooks.slice(0, 12)}
                    readingHistory={readingHistory}
                    {...cardProps}
                  />
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StoriesGallery;
