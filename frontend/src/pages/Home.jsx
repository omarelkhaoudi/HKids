import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI, categoriesAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { getImageUrl } from '../utils/imageUrl';
import { 
  BookIcon, SearchIcon, HeartIcon, HistoryIcon, 
  MoonIcon, SunIcon, LockIcon, GridIcon, ListIcon, XIcon,
  CategoryIcon, StarIcon, ChildIcon, PaletteIcon, SparklesIcon,
  AudioIcon, MicrophoneIcon, TheaterIcon, FontIcon, RulerIcon, VolumeIcon,
  ChevronRightIcon, UserIcon, ComputerIcon, TabletIcon, SmartphoneIcon,
  FacebookIcon, InstagramIcon, WhatsAppIcon, TwitterIcon, YouTubeIcon, LinkedInIcon,
  ClockIcon, BrainIcon, GraduationIcon, LanguageIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import LibraryMenu from '../components/LibraryMenu';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function Home({ darkMode, setDarkMode }) {
  const { language } = useLanguage();
  const t = translations[language];
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
  const [imageError, setImageError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Reset image error when book changes
  useEffect(() => {
    setImageError(false);
  }, [allBooks[0]?.id]);

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
      filterAndSortBooks(booksRes.data);
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

  // Petites statistiques pour la hero section
  const totalBooks = allBooks?.length || 0;
  const totalCategories = categories?.length || 0;

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
          <Logo size="default" />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-neutral-100">
            <LibraryMenu
              categories={categories}
              onCategorySelect={setSelectedCategory}
              onAgeSelect={setSelectedAge}
              selectedCategory={selectedCategory}
              selectedAge={selectedAge}
            />
            <Link 
              to="/favorites" 
              className="btn-nav flex items-center gap-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80"
              title={t.favorites}
            >
              <HeartIcon className="w-4 h-4" filled={false} />
              <span>{t.favorites}</span>
            </Link>
            <Link 
              to="/history" 
              className="btn-nav flex items-center gap-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80"
              title={t.history}
            >
              <HistoryIcon className="w-4 h-4" />
              <span>{t.history}</span>
            </Link>
            <Link 
              to="/admin/login" 
              className="btn-nav flex items-center gap-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80"
            >
              <LockIcon className="w-4 h-4" />
              <span>{t.admin}</span>
            </Link>
            <div className="ml-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <LanguageSelector />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <div className="px-2 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <LanguageSelector />
            </div>
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-neutral-800/95 backdrop-blur-md border-t border-neutral-700"
            >
              <nav className="px-4 py-4 space-y-2">
                <Link 
                  to="/favorites" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-neutral-100 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-colors"
                >
                  <HeartIcon className="w-5 h-5" filled={false} />
                  <span>{t.favorites}</span>
                </Link>
                <Link 
                  to="/history" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-neutral-100 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-colors"
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span>{t.history}</span>
                </Link>
                <Link 
                  to="/admin/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-neutral-100 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-colors"
                >
                  <LockIcon className="w-5 h-5" />
                  <span>{t.admin}</span>
                </Link>
                <div className="pt-2 border-t border-neutral-700">
                  <LibraryMenu
                    categories={categories}
                    onCategorySelect={(cat) => {
                      setSelectedCategory(cat);
                      setMobileMenuOpen(false);
                    }}
                    onAgeSelect={(age) => {
                      setSelectedAge(age);
                      setMobileMenuOpen(false);
                    }}
                    selectedCategory={selectedCategory}
                    selectedAge={selectedAge}
                  />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Section 1: Hero - Donner le goût de lire */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 py-8 md:py-12 lg:py-16">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-3 sm:mb-4 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-red-600 drop-shadow-lg">{t.heroTitle1}</span>
                <br />
                <span className="text-neutral-900">{t.heroTitle2}</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t.heroSubtitle}{' '}
                <span className="text-red-600">{totalBooks} {t.heroSubtitle2}</span>
              </motion.p>

              <motion.p 
                className="text-sm sm:text-base text-neutral-600 mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t.heroDescription}
              </motion.p>
          </motion.div>

          {/* Right: Illustration card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/30 via-pink-500/20 to-orange-500/30 blur-3xl rounded-[2.5rem]" />
              <div className="relative rounded-[2.5rem] bg-white/95 backdrop-blur border-2 border-red-100 shadow-2xl p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 mb-4 shadow-lg">
                    <BookIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{t.digitalLibrary}</h3>
                  <p className="text-sm text-neutral-600">{t.forChildrenAges}</p>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: BookIcon, text: t.illustratedBooks, color: 'from-red-500 to-pink-500' },
                    { icon: PaletteIcon, text: t.simpleNavigation, color: 'from-pink-500 to-orange-500' },
                    { icon: StarIcon, text: t.adaptedContent, color: 'from-orange-500 to-amber-500' }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    const isBooksLink = item.text === t.illustratedBooks;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow ${isBooksLink ? 'cursor-pointer' : ''}`}
                        onClick={isBooksLink ? () => {
                          document.getElementById('books-section')?.scrollIntoView({ behavior: 'smooth' });
                        } : undefined}
                        whileHover={isBooksLink ? { scale: 1.02 } : {}}
                        whileTap={isBooksLink ? { scale: 0.98 } : {}}
                      >
                        <IconComponent className="w-8 h-8 text-red-600" />
                        <span className="font-semibold text-neutral-900">{item.text}</span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-pink-100 border-2 border-white flex items-center justify-center shadow-md"
                      >
                        <ChildIcon className="w-5 h-5 text-red-600" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-600 text-right">
                    <span className="font-bold text-neutral-900">{t.designedForChildren}</span>
                    <br />
                    {t.intuitiveInterface}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1.5: Livre de la semaine - Inspiré de freechildrenstories.com */}
      {allBooks && allBooks.length > 0 && (
        <section className="bg-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm font-bold mb-4">
                {t.bookOfTheWeek}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
                {allBooks[0]?.title || t.discoverSelection}
              </h2>
              {allBooks[0]?.description && (
                <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                  {allBooks[0].description.length > 200 
                    ? `${allBooks[0].description.substring(0, 200)}...` 
                    : allBooks[0].description}
                </p>
              )}
            </motion.div>

            {allBooks[0] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <Link to={`/book-details/${allBooks[0].id}`}>
                  <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white hover:shadow-3xl transition-all group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 via-pink-500/20 to-orange-500/20 blur-2xl rounded-3xl"></div>
                        <div className="relative bg-white rounded-2xl p-6 shadow-xl">
                          {allBooks[0].cover_image && !imageError ? (
                            <div className="w-full min-h-[400px] flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
                              <img
                                src={getImageUrl(allBooks[0].cover_image)}
                                alt={allBooks[0].title}
                                className="w-full h-auto max-h-[500px] object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                                onError={() => setImageError(true)}
                                onLoad={() => setImageError(false)}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                              <BookIcon className="w-32 h-32 text-red-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2 group-hover:text-red-600 transition-colors">
                            {allBooks[0].title}
                          </h3>
                          {allBooks[0].author && (
                            <p className="text-lg text-neutral-600 mb-4">{t.by} {allBooks[0].author}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {allBooks[0].category_name && (
                            <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm font-semibold">
                              {allBooks[0].category_name}
                            </span>
                          )}
                          {allBooks[0].age_group_min !== undefined && allBooks[0].age_group_max !== undefined && (
                            <span className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-full text-sm font-semibold">
                              {allBooks[0].age_group_min}-{allBooks[0].age_group_max} {t.years}
                            </span>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                        >
                          <BookIcon className="w-6 h-6" />
                          {t.readNow}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Section 1.6: Navigation par âge - Inspiré de freechildrenstories.com */}
      <section className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {t.browseByAge}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.ageDescription}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: t.age3to5, age: '3', desc: t.firstSteps, image: '/enfant3ans.webp' },
              { label: t.age5to8, age: '5', desc: t.shortStories, image: encodeURI('/enfant 5 8ans.webp') },
              { label: t.age8to10, age: '8', desc: t.adventures, image: '/enfant10ans.webp' },
              { label: t.age10plus, age: '10', desc: t.novels, image: '/enfant12.webp' }
            ].map((item, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  setSelectedAge(item.age);
                  document.getElementById('books-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all text-center border-2 border-white/20 relative overflow-hidden group"
              >
                {/* Image de fond avec overlay */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                  <img 
                    src={item.image} 
                    alt={item.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Si l'image n'existe pas, masquer l'image
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="relative z-10">
                  {/* Image principale centrée */}
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-white/30 shadow-lg bg-white/10">
                    <img 
                      src={item.image} 
                      alt={item.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Si l'image n'existe pas, afficher l'icône
                        e.target.style.display = 'none';
                        const icon = e.target.nextElementSibling;
                        if (icon) icon.style.display = 'block';
                      }}
                    />
                    <ChildIcon className="w-full h-full p-4 hidden" style={{ display: 'none' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.label}</h3>
                  <p className="text-sm opacity-90">{item.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Bibliothèque */}
      <section id="books-section" className="bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {t.discoverLibrary}
            </h2>
            <p className="text-lg text-neutral-600">
              {totalBooks} {t.booksAvailable} • {totalCategories} {t.categories}
            </p>
          </motion.div>

        {/* Grille de livres */}
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
            <h2 className="text-3xl font-bold text-neutral-900 mb-3">{t.noBooksFound}</h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">{t.noBooksMatch}</p>
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
                {t.resetFilters}
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
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch w-full"
                : "space-y-3 sm:space-y-4 max-w-4xl mx-auto w-full"
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
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  className="h-full"
                >
                  <Link
                    to={`/book-details/${book.id}`}
                    className="block h-full"
                  >
                    <div className="book-card-enhanced bg-white rounded-2xl overflow-hidden group h-full flex flex-col relative hover:shadow-xl transition-all duration-300 border border-neutral-200">
                      {/* Section colorée en haut */}
                      <div 
                        className="relative px-6 py-8 text-white flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${getCategoryColor(book.category_name, index)} 0%, ${getCategoryColor(book.category_name, index)}dd 100%)`
                        }}
                      >
                        {/* Bouton favori */}
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const wasFavorite = storage.isFavorite(book.id);
                            if (wasFavorite) {
                              storage.removeFavorite(book.id);
                              showToast(t.bookRemovedFromFavorites, 'info', 2000);
                            } else {
                              storage.addFavorite(book.id);
                              showToast(t.bookAddedToFavorites, 'success', 2000);
                            }
                            setFavoritesUpdate(prev => prev + 1);
                          }}
                          className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
                          title={storage.isFavorite(book.id) ? t.removeFromFavorites : t.addToFavorites}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <HeartIcon 
                            className={`w-5 h-5 ${storage.isFavorite(book.id) ? 'text-white' : 'text-white/80'}`}
                            filled={storage.isFavorite(book.id)}
                          />
                        </motion.button>
                        
                        {/* Titre */}
                        <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight pr-12">
                          {book.title}
                        </h3>
                        
                        {/* Genre/Catégorie */}
                        {book.category_name && (
                          <p className="font-bold text-base opacity-95">
                            {book.category_name}
                          </p>
                        )}
                      </div>
                    
                      {/* Section blanche en bas */}
                      <div className="p-6 flex-1 flex flex-col bg-white min-h-[180px]">
                        <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-neutral-600 mb-4">{t.by} {book.author}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                          {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                            <span className="inline-block px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.age_group_min}-{book.age_group_max} {t.years}
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} {book.page_count === 1 ? t.page : t.pages}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
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
                            src={getImageUrl(book.cover_image)}
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
                            <p className="text-base text-neutral-500 mb-3 font-medium">{t.by} {book.author}</p>
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
                              {book.age_group_min}-{book.age_group_max} {t.years}
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} {book.page_count === 1 ? t.page : t.pages}
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
                <p className="text-gray-600">{t.noBooksFound}</p>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        )}
        </div>
      </section>

      {/* Section 2.7: Le saviez-vous ? - Inspiré de freechildrenstories.com */}
      <section className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {t.didYouKnow}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.funFacts}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: HeartIcon,
                title: t.readingDevelopsEmpathy,
                fact: t.empathyFact,
                color: 'from-red-400 to-pink-500'
              },
              {
                icon: ClockIcon,
                title: t.twentyMinutes,
                fact: t.readingFact,
                color: 'from-orange-400 to-amber-500'
              },
              {
                icon: BrainIcon,
                title: t.imaginationInAction,
                fact: t.imaginationFact,
                color: 'from-purple-400 to-indigo-500'
              },
              {
                icon: GraduationIcon,
                title: t.betterConcentration,
                fact: t.concentrationFact,
                color: 'from-blue-400 to-cyan-500'
              },
              {
                icon: LanguageIcon,
                title: t.languageSkills,
                fact: t.languageFact,
                color: 'from-green-400 to-emerald-500'
              },
              {
                icon: StarIcon,
                title: t.stressRelief,
                fact: t.stressFact,
                color: 'from-pink-400 to-rose-500'
              }
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-red-200"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-4 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-700 leading-relaxed text-sm">{item.fact}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: De l'éveil à l'apprentissage */}
      <section className="bg-gradient-to-br from-neutral-50 via-white to-red-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
              {t.fromAwakeningToLearning}
            </h2>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              {t.readingAidDescription}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: AudioIcon,
                title: t.audioVersions,
                desc: t.audioVersionsDesc,
                color: 'from-red-500 to-pink-500',
                bgColor: 'from-red-50 to-pink-50',
                comingSoon: false,
                featureId: 'versions-audio'
              },
              {
                icon: BookIcon,
                title: t.readingAid,
                desc: t.readingAidDesc,
                color: 'from-red-500 to-pink-500',
                bgColor: 'from-red-50 to-pink-50',
                comingSoon: false,
                featureId: 'aide-lecture'
              },
              {
                icon: MicrophoneIcon,
                title: t.recordVoice,
                desc: t.recordVoiceDesc,
                color: 'from-red-500 to-pink-500',
                bgColor: 'from-red-50 to-pink-50',
                comingSoon: true,
                featureId: 'enregistrer-voix'
              }
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative group"
                >
                  <div className={`bg-gradient-to-br ${item.bgColor} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-red-200 h-full flex flex-col`}>
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">{item.title}</h3>
                    <p className="text-sm text-neutral-700 leading-relaxed mb-4 flex-1">{item.desc}</p>
                    {item.comingSoon && (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold mb-4">
                        {t.comingSoon}
                      </span>
                    )}
                    <Link to={`/features/${item.featureId}`}>
                      <motion.button
                        whileHover={{ x: 5 }}
                        className="mt-auto text-red-600 font-semibold flex items-center gap-2 group-hover:text-red-700 transition-colors text-sm"
                      >
                        {t.learnMore}
                        <ChevronRightIcon className="w-4 h-4" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4.7: Ils nous font confiance */}
      <section className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {t.theyTrustUs}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: t.testimonial1,
                author: 'Fanny Joly',
                role: 'Grand-mère et auteure jeunesse',
                icon: UserIcon
              },
              {
                quote: t.testimonial2,
                author: 'Fabienne',
                role: 'Enfant',
                icon: ChildIcon
              },
              {
                quote: t.testimonial3,
                author: 'Enfant',
                role: 'Utilisateur',
                icon: ChildIcon
              }
            ].map((testimonial, i) => {
              const IconComponent = testimonial.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-red-200"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                <p className="text-neutral-700 italic mb-6 leading-relaxed text-base line-clamp-3 min-h-[96px]">
                  « {testimonial.quote} »
                </p>
                  <div className="border-t border-neutral-200 pt-4">
                    <p className="font-bold text-neutral-900 text-base">{testimonial.author}</p>
                    <p className="text-sm text-neutral-600">{testimonial.role}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: LIRE - ÉCOUTER - RACONTER - PARTAGER */}
      <section className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {t.read} • {t.listen} • {t.tell} • {t.share}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              {t.completeExperience}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: BookIcon, title: t.read, desc: t.readDesc },
              { icon: AudioIcon, title: t.listen, desc: t.listenDesc },
              { icon: TheaterIcon, title: t.tell, desc: t.tellDesc },
              { icon: HeartIcon, title: t.share, desc: t.shareDesc }
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center border-2 border-transparent hover:border-red-200"
                >
                  <div className="mb-4 flex justify-center">
                    <IconComponent className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-600">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6.5: Grille de livres (vide - les livres sont maintenant dans la section 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 hidden">
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
            <h2 className="text-3xl font-bold text-neutral-900 mb-3">{t.noBooksFound}</h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">{t.noBooksMatch}</p>
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
                {t.resetFilters}
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
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch"
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
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  className="h-full"
                >
                  <Link
                    to={`/book-details/${book.id}`}
                    className="block h-full"
                  >
                    <div className="book-card-enhanced bg-white rounded-2xl overflow-hidden group h-full flex flex-col relative hover:shadow-xl transition-all duration-300 border border-neutral-200">
                      {/* Section colorée en haut */}
                      <div 
                        className="relative px-6 py-8 text-white flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${getCategoryColor(book.category_name, index)} 0%, ${getCategoryColor(book.category_name, index)}dd 100%)`
                        }}
                      >
                        {/* Bouton favori */}
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const wasFavorite = storage.isFavorite(book.id);
                            if (wasFavorite) {
                              storage.removeFavorite(book.id);
                              showToast(t.bookRemovedFromFavorites, 'info', 2000);
                            } else {
                              storage.addFavorite(book.id);
                              showToast(t.bookAddedToFavorites, 'success', 2000);
                            }
                            setFavoritesUpdate(prev => prev + 1);
                          }}
                          className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
                          title={storage.isFavorite(book.id) ? t.removeFromFavorites : t.addToFavorites}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <HeartIcon 
                            className={`w-5 h-5 ${storage.isFavorite(book.id) ? 'text-white' : 'text-white/80'}`}
                            filled={storage.isFavorite(book.id)}
                          />
                        </motion.button>
                        
                        {/* Titre */}
                        <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight pr-12">
                          {book.title}
                        </h3>
                        
                        {/* Genre/Catégorie */}
                        {book.category_name && (
                          <p className="font-bold text-base opacity-95">
                            {book.category_name}
                          </p>
                        )}
                      </div>
                    
                      {/* Section blanche en bas */}
                      <div className="p-6 flex-1 flex flex-col bg-white min-h-[180px]">
                        <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-neutral-600 mb-4">{t.by} {book.author}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                          {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                            <span className="inline-block px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.age_group_min}-{book.age_group_max} {t.years}
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} {book.page_count === 1 ? t.page : t.pages}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
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
                            src={getImageUrl(book.cover_image)}
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
                            <p className="text-base text-neutral-500 mb-3 font-medium">{t.by} {book.author}</p>
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
                              {book.age_group_min}-{book.age_group_max} {t.years}
                            </span>
                          )}
                          {book.page_count > 0 && (
                            <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg">
                              {book.page_count} {book.page_count === 1 ? t.page : t.pages}
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
                <p className="text-gray-600">{t.noBooksFound}</p>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-900 text-neutral-200 relative overflow-hidden">
        {/* Étoiles animées en arrière-plan du footer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            >
              <StarIcon className="w-5 h-5" />
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-10">
            {/* Brand / short description */}
            <div className="md:w-1/3">
              <div className="flex items-center gap-2 mb-4">
                <Logo size="small" />
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                {t.footerDescription}
              </p>
              
              {/* Réseaux sociaux */}
              <div>
                <p className="text-xs font-semibold text-neutral-300 mb-3 uppercase tracking-wide">
                  {t.followUs}
                </p>
                <div className="flex items-center gap-3">
                  <motion.a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Facebook"
                  >
                    <FacebookIcon className="w-5 h-5 text-white" />
                  </motion.a>
                  <motion.a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Instagram"
                  >
                    <InstagramIcon className="w-5 h-5 text-white" />
                  </motion.a>
                  <motion.a
                    href="https://wa.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-green-500 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  </motion.a>
                  <motion.a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-blue-400 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Twitter"
                  >
                    <TwitterIcon className="w-5 h-5 text-white" />
                  </motion.a>
                  <motion.a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-red-600 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="YouTube"
                  >
                    <YouTubeIcon className="w-5 h-5 text-white" />
                  </motion.a>
                  <motion.a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-blue-700 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="LinkedIn"
                  >
                    <LinkedInIcon className="w-5 h-5 text-white" />
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-semibold text-neutral-100 mb-3 text-xs uppercase tracking-wide">
                  {t.explore}
                </p>
                <ul className="space-y-2 text-neutral-400">
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      {t.home}
                    </Link>
                  </li>
                  <li>
                    <Link to="/favorites" className="hover:text-white transition-colors">
                      {t.favorites}
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="hover:text-white transition-colors">
                      {t.history}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-neutral-100 mb-3 text-xs uppercase tracking-wide">
                  {t.forParents}
                </p>
                <ul className="space-y-2 text-neutral-400">
                  <li>
                    <span className="cursor-default">
                      {t.verifiedContent}
                    </span>
                  </li>
                  <li>
                    <span className="cursor-default">
                      {t.noAds}
                    </span>
                  </li>
                  <li>
                    <span className="cursor-default">
                      {t.offlineModeComing}
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-neutral-100 mb-3 text-xs uppercase tracking-wide">
                  {t.adminSpace}
                </p>
                <ul className="space-y-2 text-neutral-400">
                  <li>
                    <Link to="/admin/login" className="hover:text-white transition-colors">
                      {t.adminAccess}
                    </Link>
                  </li>
                  <li>
                    <span className="cursor-default">
                      {t.bookManagement}
                    </span>
                  </li>
                  <li>
                    <span className="cursor-default">
                      {t.categoriesAges}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-xs text-neutral-500 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <p>
              © {new Date().getFullYear()} HKids. {t.copyright}
            </p>
            <p className="text-[11px] sm:text-xs">
              {t.footerNote}
            </p>
          </div>
      </div>
      </footer>
    </div>
  );
}

export default Home;

