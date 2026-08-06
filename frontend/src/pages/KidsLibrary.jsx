import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import {
  getContinueReading,
  getSectionItems,
  loadRecommendations,
  rankSearchResults,
} from '../services/recommendations/recommendationEngine';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { withPersonalizationLabels } from '../constants/personalizationLabels';
import { localizeKidCategories, getKidCategory } from '../constants/kidCategories';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads } from '../services/offline/offlineContentService';
import {
  filterBooksByParentalPolicy,
  getCurrentParentalPolicy,
  getLibraryControlsFromPolicy,
  getRecommendationRailsFromPolicy,
  getRestrictionMessage,
} from '../services/parental/parentalAccessService';
import { applyLibraryControlOrdering, isRecommendationRailEnabled } from '../constants/parentControlCenter';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsThemePill } from '../components/kids/KidsThemePill';
import { KidCategoryCard } from '../components/kids/KidCategoryCard';
import { KidsCategoryAtmosphere } from '../components/kids/KidsCategoryAtmosphere';
import { KidsHeroStoryCard } from '../components/kids/KidsHeroStoryCard';
import { KidsContinueRail } from '../components/kids/KidsContinueRail';
import { Logo } from '../components/Logo';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsFamilyMessages } from '../components/kids/KidsFamilyMessages';
import { KidsTrustBadges } from '../components/kids/KidsTrustBadges';
import { KidsAmbientSound } from '../components/kids/KidsAmbientSound';
import { SearchBar } from '../components/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsPageEnter } from '../constants/kidsMotion';
import { getKidsContentPath } from '../utils/contentRouting';
import { contentMatchesSearch } from '../utils/contentSearch';
import {
  annotateBooksWithReasons,
  filterAudioBooks,
  filterPremiumBooks,
  filterSeasonalBooks,
  inferLikedThemeId,
  isShortStory,
  pickDailyFeatured,
  pickEditorsChoice,
  pickRandomExplore,
  withDiscoveryReason,
} from '../utils/discoveryRails';
import {
  buildSoftProgressSummary,
  collectCompletedBookIds,
  excludeBookIds,
  getKidsPersonalizationProfile,
  reorderThemesByWorlds,
} from '../utils/kidsPersonalization';
import {
  AGE_GROUPS,
  ALL_AGES_ID,
  bookOverlapsAgeGroup,
  getAgeGroupById,
  parseAgeGroupId,
} from '../constants/ageGroups';
import { KidsGuideCompanion } from '../components/kids/KidsGuideCompanion';
import { getCategoryVoicePhrase, getGuideVoicePhrase, KIDS_PICTOGRAMS } from '../utils/kidsGuidePhrases';
import { playKidsUiSound } from '../utils/kidsUiSound';
import { useKidsVoiceGuide } from '../hooks/useKidsVoiceGuide';

const SHELF_THEME_IDS = [
  'dinosaurs',
  'space',
  'animals',
  'bedtime',
  'princesses',
  'ocean',
  'world',
  'spirituality',
  'science',
  'geography',
  'languages',
  'characters',
  'colors',
  'vehicles',
];
const RECENT_SEARCHES_KEY = 'hkids_recent_library_searches';

const AGE_FILTERS = [
  { id: ALL_AGES_ID, pictogram: '??', labelKey: 'kidsFilterAllAges' },
  ...AGE_GROUPS.map((group) => ({
    id: group.id,
    pictogram: group.emoji,
    labelKey: group.labelKey,
    min: group.min,
    max: group.max,
  })),
];

function inferTheme(book, childThemes) {
  if (book.theme) return book.theme;
  const searchable = [book.title, book.description, book.category_name, book.author].filter(Boolean).join(' ').toLowerCase();
  const matchedTheme = childThemes.find((theme) => theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword)));
  return matchedTheme?.id || null;
}

function withThemeEmoji(books, childThemes) {
  return books.map((book) => {
    const themeId = inferTheme(book, childThemes);
    const theme = childThemes.find((item) => item.id === themeId);
    return { ...book, _themeEmoji: theme?.pictogram, _themeId: themeId };
  });
}

function reorderShelfThemeIds(themeIds, favoriteWorlds) {
  if (!favoriteWorlds?.length) return themeIds;
  return reorderThemesByWorlds(
    themeIds.map((id) => ({ id })),
    favoriteWorlds,
  ).map((item) => item.id);
}

function KidsLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { language, isRtl, t: tRaw } = useLanguage();
  const t = useMemo(() => withPersonalizationLabels(tRaw, language), [tRaw, language]);
  const reducedMotion = useReducedMotion();
  const { speakGuide } = useKidsVoiceGuide(language);
  const personalization = useMemo(() => getKidsPersonalizationProfile(), []);
  const [books, setBooks] = useState([]);
  const [parentalPolicy, setParentalPolicy] = useState(null);
  const completedBookIds = useMemo(() => collectCompletedBookIds(), [books]);
  const softProgress = useMemo(
    () => buildSoftProgressSummary({
      favoriteWorlds: personalization.favoriteWorlds,
      t,
    }),
    [personalization.favoriteWorlds, t],
  );
  const childThemes = useMemo(() => {
    const blocked = new Set(parentalPolicy?.rules?.blocked_themes || []);
    const allowed = parentalPolicy?.rules?.allowed_themes || [];
    const base = reorderThemesByWorlds([
      { id: 'all', label: t('allCategories'), shortLabel: t('allCategories'), pictogram: '?', cue: 'Go', gradient: 'from-primary-400 to-secondary-400', match: [] },
      ...localizeKidCategories(language),
    ], personalization.favoriteWorlds);
    return base.filter((theme) => {
      if (theme.id === 'all') return true;
      if (blocked.has(theme.id)) return false;
      if (allowed.length > 0 && !allowed.includes(theme.id)) return false;
      return true;
    });
  }, [language, t, personalization.favoriteWorlds, parentalPolicy]);

  const recommendationRails = useMemo(
    () => getRecommendationRailsFromPolicy(parentalPolicy),
    [parentalPolicy],
  );

  const urlTheme = searchParams.get('theme') || 'all';
  const ageFilter = parseAgeGroupId(searchParams.get('age'));
  const selectedTheme = urlTheme;
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudio, setFilterAudio] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      return Array.isArray(stored) ? stored.slice(0, 6) : [];
    } catch {
      return [];
    }
  });
  const offlineContent = useOfflineContent();

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return undefined;
    }
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        const booksRes = await booksAPI.getPublishedBooks({ language });
        if (!active) return;
        const policy = await getCurrentParentalPolicy().catch(() => null);
        if (!active) return;
        setParentalPolicy(policy);
        const rawBooks = booksRes.data || [];
        const filtered = filterBooksByParentalPolicy(rawBooks, policy);
        const ordered = applyLibraryControlOrdering(filtered, getLibraryControlsFromPolicy(policy));
        setBooks(ordered);
        const recommendationPayload = await loadRecommendations({
          surface: 'library',
          language,
          books: ordered,
          parentalPolicy: policy,
        }).catch((error) => {
          const message = getRestrictionMessage(error);
          if (message && active) showToast(message, 'info');
          return loadRecommendations({
            surface: 'library',
            language,
            books: ordered,
            parentalPolicy: policy,
            forceRefresh: true,
          });
        });
        if (active) setRecommendations(recommendationPayload);
      } catch (error) {
        if (!active) return;
        if (!navigator.onLine) {
          const downloads = await getDownloads();
          if (!active) return;
          const policy = await getCurrentParentalPolicy().catch(() => null);
          if (!active) return;
          setParentalPolicy(policy);
          const offlineBooks = downloads
            .filter((item) => item.type === 'book' && item.status === 'downloaded')
            .map((item) => item.payload);
          const filtered = filterBooksByParentalPolicy(offlineBooks, policy);
          setBooks(applyLibraryControlOrdering(filtered, getLibraryControlsFromPolicy(policy)));
          setRecommendations(await loadRecommendations({
            surface: 'library',
            language,
            books: filtered,
            parentalPolicy: policy,
          }));
          showToast(t('offlineMode'), 'info');
        } else {
          showToast(getRestrictionMessage(error, t('loadError')), 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user, navigate, language, showToast, t]);

  const writeLibraryParams = useCallback((next = {}) => {
    const theme = next.theme !== undefined ? next.theme : selectedTheme;
    const age = parseAgeGroupId(next.age !== undefined ? next.age : ageFilter);
    const params = {};
    if (theme && theme !== 'all') params.theme = theme;
    if (age && age !== ALL_AGES_ID) params.age = age;
    setSearchParams(params, { replace: true });
  }, [selectedTheme, ageFilter, setSearchParams]);

  const handleThemeChange = (themeId) => {
    writeLibraryParams({ theme: themeId });
  };

  const handleAgeFilterChange = (nextAge) => {
    writeLibraryParams({ age: parseAgeGroupId(nextAge) });
  };

  const saveRecentSearch = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return;
    setRecentSearches((current) => {
      const next = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 6);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const favoritesIdsKey = storage.getFavorites().join(',');
  const favoritesIds = useMemo(
    () => (favoritesIdsKey ? storage.getFavorites() : []),
    [favoritesIdsKey],
  );
  const [searchRankedBooks, setSearchRankedBooks] = useState([]);
  const readingHistory = storage.getReadingHistory();
  const taggedBooks = useMemo(() => withThemeEmoji(books, childThemes), [books, childThemes]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim();
    const ageGroup = getAgeGroupById(ageFilter);
    return taggedBooks.filter((book) => {
      if (!contentMatchesSearch(book, q)) return false;
      if (filterFavorites && !favoritesIds.includes(book.id)) return false;
      if (filterAudio && !(book.audio_url || book.content_type === 'song' || book.content_type === 'audio_story')) {
        return false;
      }
      if (filterPremium && !(book.is_premium === true || book.is_premium === 1)) return false;
      if (ageGroup && !bookOverlapsAgeGroup(book, ageGroup)) return false;
      return true;
    });
  }, [taggedBooks, searchQuery, filterFavorites, filterAudio, filterPremium, ageFilter, favoritesIds]);

  useEffect(() => {
    let active = true;
    const q = searchQuery.trim();
    if (!q) {
      setSearchRankedBooks([]);
      return undefined;
    }

    rankSearchResults({
      query: q,
      books: filteredBooks,
      language,
      parentalPolicy,
    }).then((ranked) => {
      if (active) setSearchRankedBooks(ranked);
    });

    return () => {
      active = false;
    };
  }, [filteredBooks, searchQuery, language, parentalPolicy]);

  const visibleBooks = useMemo(() => {
    if (searchQuery.trim() && searchRankedBooks.length) return searchRankedBooks;
    return filteredBooks;
  }, [filteredBooks, searchQuery, searchRankedBooks]);

  const discoveryPool = useMemo(
    () => excludeBookIds(visibleBooks, completedBookIds),
    [visibleBooks, completedBookIds],
  );

  const continueBooks = useMemo(
    () => getContinueReading({
      books: visibleBooks,
      readingHistory,
      recommendations,
    }),
    [visibleBooks, readingHistory, recommendations],
  );

  const favoriteBooks = useMemo(
    () => visibleBooks.filter((b) => favoritesIds.includes(b.id)),
    [visibleBooks, favoritesIds],
  );
  const newBooks = useMemo(
    () => [...discoveryPool]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 15),
    [discoveryPool],
  );

  const apiRecommendedBooks = useMemo(
    () => getSectionItems(recommendations, 'recommended_for_you').filter((book) => discoveryPool.some((item) => item.id === book.id)),
    [recommendations, discoveryPool],
  );

  const todayBooks = useMemo(
    () => apiRecommendedBooks.length
      ? apiRecommendedBooks
      : getSectionItems(recommendations, 'recommended_for_you'),
    [apiRecommendedBooks, recommendations],
  );

  const popularBooks = useMemo(
    () => getSectionItems(recommendations, 'popular').filter((book) => discoveryPool.some((item) => item.id === book.id)),
    [recommendations, discoveryPool],
  );

  const dailyFeatured = useMemo(
    () => pickDailyFeatured(discoveryPool),
    [discoveryPool],
  );

  const editorsChoice = useMemo(
    () => annotateBooksWithReasons(pickEditorsChoice(discoveryPool, 12), t('kidsEditorsChoice')),
    [discoveryPool, t],
  );

  const randomExplore = useMemo(
    () => annotateBooksWithReasons(pickRandomExplore(discoveryPool, 10), t('kidsSurpriseExplore')),
    [discoveryPool, t],
  );

  const audioFavorites = useMemo(
    () => annotateBooksWithReasons(filterAudioBooks(discoveryPool, 15), t('kidsAudioFavorites')),
    [discoveryPool, t],
  );

  const premiumShelf = useMemo(
    () => annotateBooksWithReasons(filterPremiumBooks(discoveryPool, 12), t('kidsPremiumShelf')),
    [discoveryPool, t],
  );

  const orderedShelfThemeIds = useMemo(
    () => reorderShelfThemeIds(SHELF_THEME_IDS, personalization.favoriteWorlds),
    [personalization.favoriteWorlds],
  );

  const themeShelves = useMemo(() => (
    orderedShelfThemeIds
      .map((themeId) => {
        const theme = childThemes.find((item) => item.id === themeId);
        if (!theme) return null;
        const shelfBooks = discoveryPool.filter((book) => book._themeId === themeId).slice(0, 15);
        if (!shelfBooks.length) return null;
        return { theme, books: shelfBooks };
      })
      .filter(Boolean)
  ), [childThemes, discoveryPool, orderedShelfThemeIds]);

  const likedThemeId = useMemo(
    () => inferLikedThemeId(favoriteBooks, localizeKidCategories(language)),
    [favoriteBooks, language],
  );
  const likedTheme = likedThemeId ? getKidCategory(likedThemeId, language) : null;

  const becauseYouLikedBooks = useMemo(() => {
    const themed = getSectionItems(recommendations, 'because_you_liked')
      .filter((book) => discoveryPool.some((item) => item.id === book.id));
    if (!themed.length) return [];
    const reason = likedTheme
      ? t('discoverBecauseYouLiked', {
        theme: likedTheme?.shortLabel || likedTheme?.label || likedThemeId,
      })
      : t('discoverBecauseYouLiked', { theme: t('forYou') });
    return annotateBooksWithReasons(themed, reason);
  }, [recommendations, discoveryPool, likedTheme, likedThemeId, t]);

  const themeBooks = useMemo(
    () => visibleBooks.filter((b) => b._themeId === selectedTheme),
    [visibleBooks, selectedTheme],
  );
  const featuredBook = selectedTheme === 'all'
    ? (continueBooks[0] || todayBooks[0])
    : (themeBooks[0] || null);
  const activeThemeData = childThemes.find((theme) => theme.id === selectedTheme);
  const visualThemes = useMemo(
    () => childThemes.filter((theme) => theme.id !== 'all').slice(0, 10),
    [childThemes],
  );

  const continueSubtitle = softProgress.readingDays > 1
    ? `${t('discoverContinueSubtitle')} · ${t('kidsHomeProgressDays', { count: softProgress.readingDays })}`
    : t('discoverContinueSubtitle');

  const toggleFavorite = useCallback((bookId) => {
    if (storage.isFavorite(bookId)) {
      storage.removeFavorite(bookId);
      showToast(t('removedFromFavorites'), 'info');
    } else {
      storage.addFavorite(bookId);
      showToast(t('addedToFavorites'), 'success');
    }
    setBooks((current) => [...current]);
  }, [showToast, t]);

  const handleDownloadBook = useCallback(async (book) => {
    try {
      await offlineContent.downloadBookContent(book);
      storage.markDownloaded(book.id);
      showToast(t('downloaded'), 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(getRestrictionMessage(error, t('downloadError')), 'error');
      }
    }
  }, [offlineContent, showToast, t]);

  const handlePlayBook = useCallback((book) => {
    navigate(getKidsContentPath(book));
  }, [navigate]);

  const handleListenBook = useCallback((book) => {
    if (book?.id) {
      navigate(`/kids/listen/${book.id}`);
      return;
    }
    navigate('/kids/audio');
  }, [navigate]);

  const featuredHeroBook = featuredBook ? {
    ...featuredBook,
    progress: readingHistory.find((h) => h.bookId === featuredBook.id)
      ? Math.round((storage.getLastPage(featuredBook.id) / (featuredBook.page_count || 1)) * 100)
      : Number(featuredBook.kid_progress_percent || featuredBook.progress || 0),
    isInProgress: readingHistory.some((h) => h.bookId === featuredBook.id && h.page > 0)
      || (Number(featuredBook.kid_progress_percent || 0) > 0 && Number(featuredBook.kid_progress_percent || 0) < 100),
  } : null;

  const carouselProps = useMemo(() => ({
    isRtl,
    favorites: favoritesIds,
    offlineContent,
    onPlay: handlePlayBook,
    onFavorite: toggleFavorite,
    onDownload: handleDownloadBook,
    showActions: true,
    hideTitle: true,
    pictogramMode: true,
    modality: 'books',
    seeAllLabel: t('kidsNonReaderSeeAll'),
  }), [
    isRtl,
    favoritesIds,
    offlineContent,
    handlePlayBook,
    toggleFavorite,
    handleDownloadBook,
    t,
  ]);

  const todayAnnotated = useMemo(
    () => todayBooks.map((book) => {
      if (book._discoveryReason) return book;
      if (isShortStory(book)) return withDiscoveryReason(book, t('discoverReasonShort'));
      return withDiscoveryReason(book, t('forYou'));
    }),
    [todayBooks, t],
  );
  const newAnnotated = useMemo(
    () => annotateBooksWithReasons(newBooks, t('discoverReasonNew')),
    [newBooks, t],
  );
  const favoriteAnnotated = useMemo(
    () => annotateBooksWithReasons(favoriteBooks, t('discoverReasonLoved')),
    [favoriteBooks, t],
  );
  const popularAnnotated = useMemo(
    () => annotateBooksWithReasons(popularBooks, t('kidsPopularThisWeek')),
    [popularBooks, t],
  );
  const seasonalAnnotated = useMemo(
    () => annotateBooksWithReasons(filterSeasonalBooks(discoveryPool), t('discoverSeasonal')),
    [discoveryPool, t],
  );
  const dailyAnnotated = useMemo(
    () => (dailyFeatured ? [withDiscoveryReason(dailyFeatured, t('kidsDailyPick'))] : []),
    [dailyFeatured, t],
  );
  const themeContinueBooks = useMemo(
    () => continueBooks.filter((book) => book._themeId === selectedTheme).slice(0, 8),
    [continueBooks, selectedTheme],
  );
  const themePopularBooks = useMemo(
    () => getSectionItems(recommendations, 'popular')
      .filter((book) => themeBooks.some((item) => item.id === book.id))
      .slice(0, 12),
    [recommendations, themeBooks],
  );
  const themeNewBooks = useMemo(
    () => [...themeBooks]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 12),
    [themeBooks],
  );
  const downloadedBooks = useMemo(
    () => visibleBooks.filter((book) => {
      const status = offlineContent.getBookStatus(book.id);
      return status?.status === 'downloaded' || storage.isDownloaded(book.id);
    }).slice(0, 10),
    [visibleBooks, offlineContent],
  );
  const downloadingCount = useMemo(
    () => Object.values(offlineContent.progressById || {}).filter((value) => Number(value) > 0 && Number(value) < 100).length,
    [offlineContent.progressById],
  );
  const noSearchResults = (
    (searchQuery.trim().length > 0 || filterAudio || filterPremium || filterFavorites || ageFilter !== 'all')
    && visibleBooks.length === 0
  );

  const libraryTitle = selectedTheme === 'all'
    ? t('library')
    : (activeThemeData?.shortLabel || activeThemeData?.label);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAudio(false);
    setFilterPremium(false);
    setFilterFavorites(false);
    setSearchParams({}, { replace: true });
  };

  const quickFilters = [
    {
      id: 'audio',
      active: filterAudio,
      pictogram: KIDS_PICTOGRAMS.listen,
      label: t('kidsFilterAudio'),
      onClick: () => setFilterAudio((value) => !value),
    },
    {
      id: 'premium',
      active: filterPremium,
      pictogram: '?',
      label: t('kidsFilterPremium'),
      onClick: () => setFilterPremium((value) => !value),
    },
    {
      id: 'favorites',
      active: filterFavorites,
      pictogram: KIDS_PICTOGRAMS.favorites,
      label: t('kidsFilterFavorites'),
      onClick: () => setFilterFavorites((value) => !value),
    },
  ];


  const { changeLanguage } = useLanguage();
  const [wizardStep, setWizardStep] = useState('story');
  const [selectedWizardBook, setSelectedWizardBook] = useState(null);

  const handleBookSelect = (book) => {
    setSelectedWizardBook(book);
    setWizardStep('voice');
  };

  const handleVoiceSelect = (voiceId) => {
    try {
      window.localStorage.setItem('hkids_narration_voice_profile', voiceId);
    } catch (e) {}
    setWizardStep('language');
  };

  const handleLanguageSelect = (langCode) => {
    if (changeLanguage) changeLanguage(langCode);
    navigate('/kids/read/' + selectedWizardBook.id);
  };

  
  if (wizardStep === 'story') {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 flex flex-col items-center justify-start pt-12 px-6 pb-24 overflow-hidden">
        {/* Magical Background Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="kids-home-cloud" style={{ width: '12rem', top: '5%', left: '2%' }} />
          <span className="kids-home-cloud" style={{ width: '8rem', top: '15%', right: '5%' }} />
          <span className="kids-home-star" style={{ top: '10%', left: '30%' }} />
          <span className="kids-home-star" style={{ top: '25%', right: '20%' }} />
        </div>
        <div className="relative z-10 w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {(() => {
            const placeholders = [
              '/illustrations/hkids_stories_1785859306807.jpg',
              '/illustrations/hkids_explore_1785859328927.jpg',
              '/illustrations/hkids_games_1785859317533.jpg',
              '/illustrations/hkids_surprise_1785859339044.jpg',
              '/illustrations/hkids_avatar_1785859297185.jpg',
              '/illustrations/avatar_lion.jpg',
              '/illustrations/avatar_princess.jpg'
            ];
            return discoveryPool.slice(0, 16).map((book, index) => {
              const fallback = placeholders[index % placeholders.length];
              return (
            <motion.div
              key={book.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.08, rotate: [0, -2, 2, -2, 0] }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                playKidsUiSound('tap');
                handleBookSelect(book);
              }}
              className="cursor-pointer rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-pink-300 to-orange-300 aspect-[3/4] relative border-4 border-white/60 transition-shadow hover:shadow-kids-warm"
            >
              <img src={book.cover_url || book.image_path || fallback} alt="" className="w-full h-full object-cover" />
            </motion.div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  if (wizardStep === 'voice') {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="kids-home-cloud" style={{ width: '14rem', bottom: '10%', right: '5%' }} />
          <span className="kids-home-star" style={{ top: '20%', left: '15%' }} />
          <span className="kids-home-star" style={{ bottom: '30%', left: '25%' }} />
        </div>
        <div className="relative z-10 w-full max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 p-4">
          {[
            { id: 'woman', src: '/illustrations/avatar_mom.jpg' },
            { id: 'man', src: '/illustrations/avatar_dad.jpg' },
            { id: 'princess', src: '/illustrations/avatar_princess.jpg' },
            { id: 'lion', src: '/illustrations/avatar_lion.jpg' },
            { id: 'robot', src: '/illustrations/avatar_robot.jpg' },
            { id: 'teddy', src: '/illustrations/avatar_teddy.jpg' },
            { id: 'fairy', src: '/illustrations/avatar_fairy.jpg' }
          ].map(voice => (
            <motion.div
              key={voice.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playKidsUiSound('tap');
                handleVoiceSelect(voice.id);
              }}
              className="cursor-pointer rounded-[3rem] overflow-hidden aspect-square shadow-2xl border-4 border-white/80 transition-shadow hover:shadow-kids-warm"
            >
              <img src={voice.src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (wizardStep === 'language') {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100 flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="kids-home-cloud" style={{ width: '10rem', top: '10%', left: '10%' }} />
          <span className="kids-home-cloud" style={{ width: '15rem', bottom: '5%', right: '10%' }} />
          <span className="kids-home-star" style={{ top: '40%', right: '20%' }} />
        </div>
        <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 p-4">
          {[
            { id: 'fr', src: '/illustrations/flag_french.jpg', fallback: '🌍' },
            { id: 'en', src: '/illustrations/flag_english.jpg', fallback: '🌍' },
            { id: 'ar', src: '', fallback: '🌍' }
          ].map(lang => (
            <motion.div
              key={lang.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playKidsUiSound('tap');
                handleLanguageSelect(lang.id);
              }}
              className="cursor-pointer rounded-[3rem] overflow-hidden bg-gradient-to-br from-white to-sky-50 aspect-square flex flex-col items-center justify-center shadow-2xl border-4 border-white/80 transition-shadow hover:shadow-kids-warm"
            >
              {lang.src ? (
                <img src={lang.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl md:text-[12rem] drop-shadow-md">{lang.fallback}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
export default KidsLibrary;



