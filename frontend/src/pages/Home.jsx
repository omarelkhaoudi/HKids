import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI, categoriesAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { 
  BookIcon, SearchIcon, HeartIcon, HistoryIcon, 
  MoonIcon, SunIcon, LockIcon, GridIcon, ListIcon, XIcon 
} from '../components/Icons';
import { Logo } from '../components/Logo';

function Home({ darkMode, setDarkMode }) {
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]); // Tous les livres pour la recherche
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, title, author
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [loading, setLoading] = useState(true);
  const [favoritesUpdate, setFavoritesUpdate] = useState(0); // Pour forcer le re-render
  const { showToast } = useToast();

  // Fonction pour obtenir une couleur basée sur la catégorie
  const getCategoryColor = (categoryName, index) => {
    const colorMap = {
      'Nature': '#4CAF50',
      'Aventure': '#FF6B9D',
      'Animaux': '#FFA500',
      'Espace': '#1a1a2e',
      'Fiction': '#9C27B0',
      'Educational': '#2196F3',
    };
    
    if (categoryName && colorMap[categoryName]) {
      return colorMap[categoryName];
    }
    
    // Couleurs par défaut basées sur l'index si pas de catégorie
    const defaultColors = [
      '#FF6B9D', // Rose
      '#4CAF50', // Vert
      '#1a1a2e', // Bleu foncé
      '#FFA500', // Orange
      '#9C27B0', // Violet
      '#2196F3', // Bleu
      '#E91E63', // Rose foncé
      '#00BCD4', // Cyan
    ];
    
    return defaultColors[index % defaultColors.length];
  };

  useEffect(() => {
    console.log('Home component mounted, loading data...');
    loadData();
  }, [selectedCategory, selectedAge]);

  useEffect(() => {
    filterAndSortBooks(allBooks);
  }, [searchQuery, allBooks, sortBy, selectedCategory, selectedAge]);

  const filterAndSortBooks = (booksToFilter) => {
    let filtered = [...booksToFilter];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(book => book.category_id == selectedCategory);
    }

    // Filtre par âge
    if (selectedAge) {
      const age = parseInt(selectedAge);
      filtered = filtered.filter(book => 
        book.age_group_min <= age && book.age_group_max >= age
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'recent':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setBooks(filtered);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, categoriesRes] = await Promise.all([
        booksAPI.getPublishedBooks({
          category_id: selectedCategory || undefined,
          age_group: selectedAge || undefined
        }),
        categoriesAPI.getAll()
      ]);
      setAllBooks(booksRes.data);
      // Filtrer par recherche si nécessaire
      filterBooks(booksRes.data);
      setCategories(categoriesRes.data);
      console.log('Books loaded:', booksRes.data);
      console.log('Books count:', booksRes.data?.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-effect-enhanced sticky top-0 z-50 border-b border-neutral-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Logo size="default" />
          <nav className="flex items-center gap-2">
            <Link 
              to="/favorites" 
              className="btn-nav flex items-center gap-2"
              title="Mes favoris"
            >
              <HeartIcon className="w-4 h-4" filled={false} />
              <span className="hidden sm:inline">Favoris</span>
            </Link>
            <Link 
              to="/history" 
              className="btn-nav flex items-center gap-2"
              title="Historique"
            >
              <HistoryIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn-nav p-2"
              title={darkMode ? "Mode clair" : "Mode sombre"}
            >
              {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
            <Link 
              to="/admin/login" 
              className="btn-nav flex items-center gap-2"
            >
              <LockIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:text-left"
        >
          <motion.h2 
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
              Bibliothèque numérique
            </span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-neutral-600 max-w-3xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Découvrez une collection de livres adaptés aux enfants, organisés par âge et par catégorie.
          </motion.p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mb-10"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/10 via-neutral-800/10 to-neutral-900/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <SearchIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-neutral-600 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un livre, un auteur..."
                className="w-full pl-14 pr-12 py-4 bg-white/80 backdrop-blur-sm border-2 border-neutral-200 rounded-2xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 text-base transition-all placeholder:text-neutral-400 shadow-lg hover:shadow-xl focus:shadow-2xl"
              />
              {searchQuery && (
                <motion.button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors p-1 rounded-lg hover:bg-neutral-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
          {searchQuery && (
            <motion.p 
              className="text-sm text-neutral-600 mt-3 ml-1 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {books.length} {books.length === 1 ? 'résultat trouvé' : 'résultats trouvés'}
            </motion.p>
          )}
        </motion.div>

        {/* Filters & Sort */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 mb-10 flex-wrap items-center"
        >
          <div className="relative group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer appearance-none pr-12 text-sm font-medium text-neutral-700 shadow-md hover:shadow-lg focus:shadow-xl"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative group">
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer appearance-none pr-12 text-sm font-medium text-neutral-700 shadow-md hover:shadow-lg focus:shadow-xl"
            >
              <option value="">Tous les âges</option>
              <option value="3">3+ ans</option>
              <option value="5">5+ ans</option>
              <option value="7">7+ ans</option>
              <option value="9">9+ ans</option>
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer appearance-none pr-12 text-sm font-medium text-neutral-700 shadow-md hover:shadow-lg focus:shadow-xl"
            >
              <option value="recent">Plus récents</option>
              <option value="title">Par titre (A-Z)</option>
              <option value="author">Par auteur (A-Z)</option>
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1.5 border-2 border-neutral-200 shadow-md">
            <motion.button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-neutral-900 text-white shadow-lg' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Vue grille"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GridIcon className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-neutral-900 text-white shadow-lg' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title="Vue liste"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListIcon className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Results Count */}
        {books.length > 0 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-base text-neutral-600 font-medium">
              <span className="font-bold text-neutral-900 text-lg">{books.length}</span> 
              {' '}livre{books.length > 1 ? 's' : ''} disponible{books.length > 1 ? 's' : ''}
              {selectedCategory && (
                <span className="ml-2 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium">
                  {categories.find(c => c.id == selectedCategory)?.name}
                </span>
              )}
              {selectedAge && (
                <span className="ml-2 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium">
                  {selectedAge}+ ans
                </span>
              )}
            </p>
          </motion.div>
        )}
      </div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              : "space-y-4 max-w-4xl mx-auto"
            }
          >
            <BookGridSkeleton count={8} viewMode={viewMode} />
          </motion.div>
        ) : !books || books.length === 0 ? (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 flex justify-center">
              <div className="p-6 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl shadow-lg">
                <BookIcon className="w-16 h-16 text-neutral-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-3">Aucun livre trouvé</h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">Aucun livre ne correspond à vos critères de recherche</p>
            {(searchQuery || selectedCategory || selectedAge) && (
              <motion.button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedAge('');
                }}
                className="btn-primary text-base px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Réinitialiser les filtres
              </motion.button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${viewMode}-${books.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
                : "space-y-4 max-w-4xl mx-auto"
              }
            >
            {books && books.length > 0 ? books.map((book, index) => {
              const categoryColor = getCategoryColor(book.category_name, index);
              return viewMode === 'grid' ? (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05, 
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -12, 
                    scale: 1.03,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.97 }}
                  layout
                >
                  <div className="book-card-enhanced bg-white rounded-2xl border-2 border-neutral-200/50 overflow-hidden group h-full flex flex-col relative hover:border-neutral-300 hover:shadow-2xl transition-all duration-300">
                    {/* Bouton favori */}
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const wasFavorite = storage.isFavorite(book.id);
                        if (wasFavorite) {
                          storage.removeFavorite(book.id);
                          showToast('Livre retiré des favoris', 'info', 2000);
                        } else {
                          storage.addFavorite(book.id);
                          showToast('Livre ajouté aux favoris', 'success', 2000);
                        }
                        // Force re-render
                        setFavoritesUpdate(prev => prev + 1);
                      }}
                      className="absolute top-4 right-4 z-20 p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all"
                      title={storage.isFavorite(book.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <HeartIcon 
                        className={`w-5 h-5 ${storage.isFavorite(book.id) ? 'text-red-500' : 'text-neutral-400'}`}
                        filled={storage.isFavorite(book.id)}
                      />
                    </motion.button>
                    
                    <Link
                      to={`/book-details/${book.id}`}
                      className="flex-1 flex flex-col"
                    >
                      {/* Cover Image */}
                      <div className="h-72 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
                        {book.cover_image ? (
                          <img
                            src={`http://localhost:3000${book.cover_image}`}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-150 to-neutral-200">
                            <BookIcon className="w-20 h-20 text-neutral-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {book.category_name && (
                          <div className="absolute top-4 left-4">
                            <span 
                              className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-xs font-bold rounded-lg shadow-lg"
                              style={{ 
                                backgroundColor: `${getCategoryColor(book.category_name, index)}20`,
                                color: getCategoryColor(book.category_name, index),
                                border: `1px solid ${getCategoryColor(book.category_name, index)}40`
                              }}
                            >
                              {book.category_name}
                            </span>
                          </div>
                        )}
                      </div>
                    
                      {/* Book Details */}
                      <div className="p-6 flex-1 flex flex-col bg-white">
                        <h3 className="font-bold text-xl text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-700 transition-colors leading-tight">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-neutral-500 mb-4 font-medium">par {book.author}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-auto pt-4 border-t border-neutral-100">
                          {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.age_group_min}-{book.age_group_max} ans
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} page{book.page_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={`/book/${book.id}`}
                    className="book-card-enhanced bg-white rounded-2xl border-2 border-neutral-200/50 overflow-hidden group block hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex">
                      <div className="w-40 h-52 flex-shrink-0 bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden relative">
                        {book.cover_image ? (
                          <img
                            src={`http://localhost:3000${book.cover_image}`}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-150 to-neutral-200">
                              <BookIcon className="w-16 h-16 text-neutral-400" />
                            </div>
                          )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-2xl text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors leading-tight">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-base text-neutral-500 mb-3 font-medium">par {book.author}</p>
                          )}
                          {book.description && (
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">{book.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-neutral-100">
                          {book.category_name && (
                            <span 
                              className="inline-block px-3 py-1.5 text-xs font-bold rounded-lg"
                              style={{ 
                                backgroundColor: `${getCategoryColor(book.category_name, index)}20`,
                                color: getCategoryColor(book.category_name, index),
                                border: `1px solid ${getCategoryColor(book.category_name, index)}40`
                              }}
                            >
                              {book.category_name}
                            </span>
                          )}
                          {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.age_group_min}-{book.age_group_max} ans
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} page{book.page_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            }) : (
              <div className={`${viewMode === 'grid' ? "col-span-full" : "w-full"} text-center py-12`}>
                <p className="text-gray-600">Aucun livre trouvé</p>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Home;

