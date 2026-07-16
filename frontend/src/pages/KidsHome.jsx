import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories, getKidCategory } from '../constants/kidCategories';
import { getKidsModality } from '../constants/kidsModality';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsMascot } from '../components/kids/KidsMascot';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidCategoryCard } from '../components/kids/KidCategoryCard';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { KidsHeroStoryCard } from '../components/kids/KidsHeroStoryCard';
import { KidsContinueRail } from '../components/kids/KidsContinueRail';
import { Logo } from '../components/Logo';
import { parentalAPI } from '../api/parental';
import { recommendationsAPI } from '../api/recommendations';
import { booksAPI } from '../api/books';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getKidsContentPath } from '../utils/contentRouting';
import { useToast } from '../components/ToastProvider';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { LockIcon } from '../components/Icons';
import { getCachedKidProfile } from '../services/cloud/cloudSyncService';
import { Avatar, CategoryCard } from '../components/ui';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsProfilePanel } from '../components/kids/KidsProfilePanel';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { bookMatchesKidCategory, getCategoryContentStrategy } from '../utils/kidCategoryContent';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, kidsHoverLift } from '../constants/kidsMotion';

function getRecommendedBooks(sections = []) {
  const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
  return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

const AUTONOMY_WORLDS = [
  { id: 'library', path: '/kids/library', emoji: '📚', labelKey: 'kidsWorldBooks', modality: 'books' },
  { id: 'audio', path: '/kids/audio', emoji: '🎧', labelKey: 'kidsWorldAudio', modality: 'audio' },
  { id: 'learning', path: '/kids/learning', emoji: '🎮', labelKey: 'kidsWorldLearn', modality: 'learn' },
  { id: 'create', path: '/kids/ai-stories', emoji: '✨', labelKey: 'kidsWorldCreate', modality: 'create', studioPath: '/kids/story-studio' },
];

const HOME_CATEGORY_IDS = ['dinosaurs', 'space', 'animals', 'princesses', 'bedtime', 'ocean', 'vehicles', 'world', 'colors', 'spirituality'];

const MAGIC_STRATEGY = {
  type: 'books',
  themeId: 'princesses',
  match: ['princess', 'princesse', 'fairy', 'conte', 'tale', 'magic', 'magie', 'wizard', 'sorci', 'enchant', 'fee'],
};

function filterBooksByCategory(books, categoryId) {
  const strategy = categoryId === 'magic'
    ? MAGIC_STRATEGY
    : getCategoryContentStrategy(categoryId);
  return books.filter((book) => bookMatchesKidCategory(book, strategy)).slice(0, 12);
}

function KidsHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
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

  const favoriteBooks = useMemo(
    () => publishedBooks.filter((book) => favoriteIds.includes(book.id)),
    [publishedBooks, favoriteIds],
  );

  const newBooks = useMemo(
    () => [...publishedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15),
    [publishedBooks],
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

  const featuredBook = useMemo(() => {
    const base = continueReading
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

    if (!base?.id) return base;
    const enrichment = publishedBooks.find((book) => book.id === base.id);
    return enrichment ? { ...enrichment, ...base } : base;
  }, [continueReading, recommendedBooks, publishedBooks]);

  const bedtimeBooks = useMemo(() => filterBooksByCategory(publishedBooks, 'bedtime'), [publishedBooks]);
  const animalBooks = useMemo(() => filterBooksByCategory(publishedBooks, 'animals'), [publishedBooks]);
  const spaceBooks = useMemo(() => filterBooksByCategory(publishedBooks, 'space'), [publishedBooks]);
  const magicBooks = useMemo(() => filterBooksByCategory(publishedBooks, 'magic'), [publishedBooks]);

  const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];
  const kidCategories = localizeKidCategories(language).filter((category) => HOME_CATEGORY_IDS.includes(category.id));
  const bedtimeLabel = getKidCategory('bedtime', language)?.label || 'Bedtime';
  const animalsLabel = getKidCategory('animals', language)?.label || 'Animals';
  const spaceLabel = getKidCategory('space', language)?.label || 'Space';
  const magicLabel = getKidCategory('princesses', language)?.label || 'Magic';

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

  const handleListenBook = (book) => {
    if (book?.id) {
      navigate(`/kids/listen/${book.id}`);
      return;
    }
    navigate('/kids/audio');
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
      <KidsPageShell isRtl={isRtl} variant="home" world="home" className="pb-space-32" footer={<KidsBottomNav />}>
        <div className="px-6 py-space-8 space-y-space-8">
          <div className="kids-premium-panel h-52 animate-pulse" />
          <BookGridSkeleton count={5} variant="carousel" />
        </div>
      </KidsPageShell>
    );
  }

  return (
    <KidsPageShell isRtl={isRtl} variant="home" world="home" className="pb-space-32 kids-hero-glow" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-space-24 py-space-16 flex items-center justify-between gap-space-16">
        <div className="flex items-center gap-space-16 min-w-0">
          <Avatar
            src={avatarSrc}
            initials={avatarInitials}
            alt={kidName}
            size="lg"
            className="w-space-64 h-space-64 border-4 border-surface shadow-card bg-gradient-to-br from-primary-400 to-secondary-400 text-white shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-heading-l truncate">
              {greeting} <span className="text-primary-600">{kidName}</span>
            </h1>
            <p className="hidden sm:block text-body line-clamp-1">{t('kidsDiscoverToday')}</p>
          </div>
        </div>
        <div className="flex items-center gap-space-12 shrink-0">
          <KidsMascot mood="wave" size="small" showBubble className="hidden sm:block" />
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-full">
            <Logo size="default" showText={false} />
          </Link>
        </div>
      </header>

      <main className="kids-main kids-main-tablet-wide relative z-20 mt-2">
        <KidsHeroStoryCard
          book={featuredBook}
          isRtl={isRtl}
          t={t}
          onRead={handlePlayBook}
          onListen={handleListenBook}
          emptyLabel={t('emptyBooksTitle')}
          onEmptyAction={() => navigate('/kids/library')}
        />

        <section aria-label={t('kidsAutonomyWorlds')}>
          <KidsTrustBadges t={t} compact className="mb-space-16 opacity-90" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-16">
            {autonomyWorlds.map((world) => {
              const theme = getKidsModality(world.modality);
              return (
                <CategoryCard
                  key={world.id}
                  emoji={world.emoji}
                  title={t(world.labelKey)}
                  tone={theme.tone}
                  onClick={() => navigate(world.path)}
                  className="min-h-[8.5rem]"
                />
              );
            })}
          </div>
        </section>

        <KidsFamilyMessages />

        {continueBooks.length > 0 && (
          <KidsContinueRail
            books={continueBooks}
            title={t('continueReading')}
            emoji="⭐"
            isRtl={isRtl}
            t={t}
            onResume={handlePlayBook}
          />
        )}

        {recommendedBooks.length > 0 ? (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={t('forYou')}
              emoji="⭐"
              books={recommendedBooks}
              {...carouselProps}
            />
          </div>
        ) : (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            compact
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
            showMascot
          />
        )}

        {bedtimeBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={bedtimeLabel}
              emoji="🌙"
              books={bedtimeBooks}
              {...carouselProps}
            />
          </div>
        )}

        {animalBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={animalsLabel}
              emoji="🦁"
              books={animalBooks}
              {...carouselProps}
            />
          </div>
        )}

        {spaceBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={spaceLabel}
              emoji="🚀"
              books={spaceBooks}
              {...carouselProps}
            />
          </div>
        )}

        {magicBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={magicLabel}
              emoji="🧙"
              books={magicBooks}
              {...carouselProps}
            />
          </div>
        )}

        {favoriteBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={t('kidsRecentlyLoved')}
              emoji="❤️"
              books={favoriteBooks}
              {...carouselProps}
              modality="favorites"
            />
          </div>
        )}

        {newBooks.length > 0 && (
          <div className="kids-shelf-rail">
            <KidsBookCarousel
              title={t('newBooks')}
              emoji="🆕"
              books={newBooks}
              {...carouselProps}
            />
          </div>
        )}

        <section aria-label={t('allCategories')}>
          <h2 className="kids-shelf-title mb-space-20 px-space-8">
            <span aria-hidden="true">🗂️</span>
            <span className="sr-only">{t('allCategories')}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-16 md:gap-space-20">
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
            onGoToLibrary={() => navigate('/kids/library')}
          />
        </section>

        <section id="kids-medals" className="mb-space-12 scroll-mt-24">
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
              showMascot
              mascotMood="encourage"
            />
          ) : (
            <div className="flex flex-wrap gap-6 justify-center md:justify-start px-2">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  {...getHoverMotion(reducedMotion, kidsHoverLift)}
                  title={`${badge.label} — ${badge.description}`}
                  className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-card border-8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${badge.earned ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-primary-400 border-orange-200' : 'bg-surface-200 border-surface-300 grayscale opacity-60'}`}
                >
                  {badge.earned ? (
                    <span className="filter drop-shadow-lg z-10 relative" aria-hidden="true">{badge.icon}</span>
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
