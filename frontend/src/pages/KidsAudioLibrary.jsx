import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { recommendationsAPI } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../utils/storage';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { filterAudioBooks, filterComptines, getKidsContentPath } from '../utils/contentRouting';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsHero } from '../components/kids/KidsHero';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsMediaCard } from '../components/kids/KidsMediaCard';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsThemePill } from '../components/kids/KidsThemePill';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { getImageUrl } from '../utils/imageUrl';

const TABS = [
  { id: 'all', labelKey: 'audioTabAll', emoji: '🎧' },
  { id: 'audio_story', labelKey: 'audioTabStories', emoji: '📻' },
  { id: 'song', labelKey: 'audioTabRhymes', emoji: '🎵' },
];

const BEDTIME_KEYWORDS = ['bedtime', 'sleep', 'dormir', 'nuit', 'coucher', 'dodo', 'lullaby', 'berceuse'];

function isBedtimeBook(book) {
  const searchable = [book.title, book.description, book.theme, book.category_name].filter(Boolean).join(' ').toLowerCase();
  return BEDTIME_KEYWORDS.some((kw) => searchable.includes(kw));
}

function getListeningHistoryBooks(books, history = []) {
  const order = new Map(history.map((item, index) => [item.bookId, index]));
  return [...books]
    .filter((book) => order.has(book.id))
    .sort((a, b) => order.get(a.id) - order.get(b.id))
    .slice(0, 15);
}

function KidsAudioLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const [books, setBooks] = useState([]);
  const [recommendationSections, setRecommendationSections] = useState([]);
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
      const [booksRes, recRes] = await Promise.all([
        booksAPI.getPublishedBooks({ language }),
        recommendationsAPI.getForKid({
          favorites: storage.getFavorites(),
          readingHistory: storage.getReadingHistory(),
          listeningHistory: storage.getListeningHistory(),
          readingStats: storage.getReadingStats(),
          language,
        }).catch(() => ({ data: { sections: [] } })),
      ]);
      setBooks(booksRes.data || []);
      setRecommendationSections(recRes.data?.sections || []);
    } catch (error) {
      showToast(getRestrictionMessage(error, t('loadError')), 'error');
    } finally {
      setLoading(false);
    }
  };

  const audioBooks = useMemo(() => filterAudioBooks(books), [books]);
  const comptines = useMemo(() => filterComptines(books), [books]);
  const audioStories = useMemo(() => books.filter((b) => b.content_type === 'audio_story'), [books]);
  const listeningHistory = storage.getListeningHistory();

  const continueBooks = useMemo(() => {
    const inProgress = listeningHistory.filter((h) => !h.completed && h.currentTime > 0);
    return inProgress
      .map((h) => audioBooks.find((b) => b.id === h.bookId))
      .filter(Boolean);
  }, [listeningHistory, audioBooks]);

  const recentlyListened = useMemo(
    () => getListeningHistoryBooks(audioBooks, listeningHistory),
    [audioBooks, listeningHistory],
  );

  const recommendedSection = recommendationSections.find((s) => s.id === 'recommended_for_you');
  const recommendedBooks = useMemo(() => {
    const items = recommendedSection?.items || [];
    const ids = new Set(items.map((i) => Number(i.id ?? i.book_id)));
    const fromRec = audioBooks.filter((b) => ids.has(Number(b.id)));
    return fromRec.length > 0 ? fromRec : audioBooks.slice(0, 12);
  }, [recommendationSections, audioBooks]);

  const popularBooks = useMemo(
    () => getListeningHistoryBooks(audioBooks, listeningHistory).slice(0, 12),
    [audioBooks, listeningHistory],
  );

  const bedtimeBooks = useMemo(
    () => audioBooks.filter(isBedtimeBook).slice(0, 15),
    [audioBooks],
  );

  const visibleBooks = useMemo(() => {
    if (activeTab === 'song') return comptines;
    if (activeTab === 'audio_story') return audioStories;
    return audioBooks;
  }, [activeTab, audioBooks, comptines, audioStories]);

  const featuredBook = continueBooks[0] || recommendedBooks[0] || audioBooks[0] || null;

  const handleTab = (tabId) => {
    setSearchParams(tabId === 'all' ? {} : { type: tabId });
  };

  const handlePlay = (book) => {
    navigate(getKidsContentPath(book));
  };

  const carouselProps = {
    isRtl,
    onPlay: handlePlay,
    showActions: false,
    hideTitle: true,
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" className="pb-32 kids-hero-glow" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids" emoji="🎧" title={t('audioLibrary')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        <KidsHero
          emoji="🎵"
          badge={t('audioLibrary')}
          title={t('audioLibraryTitle')}
          subtitle={t('audioLibrarySubtitle')}
        />

        {featuredBook && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handlePlay(featuredBook)}
            className="kids-premium-panel w-full p-4 md:p-6 cursor-pointer"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-40 h-52 md:w-48 md:h-60 shrink-0 rounded-[2rem] overflow-hidden shadow-kids-soft border-4 border-white/60 relative">
                <img
                  src={getImageUrl(featuredBook.cover_image, 'book')}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-5xl">▶️</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex min-h-9 items-center rounded-full bg-primary-100 text-primary-700 px-4 py-1 text-sm font-black mb-3">
                  ▶️ {t('continueListening')}
                </span>
                <p className="text-2xl md:text-3xl font-black text-foreground">{featuredBook.title}</p>
              </div>
            </div>
          </motion.div>
        )}

        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x custom-scrollbar">
            {TABS.map((tab) => (
              <KidsThemePill
                key={tab.id}
                theme={{ id: tab.id, pictogram: tab.emoji, shortLabel: t(tab.labelKey), gradient: 'from-primary-400 to-secondary-400' }}
                isActive={activeTab === tab.id}
                onClick={() => handleTab(tab.id)}
              />
            ))}
          </div>
        </section>

        {loading ? (
          <BookGridSkeleton count={8} variant="carousel" />
        ) : activeTab === 'all' ? (
          <div className="space-y-10">
            {continueBooks.length > 0 && (
              <KidsBookCarousel title={t('continueListening')} emoji="▶️" books={continueBooks} {...carouselProps} />
            )}
            {recommendedBooks.length > 0 && (
              <KidsBookCarousel title={t('audioRecommended')} emoji="⭐" books={recommendedBooks} {...carouselProps} />
            )}
            {popularBooks.length > 0 && (
              <KidsBookCarousel title={t('popularStories')} emoji="🔥" books={popularBooks} {...carouselProps} />
            )}
            {bedtimeBooks.length > 0 && (
              <KidsBookCarousel title={t('audioBedtime')} emoji="🌙" books={bedtimeBooks} {...carouselProps} />
            )}
            {recentlyListened.length > 0 && (
              <KidsBookCarousel title={t('lastListened')} emoji="🕐" books={recentlyListened} {...carouselProps} />
            )}
            {comptines.length > 0 && (
              <KidsBookCarousel title={t('rhymes')} emoji="🎵" books={comptines} {...carouselProps} />
            )}
            {audioStories.length > 0 && (
              <KidsBookCarousel title={t('audioStories')} emoji="📻" books={audioStories} {...carouselProps} />
            )}
            {audioBooks.length === 0 && (
              <KidsEmptyState
                emoji="🎧"
                title={t('emptyAudioTitle')}
                description={t('emptyAudioDescription')}
                actionLabel={t('goToLibrary')}
                onAction={() => navigate('/kids/library')}
              />
            )}
          </div>
        ) : visibleBooks.length === 0 ? (
          <KidsEmptyState
            emoji={activeTab === 'song' ? '🎵' : '🎧'}
            title={t('emptyAudioTitle')}
            description={t('emptyAudioDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
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
