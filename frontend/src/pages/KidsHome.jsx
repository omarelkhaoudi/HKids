import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories } from '../constants/kidCategories';
import { getKidsModality } from '../constants/kidsModality';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { LitMascot } from '../components/kids/LitMascot';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidCategoryCard } from '../components/kids/KidCategoryCard';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { Logo } from '../components/Logo';
import { parentalAPI } from '../api/parental';
import { recommendationsAPI } from '../api/recommendations';
import { booksAPI } from '../api/books';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getKidsContentPath } from '../utils/contentRouting';
import { useToast } from '../components/ToastProvider';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { PlayIcon, LockIcon } from '../components/Icons';
import { getCachedKidProfile } from '../services/cloud/cloudSyncService';
import { Avatar } from '../components/ui';
import { KidsProfilePanel } from '../components/kids/KidsProfilePanel';
import { BookGridSkeleton } from '../components/SkeletonLoader';

function getRecommendedBooks(sections = []) {
  const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
  return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

function getPopularBooks(books, history = []) {
  const order = new Map(history.map((item, index) => [item.bookId, index]));
  return [...books]
    .filter((book) => order.has(book.id))
    .sort((a, b) => order.get(a.id) - order.get(b.id))
    .slice(0, 15);
}

const AUTONOMY_WORLDS = [
  { id: 'library', path: '/kids/library', emoji: '📚', labelKey: 'kidsWorldBooks', modality: 'books' },
  { id: 'audio', path: '/kids/audio', emoji: '🎧', labelKey: 'kidsWorldAudio', modality: 'audio' },
  { id: 'learning', path: '/kids/learning', emoji: '🎮', labelKey: 'kidsWorldLearn', modality: 'learn' },
  { id: 'create', path: '/kids/ai-stories', emoji: '✨', labelKey: 'kidsWorldCreate', modality: 'create', studioPath: '/kids/story-studio' },
];

const HOME_CATEGORY_IDS = ['dinosaurs', 'space', 'animals', 'princesses', 'bedtime', 'ocean', 'vehicles', 'world', 'colors', 'spirituality'];

function KidsHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState(t('goodMorning'));
  const [homeData, setHomeData] = useState(null);
  const [recommendationSections, setRecommendationSections] = useState([]);
  const [publishedBooks, setPublishedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('goodMorning'));
    else if (hour < 18) setGreeting(t('goodAfternoon'));
    else setGreeting(t('goodEvening'));
  }, [t]);

  useEffect(() => {
    if (loading) return;
    if (location.hash === '#medals') {
      document.getElementById('kids-medals')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (location.hash === '#profile') {
      document.getElementById('kids-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash, location.pathname]);

  useEffect(() => {
    let active = true;

    const loadKidsHome = async () => {
      try {
        setLoading(true);
        const [overviewResult, recommendationsResult, booksResult] = await Promise.allSettled([
          parentalAPI.getConnectedKidOverview(),
          recommendationsAPI.getForKid({ language }),
          booksAPI.getPublishedBooks({ language }),
        ]);

        if (!active) return;

        if (overviewResult.status === 'fulfilled') {
          setHomeData(overviewResult.value.data);
        } else {
          console.warn('Connected kid overview unavailable:', overviewResult.reason);
          if (user?.kid_profile_id) {
            const cachedProfile = await getCachedKidProfile(user.kid_profile_id);
            if (cachedProfile && active) {
              setHomeData((current) => ({
                ...(current || {}),
                kid: cachedProfile,
                progress: current?.progress || [],
              }));
            }
          }
        }

        if (recommendationsResult.status === 'fulfilled') {
          setRecommendationSections(recommendationsResult.value.data?.sections || []);
        } else {
          console.warn('Kid recommendations unavailable:', recommendationsResult.reason);
          const message = getRestrictionMessage(recommendationsResult.reason);
          if (message) showToast(message, 'info');
        }

        if (booksResult.status === 'fulfilled') {
          setPublishedBooks(booksResult.value.data || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadKidsHome();
    return () => {
      active = false;
    };
  }, [showToast, language, user?.kid_profile_id]);

  const kid = homeData?.kid || null;
  const kidName = kid?.name || user?.username || '';
  const avatarSrc = kid?.photo_url ? getImageUrl(kid.photo_url) : null;
  const avatarInitials = kid?.avatar || kidName.trim().charAt(0).toUpperCase() || '?';
  const progressRows = Array.isArray(homeData?.progress) ? homeData.progress : [];
  const continueReading = progressRows.find((item) => (
    !item.completed && Number(item.progress_percent || 0) > 0
  )) || null;
  const recommendedBooks = getRecommendedBooks(recommendationSections);
  const favoriteIds = storage.getFavorites();
  const readingHistory = storage.getReadingHistory();

  const favoriteBooks = useMemo(
    () => publishedBooks.filter((book) => favoriteIds.includes(book.id)),
    [publishedBooks, favoriteIds],
  );

  const newBooks = useMemo(
    () => [...publishedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15),
    [publishedBooks],
  );

  const popularBooks = useMemo(
    () => getPopularBooks(publishedBooks, readingHistory),
    [publishedBooks, readingHistory],
  );

  const continueBooks = useMemo(
    () => progressRows
      .filter((item) => !item.completed && Number(item.progress_percent || 0) > 0)
      .map((item) => ({
        id: item.book_id,
        title: item.book_title,
        cover_image: item.cover_image,
        kid_progress_percent: item.progress_percent,
        current_page: item.current_page,
      })),
    [progressRows],
  );

  const featuredBook = continueReading
    ? {
        id: continueReading.book_id,
        title: continueReading.book_title,
        cover_image: continueReading.cover_image,
        progress: Number(continueReading.progress_percent || 0),
        currentPage: Number(continueReading.current_page || 0),
        isInProgress: true,
      }
    : recommendedBooks[0]
      ? {
          ...recommendedBooks[0],
          progress: Number(recommendedBooks[0].kid_progress_percent || 0),
          isInProgress: false,
        }
      : null;
  const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];
  const kidCategories = localizeKidCategories(language).filter((category) => HOME_CATEGORY_IDS.includes(category.id));
  const autonomyWorlds = AUTONOMY_WORLDS.map((world) => {
    if (world.id === 'create' && user?.role !== 'kid') {
      return { ...world, path: world.studioPath || world.path };
    }
    return world;
  });

  const handlePlayBook = (book) => {
    const progress = progressRows.find((row) => row.book_id === book.id);
    const pageQuery = progress?.current_page ? `?page=${progress.current_page}` : '';
    if (book.id) {
      navigate(`/kids/read/${book.id}${pageQuery}`);
      return;
    }
    navigate(getKidsContentPath(book));
  };

  const carouselProps = {
    isRtl,
    showActions: false,
    hideTitle: true,
    hideSectionTitle: false,
    onPlay: handlePlayBook,
    modality: 'books',
  };

  const lastActivityBook = progressRows[0];
  const lastActivityText = lastActivityBook?.book_title || null;

  if (loading) {
    return (
      <KidsPageShell isRtl={isRtl} variant="home" className="pb-32" footer={<KidsBottomNav />}>
        <div className="px-6 py-8 space-y-8">
          <div className="kids-premium-panel h-72 animate-pulse" />
          <BookGridSkeleton count={5} variant="carousel" />
        </div>
      </KidsPageShell>
    );
  }

  return (
    <KidsPageShell isRtl={isRtl} variant="home" className="pb-32 kids-hero-glow" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar
            src={avatarSrc}
            initials={avatarInitials}
            alt={kidName}
            size="lg"
            className="w-16 h-16 border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-400 text-white shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-foreground truncate">
              {greeting} <span className="text-primary-600">{kidName}</span>
            </h1>
            <p className="hidden sm:block text-sm font-bold text-foreground-muted">{t('readyToPlay')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LitMascot showBubble={false} size="small" className="hidden sm:flex" />
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 space-y-8 mt-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="cursor-pointer"
          onClick={() => {
            if (!featuredBook) {
              navigate('/kids/library');
              return;
            }
            const pageQuery = featuredBook.isInProgress ? `?page=${featuredBook.currentPage}` : '';
            navigate(`/kids/read/${featuredBook.id}${pageQuery}`);
          }}
        >
          <div className="relative h-72 md:h-[22rem] w-full rounded-[2.5rem] overflow-hidden shadow-kids-soft group border-4 border-white/70">
            {featuredBook?.cover_image ? (
              <img
                src={getImageUrl(featuredBook.cover_image)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${getKidsModality('books').gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="kids-touch-target w-24 h-24 md:w-28 md:h-28 bg-white/35 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/60 group-hover:scale-110 transition-transform shadow-kids-warm">
                <PlayIcon className={`w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-md ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} filled />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-5 md:p-7 flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex min-h-9 items-center bg-primary-500/90 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-black border border-white/40 uppercase tracking-wide mb-2">
                    {featuredBook?.isInProgress ? t('resume') : t('discover')}
                  </span>
                  {featuredBook?.title && (
                    <h2 className="text-white font-black text-2xl md:text-3xl drop-shadow-md truncate">{featuredBook.title}</h2>
                  )}
                </div>
                <span className="text-white font-black drop-shadow-md text-xl shrink-0">{featuredBook?.progress || 0}%</span>
              </div>
              <div className="h-4 w-full bg-black/35 rounded-full overflow-hidden border border-white/25 backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${featuredBook?.progress || 0}%` }}
                  className="h-full bg-gradient-to-r from-primary-300 to-accent-300 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.section>

        <section aria-label={t('kidsAutonomyWorlds')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {autonomyWorlds.map((world) => {
              const theme = getKidsModality(world.modality);
              return (
                <motion.button
                  key={world.id}
                  type="button"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(world.path)}
                  className={`kids-touch-target rounded-[2rem] bg-gradient-to-br ${theme.gradient} p-5 md:p-6 text-white shadow-kids-soft border-4 border-white/50 min-h-[8rem] flex flex-col items-center justify-center gap-2`}
                  aria-label={t(world.labelKey)}
                >
                  <span className="text-5xl md:text-6xl" aria-hidden="true">{world.emoji}</span>
                  <span className="font-black text-base md:text-lg">{t(world.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <KidsFamilyMessages />

        {continueBooks.length > 0 && (
          <KidsBookCarousel
            title={t('continueReading')}
            emoji="📖"
            books={continueBooks}
            {...carouselProps}
          />
        )}

        {favoriteBooks.length > 0 && (
          <KidsBookCarousel
            title={t('yourFavorites')}
            emoji="❤️"
            books={favoriteBooks}
            {...carouselProps}
            modality="favorites"
          />
        )}

        {recommendedBooks.length > 0 ? (
          <KidsBookCarousel
            title={t('forYou')}
            emoji="⭐"
            books={recommendedBooks}
            {...carouselProps}
          />
        ) : (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            compact
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
        )}

        {newBooks.length > 0 && (
          <KidsBookCarousel
            title={t('newBooks')}
            emoji="🆕"
            books={newBooks}
            {...carouselProps}
          />
        )}

        {popularBooks.length > 0 && (
          <KidsBookCarousel
            title={t('popularStories')}
            emoji="🔥"
            books={popularBooks}
            {...carouselProps}
          />
        )}

        <section>
          <h2 className="kids-shelf-title mb-5 px-2">
            <span aria-hidden="true">🗂️</span>
            <span className="sr-only sm:not-sr-only">{t('allCategories')}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {kidCategories.map((category) => (
              <KidCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        <section id="kids-profile" className="scroll-mt-24">
          <KidsProfilePanel
            kid={kid}
            kidName={kidName}
            progressRows={progressRows}
            favoriteBooks={favoriteBooks}
            lastActivity={lastActivityText}
            t={t}
            isRtl={isRtl}
            onPlayBook={handlePlayBook}
          />
        </section>

        <section id="kids-medals" className="mb-12 scroll-mt-24">
          <h2 className="kids-shelf-title mb-6 pl-2">
            <span aria-hidden="true">🏆</span>
            <span>{t('yourMedals')}</span>
          </h2>
          {badges.length === 0 ? (
            <KidsEmptyState
              emoji="🏅"
              title={t('emptyBadgesTitle')}
              compact
              actionLabel={t('goToLibrary')}
              onAction={() => navigate('/kids/library')}
            />
          ) : (
            <div className="flex flex-wrap gap-6 justify-center md:justify-start px-2">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 10, 0] }}
                  title={`${badge.label} — ${badge.description}`}
                  className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl border-8 ${badge.earned ? 'bg-gradient-to-br from-accent-300 via-accent-400 to-primary-400 border-accent-200' : 'bg-surface-200 border-surface-300 grayscale opacity-60'}`}
                >
                  {badge.earned ? (
                    <>
                      <span className="filter drop-shadow-lg z-10 relative">{badge.icon}</span>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-4 border-dashed border-white/40" />
                    </>
                  ) : (
                    <LockIcon className="w-10 h-10 text-surface-400" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <VoiceAssistant onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsHome;
