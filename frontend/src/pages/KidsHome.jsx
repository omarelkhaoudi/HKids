import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories, getKidCategory } from '../constants/kidCategories';
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
import { Avatar } from '../components/ui';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsProfilePanel } from '../components/kids/KidsProfilePanel';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { bookMatchesKidCategory, getCategoryContentStrategy } from '../utils/kidCategoryContent';
import {
  annotateBooksWithReasons,
  filterByAgeBand,
  filterSeasonalBooks,
  inferLikedThemeId,
  isShortStory,
  withDiscoveryReason,
} from '../utils/discoveryRails';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, kidsHoverLift, getMotionProps, kidsCarouselReveal } from '../constants/kidsMotion';

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

const WORLD_CATEGORY_IDS = ['animals', 'space', 'princesses', 'bedtime', 'dinosaurs', 'ocean', 'world', 'colors'];

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
    // Today's Adventure: prefer a recommended pick that is NOT the continue book
    const continueId = continueReading?.book_id;
    const adventureCandidate = recommendedBooks.find((book) => book.id !== continueId)
      || recommendedBooks[0]
      || newBooks[0]
      || publishedBooks[0]
      || null;

    if (!adventureCandidate?.id) return null;
    const enrichment = publishedBooks.find((book) => book.id === adventureCandidate.id);
    const merged = enrichment ? { ...enrichment, ...adventureCandidate } : adventureCandidate;
    return {
      ...merged,
      progress: Number(merged.kid_progress_percent || 0),
      isInProgress: false,
    };
  }, [continueReading, recommendedBooks, newBooks, publishedBooks]);

  const bedtimeBooks = useMemo(() => filterBooksByCategory(publishedBooks, 'bedtime'), [publishedBooks]);
  const kidCategories = localizeKidCategories(language).filter((category) => WORLD_CATEGORY_IDS.includes(category.id));

  const likedThemeId = useMemo(
    () => inferLikedThemeId(favoriteBooks, localizeKidCategories(language)),
    [favoriteBooks, language],
  );
  const likedTheme = likedThemeId ? getKidCategory(likedThemeId, language) : null;

  const becauseYouLikedBooks = useMemo(() => {
    if (!likedThemeId) {
      return annotateBooksWithReasons(favoriteBooks.slice(0, 12), t('discoverReasonLoved'));
    }
    const themed = filterBooksByCategory(publishedBooks, likedThemeId)
      .filter((book) => !favoriteIds.includes(book.id))
      .slice(0, 12);
    const reason = t('discoverBecauseYouLiked', { theme: likedTheme?.shortLabel || likedTheme?.label || likedThemeId });
    return annotateBooksWithReasons(themed.length ? themed : favoriteBooks.slice(0, 12), reason);
  }, [likedThemeId, likedTheme, publishedBooks, favoriteBooks, favoriteIds, t]);

  const recommendedForYou = useMemo(
    () => recommendedBooks.map((book) => {
      if (isShortStory(book)) return withDiscoveryReason(book, t('discoverReasonShort'));
      if (book.age_group_min != null && book.age_group_max != null) {
        return withDiscoveryReason(book, t('discoverReasonAges', { min: book.age_group_min, max: book.age_group_max }));
      }
      return withDiscoveryReason(book, t('forYou'));
    }),
    [recommendedBooks, t],
  );

  const recentlyAdded = useMemo(
    () => annotateBooksWithReasons(newBooks, t('discoverReasonNew')),
    [newBooks, t],
  );

  const seasonalBooks = useMemo(
    () => annotateBooksWithReasons(filterSeasonalBooks(publishedBooks), t('discoverSeasonal')),
    [publishedBooks, t],
  );

  const collectionLittle = useMemo(
    () => annotateBooksWithReasons(filterByAgeBand(publishedBooks, 2, 5), t('discoverCollectionLittle')),
    [publishedBooks, t],
  );
  const collectionGrowing = useMemo(
    () => annotateBooksWithReasons(filterByAgeBand(publishedBooks, 5, 8), t('discoverCollectionGrowing')),
    [publishedBooks, t],
  );
  const collectionBig = useMemo(
    () => annotateBooksWithReasons(filterByAgeBand(publishedBooks, 8, 12), t('discoverCollectionBig')),
    [publishedBooks, t],
  );

  const bedtimeAnnotated = useMemo(
    () => annotateBooksWithReasons(bedtimeBooks, t('discoverReasonBedtime')),
    [bedtimeBooks, t],
  );

  const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];

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
    seeAllLabel: t('seeAll'),
    onSeeAll: () => navigate('/kids/library'),
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
            className="w-space-64 h-space-64 border-2 border-surface shadow-soft bg-gradient-to-br from-primary-400 to-primary-600 text-white shrink-0"
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

      <main className="kids-main kids-main-tablet-wide relative z-20 mt-2 space-y-space-20">
        {/* 1. Continue Reading — always first */}
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

        {/* 2. Today's Adventure — one featured story */}
        <KidsHeroStoryCard
          book={featuredBook}
          isRtl={isRtl}
          t={t}
          onRead={handlePlayBook}
          onListen={handleListenBook}
          emptyLabel={t('emptyBooksTitle')}
          onEmptyAction={() => navigate('/kids/library')}
          badgeLabel={t('kidsStoriesToday')}
        />
        {featuredBook && (
          <p className="px-space-8 -mt-space-12 text-caption font-bold text-foreground-muted">
            {t('discoverAdventureSubtitle')}
          </p>
        )}

        {/* 3. Recommended For You */}
        {recommendedForYou.length > 0 ? (
          <KidsBookCarousel
            title={t('forYou')}
            subtitle={t('discoverRecommendedSubtitle')}
            emoji="✨"
            books={recommendedForYou}
            {...carouselProps}
          />
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

        {/* 4. Recently Added */}
        {recentlyAdded.length > 0 && (
          <KidsBookCarousel
            title={t('newBooks')}
            subtitle={t('discoverNewSubtitle')}
            emoji="🆕"
            books={recentlyAdded}
            {...carouselProps}
          />
        )}

        {/* 5. Because You Liked... */}
        {becauseYouLikedBooks.length > 0 && (
          <KidsBookCarousel
            title={likedTheme
              ? t('discoverBecauseYouLiked', { theme: likedTheme.shortLabel || likedTheme.label })
              : t('kidsRecentlyLoved')}
            subtitle={t('discoverBecauseSubtitle')}
            emoji="❤️"
            books={becauseYouLikedBooks}
            {...carouselProps}
            modality="favorites"
          />
        )}

        {/* 6. Categories as visual worlds */}
        <motion.section aria-label={t('allCategories')} {...getMotionProps(reducedMotion, kidsCarouselReveal)}>
          <div className="mb-space-16 px-space-8 md:px-space-16 flex items-end justify-between gap-space-12">
            <div>
              <h2 className="kids-shelf-title !mb-0">
                <span aria-hidden="true">🗺️</span>
                <span>{t('kidsWorldsExplore')}</span>
              </h2>
              <p className="mt-space-4 text-caption font-bold text-foreground-muted">{t('discoverCategoriesSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/kids/library')}
              className="kids-touch-target inline-flex min-h-touch items-center rounded-full border-2 border-border bg-card px-space-16 py-space-8 text-caption font-black text-primary-600 shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
            >
              {t('seeAll')}
            </button>
          </div>
          <div className="kids-discovery-rail pb-space-8">
            {kidCategories.map((category) => (
              <KidCategoryCard key={category.id} category={category} compact />
            ))}
          </div>
        </motion.section>

        {/* Bedtime world shelf — atmospheric accent */}
        {bedtimeAnnotated.length > 0 && (
          <KidsBookCarousel
            title={getKidCategory('bedtime', language)?.label || 'Bedtime'}
            subtitle={t('discoverReasonBedtime')}
            emoji="🌙"
            books={bedtimeAnnotated}
            {...carouselProps}
            onSeeAll={() => navigate('/kids/library?theme=bedtime')}
          />
        )}

        {/* 7. Collections (age bands) */}
        {(collectionLittle.length > 0 || collectionGrowing.length > 0 || collectionBig.length > 0) && (
          <section aria-label={t('discoverCollections')} className="space-y-space-16">
            <div className="px-space-8 md:px-space-16">
              <h2 className="kids-shelf-title !mb-0">
                <span aria-hidden="true">📚</span>
                <span>{t('discoverCollections')}</span>
              </h2>
              <p className="mt-space-4 text-caption font-bold text-foreground-muted">{t('discoverCollectionsSubtitle')}</p>
            </div>
            {collectionLittle.length > 0 && (
              <KidsBookCarousel
                title={t('discoverCollectionLittle')}
                emoji="🐣"
                books={collectionLittle}
                {...carouselProps}
              />
            )}
            {collectionGrowing.length > 0 && (
              <KidsBookCarousel
                title={t('discoverCollectionGrowing')}
                emoji="🌱"
                books={collectionGrowing}
                {...carouselProps}
              />
            )}
            {collectionBig.length > 0 && (
              <KidsBookCarousel
                title={t('discoverCollectionBig')}
                emoji="🚀"
                books={collectionBig}
                {...carouselProps}
              />
            )}
          </section>
        )}

        {/* 8. Seasonal Stories */}
        {seasonalBooks.length > 0 && (
          <KidsBookCarousel
            title={t('discoverSeasonal')}
            subtitle={t('discoverSeasonalSubtitle')}
            emoji="🍂"
            books={seasonalBooks}
            {...carouselProps}
          />
        )}

        {/* Autonomy worlds — secondary navigation */}
        <motion.section
          aria-label={t('kidsAutonomyWorlds')}
          {...getMotionProps(reducedMotion, kidsCarouselReveal)}
        >
          <h2 className="kids-shelf-title mb-space-16 px-space-8">
            <span aria-hidden="true">🌍</span>
            <span>{t('kidsAutonomyWorlds')}</span>
          </h2>
          <div className="kids-discovery-rail">
            {autonomyWorlds.map((world) => {
              return (
                <motion.button
                  key={world.id}
                  type="button"
                  {...getHoverMotion(reducedMotion, kidsHoverLift)}
                  onClick={() => navigate(world.path)}
                  className="kids-world-portal shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  aria-label={t(world.labelKey)}
                >
                  <span className="text-4xl" aria-hidden="true">{world.emoji}</span>
                  <span className="text-body font-bold text-foreground">{t(world.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <KidsFamilyMessages />

        <details className="kids-profile-fold rounded-32 border border-border/70 bg-card shadow-soft overflow-hidden">
          <summary className="kids-touch-target cursor-pointer list-none px-space-24 py-space-16 text-heading-m font-bold text-foreground flex items-center justify-between gap-space-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300">
            <span className="flex items-center gap-space-12">
              <span aria-hidden="true">👤</span>
              {kidName ? `${kidName}` : t('yourMedals')}
            </span>
            <span className="text-caption text-foreground-muted font-bold">{t('yourMedals')}</span>
          </summary>
          <div className="px-space-16 pb-space-24 space-y-space-24">
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
            <section id="kids-medals" className="scroll-mt-24">
              <h2 className="kids-shelf-title mb-space-16 pl-space-8">
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
                <div className="flex flex-wrap gap-space-16 justify-center md:justify-start px-space-8">
                  {badges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      {...getHoverMotion(reducedMotion, kidsHoverLift)}
                      title={`${badge.label} — ${badge.description}`}
                      className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-card border-8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${badge.earned ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-primary-400 border-orange-200' : 'bg-surface-200 border-surface-300 grayscale opacity-60'}`}
                    >
                      {badge.earned ? (
                        <span className="filter drop-shadow-lg z-10 relative" aria-hidden="true">{badge.icon}</span>
                      ) : (
                        <LockIcon className="w-8 h-8 text-surface-400" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </details>

        <KidsTrustBadges t={t} compact className="opacity-80" />
      </main>

      <VoiceAssistant onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsHome;
