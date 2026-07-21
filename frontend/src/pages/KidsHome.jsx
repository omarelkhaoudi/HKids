import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories, getKidCategory } from '../constants/kidCategories';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
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
import { BookIcon, AudioIcon, SparklesIcon, StarIcon } from '../components/Icons';
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
import { shouldShowKidOnboarding } from '../utils/onboarding';

function getRecommendedBooks(sections = []) {
  const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
  return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

const AUTONOMY_WORLDS = [
  { id: 'library', path: '/kids/library', icon: BookIcon, labelKey: 'kidsWorldBooks', modality: 'books', tone: 'kids-autonomy-tile--books' },
  { id: 'audio', path: '/kids/audio', icon: AudioIcon, labelKey: 'kidsWorldAudio', modality: 'audio', tone: 'kids-autonomy-tile--audio' },
  { id: 'learning', path: '/kids/learning', icon: StarIcon, labelKey: 'kidsWorldLearn', modality: 'learn', tone: 'kids-autonomy-tile--learn' },
  { id: 'create', path: '/kids/ai-stories', icon: SparklesIcon, labelKey: 'kidsWorldCreate', modality: 'create', studioPath: '/kids/story-studio', tone: 'kids-autonomy-tile--create' },
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
    if (shouldShowKidOnboarding(user)) {
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate]);

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
      .map((item) => {
        const published = publishedBooks.find((book) => book.id === item.book_id);
        return {
          ...(published || {}),
          id: item.book_id,
          title: item.book_title || published?.title,
          cover_image: published?.cover_image || item.cover_image,
          slug: published?.slug || item.slug,
          theme: published?.theme || item.theme,
          author: published?.author || item.author,
          kid_progress_percent: item.progress_percent,
          current_page: item.current_page,
        };
      }),
    [progressRows, publishedBooks],
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
    const progressRow = progressRows.find((row) => row.book_id === merged.id);
    const progress = Number(progressRow?.progress_percent || merged.kid_progress_percent || 0);
    return {
      ...merged,
      progress,
      kid_progress_percent: progress,
      isInProgress: progress > 0 && progress < 100,
    };
  }, [continueReading, recommendedBooks, newBooks, publishedBooks, progressRows]);

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
    hideTitle: false,
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
      <KidsPageShell isRtl={isRtl} variant="home" world="home" className="pb-space-32 kids-home-shell kids-hero-glow" footer={<KidsBottomNav />}>
        <div className="kids-main kids-home-main px-space-24 py-space-24 space-y-space-24">
          <div className="kids-hero-story h-64 md:h-80 animate-pulse rounded-32" />
          <BookGridSkeleton count={5} variant="carousel" />
        </div>
      </KidsPageShell>
    );
  }

  return (
    <KidsPageShell isRtl={isRtl} variant="home" world="home" className="pb-space-32 kids-home-shell kids-hero-glow" footer={<KidsBottomNav />}>
      <div className="kids-home-atmosphere" aria-hidden="true">
        <span className="kids-home-cloud" style={{ width: '9rem', top: '8%', left: '6%' }} />
        <span className="kids-home-cloud" style={{ width: '6rem', top: '18%', right: '10%' }} />
        <span className="kids-home-star" style={{ top: '12%', left: '28%' }} />
        <span className="kids-home-star" style={{ top: '22%', right: '24%' }} />
        <span className="kids-home-star" style={{ top: '40%', left: '14%' }} />
      </div>

      <header className="kids-home-header relative z-10 px-space-20 md:px-space-32 py-space-12 md:py-space-16 flex items-center justify-between gap-space-16 sticky top-0">
        <div className="flex items-center gap-space-12 md:gap-space-16 min-w-0">
          <Avatar
            src={avatarSrc}
            initials={avatarInitials}
            alt={kidName}
            size="lg"
            className="w-12 h-12 md:w-14 md:h-14 border border-border/40 shadow-soft bg-primary-50 text-primary-700 shrink-0"
          />
          <div className="min-w-0">
            <p className="kids-type-caption">{greeting}</p>
            <p className="kids-type-h1 !text-[1.35rem] md:!text-[1.55rem] truncate">
              {kidName}
            </p>
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

      <main className="kids-main kids-main-tablet-wide kids-home-main relative z-20">
        {/* 1. Today's Adventure */}
        <section aria-label={t('kidsStoriesToday')} className="kids-home-hero-section">
          <KidsHeroStoryCard
            book={featuredBook}
            isRtl={isRtl}
            t={t}
            onRead={handlePlayBook}
            onListen={handleListenBook}
            onContinue={handlePlayBook}
            emptyLabel={t('emptyBooksTitle')}
            onEmptyAction={() => navigate('/kids/library')}
            badgeLabel={t('kidsStoriesToday')}
          />
        </section>

        {/* 2. Continue Reading */}
        {continueBooks.length > 0 && (
          <KidsContinueRail
            books={continueBooks}
            title={t('continueReading')}
            isRtl={isRtl}
            t={t}
            onResume={handlePlayBook}
          />
        )}

        {/* 3. Recommended For You */}
        {recommendedForYou.length > 0 ? (
          <KidsBookCarousel
            title={t('forYou')}
            subtitle={t('discoverRecommendedSubtitle')}
            books={recommendedForYou}
            {...carouselProps}
          />
        ) : (
          <KidsEmptyState
            title={t('emptyBooksTitle')}
            compact
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
            showMascot
          />
        )}

        {/* 4. Explore Worlds */}
        <motion.section aria-label={t('allCategories')} className="kids-home-primary-shelf" {...getMotionProps(reducedMotion, kidsCarouselReveal)}>
          <div className="mb-space-24 px-space-8 md:px-space-16 flex items-end justify-between gap-space-12">
            <div>
              <h2 className="kids-shelf-title !mb-0">
                <span>{t('kidsWorldsExplore')}</span>
              </h2>
              <p className="kids-shelf-subtitle">{t('discoverCategoriesSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/kids/library')}
              className="kids-touch-target inline-flex min-h-[56px] items-center rounded-full border border-border/40 bg-card/80 px-space-16 py-space-8 kids-type-caption font-semibold text-primary-700 shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              {t('seeAll')}
            </button>
          </div>
          <div className="kids-discovery-rail pb-space-8 !gap-space-20 md:!gap-space-24">
            {kidCategories.map((category) => (
              <KidCategoryCard key={category.id} category={category} compact />
            ))}
          </div>
        </motion.section>

        {/* 5. New Stories */}
        {recentlyAdded.length > 0 && (
          <KidsBookCarousel
            title={t('newBooks')}
            subtitle={t('discoverNewSubtitle')}
            books={recentlyAdded}
            {...carouselProps}
          />
        )}

        {/* Secondary discovery — quieter visual weight */}
        <div className="kids-home-secondary-shelves space-y-[inherit]">
          {becauseYouLikedBooks.length > 0 && (
            <KidsBookCarousel
              title={likedTheme
                ? t('discoverBecauseYouLiked', { theme: likedTheme.shortLabel || likedTheme.label })
                : t('kidsRecentlyLoved')}
              subtitle={t('discoverBecauseSubtitle')}
              books={becauseYouLikedBooks}
              {...carouselProps}
              modality="favorites"
            />
          )}

          {bedtimeAnnotated.length > 0 && (
            <KidsBookCarousel
              title={getKidCategory('bedtime', language)?.label || 'Bedtime'}
              subtitle={t('discoverReasonBedtime')}
              books={bedtimeAnnotated}
              {...carouselProps}
              onSeeAll={() => navigate('/kids/library?theme=bedtime')}
            />
          )}

          {(collectionLittle.length > 0 || collectionGrowing.length > 0 || collectionBig.length > 0) && (
            <section aria-label={t('discoverCollections')} className="space-y-space-32">
              <div className="px-space-8 md:px-space-16">
                <h2 className="kids-shelf-title !mb-0">
                  <span>{t('discoverCollections')}</span>
                </h2>
                <p className="kids-shelf-subtitle">{t('discoverCollectionsSubtitle')}</p>
              </div>
              {collectionLittle.length > 0 && (
                <KidsBookCarousel
                  title={t('discoverCollectionLittle')}
                  books={collectionLittle}
                  {...carouselProps}
                />
              )}
              {collectionGrowing.length > 0 && (
                <KidsBookCarousel
                  title={t('discoverCollectionGrowing')}
                  books={collectionGrowing}
                  {...carouselProps}
                />
              )}
              {collectionBig.length > 0 && (
                <KidsBookCarousel
                  title={t('discoverCollectionBig')}
                  books={collectionBig}
                  {...carouselProps}
                />
              )}
            </section>
          )}

          {seasonalBooks.length > 0 && (
            <KidsBookCarousel
              title={t('discoverSeasonal')}
              subtitle={t('discoverSeasonalSubtitle')}
              books={seasonalBooks}
              {...carouselProps}
            />
          )}
        </div>

        {/* Autonomy worlds — illustration-first tiles, no emoji game buttons */}
        <motion.section
          aria-label={t('kidsAutonomyWorlds')}
          className="kids-home-autonomy"
          {...getMotionProps(reducedMotion, kidsCarouselReveal)}
        >
          <h2 className="kids-shelf-title mb-space-20 px-space-8 md:px-space-16">
            <span>{t('kidsAutonomyWorlds')}</span>
          </h2>
          <div className="kids-discovery-rail !gap-space-16 md:!gap-space-20">
            {autonomyWorlds.map((world) => {
              const WorldIcon = world.icon;
              return (
                <motion.button
                  key={world.id}
                  type="button"
                  {...getHoverMotion(reducedMotion, kidsHoverLift)}
                  onClick={() => navigate(world.path)}
                  className={`kids-autonomy-tile ${world.tone} shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300`}
                  aria-label={t(world.labelKey)}
                >
                  <span className="kids-autonomy-tile-icon" aria-hidden="true">
                    <WorldIcon className="h-7 w-7" />
                  </span>
                  <span className="kids-autonomy-tile-label">{t(world.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <KidsFamilyMessages />

        <section className="kids-profile-universe-wrap px-space-8 md:px-space-16 pb-space-24">
          <KidsProfilePanel
            kid={kid}
            kidName={kidName}
            greeting={greeting}
            progressRows={progressRows}
            favoriteBooks={favoriteBooks}
            publishedBooks={publishedBooks}
            badges={badges}
            lastActivity={lastActivityText}
            t={t}
            isRtl={isRtl}
            onPlayBook={handlePlayBook}
            onGoToLibrary={() => navigate('/kids/library')}
          />
        </section>

        <KidsTrustBadges t={t} compact className="opacity-60" />
      </main>

      <VoiceAssistant onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsHome;
