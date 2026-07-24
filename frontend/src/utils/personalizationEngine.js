/**
 * HKids Intelligent Personalization Engine (client-side).
 * Learns from local activity + existing API signals — no backend rewrite.
 */

import { deriveBookTheme } from './bookCover';
import {
  annotateBooksWithReasons,
  estimateRemainingMinutes,
  filterByAgeBand,
  isAudioBook,
  isPremiumBook,
  isShortStory,
  pickDailyFeatured,
  pickRandomExplore,
  withDiscoveryReason,
} from './discoveryRails';
import {
  buildAudioDiscoveries,
  buildBedtimeShelf,
  buildPersonalizedRecommended,
  buildWorldShelves,
  collectCompletedBookIds,
  excludeBookIds,
  getKidsPersonalizationProfile,
} from './kidsPersonalization';
import { bookMatchesKidCategory, getCategoryContentStrategy } from './kidCategoryContent';
import { onboardingBandToRange } from '../constants/ageGroups';
import { storage } from './storage';
import { ONBOARDING_WORLDS } from './onboarding';

const PROFILE_KEY = 'hkids_learning_profile_v1';
const SHOWN_KEY = 'hkids_shown_books_v1';

const SCORE = {
  favoriteCategory: 10,
  sameNarrator: 8,
  sameAge: 7,
  similarTags: 6,
  trending: 5,
  similarDuration: 4,
  unfinishedSeries: 3,
  favoriteWorld: 8,
  audioAffinity: 4,
  premiumMix: 2,
  learningMix: 2,
  recentlyShown: -6,
  alreadyCompleted: -5,
  alreadyFavoriteBoost: 1,
};

export const PERSONALIZATION_ACHIEVEMENTS = [
  { id: 'first_story', emoji: '🌱', labelKey: 'persAchFirstStory', test: (s) => s.completed >= 1 },
  { id: 'five_stories', emoji: '📖', labelKey: 'persAchFiveStories', test: (s) => s.completed >= 5 },
  { id: 'ten_stories', emoji: '📚', labelKey: 'persAchTenStories', test: (s) => s.completed >= 10 },
  { id: 'animal_explorer', emoji: '🦁', labelKey: 'persAchAnimalExplorer', test: (s) => (s.themeCounts.animals || 0) >= 3 },
  { id: 'space_explorer', emoji: '🚀', labelKey: 'persAchSpaceExplorer', test: (s) => (s.themeCounts.space || 0) >= 2 },
  { id: 'good_listener', emoji: '🎧', labelKey: 'persAchGoodListener', test: (s) => s.audioSessions >= 3 },
  { id: 'reading_champion', emoji: '🏆', labelKey: 'persAchReadingChampion', test: (s) => s.completed >= 15 || s.streakDays >= 5 },
  { id: 'curious_mind', emoji: '🔍', labelKey: 'persAchCuriousMind', test: (s) => s.worldsExplored >= 3 },
];

function emptyProfile() {
  return {
    favoriteThemes: [],
    favoriteCategories: [],
    favoriteDurationBand: null,
    favoriteNarrator: null,
    favoriteLanguage: null,
    favoriteAgeBand: null,
    favoriteDifficulty: null,
    audioTextRatio: 0.5,
    recentActivity: [],
    completionRate: 0,
    readingFrequency: 0,
    favoriteTimeOfDay: null,
    themeCounts: {},
    categoryCounts: {},
    narratorCounts: {},
    languageCounts: {},
    durationSamples: [],
    updatedAt: null,
  };
}

function scopedKey(base) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'kid' && user?.kid_profile_id) {
      return `${base}:kid:${user.kid_profile_id}`;
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function loadLearningProfile() {
  try {
    const raw = localStorage.getItem(scopedKey(PROFILE_KEY));
    if (!raw) return emptyProfile();
    return { ...emptyProfile(), ...JSON.parse(raw) };
  } catch {
    return emptyProfile();
  }
}

export function saveLearningProfile(profile) {
  try {
    localStorage.setItem(scopedKey(PROFILE_KEY), JSON.stringify(profile));
  } catch {
    /* ignore quota */
  }
  return profile;
}

export function getPinnedFavoriteIds() {
  return storage.getPinnedFavorites?.() || [];
}

export function togglePinnedFavorite(bookId) {
  return storage.togglePinnedFavorite?.(bookId) || getPinnedFavoriteIds();
}

export function getRecentlyShownBookIds() {
  try {
    const raw = localStorage.getItem(scopedKey(SHOWN_KEY));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

export function recordShownBooks(bookIds = []) {
  const prev = getRecentlyShownBookIds();
  const merged = [...bookIds.map(String), ...prev];
  const unique = [...new Set(merged)].slice(0, 80);
  try {
    localStorage.setItem(scopedKey(SHOWN_KEY), JSON.stringify(unique));
  } catch {
    /* ignore */
  }
  return unique;
}

function hourBucket(iso) {
  if (!iso) return null;
  const h = new Date(iso).getHours();
  if (h < 11) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function durationBand(book) {
  const minutes = Number(book?.duration_minutes || 0)
    || (Number(book?.duration_seconds || 0) > 0 ? Math.round(Number(book.duration_seconds) / 60) : 0)
    || (Number(book?.page_count || 0) > 0 ? Math.round(Number(book.page_count) * 0.75) : 0);
  if (!minutes) return null;
  if (minutes <= 5) return 'short';
  if (minutes <= 12) return 'medium';
  return 'long';
}

function topKeys(counts = {}, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

/**
 * Rebuild invisible learning profile from existing local + API signals.
 */
export function rebuildLearningProfile({
  progressRows = [],
  favoriteBooks = [],
  publishedBooks = [],
  onboarding = null,
} = {}) {
  const profile = emptyProfile();
  const onboardingProfile = onboarding || getKidsPersonalizationProfile();
  const stats = storage.getReadingStats?.() || {};
  const history = storage.getReadingHistory?.() || [];
  const listening = storage.getListeningHistory?.() || [];
  const bookMap = new Map((publishedBooks || []).map((b) => [String(b.id), b]));

  const bump = (bag, key, amount = 1) => {
    if (!key) return;
    bag[key] = (bag[key] || 0) + amount;
  };

  const touchBook = (book, weight = 1, at = null) => {
    if (!book) return;
    const theme = deriveBookTheme(book) || book.theme || book.category_name;
    bump(profile.themeCounts, theme, weight);
    bump(profile.categoryCounts, book.category_id || book.category_name || theme, weight);
    bump(profile.narratorCounts, book.narrator || book.author, weight);
    bump(profile.languageCounts, book.language || book.lang, weight);
    const band = durationBand(book);
    if (band) profile.durationSamples.push(band);
    if (at) {
      profile.recentActivity.push({
        bookId: book.id,
        at,
        theme,
      });
    }
  };

  (onboardingProfile.favoriteWorlds || []).forEach((worldId) => {
    bump(profile.themeCounts, worldId, 3);
    const world = ONBOARDING_WORLDS.find((w) => w.id === worldId);
    if (world?.categoryId) bump(profile.categoryCounts, world.categoryId, 3);
  });

  favoriteBooks.forEach((book) => touchBook(book, 4));

  progressRows.forEach((row) => {
    const book = bookMap.get(String(row.book_id)) || {
      id: row.book_id,
      title: row.book_title,
      theme: row.theme,
      category_name: row.category_name,
    };
    const weight = row.completed || Number(row.progress_percent || 0) >= 100 ? 5 : 2;
    touchBook(book, weight, row.updated_at || row.last_read_at);
  });

  history.forEach((item) => {
    const book = bookMap.get(String(item.bookId));
    touchBook(book || { id: item.bookId, title: item.bookTitle }, 2, item.lastRead);
  });

  listening.forEach((item) => {
    const book = bookMap.get(String(item.bookId)) || { id: item.bookId, title: item.bookTitle, audio_url: item.audioUrl };
    touchBook(book, 3, item.listenedAt);
  });

  const sessions = Array.isArray(stats.sessions) ? stats.sessions : [];
  const timeBuckets = {};
  sessions.forEach((session) => {
    const bucket = hourBucket(session.date || session.endedAt || session.startedAt);
    if (bucket) bump(timeBuckets, bucket, 1);
    if (session.bookId) {
      const book = bookMap.get(String(session.bookId));
      touchBook(book || { id: session.bookId, title: session.bookTitle }, session.finished ? 3 : 1, session.date);
    }
  });

  const started = Math.max(progressRows.length, history.length, 1);
  const completed = Math.max(
    (stats.completedBookIds || []).length,
    progressRows.filter((r) => r.completed || Number(r.progress_percent || 0) >= 100).length,
  );

  const audioTouches = listening.length;
  const textTouches = history.length + progressRows.length;
  const ratioDenom = audioTouches + textTouches;
  profile.audioTextRatio = ratioDenom ? audioTouches / ratioDenom : 0.5;

  profile.favoriteThemes = topKeys(profile.themeCounts, 5);
  profile.favoriteCategories = topKeys(profile.categoryCounts, 5);
  profile.favoriteNarrator = topKeys(profile.narratorCounts, 1)[0] || null;
  profile.favoriteLanguage = topKeys(profile.languageCounts, 1)[0]
    || onboardingProfile.language
    || null;
  profile.favoriteAgeBand = onboardingProfile.ageBand || null;
  profile.favoriteDifficulty = onboardingProfile.readingGoal === 'daily' ? 'easy' : 'medium';
  profile.favoriteDurationBand = topKeys(
    profile.durationSamples.reduce((acc, band) => {
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    }, {}),
    1,
  )[0] || null;
  profile.favoriteTimeOfDay = topKeys(timeBuckets, 1)[0] || null;
  profile.completionRate = Math.round((completed / started) * 100);
  profile.readingFrequency = sessions.length;
  profile.recentActivity = profile.recentActivity
    .filter((a) => a.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 20);
  profile.updatedAt = new Date().toISOString();

  return saveLearningProfile(profile);
}

function ageOverlap(book, ageBand) {
  if (!ageBand) return false;
  const { min, max } = onboardingBandToRange(ageBand);
  const bMin = Number(book.age_group_min);
  const bMax = Number(book.age_group_max);
  if (!Number.isFinite(bMin) && !Number.isFinite(bMax)) return false;
  const a0 = Number.isFinite(bMin) ? bMin : bMax;
  const a1 = Number.isFinite(bMax) ? bMax : bMin;
  return a1 >= min && a0 <= max;
}

function tagsOverlap(book, profile) {
  const text = [book.title, book.description, book.theme, book.category_name, ...(book.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (profile.favoriteThemes || []).some((theme) => text.includes(String(theme).toLowerCase()));
}

/**
 * Score a candidate book for the current child profile.
 */
export function scoreBookForChild(book, profile, {
  completedIds = new Set(),
  recentlyShown = [],
  continueIds = new Set(),
} = {}) {
  if (!book?.id) return -999;
  let score = 0;
  const theme = deriveBookTheme(book) || book.theme;

  if (theme && profile.favoriteThemes?.includes(theme)) score += SCORE.favoriteCategory;
  if (book.category_id && profile.favoriteCategories?.includes(String(book.category_id))) {
    score += SCORE.favoriteCategory;
  }
  if (profile.favoriteNarrator && (book.narrator === profile.favoriteNarrator || book.author === profile.favoriteNarrator)) {
    score += SCORE.sameNarrator;
  }
  if (ageOverlap(book, profile.favoriteAgeBand)) score += SCORE.sameAge;
  if (tagsOverlap(book, profile)) score += SCORE.similarTags;
  if (book.is_popular || book.is_recommended) score += SCORE.trending;
  if (profile.favoriteDurationBand && durationBand(book) === profile.favoriteDurationBand) {
    score += SCORE.similarDuration;
  }
  if (continueIds.has(String(book.id))) score += SCORE.unfinishedSeries;
  if (profile.audioTextRatio > 0.55 && isAudioBook(book)) score += SCORE.audioAffinity;
  if (isPremiumBook(book)) score += SCORE.premiumMix;
  if (book.content_type === 'learning' || book.is_learning) score += SCORE.learningMix;
  if (recentlyShown.includes(String(book.id))) score += SCORE.recentlyShown;
  if (completedIds.has(String(book.id))) score += SCORE.alreadyCompleted;

  return score;
}

export function rankBooksForChild(books = [], profile, options = {}) {
  return [...books]
    .map((book) => ({ book, score: scoreBookForChild(book, profile, options) }))
    .sort((a, b) => b.score - a.score || String(a.book.title || '').localeCompare(String(b.book.title || '')))
    .map((entry) => ({ ...entry.book, _recommendationScore: entry.score }));
}

function mixDiscoverPool(books, profile, { completedIds, recentlyShown, limit = 12 } = {}) {
  const ranked = rankBooksForChild(books, profile, { completedIds, recentlyShown });
  const favorites = ranked.filter((b) => (profile.favoriteThemes || []).includes(deriveBookTheme(b)));
  const fresh = ranked.filter((b) => !recentlyShown.includes(String(b.id)) && !completedIds.has(String(b.id)));
  const premium = ranked.filter(isPremiumBook);
  const learning = ranked.filter((b) => b.content_type === 'learning' || b.is_learning);
  const audio = ranked.filter(isAudioBook);

  const picked = [];
  const take = (list, n) => {
    let added = 0;
    for (const book of list) {
      if (added >= n || picked.length >= limit) break;
      if (picked.some((b) => String(b.id) === String(book.id))) continue;
      picked.push(book);
      added += 1;
    }
  };

  take(favorites, 3);
  take(fresh, 4);
  take(premium, 2);
  take(learning, 1);
  take(audio, 2);
  take(ranked, limit);
  return picked.slice(0, limit);
}

function buildBecauseRails({
  publishedBooks,
  profile,
  favoriteBooks,
  completedIds,
  recentlyShown,
  t,
  onboardingWorlds = [],
}) {
  const rails = [];
  const pool = excludeBookIds(publishedBooks, completedIds);

  // Onboarding / profile world rails
  const worldIds = [
    ...new Set([
      ...(onboardingWorlds || []),
      ...(profile.favoriteThemes || []).slice(0, 3),
    ]),
  ].slice(0, 4);

  worldIds.forEach((themeId) => {
    const strategy = getCategoryContentStrategy(themeId);
    const world = ONBOARDING_WORLDS.find((w) => w.id === themeId || w.categoryId === themeId);
    const label = world
      ? (typeof t === 'function' ? t(`onboardingWorld_${world.id}`) : themeId)
      : themeId;
    const books = rankBooksForChild(
      pool.filter((book) => bookMatchesKidCategory(book, strategy) || deriveBookTheme(book) === themeId),
      profile,
      { completedIds, recentlyShown },
    )
      .filter((b) => !recentlyShown.includes(String(b.id)))
      .slice(0, 12);
    if (!books.length) return;
    rails.push({
      id: `because-${themeId}`,
      type: 'because',
      emoji: world?.emoji || '⭐',
      title: t('discoverBecauseYouLiked', { theme: label }),
      subtitle: t('discoverBecauseSubtitle'),
      books: annotateBooksWithReasons(books, t('discoverBecauseYouLiked', { theme: label })),
      categoryId: world?.categoryId || themeId,
    });
  });

  // Finished-theme rail
  const finishedTheme = profile.favoriteThemes?.[0];
  if (finishedTheme && profile.completionRate >= 40) {
    const strategy = getCategoryContentStrategy(finishedTheme);
    const books = pool
      .filter((book) => bookMatchesKidCategory(book, strategy))
      .slice(0, 8);
    if (books.length) {
      rails.push({
        id: `because-finished-${finishedTheme}`,
        type: 'because',
        emoji: '✨',
        title: t('persBecauseFinished', { theme: finishedTheme }),
        books: annotateBooksWithReasons(books, t('persBecauseFinished', { theme: finishedTheme })),
      });
    }
  }

  // Listened bedtime
  if ((profile.audioTextRatio || 0) > 0.4 || (profile.favoriteThemes || []).includes('bedtime')) {
    const bedtime = buildBedtimeShelf(pool, 'bedtime', t, { excludeIds: completedIds });
    if (bedtime.length) {
      rails.push({
        id: 'because-bedtime-listen',
        type: 'because',
        emoji: '🌙',
        title: t('persBecauseListenedBedtime'),
        books: bedtime,
        modality: 'audio',
      });
    }
  }

  // Favorites affinity fallback
  if (!rails.length && favoriteBooks.length) {
    rails.push({
      id: 'because-loved',
      type: 'because',
      emoji: '❤️',
      title: t('kidsRecentlyLoved'),
      books: annotateBooksWithReasons(favoriteBooks.slice(0, 12), t('discoverReasonLoved')),
      modality: 'favorites',
    });
  }

  return rails.slice(0, 4);
}

function buildContinueItems(progressRows = [], publishedBooks = []) {
  const bookMap = new Map(publishedBooks.map((b) => [String(b.id), b]));
  return progressRows
    .filter((item) => !item.completed && Number(item.progress_percent || 0) > 0 && Number(item.progress_percent || 0) < 100)
    .map((item) => {
      const published = bookMap.get(String(item.book_id)) || {};
      const progress = Number(item.progress_percent || 0);
      const merged = {
        ...published,
        id: item.book_id,
        title: item.book_title || published.title,
        cover_image: published.cover_image || item.cover_image,
        slug: published.slug || item.slug,
        theme: published.theme || item.theme,
        author: published.author || item.author,
        kid_progress_percent: progress,
        progress,
        current_page: item.current_page,
        last_opened_at: item.updated_at || item.last_read_at || item.updatedAt || null,
        remaining_minutes: estimateRemainingMinutes({ ...published, ...item }, progress),
        finished: false,
      };
      return merged;
    });
}

export function evaluatePersonalizationAchievements({
  progressRows = [],
  listeningHistory = null,
  profile = null,
} = {}) {
  const stats = storage.getReadingStats?.() || {};
  const listening = listeningHistory || storage.getListeningHistory?.() || [];
  const completed = Math.max(
    (stats.completedBookIds || []).length,
    progressRows.filter((r) => r.completed || Number(r.progress_percent || 0) >= 100).length,
  );
  const themeCounts = profile?.themeCounts || {};
  const dayKeys = new Set(
    (stats.sessions || [])
      .map((s) => String(s.date || s.endedAt || '').slice(0, 10))
      .filter(Boolean),
  );
  const signal = {
    completed,
    themeCounts,
    audioSessions: listening.length,
    streakDays: dayKeys.size,
    worldsExplored: Object.keys(themeCounts).length,
  };
  return PERSONALIZATION_ACHIEVEMENTS.map((ach) => ({
    ...ach,
    earned: ach.test(signal),
  }));
}

/**
 * Build ordered dynamic Smart Home sections for a child.
 */
export function buildSmartHomeSections({
  publishedBooks = [],
  recommendedBooks = [],
  progressRows = [],
  favoriteBooks = [],
  t,
  language = 'fr',
} = {}) {
  const onboarding = getKidsPersonalizationProfile();
  const completedIds = collectCompletedBookIds(progressRows);
  const recentlyShown = getRecentlyShownBookIds();
  const profile = rebuildLearningProfile({
    progressRows,
    favoriteBooks,
    publishedBooks,
    onboarding,
  });

  const continueBooks = buildContinueItems(progressRows, publishedBooks);
  const continueIds = new Set(continueBooks.map((b) => String(b.id)));
  const pool = excludeBookIds(publishedBooks, completedIds);

  const worldShelves = buildWorldShelves(publishedBooks, onboarding.favoriteWorlds, t, {
    excludeIds: completedIds,
  });

  const becauseRails = buildBecauseRails({
    publishedBooks,
    profile,
    favoriteBooks,
    completedIds,
    recentlyShown,
    t,
    onboardingWorlds: onboarding.favoriteWorlds,
  }).filter((rail) => !worldShelves.some((shelf) => shelf.categoryId && shelf.categoryId === rail.categoryId));

  const recommendedForYou = rankBooksForChild(
    buildPersonalizedRecommended({
      publishedBooks,
      recommendedBooks,
      favoriteWorlds: onboarding.favoriteWorlds,
      ageBand: onboarding.ageBand,
      readingGoal: onboarding.readingGoal,
      t,
      excludeIds: completedIds,
    }),
    profile,
    { completedIds, recentlyShown, continueIds },
  ).slice(0, 12);

  const newForYou = annotateBooksWithReasons(
    rankBooksForChild(
      [...pool].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 30),
      profile,
      { completedIds, recentlyShown },
    ).slice(0, 12),
    t('discoverReasonNew'),
  );

  const recentlyPlayed = (() => {
    const history = storage.getReadingHistory?.() || [];
    const listening = storage.getListeningHistory?.() || [];
    const ids = [
      ...history.map((h) => h.bookId),
      ...listening.map((h) => h.bookId),
    ];
    const books = ids
      .map((id) => publishedBooks.find((b) => String(b.id) === String(id)))
      .filter(Boolean)
      .filter((b, index, arr) => arr.findIndex((x) => String(x.id) === String(b.id)) === index)
      .slice(0, 12);
    return annotateBooksWithReasons(books, t('persRecentlyPlayed'));
  })();

  const ageRange = onboardingBandToRange(onboarding.ageBand || profile.favoriteAgeBand || '5-6');
  const popularWithAge = annotateBooksWithReasons(
    rankBooksForChild(
      filterByAgeBand(pool, ageRange.min, ageRange.max),
      profile,
      { completedIds, recentlyShown },
    )
      .filter((b) => b.is_popular || b.is_recommended || b._recommendationScore > 0)
      .slice(0, 12),
    t('persPopularWithAge'),
  );

  const seedBook = favoriteBooks[0] || continueBooks[0] || recommendedForYou[0];
  const similarStories = seedBook
    ? annotateBooksWithReasons(
      rankBooksForChild(
        pool.filter((b) => String(b.id) !== String(seedBook.id)),
        {
          ...profile,
          favoriteThemes: [deriveBookTheme(seedBook), ...(profile.favoriteThemes || [])].filter(Boolean),
          favoriteNarrator: seedBook.narrator || seedBook.author || profile.favoriteNarrator,
        },
        { completedIds, recentlyShown },
      ).slice(0, 12),
      t('persSimilarStories'),
    )
    : [];

  const exploreSomethingNew = annotateBooksWithReasons(
    mixDiscoverPool(pool, profile, { completedIds, recentlyShown, limit: 12 })
      .filter((b) => !recentlyShown.includes(String(b.id)))
      .slice(0, 12),
    t('persExploreNew'),
  );

  const todaysSurpriseBook = pickDailyFeatured(
    rankBooksForChild(pool, profile, { completedIds, recentlyShown }).slice(0, 40),
  );
  const todaysSurprise = todaysSurpriseBook
    ? [withDiscoveryReason(todaysSurpriseBook, t('persTodaysSurprise'))]
    : annotateBooksWithReasons(pickRandomExplore(pool, 1), t('persTodaysSurprise'));

  const audioDiscoveries = buildAudioDiscoveries(publishedBooks, t, { excludeIds: completedIds });
  const bedtime = buildBedtimeShelf(publishedBooks, onboarding.readingGoal, t, {
    excludeIds: completedIds,
  });

  const sections = [];

  if (continueBooks.length) {
    sections.push({
      id: 'continue_reading',
      type: 'continue',
      emoji: '▶️',
      title: t('kidsHomeContinueAdventures'),
      books: continueBooks,
      priority: 100,
    });
  }

  worldShelves.forEach((shelf, index) => {
    sections.push({
      ...shelf,
      type: 'because',
      priority: 90 - index,
    });
  });

  becauseRails.forEach((rail, index) => {
    sections.push({ ...rail, priority: 85 - index });
  });

  if (recommendedForYou.length) {
    sections.push({
      id: 'recommended_for_you',
      type: 'recommended',
      emoji: '⭐',
      title: t('forYou'),
      subtitle: t('kidsHomeRecommendedSubtitle'),
      books: recommendedForYou,
      priority: 80,
    });
  }

  if (newForYou.length) {
    sections.push({
      id: 'new_for_you',
      type: 'rail',
      emoji: '✨',
      title: t('persNewForYou'),
      books: newForYou,
      priority: 70,
    });
  }

  if (recentlyPlayed.length) {
    sections.push({
      id: 'recently_played',
      type: 'rail',
      emoji: '🕘',
      title: t('persRecentlyPlayed'),
      books: recentlyPlayed,
      priority: 65,
    });
  }

  if (popularWithAge.length) {
    sections.push({
      id: 'popular_age',
      type: 'rail',
      emoji: '👧',
      title: t('persPopularWithAge'),
      books: popularWithAge,
      priority: 60,
    });
  }

  if (similarStories.length) {
    sections.push({
      id: 'similar_stories',
      type: 'rail',
      emoji: '🔗',
      title: t('persSimilarStories'),
      books: similarStories,
      priority: 55,
    });
  }

  if (todaysSurprise.length) {
    sections.push({
      id: 'todays_surprise',
      type: 'rail',
      emoji: '🎁',
      title: t('persTodaysSurprise'),
      books: todaysSurprise,
      priority: 50,
    });
  }

  if (exploreSomethingNew.length) {
    sections.push({
      id: 'explore_new',
      type: 'rail',
      emoji: '🧭',
      title: t('persExploreNew'),
      books: exploreSomethingNew,
      priority: 45,
    });
  }

  if (onboarding.readingGoal === 'bedtime' && bedtime.length) {
    sections.push({
      id: 'bedtime',
      type: 'rail',
      emoji: '🌙',
      title: t('kidsHomeBedtimeGoal'),
      books: bedtime,
      priority: 75,
      seeAllTheme: 'bedtime',
    });
  } else if (bedtime.length) {
    sections.push({
      id: 'bedtime',
      type: 'rail',
      emoji: '🌙',
      title: t('kidsHomeBedtimeGoal'),
      books: bedtime,
      priority: 35,
      seeAllTheme: 'bedtime',
    });
  }

  if (audioDiscoveries.length) {
    sections.push({
      id: 'audio',
      type: 'rail',
      emoji: '🎧',
      title: t('kidsHomeListenDiscover'),
      books: audioDiscoveries,
      priority: onboarding.readingGoal === 'bedtime' || (onboarding.favoriteWorlds || []).includes('music') ? 72 : 40,
      modality: 'audio',
    });
  }

  const ordered = sections
    .filter((section) => Array.isArray(section.books) && section.books.length > 0)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const impressionIds = ordered
    .slice(0, 5)
    .flatMap((section) => section.books.slice(0, 4).map((b) => b.id))
    .filter(Boolean);

  const achievements = evaluatePersonalizationAchievements({
    progressRows,
    profile,
  });

  return {
    profile,
    sections: ordered,
    continueBooks,
    achievements,
    impressionIds,
    language,
  };
}

export function getSmartEmptyRecommendations(publishedBooks = [], t) {
  const profile = loadLearningProfile();
  const completedIds = collectCompletedBookIds([]);
  const books = mixDiscoverPool(publishedBooks, profile, {
    completedIds,
    recentlyShown: getRecentlyShownBookIds(),
    limit: 6,
  });
  return annotateBooksWithReasons(books, t?.('persExploreNew') || 'Discover');
}
