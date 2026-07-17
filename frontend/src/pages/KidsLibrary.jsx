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
import { KidsHeroStoryCard } from '../components/kids/KidsHeroStoryCard';
import { HomeIcon, HeartIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsAmbientSound } from '../components/kids/KidsAmbientSound';
import { SearchBar } from '../components/ui';
import { getKidsContentPath } from '../utils/contentRouting';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const visibleBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return taggedBooks;
    return taggedBooks.filter((book) => {
      const hay = [book.title, book.description, book.author, book.category_name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [taggedBooks, searchQuery]);

  const continueBooks = useMemo(() => {
    const byId = new Map(visibleBooks.map((book) => [book.id, book]));
    return readingHistory
      .map((entry) => byId.get(entry.bookId))
      .filter(Boolean)
      .slice(0, 12);
  }, [visibleBooks, readingHistory]);

  const favoriteBooks = visibleBooks.filter((b) => favoritesIds.includes(b.id));
  const newBooks = [...visibleBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);

  const recommendedSection = recommendationSections.find((section) => section.id === 'recommended_for_you');
  const recommendedIds = new Set(
    (recommendedSection?.items || []).map((item) => Number(item.id ?? item.book_id)).filter(Number.isFinite)
  );
  const todayBooks = recommendedIds.size > 0
    ? visibleBooks.filter((book) => recommendedIds.has(Number(book.id)))
    : visibleBooks.slice(0, 10);

  const themeShelves = useMemo(() => (
    SHELF_THEME_IDS
      .map((themeId) => {
        const theme = childThemes.find((item) => item.id === themeId);
        if (!theme) return null;
        const shelfBooks = visibleBooks.filter((book) => book._themeId === themeId).slice(0, 15);
        if (!shelfBooks.length) return null;
        return { theme, books: shelfBooks };
      })
      .filter(Boolean)
  ), [childThemes, visibleBooks]);

  const themeBooks = visibleBooks.filter((b) => b._themeId === selectedTheme);
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

  const handleListenBook = (book) => {
    if (book?.id) {
      navigate(`/kids/listen/${book.id}`);
      return;
    }
    navigate('/kids/audio');
  };

  const featuredHeroBook = featuredBook ? {
    ...featuredBook,
    progress: readingHistory.find((h) => h.bookId === featuredBook.id)
      ? Math.round((storage.getLastPage(featuredBook.id) / (featuredBook.page_count || 1)) * 100)
      : 0,
    isInProgress: readingHistory.some((h) => h.bookId === featuredBook.id && h.page > 0),
  } : null;

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
    <KidsPageShell isRtl={isRtl} variant="library" world="books" className={`pb-space-32 kids-glow-books ${selectedTheme === 'bedtime' ? 'kids-night-calm' : ''}`} footer={<KidsBottomNav />}>
      {selectedTheme !== 'all' && <KidsCategoryAtmosphere categoryId={selectedTheme} />}

      <header className="relative z-10 kids-premium-panel mx-space-16 sm:mx-space-24 mt-space-8 sticky top-space-8 px-space-16 sm:px-space-24 py-space-12 flex items-center justify-between gap-space-16">
        <div className="flex items-center gap-space-16">
          <button
            type="button"
            onClick={() => navigate('/kids')}
            className="kids-icon-action"
            aria-label={t('home')}
          >
            <HomeIcon />
          </button>
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
          <h1 className="text-heading-m hidden sm:block truncate">
            {selectedTheme === 'all' ? t('library') : (activeThemeData?.shortLabel || activeThemeData?.label)}
          </h1>
        </div>
        <span className="text-4xl" aria-hidden="true">{selectedTheme === 'all' ? '📚' : (activeThemeData?.pictogram || '📚')}</span>
      </header>

      <main className="kids-main kids-main-tablet-wide relative z-20">
        <KidsTrustBadges t={t} compact className="opacity-90" />

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('tryAnotherWord') || 'Search…'}
          aria-label={t('library')}
        />

        {selectedTheme === 'bedtime' && (
          <KidsAmbientSound
            enabled
            preset="night"
            compact
            labels={{
              bedtimeSoundRain: t('bedtimeSoundRain'),
              bedtimeSoundForest: t('bedtimeSoundForest'),
              bedtimeSoundOcean: t('bedtimeSoundOcean'),
              bedtimeSoundNight: t('bedtimeSoundNight'),
              bedtimeSoundWind: t('bedtimeSoundWind'),
            }}
          />
        )}

        <section aria-label={t('allCategories')}>
          <div className="flex gap-space-16 overflow-x-auto pb-space-16 pt-space-8 px-space-8 snap-x snap-mandatory custom-scrollbar kids-scroll-smooth">
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

        {featuredHeroBook && (
          <KidsHeroStoryCard
            book={featuredHeroBook}
            isRtl={isRtl}
            t={t}
            onRead={handlePlayBook}
            onListen={handleListenBook}
            badgeLabel={selectedTheme === 'all' ? t('kidsStoriesToday') : (activeThemeData?.shortLabel || activeThemeData?.label)}
            onEmptyAction={() => handleThemeChange('all')}
          />
        )}

        <KidsFamilyMessages />

        {loading ? (
          <div className="px-space-4">
            <BookGridSkeleton count={8} variant="carousel" />
          </div>
        ) : books.length === 0 ? (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => handleThemeChange('all')}
            showMascot
          />
        ) : selectedTheme !== 'all' ? (
          themeBooks.length === 0 ? (
            <KidsEmptyState
              emoji={activeThemeData?.pictogram || '🔍'}
              title={t('nothingFound')}
              description={t('tryAnotherWord')}
              actionLabel={t('allCategories')}
              onAction={() => handleThemeChange('all')}
              showMascot
              mascotMood="encourage"
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
          <div className="space-y-space-12">
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
