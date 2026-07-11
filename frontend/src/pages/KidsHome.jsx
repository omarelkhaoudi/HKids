import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeKidCategories } from '../constants/kidCategories';
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
import { getImageUrl } from '../utils/imageUrl';
import { useToast } from '../components/ToastProvider';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { PlayIcon, StarIcon, LockIcon, SparklesIcon } from '../components/Icons';
import { getCachedKidProfile } from '../services/cloud/cloudSyncService';
import { Avatar } from '../components/ui';
import { BookGridSkeleton } from '../components/SkeletonLoader';

function getRecommendedBooks(sections = []) {
  const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
  return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

function getMissionText(goal, summary, t) {
  if (goal) {
    const units = {
      minutes: 'min',
      completed_books: 'livres',
      sessions: 'sessions',
    };
    return `${Number(goal.progress_value || 0)} / ${Number(goal.target_value || 0)} ${units[goal.goal_type] || ''}`.trim();
  }

  const totalMinutes = Math.floor(Number(summary?.total_time_seconds || 0) / 60);
  if (totalMinutes > 0) return t('readingMinutes', { count: totalMinutes });

  const totalSessions = Number(summary?.total_sessions || 0);
  if (totalSessions > 0) return t(totalSessions > 1 ? 'readingSessionsPlural' : 'readingSessions', { count: totalSessions });

  return t('noReadingRecorded');
}

const QUICK_LINKS = [
  { id: 'learning', path: '/kids/learning', emoji: '🎮', labelKey: 'kidsQuickLearning', gradient: 'from-sky-400 to-emerald-500' },
  { id: 'studio', path: '/kids/story-studio', emoji: '✨', labelKey: 'kidsQuickStudio', gradient: 'from-fuchsia-500 to-primary-500' },
  { id: 'stories', path: '/kids/ai-stories', emoji: '📖', labelKey: 'kidsQuickStories', gradient: 'from-amber-400 to-rose-500' },
];

function KidsHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState(t('goodMorning'));
  const [homeData, setHomeData] = useState(null);
  const [recommendationSections, setRecommendationSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('goodMorning'));
    else if (hour < 18) setGreeting(t('goodAfternoon'));
    else setGreeting(t('goodEvening'));
  }, [t]);

  useEffect(() => {
    if (loading || location.hash !== '#medals') return;
    const medalsSection = document.getElementById('kids-medals');
    medalsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash, location.pathname]);

  useEffect(() => {
    let active = true;

    const loadKidsHome = async () => {
      try {
        setLoading(true);
        const [overviewResult, recommendationsResult] = await Promise.allSettled([
          parentalAPI.getConnectedKidOverview(),
          recommendationsAPI.getForKid({ language }),
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
  const recommendedBooks = getRecommendedBooks(recommendationSections)
    .filter((book) => !book.language || book.language === language);
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
  const missionText = getMissionText(homeData?.goal, homeData?.summary, t);
  const kidCategories = localizeKidCategories(language);

  const handleSurprise = () => {
    if (recommendedBooks.length === 0) {
      navigate('/kids/library');
      return;
    }

    const randomBook = recommendedBooks[Math.floor(Math.random() * recommendedBooks.length)];
    navigate(`/kids/read/${randomBook.id}`);
  };

  if (loading) {
    return (
      <KidsPageShell isRtl={isRtl} variant="home" className="pb-32" footer={<KidsBottomNav />}>
        <div className="px-6 py-8">
          <BookGridSkeleton count={4} />
        </div>
      </KidsPageShell>
    );
  }

  return (
    <KidsPageShell isRtl={isRtl} variant="home" className="pb-32" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar src={avatarSrc} initials={avatarInitials} alt={kidName} size="lg" className="w-16 h-16 border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-500 text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-foreground truncate">
              {greeting} <span className="text-primary-600">{kidName}</span>
            </h1>
            <p className="text-sm font-bold text-foreground-muted">{t('readyToPlay')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LitMascot showBubble={false} size="small" className="hidden sm:flex" />
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
        </div>
      </header>

      <div className="relative z-10 px-6 -mt-2 mb-2 sm:hidden flex justify-center">
        <LitMascot size="large" showBubble message={t('litMascotGreeting')} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 space-y-12 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="lg:col-span-2 cursor-pointer"
            onClick={() => {
              if (!featuredBook) {
                navigate('/kids/library');
                return;
              }
              const pageQuery = featuredBook.isInProgress ? `?page=${featuredBook.currentPage}` : '';
              navigate(`/kids/read/${featuredBook.id}${pageQuery}`);
            }}
          >
            <div className="relative h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden shadow-2xl group border-4 border-white/40">
              {featuredBook?.cover_image ? (
                <img src={getImageUrl(featuredBook.cover_image)} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/50 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                  <PlayIcon className={`w-12 h-12 text-white drop-shadow-md ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} filled />
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-black border border-white/30 uppercase tracking-wider">
                    {featuredBook?.isInProgress ? t('resume') : t('discover')}
                  </span>
                  <span className="text-white font-black drop-shadow-md">{featuredBook?.progress || 0}%</span>
                </div>
                <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${featuredBook?.progress || 0}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="cursor-pointer">
            <div className="h-64 md:h-80 rounded-[2.5rem] bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl border-4 border-white/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-8xl filter drop-shadow-2xl mb-4"
                aria-hidden="true"
              >
                🎁
              </motion.div>
              <h3 className="text-white text-2xl font-black drop-shadow-md mb-2">{t('magicChest')}</h3>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white font-bold">
                <StarIcon className="w-5 h-5 text-yellow-300" />
                <span>{missionText}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <section>
          <div className="grid grid-cols-3 gap-4">
            {QUICK_LINKS.map((link) => (
              <motion.button
                key={link.id}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(link.path)}
                className={`rounded-[2rem] bg-gradient-to-br ${link.gradient} p-5 md:p-6 text-white shadow-xl border-4 border-white/40 min-h-[120px] flex flex-col items-center justify-center gap-2`}
                aria-label={t(link.labelKey)}
              >
                <span className="text-4xl" aria-hidden="true">{link.emoji}</span>
                <span className="font-black text-lg">{t(link.labelKey)}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <KidsFamilyMessages />

        <div className="flex justify-center my-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSurprise}
            className="group relative flex items-center gap-4 bg-gradient-to-r from-primary-500 via-fuchsia-500 to-accent-500 p-4 pr-8 rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner relative z-10 group-hover:rotate-12 transition-transform">
              <SparklesIcon className="w-8 h-8 text-fuchsia-500" />
            </div>
            <span className="text-white font-black text-2xl relative z-10 drop-shadow-md">{t('surpriseMe')}</span>
          </motion.button>
        </div>

        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {kidCategories.map((category) => (
              <KidCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {recommendedBooks.length > 0 ? (
          <KidsBookCarousel
            title={t('forYou')}
            emoji="⭐"
            books={recommendedBooks}
            isRtl={isRtl}
            showActions={false}
            hideTitle
            onPlay={(book) => navigate(`/kids/read/${book.id}`)}
          />
        ) : (
          <KidsEmptyState
            emoji="📚"
            title={t('emptyBooksTitle')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
        )}

        <section id="kids-medals" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-black text-foreground mb-6 pl-2">🏆 {t('yourMedals')}</h2>
          {badges.length === 0 ? (
            <KidsEmptyState
              emoji="🏅"
              title={t('emptyBadgesTitle')}
              description={t('emptyBadgesDescription')}
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
                  className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl border-8 ${badge.earned ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-yellow-200' : 'bg-surface-200 border-surface-300 grayscale opacity-60'}`}
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
