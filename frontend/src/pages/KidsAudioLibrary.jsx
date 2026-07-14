import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../utils/storage';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { filterAudioBooks, filterComptines, getKidsContentPath } from '../utils/contentRouting';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsMediaCard } from '../components/kids/KidsMediaCard';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { Logo } from '../components/Logo';
import { AudioIcon, BookIcon, HomeIcon, LogOutIcon, SparklesIcon } from '../components/Icons';

const TABS = [
  { id: 'all', labelKey: 'audioTabAll', emoji: '🎧' },
  { id: 'audio_story', labelKey: 'audioTabStories', emoji: '📻' },
  { id: 'song', labelKey: 'audioTabRhymes', emoji: '🎵' },
];

function KidsAudioLibrary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('type') || 'all';

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }
    loadBooks();
  }, [user, language]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getPublishedBooks({ language });
      setBooks(response.data || []);
    } catch (error) {
      showToast(getRestrictionMessage(error, t('loadError')), 'error');
    } finally {
      setLoading(false);
    }
  };

  const audioBooks = useMemo(() => filterAudioBooks(books), [books]);
  const comptines = useMemo(() => filterComptines(books), [books]);
  const audioStories = useMemo(() => books.filter((b) => b.content_type === 'audio_story'), [books]);

  const visibleBooks = useMemo(() => {
    if (activeTab === 'song') return comptines;
    if (activeTab === 'audio_story') return audioStories;
    return audioBooks;
  }, [activeTab, audioBooks, comptines, audioStories]);

  const handleTab = (tabId) => {
    setSearchParams(tabId === 'all' ? {} : { type: tabId });
  };

  const handlePlay = (book) => {
    navigate(getKidsContentPath(book));
  };

  const favoritesIds = storage.getFavorites();
  const carouselProps = {
    isRtl,
    favorites: favoritesIds,
    onPlay: handlePlay,
    showActions: false,
  };

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" className="pb-32" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-white/60 dark:bg-surface-900/60 backdrop-blur-md border-b border-white/60 dark:border-white/10 shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <div className="flex items-center gap-2 text-primary-600">
            <AudioIcon className="h-7 w-7" />
            <span className="font-black text-lg hidden sm:inline">{t('audioLibrary')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/kids" className="grid h-12 w-12 place-items-center rounded-2xl bg-card shadow-md" aria-label={t('kidsNavHome')}>
            <HomeIcon className="h-6 w-6" />
          </Link>
          <button type="button" onClick={handleLogout} className="grid h-12 w-12 place-items-center rounded-2xl bg-card shadow-md" aria-label="Logout">
            <LogOutIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] bg-gradient-to-br from-primary-500 via-primary-500 to-rose-500 p-8 md:p-12 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <SparklesIcon className="h-8 w-8 text-accent-300" />
            <span className="font-black text-sm uppercase tracking-wider">{t('audioLibrary')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2">{t('audioLibraryTitle')}</h1>
          <p className="text-white/85 font-bold text-lg max-w-xl">{t('audioLibrarySubtitle')}</p>
        </motion.section>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 rounded-full px-6 py-3 font-black text-sm transition shadow-sm ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-card text-foreground-muted border border-border hover:bg-surface-secondary'
              }`}
            >
              <span>{tab.emoji}</span>
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {loading ? (
          <BookGridSkeleton count={8} />
        ) : visibleBooks.length === 0 ? (
          <KidsEmptyState
            emoji={activeTab === 'song' ? '🎵' : '🎧'}
            title={t('emptyAudioTitle')}
            description={t('emptyAudioDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
        ) : activeTab === 'all' ? (
          <div className="space-y-12">
            {comptines.length > 0 && (
              <KidsBookCarousel title={t('rhymes')} icon={AudioIcon} books={comptines} hideTitle {...carouselProps} />
            )}
            {audioStories.length > 0 && (
              <KidsBookCarousel title={t('audioStories')} icon={BookIcon} books={audioStories} hideTitle {...carouselProps} />
            )}
            {comptines.length === 0 && audioStories.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                  {visibleBooks.map((book) => (
                    <KidsMediaCard key={book.id} book={book} variant="poster" hideTitle onPlay={handlePlay} isRtl={isRtl} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
            <AnimatePresence>
              {visibleBooks.map((book) => (
                <KidsMediaCard key={book.id} book={book} variant="poster" hideTitle onPlay={handlePlay} isRtl={isRtl} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <VoiceAssistant
        language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'}
        onNavigate={(path) => navigate(path)}
      />
    </KidsPageShell>
  );
}

export default KidsAudioLibrary;
