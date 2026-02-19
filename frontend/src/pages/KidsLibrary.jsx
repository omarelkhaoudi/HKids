import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI, categoriesAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { 
  BookIcon, SearchIcon, HeartIcon, HistoryIcon, 
  LogOutIcon, UserIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function KidsLibrary() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [readingStats, setReadingStats] = useState(() => storage.getReadingStats());

  useEffect(() => {
    if (!user || user.role !== 'kid') {
      navigate('/admin/login');
      return;
    }
    loadData();
    setReadingStats(storage.getReadingStats());
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      // The API will automatically filter by approved categories when user is a kid
      const booksRes = await booksAPI.getPublishedBooks();
      setAllBooks(booksRes.data);
      filterBooks(booksRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des livres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = (booksToFilter) => {
    let filtered = [...booksToFilter];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.description?.toLowerCase().includes(query)
      );
    }

    setBooks(filtered);
  };

  useEffect(() => {
    filterBooks(allBooks);
  }, [searchQuery, allBooks]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleFavorite = (bookId) => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(bookId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      showToast('Retiré des favoris', 'info');
    } else {
      favorites.push(bookId);
      showToast('Ajouté aux favoris', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadData();
  };

  const isFavorite = (bookId) => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(bookId);
  };

  const completedBooks = readingStats.completedBookIds?.length || 0;
  const totalSessions = readingStats.totalSessions || 0;
  const totalMinutes = Math.floor((readingStats.totalTimeSeconds || 0) / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const formatTime = () => {
    if (totalHours > 0) {
      return `${totalHours}h ${remainingMinutes}min`;
    }
    return `${totalMinutes} min`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <Logo size="default" showText={true} />
          
          <div className="flex items-center gap-3">
            <Link 
              to="/favorites" 
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <HeartIcon className="w-6 h-6" />
            </Link>
            <Link 
              to="/history" 
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <HistoryIcon className="w-6 h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOutIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
            Ma Bibliothèque
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400">
            Bienvenue {user?.username || 'Enfant'} ! Voici tes livres approuvés.
          </p>
        </div>

        {/* Quick actions + stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-4">
          <button
            onClick={() => {
              const el = document.getElementById('kids-books-grid');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white/90 shadow-lg border-2 border-red-200 hover:border-red-400 hover:shadow-xl transition-all"
          >
            <BookIcon className="w-8 h-8 text-red-500" />
            <span className="text-base font-bold text-neutral-800">Lire un livre</span>
            <span className="text-xs text-neutral-500">Choisis un livre et commence à lire</span>
          </button>
          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white/90 shadow-lg border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all"
          >
            <HeartIcon className="w-8 h-8 text-pink-500" />
            <span className="text-base font-bold text-neutral-800">Mes favoris</span>
            <span className="text-xs text-neutral-500">Retrouve tes histoires préférées</span>
          </Link>
          <Link
            to="/history"
            className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white/90 shadow-lg border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all"
          >
            <HistoryIcon className="w-8 h-8 text-purple-500" />
            <span className="text-base font-bold text-neutral-800">Mon histoire</span>
            <span className="text-xs text-neutral-500">Vois ce que tu as déjà lu</span>
          </Link>
        </div>

        {/* Reading stats */}
        {(completedBooks > 0 || totalSessions > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/90 rounded-2xl p-4 shadow-md border border-green-100 flex flex-col items-center">
              <span className="text-xs text-green-600 font-semibold mb-1">Livres terminés</span>
              <span className="text-2xl font-bold text-green-700">{completedBooks}</span>
            </div>
            <div className="bg-white/90 rounded-2xl p-4 shadow-md border border-blue-100 flex flex-col items-center">
              <span className="text-xs text-blue-600 font-semibold mb-1">Temps de lecture</span>
              <span className="text-2xl font-bold text-blue-700">{formatTime()}</span>
            </div>
            <div className="bg-white/90 rounded-2xl p-4 shadow-md border border-orange-100 flex flex-col items-center">
              <span className="text-xs text-orange-600 font-semibold mb-1">Sessions</span>
              <span className="text-2xl font-bold text-orange-700">{totalSessions}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher un livre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:border-red-500 focus:outline-none shadow-lg"
            />
          </div>
        </div>
      </motion.section>

      {/* Books Grid */}
      <section id="kids-books-grid" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <BookGridSkeleton />
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookIcon className="w-24 h-24 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              {searchQuery ? 'Aucun livre trouvé' : 'Aucun livre approuvé'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              {searchQuery 
                ? 'Essayez une autre recherche'
                : 'Demande à tes parents d\'approuver des catégories de livres pour toi !'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
          >
            {books.map((book) => {
              const coverImageUrl = getImageUrl(book.cover_image);
              const favorite = isFavorite(book.id);

              return (
                <motion.div
                  key={book.id}
                  variants={itemVariants}
                  className="group relative"
                >
                  <Link to={`/book/${book.id}`}>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800">
                      {coverImageUrl ? (
                        <img
                          src={coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          coverImageUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <BookIcon className="w-16 h-16 text-neutral-400" />
                      </div>
                      
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(book.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-neutral-800/90 rounded-full hover:bg-white dark:hover:bg-neutral-700 transition-colors z-10"
                      >
                        <HeartIcon
                          className={`w-5 h-5 ${
                            favorite
                              ? 'text-red-500 fill-current'
                              : 'text-neutral-400'
                          }`}
                        />
                      </button>

                      {/* Category Badge */}
                      {book.category_name && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                            {book.category_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="mt-2">
                    <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-red-500 transition-colors">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {book.author}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default KidsLibrary;

