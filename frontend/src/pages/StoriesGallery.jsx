import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { getImageUrl } from '../utils/imageUrl';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { BookIcon, ChevronLeftIcon, HeartIcon, LockIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function StoryBookCard({ book, index, isAuthenticated, showToast, onFavoriteChange, onOpenBook, onRequireAuth }) {
  const isFavorite = storage.isFavorite(book.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -3, scale: 1.005 }}
      className="min-w-0"
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
        className="group block text-center cursor-pointer"
      >
        <div className="relative aspect-[4/5] rounded-lg border-2 border-dashed border-orange-400 bg-gradient-to-br from-orange-50 via-white to-pink-50 p-3 sm:p-4 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-pink-500 group-hover:shadow-md [perspective:900px]">
          <motion.button
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
            className="absolute top-3 right-3 z-30 p-2.5 bg-white/85 hover:bg-white rounded-full shadow-md backdrop-blur-sm transition-all"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <HeartIcon
              className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-orange-400'}`}
              filled={isFavorite}
            />
          </motion.button>
          {!isAuthenticated && (
            <div className="absolute top-3 left-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-md backdrop-blur-sm">
              <LockIcon className="w-3.5 h-3.5 text-orange-500" />
              Prive
            </div>
          )}

          <div className="relative w-[72%] max-w-[190px] aspect-[3/4] [transform-style:preserve-3d] transition-transform duration-300 [transform:rotateY(-18deg)_rotateZ(-1deg)] group-hover:[transform:rotateY(-15deg)_rotateZ(-0.5deg)_translateY(-1px)]">
            <div className="absolute -right-[13%] top-[3%] h-[94%] w-[16%] rounded-r-md bg-gradient-to-r from-neutral-200 via-white to-neutral-300 shadow-md [transform:rotateY(72deg)_translateZ(1px)] origin-left">
              <div className="absolute inset-y-2 left-1/3 w-px bg-neutral-300/80"></div>
              <div className="absolute inset-y-3 right-1/3 w-px bg-neutral-200/80"></div>
            </div>
            <div className="absolute -right-[8%] top-[5%] h-[90%] w-[10%] rounded-r-sm bg-gradient-to-r from-white via-neutral-100 to-neutral-300 [transform:translateZ(-9px)]"></div>
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-neutral-900/10 to-neutral-900/25 [transform:translateZ(-14px)]"></div>
            <div className="relative z-10 h-full w-full overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/10 [transform:translateZ(12px)]">
              {book.cover_image ? (
                <img
                  src={getImageUrl(book.cover_image)}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${book.cover_image ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100`}>
                <BookIcon className="w-12 h-12 sm:w-16 sm:h-16 text-orange-300" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[14%] bg-gradient-to-r from-black/20 via-black/5 to-transparent"></div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/35"></div>
            </div>
            <div className="absolute -bottom-5 left-[9%] h-5 w-[92%] rounded-full bg-black/18 blur-md [transform:rotateX(75deg)]"></div>
          </div>
        </div>

        <div className="mt-4 px-1">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {book.title}
          </h3>
          {book.category_name && (
            <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 truncate">
              {book.category_name}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {book.age_group_min !== undefined && book.age_group_max !== undefined && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                {book.age_group_min}-{book.age_group_max} ans
              </span>
            )}
            {book.page_count > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-full">
                {book.page_count} {book.page_count === 1 ? 'page' : 'pages'}
              </span>
            )}
          </div>
          <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-orange-500 font-bold text-sm">
            {isAuthenticated ? (
              <BookIcon className="w-4 h-4" />
            ) : (
              <LockIcon className="w-4 h-4" />
            )}
            <span>{isAuthenticated ? 'Lire' : 'Connexion pour lire'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StoriesGallery() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user || localStorage.getItem('token'));

  const requireAuth = () => {
    showToast('Connectez-vous pour acceder aux histoires.', 'info', 2500);
    navigate('/admin/login');
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
        const response = await booksAPI.getPublishedBooks();
        setBooks(response.data || []);
      } catch (error) {
        console.error('Error loading stories gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const decorativeStars = [
    { top: '8%', left: '7%', size: 'w-5 h-5', opacity: 'opacity-40' },
    { top: '16%', right: '13%', size: 'w-7 h-7', opacity: 'opacity-50' },
    { top: '34%', left: '4%', size: 'w-6 h-6', opacity: 'opacity-35' },
    { top: '58%', right: '5%', size: 'w-5 h-5', opacity: 'opacity-40' },
    { bottom: '10%', left: '12%', size: 'w-7 h-7', opacity: 'opacity-45' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-pink-50/30">
      <header className="sticky top-0 z-40 shadow-md bg-neutral-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            to="/abonnements"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
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
            className={`pointer-events-none absolute z-0 text-yellow-300 ${size} ${opacity}`}
            style={position}
          />
        ))}

        <section className="relative z-10 py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="rounded-[2rem] bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border-4 border-white shadow-xl px-5 py-10 md:px-10 md:py-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 text-orange-600 rounded-full text-sm font-bold mb-4 border border-orange-100 shadow-sm">
                <StarIcon className="w-4 h-4" />
                Collection HKids
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4">
                Toutes les histoires HKids
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                Parcourez les livres disponibles, ajoutez vos favoris et choisissez une histoire adaptee a l'age de votre enfant.
              </p>
              <Link
                to="/abonnements"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Voir les abonnements mensuels
              </Link>
              {!isAuthenticated && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-neutral-800 shadow-sm border border-orange-100">
                  <LockIcon className="w-4 h-4 text-orange-500" />
                  Connectez-vous pour lire les histoires.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative z-10 pb-14 md:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-[4/5] rounded-lg bg-white/80 border-2 border-dashed border-orange-200 animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 rounded-[2rem] bg-white/80 border border-orange-100 shadow-sm">
              <BookIcon className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-neutral-700">Aucune histoire disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 lg:gap-x-8">
              {books.map((book, index) => (
                <StoryBookCard
                  key={`${book.id}-${favoritesVersion}`}
                  book={book}
                  index={index}
                  isAuthenticated={isAuthenticated}
                  showToast={showToast}
                  onFavoriteChange={() => setFavoritesVersion((value) => value + 1)}
                  onOpenBook={openBook}
                  onRequireAuth={requireAuth}
                />
              ))}
            </div>
          )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StoriesGallery;
