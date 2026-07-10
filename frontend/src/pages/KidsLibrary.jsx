import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { recommendationsAPI } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories } from '../constants/kidCategories';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads } from '../services/offline/offlineContentService';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import {
  BookIcon, DownloadIcon, HeartIcon, PlayIcon,
  SparklesIcon, ChevronLeftIcon, ChevronRightIcon,
  ClockIcon, ShieldIcon, HomeIcon, StarIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';

// --- THEMES & CONSTANTS ---
function inferTheme(book, childThemes) {
  if (book.theme) return book.theme;
  const searchable = [book.title, book.description, book.category_name, book.author].filter(Boolean).join(' ').toLowerCase();
  const matchedTheme = childThemes.find((theme) => theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword)));
  return matchedTheme?.id || 'all';
}

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function getRecommendationContext() {
  return {
    favorites: storage.getFavorites(),
    readingHistory: storage.getReadingHistory(),
    listeningHistory: storage.getListeningHistory(),
    readingStats: storage.getReadingStats(),
  };
}

// --- PREMIUM COMPONENTS FOR KIDS ---
const CinematicCard = ({ book, isFavorite, offlineReady, onPlay, onFavorite, onDownload, isRtl = false, hideTitle = true }) => {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative h-80 w-56 md:h-96 md:w-64 shrink-0 cursor-pointer overflow-hidden rounded-[2rem] bg-surface-secondary shadow-lg transition-shadow hover:shadow-2xl border-4 border-white/20"
      onClick={() => onPlay(book)}
      aria-label={book.title}
    >
      {/* Cover Image */}
      <img
        src={getImageUrl(book.cover_image, 'book')}
        alt={book.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Heavy Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

      {/* Top Badges (Discreet for parents, visible for kids) */}
      <div className="absolute left-3 top-3 right-3 flex flex-wrap gap-2">
        {book.is_premium && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-black text-white shadow-md border-2 border-white/50">
            <SparklesIcon className="h-4 w-4" /> PRO
          </span>
        )}
      </div>

      {/* Big Action Buttons (Favorite / Download) */}
      <div className="absolute right-3 top-3 flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onFavorite(book.id); }}
          className="rounded-full bg-white/20 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/30 hover:bg-rose-500 hover:border-rose-400 transition-colors"
        >
          <HeartIcon className="h-6 w-6" filled={isFavorite} />
        </motion.button>
        {!offlineReady && (
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDownload(book); }}
            className="rounded-full bg-white/20 backdrop-blur-md p-3 text-white shadow-xl border-2 border-white/30 hover:bg-emerald-500 hover:border-emerald-400 transition-colors"
          >
            <DownloadIcon className="h-6 w-6" />
          </motion.button>
        )}
        {offlineReady && (
          <div className="rounded-full bg-emerald-500 p-3 text-white shadow-xl border-2 border-emerald-400">
            <DownloadIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* GIANT PLAY BUTTON (Always mostly visible, expands on hover) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white shadow-[0_0_30px_rgba(255,255,255,0.3)] border-4 border-white/50 group-hover:scale-110 group-hover:bg-primary-500 group-hover:border-primary-400 transition-all duration-300 pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); onPlay(book); }}
        >
          <PlayIcon className={`h-10 w-10 drop-shadow-md ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} filled />
        </motion.div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-300">
        {!hideTitle && (
          <h3 className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow-lg mb-2">
            {book.title}
          </h3>
        )}
        <div className="flex items-center gap-4 text-sm font-black text-white/90">
          {book.duration_seconds > 0 && (
            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
              <ClockIcon className="h-4 w-4 text-amber-400" />
              {formatDuration(book.duration_seconds)}
            </span>
          )}
          {book.age_level && (
            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
              <ShieldIcon className="h-4 w-4 text-green-400" />
              {book.age_level}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SectionCarousel = ({ title, icon: Icon, books, onPlay, favorites, offlineContent, onFavorite, onDownload, isRtl = false }) => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const visualDirection = isRtl ? (direction === 'left' ? 'right' : 'left') : direction;
      const scrollAmount = visualDirection === 'left' ? -600 : 600;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="mb-12 relative group">
      <div className="mb-6 flex items-center justify-between px-4 md:px-8">
        <h2 className="flex items-center gap-3 text-3xl font-black text-foreground drop-shadow-sm">
          {Icon && <Icon className="h-8 w-8 text-primary-500" />}
          {title}
        </h2>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => scroll('left')} className="p-3 rounded-full bg-white shadow-md border-2 border-border hover:bg-surface-100 hover:scale-110 transition-transform text-primary-500">
            <ChevronLeftIcon className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => scroll('right')} className="p-3 rounded-full bg-white shadow-md border-2 border-border hover:bg-surface-100 hover:scale-110 transition-transform text-primary-500">
            <ChevronRightIcon className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto px-4 md:px-8 pb-8 pt-2 snap-x snap-mandatory custom-scrollbar"
      >
        {books.map((book) => {
          const isFavorite = favorites.includes(book.id);
          const offlineReady = offlineContent.getBookStatus(book.id)?.status === 'downloaded';
          return (
            <div key={book.id} className="snap-start shrink-0">
              <CinematicCard 
                book={book} 
                isFavorite={isFavorite} 
                offlineReady={offlineReady} 
                onPlay={onPlay}
                onFavorite={onFavorite}
                onDownload={onDownload}
                isRtl={isRtl}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

// --- MAIN COMPONENT ---
function KidsLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const childThemes = useMemo(() => [
    { id: 'all', label: t('allCategories'), shortLabel: t('allCategories'), pictogram: '⭐', cue: 'Go', gradient: 'from-sky-400 to-emerald-400', match: [] },
    ...localizeKidCategories(language),
  ], [language, t]);
  
  const [books, setBooks] = useState([]);
  
  const urlTheme = searchParams.get('theme') || 'all';
  const [selectedTheme, setSelectedTheme] = useState(urlTheme);
  
  const [loading, setLoading] = useState(true);
  const [recommendationSections, setRecommendationSections] = useState([]);
  
  const offlineContent = useOfflineContent();

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }
    loadData();
  }, [user, navigate, language]);

  useEffect(() => {
    const currentTheme = searchParams.get('theme') || 'all';
    setSelectedTheme(currentTheme);
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, recommendationsRes] = await Promise.all([
        booksAPI.getPublishedBooks({ language }),
        recommendationsAPI.getForKid({ ...getRecommendationContext(), language }).catch((error) => {
          const message = getRestrictionMessage(error);
          if (message) showToast(message, 'info');
          return { data: { sections: [] } };
        }),
      ]);
      setBooks(booksRes.data || []);
      setRecommendationSections(recommendationsRes.data?.sections || []);
    } catch (error) {
      if (!navigator.onLine) {
        const downloads = await getDownloads();
        const offlineBooks = downloads
          .filter((item) => item.type === 'book' && item.status === 'downloaded')
          .map((item) => item.payload);
        setBooks(offlineBooks);
        setRecommendationSections([]);
        showToast(t('offlineMode'), 'info');
      } else {
        showToast(getRestrictionMessage(error, t('loadError')), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    setSearchParams({ theme: themeId });
  };

  // Sections data
  const favoritesIds = storage.getFavorites();
  const localizedBooks = books.filter((book) => !book.language || book.language === language);
  const favoriteBooks = localizedBooks.filter(b => favoritesIds.includes(b.id));
  const newBooks = [...localizedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);
  const downloadedBooks = localizedBooks.filter(b => offlineContent.getBookStatus(b.id)?.status === 'downloaded');
  const recommendedSection = recommendationSections.find((section) => section.id === 'recommended_for_you');
  const recommendedIds = new Set(
    (recommendedSection?.items || []).map((item) => Number(item.id ?? item.book_id)).filter(Number.isFinite)
  );
  const recommendedBooks = recommendedIds.size > 0
    ? localizedBooks.filter((book) => recommendedIds.has(Number(book.id)))
    : localizedBooks.slice(0, 10);
  
  // Featured book is either the first of the selected theme, or a general recommendation
  const themeBooks = localizedBooks.filter(b => inferTheme(b, childThemes) === selectedTheme);
  const featuredBook = selectedTheme === 'all' ? recommendedBooks[0] : (themeBooks.length > 0 ? themeBooks[0] : null);

  const activeThemeData = childThemes.find(t => t.id === selectedTheme);

  const toggleFavorite = (bookId) => {
    if (storage.isFavorite(bookId)) {
      storage.removeFavorite(bookId);
      showToast(t('removedFromFavorites'), 'info');
    } else {
      storage.addFavorite(bookId);
      showToast(t('addedToFavorites'), 'success');
    }
    setBooks((current) => [...current]);
  };

  const handleDownloadBook = async (book) => {
    try {
      await offlineContent.downloadBookContent(book);
      storage.markDownloaded(book.id);
      showToast(t('downloaded'), 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(getRestrictionMessage(error, t('downloadError')), 'error');
      }
    }
  };

  const handlePlayBook = (book) => {
    navigate(`/kids/read/${book.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-foreground pb-24 lg:pb-0 overflow-x-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* MAGICAL BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{x: [0, 30, 0], y: [0, -20, 0]}} transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-10 right-10 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
        <motion.div animate={{x: [0, -30, 0], y: [0, 30, 0]}} transition={{duration: 15, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-40 left-20 w-[30rem] h-[30rem] bg-sky-200/40 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/kids')}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-primary-500 shadow-md transition hover:scale-105 border-2 border-primary-100"
            aria-label={t('home')}
          >
            <HomeIcon className="h-6 w-6" />
          </button>
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
        </div>
      </header>

      <main className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* HORIZONTAL THEME NAVIGATOR (Disney+ Style) */}
        <section className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 snap-x snap-mandatory custom-scrollbar">
            {childThemes.map((theme) => {
              const isActive = selectedTheme === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`snap-start shrink-0 flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-4 rounded-[2rem] font-black text-lg shadow-lg border-4 transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${theme.gradient} text-white border-white/50 scale-105 shadow-xl` 
                      : 'bg-white text-foreground-600 border-transparent hover:bg-surface-50 hover:text-primary-500'
                  }`}
                  aria-label={theme.shortLabel || theme.label}
                >
                  <span className="text-4xl md:text-3xl filter drop-shadow-sm">{theme.pictogram}</span>
                  <span className="hidden md:inline">{theme.shortLabel || theme.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* IMMERSIVE HERO SECTION */}
        {featuredBook && (
          <motion.section 
            key={selectedTheme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-[3rem] bg-gradient-to-br ${activeThemeData?.gradient || 'from-primary-500 to-purple-600'} p-8 md:p-16 text-white shadow-2xl border-8 border-white/30 mb-12`}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[15rem] opacity-20 pointer-events-none filter blur-sm transform rotate-12">
              {activeThemeData?.pictogram}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              {/* Featured Book Cover */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="w-48 md:w-64 shrink-0 relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white cursor-pointer"
                onClick={() => handlePlayBook(featuredBook)}
              >
                <img 
                  src={getImageUrl(featuredBook.cover_image, 'book')} 
                  alt={featuredBook.title} 
                  className="w-full h-auto object-cover" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </motion.div>

              {/* Info & CTA */}
              <div className={`flex-1 text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 px-5 py-2 text-sm font-black mb-6 shadow-xl text-white">
                  <StarIcon className="h-5 w-5 text-yellow-300" filled />
                  <span>{t('featured')} {activeThemeData?.label}</span>
                </div>
                <h1 className="text-3xl md:text-6xl font-black leading-tight mb-4 filter drop-shadow-lg text-white hidden md:block">
                  {featuredBook.title}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayBook(featuredBook)}
                    className="flex items-center gap-4 rounded-full bg-white px-10 py-5 text-2xl font-black text-primary-600 shadow-xl hover:shadow-2xl transition"
                  >
                    <PlayIcon className={`h-8 w-8 ${isRtl ? 'rotate-180' : ''}`} filled />
                    {t('listenAction')}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(featuredBook.id)}
                    className="rounded-full bg-white/20 backdrop-blur-md p-5 text-white shadow-xl border-2 border-white/30 hover:bg-rose-500 transition-colors"
                  >
                    <HeartIcon className="h-8 w-8" filled={favoritesIds.includes(featuredBook.id)} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="px-4">
            <BookGridSkeleton count={8} />
          </div>
        ) : selectedTheme !== 'all' ? (
          /* THEME SPECIFIC GRID */
          <section className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <AnimatePresence>
                {themeBooks.map(book => (
                  <CinematicCard 
                    key={book.id} 
                    book={book} 
                    isFavorite={favoritesIds.includes(book.id)} 
                    offlineReady={offlineContent.getBookStatus(book.id)?.status === 'downloaded'} 
                    onPlay={handlePlayBook}
                    onFavorite={toggleFavorite}
                    onDownload={handleDownloadBook}
                    isRtl={isRtl}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        ) : (
          /* GENERAL HOME CAROUSELS */
          <div className="space-y-16">
            <SectionCarousel 
              title={t('forYou')}
              icon={SparklesIcon} 
              books={recommendedBooks} 
              onPlay={handlePlayBook} 
              favorites={favoritesIds} 
              offlineContent={offlineContent} 
              onFavorite={toggleFavorite} 
              onDownload={handleDownloadBook} 
              isRtl={isRtl}
            />
            
            <SectionCarousel 
              title={t('newBooks')}
              icon={BookIcon} 
              books={newBooks} 
              onPlay={handlePlayBook} 
              favorites={favoritesIds} 
              offlineContent={offlineContent} 
              onFavorite={toggleFavorite} 
              onDownload={handleDownloadBook} 
              isRtl={isRtl}
            />
            
            {favoriteBooks.length > 0 && (
              <SectionCarousel 
                title={t('yourFavorites')}
                icon={HeartIcon} 
                books={favoriteBooks} 
                onPlay={handlePlayBook} 
                favorites={favoritesIds} 
                offlineContent={offlineContent} 
                onFavorite={toggleFavorite} 
                onDownload={handleDownloadBook} 
                isRtl={isRtl}
              />
            )}
            
            {downloadedBooks.length > 0 && (
              <SectionCarousel 
                title={t('offline')}
                icon={DownloadIcon} 
                books={downloadedBooks} 
                onPlay={handlePlayBook} 
                favorites={favoritesIds} 
                offlineContent={offlineContent} 
                onFavorite={toggleFavorite} 
                onDownload={handleDownloadBook} 
                isRtl={isRtl}
              />
            )}
          </div>
        )}

      </main>
      
      {/* The book audio player is mounted inside BookReader after navigation. */}
      <VoiceAssistant language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'} />
    </div>
  );
}

export default KidsLibrary;
