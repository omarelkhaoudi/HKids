import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { HeartIcon, BookIcon, ChevronLeftIcon } from '../components/Icons';

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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect border-b border-neutral-200 py-4 px-6 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-2 transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Retour</span>
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <HeartIcon className="w-5 h-5" filled={true} />
            <span>Mes Favoris</span>
          </h1>
          <div></div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <BookGridSkeleton count={4} />
          </div>
        ) : favoriteBooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-neutral-100 rounded-full">
                <HeartIcon className="w-12 h-12 text-neutral-400" filled={false} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Aucun favori</h2>
            <p className="text-neutral-600 mb-6">Vous n'avez pas encore de livres favoris</p>
            <Link to="/" className="btn-primary inline-block">
              Découvrir des livres
            </Link>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <p className="text-xl text-gray-600">
                {favoriteBooks.length} livre{favoriteBooks.length > 1 ? 's' : ''} favori{favoriteBooks.length > 1 ? 's' : ''}
              </p>
            </motion.div>
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
                  <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden group h-full flex flex-col hover:border-neutral-300">
                    <Link to={`/book-details/${book.id}`} className="flex-1">
                      <div className="h-48 bg-neutral-100 flex items-center justify-center">
                        {book.cover_image ? (
                          <img
                            src={`http://localhost:3000${book.cover_image}`}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                            <BookIcon className="w-16 h-16 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-2">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-neutral-600">par {book.author}</p>
                        )}
                      </div>
                    </Link>
                    <div className="p-5 pt-0">
                      <motion.button
                        onClick={() => removeFavorite(book.id)}
                        className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
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
    </div>
  );
}

export default Favorites;

