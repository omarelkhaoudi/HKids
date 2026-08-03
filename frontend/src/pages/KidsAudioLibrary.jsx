import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import {
  getContinueReading,
  getSectionItems,
  loadRecommendations,
} from '../services/recommendations/recommendationEngine';
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
import { KidsBookCover } from '../components/kids/KidsBookCover';
import { KidsIconAction } from '../components/kids/KidsIconAction';

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
  const [recommendations, setRecommendations] = useState(null);
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
      const booksRes = await booksAPI.getPublishedBooks({ language });
      const nextBooks = booksRes.data || [];
      setBooks(nextBooks);
      const recommendationPayload = await loadRecommendations({
        surface: 'audio',
        language,
        books: nextBooks,
      }).catch(() => loadRecommendations({
        surface: 'audio',
        language,
        books: nextBooks,
        forceRefresh: true,
      }));
      setRecommendations(recommendationPayload);
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

  const continueBooks = useMemo(
    () => getContinueReading({
      books: audioBooks,
      readingHistory: listeningHistory,
      recommendations,
    }),
    [audioBooks, listeningHistory, recommendations],
  );

  const recentlyListened = useMemo(
    () => getListeningHistoryBooks(audioBooks, listeningHistory),
    [audioBooks, listeningHistory],
  );

  const recommendedBooks = useMemo(() => {
    const items = getSectionItems(recommendations, 'recommended_for_you');
    const fromRec = audioBooks.filter((book) => items.some((item) => item.id === book.id));
    return fromRec.length > 0 ? fromRec : items.filter((book) => (
      book.audio_url || book.content_type === 'song' || book.content_type === 'audio_story'
    )).slice(0, 12);
  }, [recommendations, audioBooks]);

  const popularBooks = useMemo(
    () => getSectionItems(recommendations, 'popular')
      .filter((book) => audioBooks.some((item) => item.id === book.id))
      .slice(0, 12),
    [recommendations, audioBooks],
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
    modality: 'audio',
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="audio" className="pb-32 kids-glow-audio" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids" emoji="🎧" title={t('audioLibrary')} />

      <main className="kids-main kids-main-tablet-wide relative z-20">
        <KidsHero
          modality="audio"
          emoji="🎵"
          badge={t('audioLibrary')}
          title={t('audioLibraryTitle')}
          subtitle={t('audioLibrarySubtitle')}
          nonReader
        />

        {featuredBook && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handlePlay(featuredBook)}
            className="kids-premium-panel w-full cursor-pointer p-4 md:p-6"
            aria-label={`${t('continueListening')} — ${featuredBook.title}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="kids-hero-cover w-40 md:w-48 shrink-0 relative">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <KidsBookCover
                    book={featuredBook}
                    imgClassName="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center md:items-start">
                <span className="text-5xl" aria-hidden="true">▶️</span>
                <h2 className="sr-only">{featuredBook.title}</h2>
                <KidsIconAction
                  action="listen"
                  size="xl"
                  label={t('continueListening')}
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePlay(featuredBook);
                  }}
                />
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
                showMascot
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
            showMascot
            mascotMood="encourage"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
            <AnimatePresence>
              {visibleBooks.map((book) => (
                <KidsMediaCard key={book.id} book={book} variant="carousel" hideTitle onPlay={handlePlay} isRtl={isRtl} />
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
