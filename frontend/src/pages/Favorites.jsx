import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { ChevronLeftIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { KidsBookCover } from '../components/kids/KidsBookCover';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsGuideCompanion } from '../components/kids/KidsGuideCompanion';
import { getKidsContentPath } from '../utils/contentRouting';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { PlatformShell } from '../components/layout/PlatformShell';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear, kidsPageEnter } from '../constants/kidsMotion';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { playKidsUiSound } from '../utils/kidsUiSound';
import { getGuideVoicePhrase, KIDS_PICTOGRAMS } from '../utils/kidsGuidePhrases';

function Favorites() {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, isRtl, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const offlineContent = useOfflineContent();
  const isKidMode = user?.role === 'kid';
  const { showToast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, [language]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoriteIds = storage.getFavorites();

      if (favoriteIds.length === 0) {
        setFavoriteBooks([]);
        setLoading(false);
        return;
      }

      const response = await booksAPI.getPublishedBooks({ language });
      const favorites = response.data.filter((book) => favoriteIds.includes(book.id));

      const missingBookIds = favoriteIds.filter((id) => !favorites.find((b) => b.id === id));
      const missingBooks = await Promise.all(
        missingBookIds.map(async (id) => {
          try {
            const bookResponse = await booksAPI.getBook(id);
            return bookResponse.data;
          } catch (err) {
            console.warn(`[Favorites] Could not load book ${id}:`, err);
            return null;
          }
        }),
      );

      const allFavorites = [...favorites, ...missingBooks.filter(Boolean)];
      const sorted = favoriteIds.map((id) => allFavorites.find((b) => b.id === id)).filter(Boolean);
      setFavoriteBooks(sorted);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (bookId) => {
    playKidsUiSound('favorite');
    storage.removeFavorite(bookId);
    showToast(t('removedFromFavorites'), 'info', 2000);
    loadFavorites();
  };

  const pinnedFavorites = useMemo(() => favoriteBooks.slice(0, 3), [favoriteBooks]);
  const recentFavorites = useMemo(() => favoriteBooks.slice(0, 12), [favoriteBooks]);
  const offlineFavorites = useMemo(
    () => favoriteBooks.filter((book) => {
      const status = offlineContent.getBookStatus?.(book.id);
      return status?.status === 'downloaded' || storage.isDownloaded(book.id);
    }),
    [favoriteBooks, offlineContent],
  );

  if (isKidMode) {
    return (
      <KidsPageShell isRtl={isRtl} variant="library" world="favorites" className="pb-32 kids-glow-audio kids-favorites-premium" footer={<KidsBottomNav />}>
        <KidsPageHeader backTo="/kids" emoji="❤️" title={t('yourFavorites')} />
        <main className="kids-main kids-main-tablet-wide relative z-20">
          {loading ? (
            <BookGridSkeleton count={6} variant="carousel" />
          ) : favoriteBooks.length === 0 ? (
            <KidsEmptyState
              emoji="❤️"
              title={t('emptyFavoritesTitle')}
              description={t('emptyBooksDescription')}
              actionLabel={t('goToLibrary')}
              onAction={() => navigate('/kids/library')}
              showMascot
              mascotMood="encourage"
            />
          ) : (
            <>
              {pinnedFavorites.length > 0 && (
                <KidsBookCarousel
                  title={t('kidsPinnedFavorites')}
                  emoji="📌"
                  books={pinnedFavorites}
                  isRtl={isRtl}
                  showActions
                  hideTitle
                  pictogramMode
                  modality="favorites"
                  onPlay={(book) => {
                    playKidsUiSound('play');
                    navigate(getKidsContentPath(book));
                  }}
                  onFavorite={(bookId) => removeFavorite(bookId)}
                />
              )}
              <KidsBookCarousel
                title={t('kidsRecentlyFavorited')}
                emoji={KIDS_PICTOGRAMS.favorites}
                books={recentFavorites}
                isRtl={isRtl}
                showActions
                hideTitle
                pictogramMode
                modality="favorites"
                onPlay={(book) => {
                  playKidsUiSound('play');
                  navigate(getKidsContentPath(book));
                }}
                onFavorite={(bookId) => removeFavorite(bookId)}
              />
              {offlineFavorites.length > 0 && (
                <KidsBookCarousel
                  title={t('kidsOfflineFavorites')}
                  emoji={KIDS_PICTOGRAMS.downloads}
                  books={offlineFavorites}
                  isRtl={isRtl}
                  showActions
                  hideTitle
                  pictogramMode
                  modality="favorites"
                  onPlay={(book) => {
                    playKidsUiSound('play');
                    navigate(getKidsContentPath(book));
                  }}
                  onFavorite={(bookId) => removeFavorite(bookId)}
                />
              )}
            </>
          )}
        </main>
        <KidsGuideCompanion
          mood="encourage"
          message={getGuideVoicePhrase('favorites', language)}
          speakOnMount
          speakText={getGuideVoicePhrase('favorites', language)}
        />
        <VoiceAssistant onNavigate={navigate} />
      </KidsPageShell>
    );
  }

  return (
    <PlatformShell variant="platform" isRtl={isRtl} className="pb-24 parent-home-shell">
      <motion.div {...getMotionProps(reducedMotion, kidsPageEnter)}>
        <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
            <Logo size="default" isLink={false} />
            <Link to="/" className="text-foreground-secondary hover:text-foreground font-medium flex items-center gap-2 transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
              <span>{t('back')}</span>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          <motion.section {...getMotionProps(reducedMotion, kidsCardAppear)} className="parent-today-hero mb-8">
            <p className="parent-today-hero-kicker">{t('yourFavorites')}</p>
            <h1 className="parent-today-hero-title">❤️ {t('yourFavorites')}</h1>
            <p className="parent-today-hero-message">
              {favoriteBooks.length > 0
                ? `${favoriteBooks.length} ${t('yourFavorites').toLowerCase()}`
                : t('emptyBooksDescription')}
            </p>
          </motion.section>

          {loading ? (
            <BookGridSkeleton count={8} />
          ) : favoriteBooks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-foreground-muted mb-4">{t('emptyFavoritesTitle')}</p>
              <Link to="/kids/library" className="text-primary-600 font-semibold">{t('goToLibrary')}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {favoriteBooks.map((book) => (
                <motion.article key={book.id} {...getMotionProps(reducedMotion, kidsCardAppear)} className="group">
                  <button
                    type="button"
                    onClick={() => navigate(getKidsContentPath(book))}
                    className="w-full text-start"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-soft">
                      <KidsBookCover book={book} imgClassName="absolute inset-0 h-full w-full object-cover" />
                    </div>
                    <h3 className="mt-2 font-bold line-clamp-2">{book.title}</h3>
                  </button>
                </motion.article>
              ))}
            </div>
          )}
        </main>
      </motion.div>
    </PlatformShell>
  );
}

export default Favorites;
