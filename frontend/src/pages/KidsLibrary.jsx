import { useEffect, useMemo, useState } from 'react';
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
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsMediaCard } from '../components/kids/KidsMediaCard';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsThemePill } from '../components/kids/KidsThemePill';
import {
  BookIcon, DownloadIcon, HeartIcon, PlayIcon,
  SparklesIcon, HomeIcon, StarIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';

function inferTheme(book, childThemes) {
  if (book.theme) return book.theme;
  const searchable = [book.title, book.description, book.category_name, book.author].filter(Boolean).join(' ').toLowerCase();
  const matchedTheme = childThemes.find((theme) => theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword)));
  return matchedTheme?.id || 'all';
}

function getRecommendationContext() {
  return {
    favorites: storage.getFavorites(),
    readingHistory: storage.getReadingHistory(),
    listeningHistory: storage.getListeningHistory(),
    readingStats: storage.getReadingStats(),
  };
}

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

  const favoritesIds = storage.getFavorites();
  const localizedBooks = books.filter((book) => !book.language || book.language === language);
  const favoriteBooks = localizedBooks.filter((b) => favoritesIds.includes(b.id));
  const newBooks = [...localizedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);
  const downloadedBooks = localizedBooks.filter((b) => offlineContent.getBookStatus(b.id)?.status === 'downloaded');
  const recommendedSection = recommendationSections.find((section) => section.id === 'recommended_for_you');
  const recommendedIds = new Set(
    (recommendedSection?.items || []).map((item) => Number(item.id ?? item.book_id)).filter(Number.isFinite)
  );
  const recommendedBooks = recommendedIds.size > 0
    ? localizedBooks.filter((book) => recommendedIds.has(Number(book.id)))
    : localizedBooks.slice(0, 10);

  const themeBooks = localizedBooks.filter((b) => inferTheme(b, childThemes) === selectedTheme);
  const featuredBook = selectedTheme === 'all' ? recommendedBooks[0] : (themeBooks.length > 0 ? themeBooks[0] : null);
  const activeThemeData = childThemes.find((theme) => theme.id === selectedTheme);

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

  const carouselProps = {
    isRtl,
    favorites: favoritesIds,
    offlineContent,
    onPlay: handlePlayBook,
    onFavorite: toggleFavorite,
    onDownload: handleDownloadBook,
    showActions: true,
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" className="pb-32" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-white/60 dark:bg-surface-900/60 backdrop-blur-md border-b border-white/60 dark:border-white/10 shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/kids')}
            className="grid h-12 w-12 place-items-center rounded-full bg-white dark:bg-surface-800 text-primary-500 shadow-md transition hover:scale-105 border-2 border-primary-100"
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
        <section className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 snap-x snap-mandatory custom-scrollbar">
            {childThemes.map((theme) => (
              <KidsThemePill
                key={theme.id}
                theme={theme}
                isActive={selectedTheme === theme.id}
                onClick={() => handleThemeChange(theme.id)}
              />
            ))}
          </div>
        </section>

        {featuredBook && (
          <motion.section
            key={selectedTheme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-[3rem] bg-gradient-to-br ${activeThemeData?.gradient || 'from-primary-500 to-purple-600'} p-8 md:p-16 text-white shadow-2xl border-8 border-white/30 mb-12`}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[15rem] opacity-20 pointer-events-none filter blur-sm transform rotate-12">
              {activeThemeData?.pictogram}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
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
              </motion.div>

              <div className={`flex-1 text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 px-5 py-2 text-sm font-black mb-6 shadow-xl text-white">
                  <StarIcon className="h-5 w-5 text-yellow-300" filled />
                  <span>{t('featured')} {activeThemeData?.label}</span>
                </div>
                <h1 className="text-3xl md:text-6xl font-black leading-tight mb-4 filter drop-shadow-lg text-white hidden lg:block">
                  {featuredBook.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayBook(featuredBook)}
                    className="flex items-center gap-4 rounded-full bg-white px-10 py-5 text-2xl font-black text-primary-600 shadow-xl hover:shadow-2xl transition"
                  >
                    <PlayIcon className={`h-8 w-8 ${isRtl ? 'rotate-180' : ''}`} filled />
                    {t('listenAction')}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
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

        <KidsFamilyMessages />

        {loading ? (
          <div className="px-4">
            <BookGridSkeleton count={8} />
          </div>
        ) : localizedBooks.length === 0 ? (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => handleThemeChange('all')}
          />
        ) : selectedTheme !== 'all' ? (
          <section className="mb-12">
            {themeBooks.length === 0 ? (
              <KidsEmptyState
                emoji="🔍"
                title={t('nothingFound')}
                description={t('tryAnotherWord')}
                actionLabel={t('allCategories')}
                onAction={() => handleThemeChange('all')}
              />
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
              <AnimatePresence>
                {themeBooks.map((book) => (
                  <KidsMediaCard
                    key={book.id}
                    book={book}
                    variant="poster"
                    hideTitle
                    isFavorite={favoritesIds.includes(book.id)}
                    offlineReady={offlineContent.getBookStatus(book.id)?.status === 'downloaded'}
                    showActions
                    onPlay={handlePlayBook}
                    onFavorite={toggleFavorite}
                    onDownload={handleDownloadBook}
                    isRtl={isRtl}
                  />
                ))}
              </AnimatePresence>
            </div>
            )}
          </section>
        ) : (
          <div className="space-y-16">
            <KidsBookCarousel title={t('forYou')} icon={SparklesIcon} books={recommendedBooks} hideTitle {...carouselProps} />
            <KidsBookCarousel title={t('newBooks')} icon={BookIcon} books={newBooks} hideTitle {...carouselProps} />
            {favoriteBooks.length > 0 && (
              <KidsBookCarousel title={t('yourFavorites')} icon={HeartIcon} books={favoriteBooks} hideTitle {...carouselProps} />
            )}
            {downloadedBooks.length > 0 && (
              <KidsBookCarousel title={t('offline')} icon={DownloadIcon} books={downloadedBooks} hideTitle {...carouselProps} />
            )}
          </div>
        )}
      </main>

      <VoiceAssistant language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'} onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsLibrary;
