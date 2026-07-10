import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Moon, Star, Library, Home, Play, Heart, Mic } from 'lucide-react';
import KidsButton from '../components/kids/KidsButton';
import KidsStoryCard from '../components/kids/KidsStoryCard';
import LitMascot from '../components/kids/LitMascot';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ToastProvider';
import { booksAPI } from '../api/books';
import { parentalAPI } from '../api/parental';
import { recommendationsAPI } from '../api/recommendations';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { BookGridSkeleton } from '../components/SkeletonLoader';

const CARD_COLORS = ['primary', 'secondary', 'accent'];
const SLEEP_THEMES = new Set(['rhymes', 'princesses', 'world']);

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.ceil(safeSeconds / 60);
  return `${minutes} min`;
}

function getRecommendationContext() {
  return {
    favorites: storage.getFavorites(),
    readingHistory: storage.getReadingHistory(),
    listeningHistory: storage.getListeningHistory(),
    readingStats: storage.getReadingStats(),
  };
}

function mapBookToCard(book, index) {
  return {
    id: book.id,
    title: book.title,
    image: getImageUrl(book.cover_image, 'book') || '/HKidsimg.webp',
    duration: formatDuration(book.duration_seconds) || '—',
    color: CARD_COLORS[index % CARD_COLORS.length],
    book,
  };
}

export default function HKidsMockup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('home');
  const [books, setBooks] = useState([]);
  const [homeData, setHomeData] = useState(null);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBadges, setShowBadges] = useState(false);
  const [greeting, setGreeting] = useState(t('goodMorning'));

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('goodMorning'));
    else if (hour < 18) setGreeting(t('goodAfternoon'));
    else setGreeting(t('goodEvening'));
  }, [t]);

  useEffect(() => {
    let active = true;

    const loadMockupData = async () => {
      try {
        setLoading(true);
        const [booksRes, overviewRes, recommendationsRes] = await Promise.allSettled([
          booksAPI.getPublishedBooks({ language }),
          parentalAPI.getConnectedKidOverview(),
          recommendationsAPI.getForKid({ ...getRecommendationContext(), language }),
        ]);

        if (!active) return;

        if (booksRes.status === 'fulfilled') {
          setBooks(Array.isArray(booksRes.value.data) ? booksRes.value.data : []);
        }

        if (overviewRes.status === 'fulfilled') {
          setHomeData(overviewRes.value.data);
        }

        if (recommendationsRes.status === 'fulfilled') {
          const sections = recommendationsRes.value.data?.sections || [];
          const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
          const ids = (recommendedSection?.items || [])
            .map((item) => Number(item.id ?? item.book_id))
            .filter(Number.isFinite);
          setRecommendedIds(ids);
        } else {
          const message = getRestrictionMessage(recommendationsRes.reason);
          if (message) showToast(message, 'info');
        }
      } catch (error) {
        showToast(getRestrictionMessage(error, t('loadError')), 'error');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMockupData();
    return () => {
      active = false;
    };
  }, [language, showToast, t]);

  const kid = homeData?.kid || null;
  const kidName = kid?.name || user?.username || t('friend');
  const favoriteIds = storage.getFavorites();
  const progressRows = Array.isArray(homeData?.progress) ? homeData.progress : [];
  const continueReading = progressRows.find((item) => (
    !item.completed && Number(item.progress_percent || 0) > 0
  )) || null;
  const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];

  const localizedBooks = useMemo(
    () => books.filter((book) => !book.language || book.language === language),
    [books, language]
  );

  const displayedStories = useMemo(() => {
    let filtered = localizedBooks;

    if (activeTab === 'favorites') {
      filtered = localizedBooks.filter((book) => favoriteIds.includes(book.id));
    } else if (activeTab === 'sleep') {
      filtered = localizedBooks.filter((book) => (
        SLEEP_THEMES.has(book.theme)
        || Number(book.duration_seconds || 0) <= 900
      ));
    } else if (recommendedIds.length > 0) {
      const recommendedSet = new Set(recommendedIds);
      const recommended = localizedBooks.filter((book) => recommendedSet.has(Number(book.id)));
      filtered = recommended.length > 0 ? recommended : localizedBooks;
    }

    return filtered.slice(0, 12).map(mapBookToCard);
  }, [activeTab, localizedBooks, favoriteIds, recommendedIds]);

  const handleContinue = () => {
    if (continueReading?.book_id) {
      const pageQuery = Number(continueReading.current_page || 0) > 0
        ? `?page=${continueReading.current_page}`
        : '';
      navigate(`/kids/read/${continueReading.book_id}${pageQuery}`);
      return;
    }

    const firstStory = displayedStories[0];
    if (firstStory) {
      navigate(`/kids/read/${firstStory.id}`);
      return;
    }

    navigate('/kids/library');
  };

  const handleOpenStory = (story) => {
    navigate(`/kids/read/${story.id}`);
  };

  const handleToggleFavorite = (bookId) => {
    if (storage.isFavorite(bookId)) {
      storage.removeFavorite(bookId);
      showToast(t('removedFromFavorites'), 'info');
    } else {
      storage.addFavorite(bookId);
      showToast(t('addedToFavorites'), 'success');
    }
    setBooks((current) => [...current]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const tabLabels = {
    home: t('discover'),
    favorites: t('favorites'),
    sleep: t('sleepStories'),
  };

  return (
    <div className="min-h-screen bg-background-kids text-surface-900 font-sans selection:bg-primary-200 overflow-x-hidden flex flex-col relative" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50"
        />
      </div>

      <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <KidsButton
          variant="ghost"
          size="sm"
          icon={Settings}
          className="!rounded-full w-16 h-16 p-0"
          aria-label={t('settings')}
          onClick={() => navigate(user?.role === 'parent' ? '/parent/dashboard' : '/kids')}
        />

        <motion.button
          type="button"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate('/kids')}
          className="bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-sm border border-surface-200"
        >
          <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            Le Lit Qui Lit
          </span>
        </motion.button>

        <KidsButton
          variant="ghost"
          size="sm"
          icon={User}
          className="!rounded-full w-16 h-16 p-0 bg-primary-100 text-primary-600 border-primary-200"
          aria-label={t('profile')}
          onClick={() => navigate('/kids')}
        />
      </header>

      <main className="flex-1 relative z-10 px-6 md:px-12 pb-36 flex flex-col items-center max-w-7xl mx-auto w-full">
        <section className="flex flex-col md:flex-row items-center justify-between w-full mt-4 mb-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center md:text-left"
          >
            <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              {greeting} <span className="text-primary-500">{kidName}</span> !
            </h2>
            <p className="text-xl md:text-2xl text-surface-500 font-bold mb-8">
              {t('readyToPlay')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <KidsButton
                icon={Play}
                size="lg"
                className="w-full md:w-auto shadow-lg shadow-primary-500/30"
                onClick={handleContinue}
              >
                {continueReading ? t('resume') : t('discover')}
              </KidsButton>
              <KidsButton
                variant="secondary"
                icon={Mic}
                size="lg"
                className="w-full md:w-auto"
                onClick={() => navigate('/kids/story-studio')}
              >
                Studio
              </KidsButton>
            </div>
          </motion.div>

          <div className="flex-1 flex justify-center">
            <LitMascot className="w-64 h-64 md:w-80 md:h-80" />
          </div>
        </section>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full mb-8 flex flex-wrap justify-center gap-4"
        >
          {['home', 'favorites', 'sleep'].map((tab) => {
            const icons = { home: Home, favorites: Heart, sleep: Moon };
            const isActive = activeTab === tab;
            const Icon = icons[tab];

            return (
              <motion.button
                key={tab}
                type="button"
                variants={itemVariants}
                onClick={() => {
                  setActiveTab(tab);
                  setShowBadges(false);
                }}
                className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-lg md:text-xl transition-all duration-300 min-h-[48px] ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white text-surface-500 hover:bg-surface-50'
                }`}
              >
                <Icon className={isActive ? 'text-white' : 'text-surface-400'} />
                {tabLabels[tab]}
              </motion.button>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="w-full px-2">
            <BookGridSkeleton count={4} />
          </div>
        ) : showBadges ? (
          <section className="w-full mb-12">
            <h3 className="text-3xl font-black mb-6 text-center">🏆 {t('yourMedals')}</h3>
            <div className="flex flex-wrap gap-6 justify-center">
              {badges.length === 0 ? (
                <p className="text-surface-500 font-bold text-lg">{t('noReadingRecorded')}</p>
              ) : badges.map((badge) => (
                <div
                  key={badge.id}
                  title={`${badge.label} — ${badge.description}`}
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl border-8 ${
                    badge.earned
                      ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-yellow-200'
                      : 'bg-surface-200 border-surface-300 grayscale opacity-60'
                  }`}
                >
                  {badge.earned ? badge.icon : '🔒'}
                </div>
              ))}
            </div>
          </section>
        ) : displayedStories.length === 0 ? (
          <div className="w-full rounded-[2rem] bg-white/80 border border-surface-200 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-black mb-2">{t('nothingFound')}</h3>
            <p className="text-surface-500 font-bold mb-6">{t('tryAnotherWord')}</p>
            <KidsButton onClick={() => navigate('/kids/library')}>{t('library')}</KidsButton>
          </div>
        ) : (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {displayedStories.map((story) => (
                <motion.div
                  key={story.id}
                  variants={itemVariants}
                  layout
                  className="relative"
                >
                  <KidsStoryCard
                    title={story.title}
                    image={story.image}
                    duration={story.duration}
                    color={story.color}
                    onClick={() => handleOpenStory(story)}
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleFavorite(story.id);
                    }}
                    className="absolute top-4 left-4 z-10 rounded-full bg-white/90 p-3 shadow-md border border-white"
                    aria-label={t('favorites')}
                  >
                    <Heart
                      className={`w-5 h-5 ${favoriteIds.includes(story.id) ? 'fill-rose-500 text-rose-500' : 'text-surface-400'}`}
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 z-20 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="pointer-events-auto bg-white/90 backdrop-blur-xl p-4 rounded-full shadow-glass border border-white/50 flex flex-wrap gap-4 justify-center"
        >
          <KidsButton
            variant={activeTab === 'home' && !showBadges ? 'primary' : 'ghost'}
            size="sm"
            icon={Library}
            className="!rounded-full px-6"
            onClick={() => {
              setShowBadges(false);
              navigate('/kids/library');
            }}
          >
            {t('library')}
          </KidsButton>
          <KidsButton
            variant={showBadges ? 'secondary' : 'ghost'}
            size="sm"
            icon={Star}
            className="!rounded-full px-6"
            onClick={() => {
              setShowBadges(true);
              setActiveTab('home');
            }}
          >
            {t('yourMedals')}
          </KidsButton>
        </motion.div>
      </div>

      <VoiceAssistant language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'} />
    </div>
  );
}
