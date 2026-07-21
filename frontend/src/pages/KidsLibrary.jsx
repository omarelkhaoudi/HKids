import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { recommendationsAPI } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
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
import { KidsContinueRail } from '../components/kids/KidsContinueRail';
import { ChevronLeftIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsAmbientSound } from '../components/kids/KidsAmbientSound';
import { SearchBar } from '../components/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsPageEnter } from '../constants/kidsMotion';
import { getKidsContentPath } from '../utils/contentRouting';
import {
  annotateBooksWithReasons,
  filterSeasonalBooks,
  isShortStory,
  withDiscoveryReason,
} from '../utils/discoveryRails';

const SHELF_THEME_IDS = ['animals', 'bedtime', 'princesses', 'ocean', 'dinosaurs', 'space', 'vehicles', 'world'];
const RECENT_SEARCHES_KEY = 'hkids_recent_library_searches';

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
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      return Array.isArray(stored) ? stored.slice(0, 6) : [];
    } catch {
      return [];
    }
  });
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

  const saveRecentSearch = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return;
    setRecentSearches((current) => {
      const next = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 6);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
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
      .map((entry) => {
        const book = byId.get(entry.bookId);
        if (!book) return null;
        const lastPage = Number(entry.page ?? storage.getLastPage(book.id) ?? 0);
        const total = Number(book.page_count || 0);
        const progress = total > 0 ? Math.min(100, Math.round((lastPage / total) * 100)) : 0;
        return {
          ...book,
          kid_progress_percent: progress,
          progress,
          current_page: lastPage,
        };
      })
      .filter(Boolean)
      .filter((book) => Number(book.kid_progress_percent || 0) > 0 && Number(book.kid_progress_percent || 0) < 100)
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

  const popularBooks = useMemo(
    () => visibleBooks
      .filter((book) => book.is_popular === true || book.is_popular === 1 || book.is_recommended === true || book.is_recommended === 1)
      .slice(0, 15),
    [visibleBooks],
  );

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
      : Number(featuredBook.kid_progress_percent || featuredBook.progress || 0),
    isInProgress: readingHistory.some((h) => h.bookId === featuredBook.id && h.page > 0)
      || (Number(featuredBook.kid_progress_percent || 0) > 0 && Number(featuredBook.kid_progress_percent || 0) < 100),
  } : null;

  const carouselProps = {
    isRtl,
    favorites: favoritesIds,
    offlineContent,
    onPlay: handlePlayBook,
    onFavorite: toggleFavorite,
    onDownload: handleDownloadBook,
    showActions: true,
    hideTitle: false,
    modality: 'books',
    seeAllLabel: t('seeAll'),
  };

  const todayAnnotated = useMemo(
    () => todayBooks.map((book) => {
      if (isShortStory(book)) return withDiscoveryReason(book, t('discoverReasonShort'));
      return withDiscoveryReason(book, t('forYou'));
    }),
    [todayBooks, t],
  );
  const newAnnotated = useMemo(
    () => annotateBooksWithReasons(newBooks, t('discoverReasonNew')),
    [newBooks, t],
  );
  const favoriteAnnotated = useMemo(
    () => annotateBooksWithReasons(favoriteBooks, t('discoverReasonLoved')),
    [favoriteBooks, t],
  );
  const popularAnnotated = useMemo(
    () => annotateBooksWithReasons(popularBooks, t('forYou')),
    [popularBooks, t],
  );
  const seasonalAnnotated = useMemo(
    () => annotateBooksWithReasons(filterSeasonalBooks(visibleBooks), t('discoverSeasonal')),
    [visibleBooks, t],
  );
  const downloadedBooks = useMemo(
    () => visibleBooks.filter((book) => {
      const status = offlineContent.getBookStatus(book.id);
      return status?.status === 'downloaded' || storage.isDownloaded(book.id);
    }).slice(0, 10),
    [visibleBooks, offlineContent],
  );
  const downloadingCount = useMemo(
    () => Object.values(offlineContent.progressById || {}).filter((value) => Number(value) > 0 && Number(value) < 100).length,
    [offlineContent.progressById],
  );
  const noSearchResults = searchQuery.trim().length > 0 && visibleBooks.length === 0;

  const libraryTitle = selectedTheme === 'all'
    ? t('library')
    : (activeThemeData?.shortLabel || activeThemeData?.label);

  return (
    <KidsPageShell
      isRtl={isRtl}
      variant="library"
      world="books"
      className={`pb-space-32 kids-library-shell kids-home-shell kids-hero-glow ${selectedTheme === 'bedtime' ? 'kids-night-calm' : ''}`}
      footer={<KidsBottomNav />}
    >
      <div className="kids-home-atmosphere" aria-hidden="true">
        <span className="kids-home-cloud" style={{ width: '8rem', top: '10%', left: '8%' }} />
        <span className="kids-home-cloud" style={{ width: '5.5rem', top: '20%', right: '12%' }} />
        <span className="kids-home-star" style={{ top: '14%', left: '32%' }} />
        <span className="kids-home-star" style={{ top: '26%', right: '22%' }} />
      </div>

      {selectedTheme !== 'all' && <KidsCategoryAtmosphere categoryId={selectedTheme} />}

      <header className="kids-home-header relative z-10 sticky top-0 px-space-20 md:px-space-32 py-space-12 md:py-space-16 flex items-center justify-between gap-space-16">
        <div className="flex items-center gap-space-12 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/kids')}
            className="kids-reader-toolbar-btn !bg-card/70"
            aria-label={t('home')}
          >
            <ChevronLeftIcon className={`h-6 w-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div className="min-w-0">
            <p className="kids-type-caption">{t('library')}</p>
            <h1 className="kids-type-h1 !text-[1.35rem] md:!text-[1.55rem] truncate">
              {libraryTitle}
            </h1>
          </div>
        </div>
        <Link
          to="/kids"
          className="shrink-0 rounded-full opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label="HKids"
        >
          <Logo size="default" showText={false} />
        </Link>
      </header>

      <main className="kids-main kids-main-tablet-wide kids-home-main kids-library-main relative z-20">
        <section className="kids-library-toolbar px-space-4 md:px-space-8 space-y-space-16" aria-label={t('library')}>
          <SearchBar
            variant="premium"
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={(value) => saveRecentSearch(value)}
            placeholder={t('tryAnotherWord') || 'Search…'}
            aria-label={t('library')}
          />

          <div className="kids-library-search-discovery kids-premium-panel">
            <div className="kids-library-search-copy">
              <p className="kids-type-caption">{t('search')}</p>
              <h2 className="kids-shelf-title !mb-space-8">
                {searchQuery.trim() ? `✨ ${searchQuery.trim()}` : t('kidsDiscoverToday')}
              </h2>
              <p className="kids-shelf-subtitle !mx-0">
                {searchQuery.trim()
                  ? t('discoverRecommendedSubtitle')
                  : 'Retrouve une histoire avec un mot doux, une catégorie aimée, ou une lecture déjà téléchargée.'}
              </p>
            </div>
            {recentSearches.length > 0 && (
              <div className="kids-library-search-group">
                <p className="kids-library-search-label">Recherches récentes</p>
                <div className="kids-library-search-chips">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSearchQuery(item)}
                      className="kids-library-search-chip"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="kids-library-search-group">
              <p className="kids-library-search-label">Catégories populaires</p>
              <div className="kids-library-search-chips">
                {childThemes.filter((theme) => theme.id !== 'all').slice(0, 5).map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      handleThemeChange(theme.id);
                      saveRecentSearch(theme.label);
                    }}
                    className="kids-library-search-chip kids-library-search-chip--theme"
                  >
                    <span aria-hidden="true">{theme.pictogram}</span>
                    {theme.shortLabel || theme.label}
                  </button>
                ))}
              </div>
            </div>
            {(downloadedBooks.length > 0 || downloadingCount > 0) && (
              <motion.div
                className="kids-library-search-meta"
                animate={downloadingCount > 0 && !reducedMotion ? { opacity: [1, 0.72, 1] } : { opacity: 1 }}
                transition={downloadingCount > 0 && !reducedMotion ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
              >
                <span>{downloadedBooks.length} livres prêts hors ligne</span>
                {downloadingCount > 0 && <span>{downloadingCount} téléchargement{downloadingCount > 1 ? 's' : ''} en cours</span>}
              </motion.div>
            )}
          </div>

          <div className="kids-discovery-rail !pt-0 !gap-space-10" role="toolbar" aria-label={t('allCategories')}>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedTheme}-${searchQuery.trim()}-${loading ? 'loading' : 'ready'}`}
            {...getMotionProps(reducedMotion, kidsPageEnter)}
          >
        {loading ? (
          <div className="px-space-4">
            <BookGridSkeleton count={8} variant="carousel" />
          </div>
        ) : noSearchResults ? (
          <>
            <KidsEmptyState
              emoji="🔎"
              title="Aucune histoire ne correspond encore"
              description="Essaie un autre mot, ou repars d'une catégorie lumineuse pour retrouver une lecture."
              actionLabel={t('allCategories')}
              onAction={() => {
                setSearchQuery('');
                handleThemeChange('all');
              }}
              showMascot
              mascotMood="encourage"
            />
            {todayAnnotated.length > 0 && (
              <KidsBookCarousel
                title={t('forYou')}
                subtitle={t('discoverRecommendedSubtitle')}
                books={todayAnnotated.slice(0, 8)}
                {...carouselProps}
                seeAllLabel={null}
              />
            )}
          </>
        ) : books.length === 0 ? (
          <KidsEmptyState
            title={t('emptyBooksTitle')}
            description={t('emptyBooksDescription')}
            actionLabel={t('allCategories')}
            onAction={() => handleThemeChange('all')}
            showMascot
          />
        ) : selectedTheme !== 'all' ? (
          themeBooks.length === 0 ? (
            <KidsEmptyState
              title={t('nothingFound')}
              description={t('tryAnotherWord')}
              actionLabel={t('allCategories')}
              onAction={() => handleThemeChange('all')}
              showMascot
              mascotMood="encourage"
            />
          ) : (
            <>
              {featuredHeroBook && (
                <KidsHeroStoryCard
                  book={featuredHeroBook}
                  isRtl={isRtl}
                  t={t}
                  onRead={handlePlayBook}
                  onListen={handleListenBook}
                  badgeLabel={activeThemeData?.shortLabel || activeThemeData?.label}
                  onEmptyAction={() => handleThemeChange('all')}
                />
              )}
              <KidsBookCarousel
                title={activeThemeData?.shortLabel || activeThemeData?.label}
                subtitle={t('discoverCategoriesSubtitle')}
                books={annotateBooksWithReasons(themeBooks, activeThemeData?.shortLabel || activeThemeData?.label)}
                {...carouselProps}
                onSeeAll={() => handleThemeChange('all')}
              />
            </>
          )
        ) : (
          <>
            {continueBooks.length > 0 && (
              <KidsContinueRail
                books={continueBooks}
                title={t('continueReading')}
                subtitle={t('discoverContinueSubtitle')}
                isRtl={isRtl}
                t={t}
                onResume={handlePlayBook}
              />
            )}

            {featuredHeroBook && !featuredHeroBook.isInProgress && (
              <KidsHeroStoryCard
                book={featuredHeroBook}
                isRtl={isRtl}
                t={t}
                onRead={handlePlayBook}
                onListen={handleListenBook}
                badgeLabel={t('kidsStoriesToday')}
                onEmptyAction={() => handleThemeChange('all')}
              />
            )}

            {todayAnnotated.length > 0 && (
              <KidsBookCarousel
                title={t('forYou')}
                subtitle={t('discoverRecommendedSubtitle')}
                books={todayAnnotated}
                {...carouselProps}
                seeAllLabel={null}
              />
            )}

            {newAnnotated.length > 0 && (
              <KidsBookCarousel
                title={t('newBooks')}
                subtitle={t('discoverNewSubtitle')}
                books={newAnnotated}
                {...carouselProps}
                seeAllLabel={null}
              />
            )}

            {popularAnnotated.length > 0 && (
              <KidsBookCarousel
                title={language === 'fr' ? 'Populaires' : language === 'ar' ? 'الأكثر شعبية' : 'Popular'}
                subtitle={t('discoverRecommendedSubtitle')}
                books={popularAnnotated}
                {...carouselProps}
                seeAllLabel={null}
              />
            )}

            {favoriteAnnotated.length > 0 && (
              <KidsBookCarousel
                title={t('yourFavorites')}
                subtitle={t('discoverBecauseSubtitle')}
                books={favoriteAnnotated}
                {...carouselProps}
                modality="favorites"
                seeAllLabel={null}
              />
            )}

            <div className="kids-home-secondary-shelves">
              {seasonalAnnotated.length > 0 && (
                <KidsBookCarousel
                  title={t('discoverSeasonal')}
                  subtitle={t('discoverSeasonalSubtitle')}
                  books={seasonalAnnotated}
                  {...carouselProps}
                  seeAllLabel={null}
                />
              )}

              {themeShelves.map(({ theme, books: shelfBooks }) => (
                <KidsBookCarousel
                  key={theme.id}
                  title={theme.id === 'princesses'
                    ? (language === 'fr' ? 'Magie' : language === 'ar' ? 'سحر' : 'Magic')
                    : (theme.shortLabel || theme.label)}
                  subtitle={theme.cue || t('discoverCategoriesSubtitle')}
                  books={annotateBooksWithReasons(shelfBooks, theme.shortLabel || theme.label)}
                  {...carouselProps}
                  onSeeAll={() => handleThemeChange(theme.id)}
                />
              ))}
            </div>
          </>
        )}
          </motion.div>
        </AnimatePresence>

        <KidsFamilyMessages />
        <KidsTrustBadges t={t} compact className="opacity-55" />
      </main>

      <VoiceAssistant language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'} onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsLibrary;
