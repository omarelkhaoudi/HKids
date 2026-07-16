import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsThemePill } from '../components/kids/KidsThemePill';
import { KidsCategoryAtmosphere } from '../components/kids/KidsCategoryAtmosphere';
import { HomeIcon, PlayIcon, HeartIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { getKidsContentPath } from '../utils/contentRouting';
import { getMotionProps, kidsPageEnter } from '../constants/kidsMotion';
import { useReducedMotion } from '../hooks/useReducedMotion';

const SHELF_THEME_IDS = ['dinosaurs', 'space', 'animals', 'princesses', 'bedtime', 'ocean', 'vehicles', 'world'];

function inferTheme(book, childThemes) {
  if (book.theme) return book.theme;
  const searchable = [book.title, book.description, book.category_name, book.author].filter(Boolean).join(' ').toLowerCase();
  const matchedTheme = childThemes.find((theme) => theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword)));
  return matchedTheme?.id || null;
}

function withThemeEmoji(books, childThemes) {
  return books.map((book) => {
    const themeId = inferTheme(book, childThemes);
    const theme = childThemes.find((item) => item.id === themeId);
    return { ...book, _themeEmoji: theme?.pictogram, _themeId: themeId };
  });
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
  const reducedMotion = useReducedMotion();
  const childThemes = useMemo(() => [
    { id: 'all', label: t('allCategories'), shortLabel: t('allCategories'), pictogram: '⭐', cue: 'Go', gradient: 'from-primary-400 to-secondary-400', match: [] },
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
    if (themeId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ theme: themeId });
    }
  };

  const favoritesIds = storage.getFavorites();
  const readingHistory = storage.getReadingHistory();
  const taggedBooks = useMemo(() => withThemeEmoji(books, childThemes), [books, childThemes]);

  const continueBooks = useMemo(() => {
    const byId = new Map(taggedBooks.map((book) => [book.id, book]));
    return readingHistory
      .map((entry) => byId.get(entry.bookId))
      .filter(Boolean)
      .slice(0, 12);
  }, [taggedBooks, readingHistory]);

  const favoriteBooks = taggedBooks.filter((b) => favoritesIds.includes(b.id));
  const newBooks = [...taggedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);

  const recommendedSection = recommendationSections.find((section) => section.id === 'recommended_for_you');
  const recommendedIds = new Set(
    (recommendedSection?.items || []).map((item) => Number(item.id ?? item.book_id)).filter(Number.isFinite)
  );
  const todayBooks = recommendedIds.size > 0
    ? taggedBooks.filter((book) => recommendedIds.has(Number(book.id)))
    : taggedBooks.slice(0, 10);

  const themeShelves = useMemo(() => (
    SHELF_THEME_IDS
      .map((themeId) => {
        const theme = childThemes.find((item) => item.id === themeId);
        if (!theme) return null;
        const shelfBooks = taggedBooks.filter((book) => book._themeId === themeId).slice(0, 15);
        if (!shelfBooks.length) return null;
        return { theme, books: shelfBooks };
      })
      .filter(Boolean)
  ), [childThemes, taggedBooks]);

  const themeBooks = taggedBooks.filter((b) => b._themeId === selectedTheme);
  const featuredBook = selectedTheme === 'all' ? (continueBooks[0] || todayBooks[0]) : (themeBooks[0] || null);
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
    navigate(getKidsContentPath(book));
  };

  const carouselProps = {
    isRtl,
    favorites: favoritesIds,
    offlineContent,
    onPlay: handlePlayBook,
    onFavorite: toggleFavorite,
    onDownload: handleDownloadBook,
    showActions: true,
    hideTitle: true,
    modality: 'books',
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="books" className="pb-32 kids-glow-books" footer={<KidsBottomNav />}>
      {selectedTheme !== 'all' && <KidsCategoryAtmosphere categoryId={selectedTheme} />}

      <header className="relative z-10 px-6 py-4 flex items-center justify-between kids-premium-panel mx-4 sm:mx-6 mt-2 sticky top-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/kids')}
            className="kids-touch-target grid h-14 w-14 place-items-center rounded-full bg-white dark:bg-surface-800 text-primary-500 shadow-md transition hover:scale-105 border-2 border-primary-100"
            aria-label={t('home')}
          >
            <HomeIcon className="h-7 w-7" />
          </button>
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
        </div>
        <span className="text-4xl" aria-hidden="true">{selectedTheme === 'all' ? '📚' : (activeThemeData?.pictogram || '📚')}</span>
      </header>

      <main className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Visual theme explorer — no search bar */}
        <section className="mb-2" aria-label={t('allCategories')}>
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
            key={`hero-${selectedTheme}-${featuredBook.id}`}
            {...getMotionProps(reducedMotion, kidsPageEnter)}
            className="relative overflow-hidden rounded-[2.75rem] kids-premium-panel p-5 md:p-8 text-white shadow-kids-soft border-4 border-white/50"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${activeThemeData?.gradient || 'from-primary-500 to-secondary-500'} opacity-95`} />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[12rem] opacity-20 pointer-events-none" aria-hidden="true">
              {activeThemeData?.pictogram || '⭐'}
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <motion.button
                type="button"
                whileHover={reducedMotion ? undefined : { scale: 1.05, y: -6 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className="w-44 md:w-56 shrink-0 relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.45)] border-4 border-white kids-book-object"
                onClick={() => handlePlayBook(featuredBook)}
                aria-label={featuredBook.title}
              >
                <img
                  src={getImageUrl(featuredBook.cover_image, 'book')}
                  alt=""
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <span className="kids-touch-target grid h-16 w-16 place-items-center rounded-full bg-white/40 border-4 border-white/60">
                    <PlayIcon className={`h-8 w-8 text-white ${isRtl ? 'rotate-180' : ''}`} filled />
                  </span>
                </div>
              </motion.button>

              <div className="flex flex-col items-center md:items-start gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 px-5 py-2 text-sm font-black shadow-xl">
                  <StarIcon className="h-5 w-5 text-accent-300" filled />
                  <span className="line-clamp-1">{selectedTheme === 'all' ? t('forYou') : (activeThemeData?.shortLabel || activeThemeData?.label)}</span>
                </span>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayBook(featuredBook)}
                    className="kids-touch-target flex items-center gap-3 rounded-full bg-white px-8 py-4 text-xl font-black text-primary-600 shadow-xl"
                    aria-label={t('listenAction')}
                  >
                    <PlayIcon className={`h-8 w-8 ${isRtl ? 'rotate-180' : ''}`} filled />
                    <span className="hidden sm:inline">{t('listenAction')}</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleFavorite(featuredBook.id)}
                    className="kids-touch-target rounded-full bg-white/25 backdrop-blur-md p-4 text-white shadow-xl border-2 border-white/35"
                    aria-label={t('yourFavorites')}
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
            <BookGridSkeleton count={8} variant="carousel" />
          </div>
        ) : books.length === 0 ? (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => handleThemeChange('all')}
          />
        ) : selectedTheme !== 'all' ? (
          themeBooks.length === 0 ? (
            <KidsEmptyState
              emoji={activeThemeData?.pictogram || '🔍'}
              title={t('nothingFound')}
              description={t('tryAnotherWord')}
              actionLabel={t('allCategories')}
              onAction={() => handleThemeChange('all')}
            />
          ) : (
            <div className="kids-shelf-rail">
              <KidsBookCarousel
                title={activeThemeData?.shortLabel || activeThemeData?.label}
                emoji={activeThemeData?.pictogram}
                books={themeBooks}
                {...carouselProps}
              />
            </div>
          )
        ) : (
          <div className="space-y-12">
            {continueBooks.length > 0 && (
              <div className="kids-shelf-rail">
                <KidsBookCarousel title={t('continueReading')} emoji="⭐" books={continueBooks} {...carouselProps} />
              </div>
            )}
            {favoriteBooks.length > 0 && (
              <div className="kids-shelf-rail">
                <KidsBookCarousel title={t('yourFavorites')} emoji="❤️" books={favoriteBooks} {...carouselProps} modality="favorites" />
              </div>
            )}
            {newBooks.length > 0 && (
              <div className="kids-shelf-rail">
                <KidsBookCarousel title={t('newBooks')} emoji="🆕" books={newBooks} {...carouselProps} />
              </div>
            )}
            {todayBooks.length > 0 && (
              <div className="kids-shelf-rail">
                <KidsBookCarousel title={t('kidsStoriesToday')} emoji="📖" books={todayBooks} {...carouselProps} />
              </div>
            )}
            {themeShelves.map(({ theme, books: shelfBooks }) => (
              <div key={theme.id} className="kids-shelf-rail">
                <KidsBookCarousel
                  title={theme.shortLabel || theme.label}
                  emoji={theme.pictogram}
                  books={shelfBooks}
                  {...carouselProps}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <VoiceAssistant language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'} onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsLibrary;
