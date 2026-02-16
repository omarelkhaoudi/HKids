import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { HeartIcon, BookIcon, ChevronLeftIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function Favorites() {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoriteIds = storage.getFavorites();
      
      if (favoriteIds.length === 0) {
        setFavoriteBooks([]);
        setLoading(false);
        return;
      }

      // Charger tous les livres publiés et filtrer les favoris
      const response = await booksAPI.getPublishedBooks();
      const favorites = response.data.filter(book => favoriteIds.includes(book.id));
      setFavoriteBooks(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const { showToast } = useToast();

  const removeFavorite = (bookId) => {
    storage.removeFavorite(bookId);
    showToast('Livre retiré des favoris', 'info', 2000);
    loadFavorites();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 shadow-md bg-neutral-900/95 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-neutral-100 hover:text-white font-medium flex items-center gap-2 transition-colors">
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <HeartIcon className="w-5 h-5" filled={true} />
              <span>Mes Favoris</span>
            </h1>
          </div>
        </div>
      </motion.header>

      {/* Hero Section avec étoiles animées */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 py-12 md:py-16">
        {/* Étoiles animées en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <StarIcon className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-red-600 drop-shadow-lg">Mes Livres</span>
              <br />
              <span className="text-neutral-900">Favoris</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Retrouvez tous vos livres préférés en un seul endroit
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <BookGridSkeleton count={4} />
            </div>
          ) : favoriteBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="mb-6 flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full shadow-lg"
                >
                  <HeartIcon className="w-16 h-16 text-red-500" filled={false} />
                </motion.div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">Aucun favori</h2>
              <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
                Vous n'avez pas encore de livres favoris. Explorez notre bibliothèque et ajoutez vos préférés !
              </p>
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Découvrir des livres
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <p className="text-xl sm:text-2xl text-neutral-700 font-semibold">
                  {favoriteBooks.length} livre{favoriteBooks.length > 1 ? 's' : ''} favori{favoriteBooks.length > 1 ? 's' : ''}
                </p>
              </motion.div>
              <AnimatePresence>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                  {favoriteBooks.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.4,
                        type: 'spring',
                        stiffness: 100
                      }}
                      whileHover={{ y: -12, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      layout
                    >
                      <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden group h-full flex flex-col hover:border-red-300 hover:shadow-xl transition-all shadow-lg">
                        <Link to={`/book-details/${book.id}`} className="flex-1">
                          <div className="h-56 bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center overflow-hidden">
                            {book.cover_image ? (
                              <motion.img
                                src={`http://localhost:3000${book.cover_image}`}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                whileHover={{ scale: 1.1 }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookIcon className="w-20 h-20 text-neutral-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-5 bg-gradient-to-br from-red-50/50 to-pink-50/50">
                            <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2">
                              {book.title}
                            </h3>
                            {book.author && (
                              <p className="text-sm text-neutral-600 font-medium">par {book.author}</p>
                            )}
                          </div>
                        </Link>
                        <div className="p-5 pt-0">
                          <motion.button
                            onClick={() => removeFavorite(book.id)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <HeartIcon className="w-4 h-4" filled={true} />
                            <span>Retirer des favoris</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Favorites;

