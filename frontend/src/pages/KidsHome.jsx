import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories } from '../constants/kidCategories';
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
import { booksAPI } from '../api/books';
import { loadRecommendations } from '../services/recommendations/recommendationEngine';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getKidsContentPath } from '../utils/contentRouting';
import { useToast } from '../components/ToastProvider';
import { Avatar } from '../components/ui';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsProfilePanel } from '../components/kids/KidsProfilePanel';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, kidsHoverLift, getMotionProps, kidsCarouselReveal } from '../constants/kidsMotion';
import { shouldShowKidOnboarding } from '../utils/onboarding';
import { buildKidsGreeting } from '../utils/kidsGreeting';
import {
  buildSoftProgressSummary,
  collectCompletedBookIds,
  getKidsPersonalizationProfile,
  pickFeaturedBook,
  reorderCategoriesByWorlds,
} from '../utils/kidsPersonalization';
import { buildSmartHomeSections, recordShownBooks } from '../utils/personalizationEngine';
import { withPersonalizationLabels } from '../constants/personalizationLabels';
import { buildFinishedStories } from '../utils/bookPreview';
import { KidsHomeProgressStrip } from '../components/kids/KidsHomeProgressStrip';
import { KidsAchievementStrip } from '../components/kids/KidsAchievementStrip';
import { KidsGuideCompanion } from '../components/kids/KidsGuideCompanion';
import { KIDS_PICTOGRAMS, getGuideVoicePhrase, getCategoryVoicePhrase } from '../utils/kidsGuidePhrases';
import { playKidsUiSound } from '../utils/kidsUiSound';
import { useKidsVoiceGuide } from '../hooks/useKidsVoiceGuide';
import { getCachedKidProfile } from '../services/cloud/cloudSyncService';

function getRecommendedBooks(sections = []) {
  const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
  return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

const AUTONOMY_WORLDS = [
  { id: 'library', path: '/kids/library', pictogram: KIDS_PICTOGRAMS.library, labelKey: 'kidsWorldBooks', modality: 'books', tone: 'kids-autonomy-tile--books', voiceKey: 'library' },
  { id: 'audio', path: '/kids/audio', pictogram: KIDS_PICTOGRAMS.audio, labelKey: 'kidsWorldAudio', modality: 'audio', tone: 'kids-autonomy-tile--audio', voiceKey: 'audio' },
  { id: 'learning', path: '/kids/explore', pictogram: KIDS_PICTOGRAMS.learn, labelKey: 'kidsWorldLearn', modality: 'learn', tone: 'kids-autonomy-tile--learn', voiceKey: 'explore' },
  { id: 'create', path: '/kids/ai-stories', pictogram: KIDS_PICTOGRAMS.create, labelKey: 'kidsWorldCreate', modality: 'create', studioPath: '/kids/story-studio', tone: 'kids-autonomy-tile--create', voiceKey: 'explore' },
];

const WORLD_CATEGORY_IDS = ['animals', 'space', 'princesses', 'bedtime', 'dinosaurs', 'ocean', 'world', 'colors'];

function KidsHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, isRtl, t: tRaw } = useLanguage();
  const t = useMemo(() => withPersonalizationLabels(tRaw, language), [tRaw, language]);
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const { speakGuide } = useKidsVoiceGuide(language);
  const [guideMessage, setGuideMessage] = useState(null);
  const personalization = getKidsPersonalizationProfile();
  const [homeData, setHomeData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [publishedBooks, setPublishedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shouldShowKidOnboarding(user)) {
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate]);

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
        const [overviewResult, booksResult] = await Promise.allSettled([
          parentalAPI.getConnectedKidOverview(),
          booksAPI.getPublishedBooks({ language }),
        ]);

        if (!active) return;

        let overviewData = null;
        if (overviewResult.status === 'fulfilled') {
          overviewData = overviewResult.value.data;
          setHomeData(overviewData);
        } else {
          console.warn('Connected kid overview unavailable:', overviewResult.reason);
          if (user?.kid_profile_id) {
            const cachedProfile = await getCachedKidProfile(user.kid_profile_id);
            if (cachedProfile && active) {
              overviewData = {
                kid: cachedProfile,
                progress: [],
              };
              setHomeData(overviewData);
            }
          }
        }

        if (booksResult.status === 'fulfilled') {
          const books = booksResult.value.data || [];
          setPublishedBooks(books);
          const recommendationPayload = await loadRecommendations({
            surface: 'home',
            language,
            books,
            kid: overviewData?.kid || null,
          });
          if (active) setRecommendations(recommendationPayload);
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
  const displayName = personalization.nickname || kid?.name || user?.username || '';
  const avatarSrc = kid?.photo_url ? getImageUrl(kid.photo_url) : null;
  const avatarInitials = personalization.avatar
    || kid?.avatar
    || displayName.trim().charAt(0).toUpperCase()
    || '?';
  const progressRows = Array.isArray(homeData?.progress) ? homeData.progress : [];
  const completedBookIds = useMemo(
    () => collectCompletedBookIds(progressRows),
    [progressRows],
  );
  const continueReading = progressRows.find((item) => (
    !item.completed && Number(item.progress_percent || 0) > 0
  )) || null;
  const recommendedBooks = getRecommendedBooks(recommendations?.sections || []);
  const favoriteIdsKey = storage.getFavorites().join(',');
  const favoriteIds = useMemo(
    () => (favoriteIdsKey ? storage.getFavorites() : []),
    [favoriteIdsKey],
  );

  const favoriteBooks = useMemo(
    () => publishedBooks.filter((book) => favoriteIds.includes(book.id)),
    [publishedBooks, favoriteIds],
  );

  const newBooks = useMemo(
    () => [...publishedBooks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15),
    [publishedBooks],
  );

  const smartHome = useMemo(
    () => buildSmartHomeSections({
      publishedBooks,
      recommendedBooks,
      progressRows,
      favoriteBooks,
      recommendations,
      t,
      language,
    }),
    [publishedBooks, recommendedBooks, progressRows, favoriteBooks, recommendations, t, language],
  );

  useEffect(() => {
    const ids = smartHome.impressionIds || [];
    if (!ids.length) return;
    recordShownBooks(ids);
  }, [smartHome.impressionIds?.join(',')]);

  const continueBooks = smartHome.continueBooks || [];

  const softProgress = useMemo(
    () => buildSoftProgressSummary({
      progressRows,
      favoriteWorlds: personalization.favoriteWorlds,
      t,
    }),
    [progressRows, personalization.favoriteWorlds, t],
  );

  const greeting = useMemo(
    () => buildKidsGreeting({
      t,
      nickname: displayName,
      favoriteWorlds: personalization.favoriteWorlds,
      readingGoal: personalization.readingGoal,
      hasContinue: continueBooks.length > 0,
      completedCount: softProgress.completed,
    }),
    [
      t,
      displayName,
      personalization.favoriteWorlds,
      personalization.readingGoal,
      continueBooks.length,
      softProgress.completed,
    ],
  );

  const featuredBook = useMemo(() => {
    const adventureCandidate = pickFeaturedBook({
      recommendedBooks,
      publishedBooks,
      continueReading,
      favoriteWorlds: personalization.favoriteWorlds,
      ageBand: personalization.ageBand,
      excludeIds: completedBookIds,
    }) || newBooks[0] || publishedBooks[0] || null;

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
  }, [
    continueReading,
    recommendedBooks,
    newBooks,
    publishedBooks,
    progressRows,
    personalization.favoriteWorlds,
    personalization.ageBand,
    completedBookIds,
  ]);

  const kidCategories = useMemo(() => {
    const categories = localizeKidCategories(language).filter((category) => WORLD_CATEGORY_IDS.includes(category.id));
    return reorderCategoriesByWorlds(categories, personalization.favoriteWorlds);
  }, [language, personalization.favoriteWorlds]);

  const finishedStories = useMemo(
    () => buildFinishedStories({
      publishedBooks,
      progressRows,
      t,
      limit: 8,
    }),
    [publishedBooks, progressRows, t],
  );

  const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];
  const personalAchievements = smartHome.achievements || [];
  const dynamicSections = smartHome.sections || [];
  const hasPersonalizedContent = dynamicSections.length > 0 || Boolean(featuredBook);

  const autonomyWorlds = AUTONOMY_WORLDS.map((world) => {
    if (world.id === 'create' && user?.role !== 'kid') {
      return { ...world, path: world.studioPath || world.path };
    }
    return world;
  });

  const handlePlayBook = useCallback((book) => {
    const progress = progressRows.find((row) => row.book_id === book.id);
    const pageQuery = progress?.current_page ? `?page=${progress.current_page}` : '';
    if (book.id) {
      navigate(`/kids/read/${book.id}${pageQuery}`);
      return;
    }
    navigate(getKidsContentPath(book));
  }, [navigate, progressRows]);

  const handleListenBook = useCallback((book) => {
    if (book?.id) {
      navigate(`/kids/listen/${book.id}`);
      return;
    }
    navigate('/kids/audio');
  }, [navigate]);

  const goToLibrary = useCallback(() => navigate('/kids/library'), [navigate]);

  const carouselProps = useMemo(() => ({
    isRtl,
    showActions: false,
    hideTitle: true,
    hideSectionTitle: false,
    pictogramMode: true,
    onPlay: handlePlayBook,
    modality: 'books',
    seeAllLabel: t('kidsNonReaderSeeAll'),
    onSeeAll: goToLibrary,
  }), [isRtl, handlePlayBook, t, goToLibrary]);

  const handleCategorySelect = useCallback((category) => {
    const phrase = getCategoryVoicePhrase(category.id, language);
    setGuideMessage(phrase);
    speakGuide(phrase);
  }, [language, speakGuide]);

  const lastActivityBook = progressRows[0];
  const lastActivityText = lastActivityBook?.book_title || null;
  const welcomePhrase = getGuideVoicePhrase('welcome', language);

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
            alt={displayName}
            size="lg"
            className="w-12 h-12 md:w-14 md:h-14 border border-border/40 shadow-soft bg-primary-50 text-primary-700 shrink-0"
          />
          <div className="min-w-0">
            <p className="kids-type-h1 !text-[1.35rem] md:!text-[1.55rem] truncate flex items-center gap-2">
              <span aria-hidden="true">{greeting.worldEmoji || '👋'}</span>
              <span className="sr-only">{greeting.primary}</span>
              {displayName || ''}
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

        {softProgress.hasSignal && (
          <KidsHomeProgressStrip
            completed={softProgress.completed}
            started={softProgress.started}
            readingDays={softProgress.readingDays}
            worlds={softProgress.worlds}
            t={t}
          />
        )}

        {personalAchievements.some((a) => a.earned) && (
          <KidsAchievementStrip
            achievements={personalAchievements}
            language={language}
            reducedMotion={reducedMotion}
          />
        )}

        {!hasPersonalizedContent && (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            description={t('persDiscoverHint')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
            showMascot
            mascotMood="encourage"
            recommendations={publishedBooks.slice(0, 4)}
            onRecommendPlay={handlePlayBook}
            recommendLabel={t('persExploreNew')}
          />
        )}

        {dynamicSections.map((section) => {
          if (section.type === 'continue') {
            return (
              <KidsContinueRail
                key={section.id}
                books={section.books}
                title={section.title}
                emoji={section.emoji || KIDS_PICTOGRAMS.continue}
                isRtl={isRtl}
                t={t}
                onResume={handlePlayBook}
              />
            );
          }

          return (
            <KidsBookCarousel
              key={section.id}
              title={section.title}
              emoji={section.emoji || KIDS_PICTOGRAMS.recommended}
              books={section.books}
              {...carouselProps}
              modality={section.modality || 'books'}
              onPlay={section.modality === 'audio' ? handleListenBook : handlePlayBook}
              onSeeAll={section.seeAllTheme
                ? () => navigate(`/kids/library?theme=${section.seeAllTheme}`)
                : section.categoryId
                  ? () => navigate(`/kids/library?theme=${section.categoryId}`)
                  : goToLibrary}
            />
          );
        })}

        {finishedStories.length > 0 && (
          <KidsBookCarousel
            title={t('kidsHomeFinishedStories')}
            emoji="⭐"
            books={finishedStories}
            {...carouselProps}
          />
        )}

        <motion.section aria-label={t('allCategories')} className="kids-home-primary-shelf" {...getMotionProps(reducedMotion, kidsCarouselReveal)}>
          <div className="mb-space-24 px-space-8 md:px-space-16 flex items-end justify-between gap-space-12">
            <h2 className="kids-shelf-title kids-shelf-title--pictogram !mb-0">
              <span className="kids-shelf-emoji" aria-hidden="true">🗺️</span>
              <span className="sr-only">{t('kidsWorldsExplore')}</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                playKidsUiSound('tap');
                speakGuide(getGuideVoicePhrase('library', language));
                navigate('/kids/library');
              }}
              className="kids-touch-target kids-see-all-pictogram inline-flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full border border-border/40 bg-card/80 text-2xl shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              aria-label={t('seeAll')}
            >
              <span aria-hidden="true">➡️</span>
            </button>
          </div>
          <div className="kids-discovery-rail pb-space-8 !gap-space-20 md:!gap-space-24">
            {kidCategories.map((category) => (
              <KidCategoryCard
                key={category.id}
                category={category}
                compact
                to={`/kids/category/${category.id}`}
                onSelect={handleCategorySelect}
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          aria-label={t('kidsAutonomyWorlds')}
          className="kids-home-autonomy"
          {...getMotionProps(reducedMotion, kidsCarouselReveal)}
        >
          <h2 className="kids-shelf-title kids-shelf-title--pictogram mb-space-20 px-space-8 md:px-space-16">
            <span className="kids-shelf-emoji" aria-hidden="true">🌈</span>
            <span className="sr-only">{t('kidsAutonomyWorlds')}</span>
          </h2>
          <div className="kids-discovery-rail !gap-space-16 md:!gap-space-20">
            {autonomyWorlds.map((world) => (
              <motion.button
                key={world.id}
                type="button"
                {...getHoverMotion(reducedMotion, kidsHoverLift)}
                onClick={() => {
                  playKidsUiSound('tap');
                  if (world.voiceKey) speakGuide(getGuideVoicePhrase(world.voiceKey, language));
                  navigate(world.path);
                }}
                className={`kids-autonomy-tile kids-autonomy-tile--pictogram ${world.tone} shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300`}
                aria-label={t(world.labelKey)}
                title={t(world.labelKey)}
              >
                <span className="kids-autonomy-tile-pictogram" aria-hidden="true">
                  {world.pictogram}
                </span>
                <span className="sr-only">{t(world.labelKey)}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <KidsFamilyMessages />

        <section className="kids-profile-universe-wrap px-space-8 md:px-space-16 pb-space-24">
          <KidsProfilePanel
            kid={kid}
            kidName={displayName}
            greeting={greeting.primary}
            progressRows={progressRows}
            favoriteBooks={favoriteBooks}
            publishedBooks={publishedBooks}
            badges={badges}
            personalAchievements={personalAchievements}
            lastActivity={lastActivityText}
            t={t}
            isRtl={isRtl}
            onPlayBook={handlePlayBook}
            onGoToLibrary={() => navigate('/kids/library')}
          />
        </section>

        <KidsTrustBadges t={t} compact className="opacity-60" />
      </main>

      <KidsGuideCompanion
        mood="wave"
        message={guideMessage || welcomePhrase}
        speakOnMount
        speakText={welcomePhrase}
      />

      <VoiceAssistant onNavigate={(path) => navigate(path)} />
    </KidsPageShell>
  );
}

export default KidsHome;
