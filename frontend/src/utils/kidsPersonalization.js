/**
 * Client-side Kids Home personalization from onboarding + local activity.
 * No API / no fake AI — filters already-loaded books.
 */

import { getCategoryContentStrategy, bookMatchesKidCategory } from './kidCategoryContent';
import {
  ONBOARDING_WORLDS,
  filterBooksForWorlds,
  getOnboardingProfile,
} from './onboarding';
import {
  annotateBooksWithReasons,
  filterByAgeBand,
  isShortStory,
  withDiscoveryReason,
} from './discoveryRails';
import { isAudioContent, filterAudioBooks } from './contentRouting';
import { storage } from './storage';
import { onboardingBandToRange } from '../constants/ageGroups';

export function getKidsPersonalizationProfile() {
  const profile = getOnboardingProfile();
  return {
    nickname: (profile.nickname || '').trim(),
    avatar: profile.avatar,
    ageBand: profile.ageBand || '5-6',
    favoriteWorlds: Array.isArray(profile.favoriteWorlds) ? profile.favoriteWorlds : [],
    favoriteAnimals: Array.isArray(profile.favoriteAnimals) ? profile.favoriteAnimals : [],
    readingGoal: profile.readingGoal || 'explore',
  };
}

export function ageBandToRange(ageBand) {
  return onboardingBandToRange(ageBand);
}

/** Merge API progress + local reading stats into a Set of finished book ids. */
export function collectCompletedBookIds(progressRows = []) {
  const stats = storage.getReadingStats?.() || { completedBookIds: [] };
  const ids = new Set((stats.completedBookIds || []).map(String));
  (progressRows || []).forEach((row) => {
    if (row?.completed || Number(row?.progress_percent || 0) >= 100) {
      if (row.book_id != null) ids.add(String(row.book_id));
    }
  });
  return ids;
}

export function excludeBookIds(books = [], idSet) {
  if (!idSet || !idSet.size) return books;
  return books.filter((book) => book?.id != null && !idSet.has(String(book.id)));
}

export function prioritizeBooksForAge(books = [], ageBand) {
  const { min, max } = ageBandToRange(ageBand);
  const matched = filterByAgeBand(books, min, max);
  if (matched.length >= 4) return matched;

  // Prefer shorter stories for younger readers when age metadata is sparse
  if (ageBand === '3-4' || ageBand === '5-6') {
    const short = books.filter(isShortStory);
    if (short.length) return short.slice(0, 12);
  }
  return books.slice(0, 12);
}

export function reorderCategoriesByWorlds(categories = [], favoriteWorlds = []) {
  if (!favoriteWorlds.length) return categories;
  const preferredCategoryIds = favoriteWorlds
    .map((worldId) => ONBOARDING_WORLDS.find((world) => world.id === worldId)?.categoryId)
    .filter(Boolean);

  const rank = new Map(preferredCategoryIds.map((id, index) => [id, index]));
  return [...categories].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : 100;
    const bRank = rank.has(b.id) ? rank.get(b.id) : 100;
    return aRank - bRank;
  });
}

/** Reorder library theme chips / shelves so favorite worlds surface first. */
export function reorderThemesByWorlds(themes = [], favoriteWorlds = []) {
  if (!favoriteWorlds.length || !themes.length) return themes;
  const preferredIds = favoriteWorlds
    .map((worldId) => ONBOARDING_WORLDS.find((world) => world.id === worldId)?.categoryId)
    .filter(Boolean);
  if (!preferredIds.length) return themes;

  const rank = new Map(preferredIds.map((id, index) => [id, index]));
  return [...themes].sort((a, b) => {
    if (a.id === 'all') return -1;
    if (b.id === 'all') return 1;
    const aRank = rank.has(a.id) ? rank.get(a.id) : 100;
    const bRank = rank.has(b.id) ? rank.get(b.id) : 100;
    return aRank - bRank;
  });
}

export function buildWorldShelves(books = [], favoriteWorlds = [], t, { excludeIds } = {}) {
  const pool = excludeBookIds(books, excludeIds);
  return favoriteWorlds.slice(0, 3).map((worldId) => {
    const world = ONBOARDING_WORLDS.find((item) => item.id === worldId);
    if (!world) return null;
    const strategy = getCategoryContentStrategy(world.categoryId);
    const shelfBooks = pool
      .filter((book) => bookMatchesKidCategory(book, strategy))
      .slice(0, 12);
    if (!shelfBooks.length) return null;
    const worldLabel = t(`onboardingWorld_${worldId}`);
    return {
      id: `world-${worldId}`,
      worldId,
      emoji: world.emoji,
      title: t('kidsHomeBecauseWorld', { world: worldLabel }),
      subtitle: t('kidsHomeBecauseWorldSubtitle'),
      books: annotateBooksWithReasons(shelfBooks, t('kidsHomeBecauseWorld', { world: worldLabel })),
      categoryId: world.categoryId,
    };
  }).filter(Boolean);
}

export function buildPersonalizedRecommended({
  publishedBooks = [],
  recommendedBooks = [],
  favoriteWorlds = [],
  ageBand,
  readingGoal,
  t,
  excludeIds,
}) {
  const pool = excludeBookIds(
    recommendedBooks.length ? recommendedBooks : publishedBooks,
    excludeIds,
  );
  let books = filterBooksForWorlds(pool, favoriteWorlds);
  books = prioritizeBooksForAge(books, ageBand);

  if (readingGoal === 'bedtime') {
    const bedtimeStrategy = getCategoryContentStrategy('bedtime');
    const bedtimeFirst = books.filter((book) => bookMatchesKidCategory(book, bedtimeStrategy));
    const rest = books.filter((book) => !bookMatchesKidCategory(book, bedtimeStrategy));
    books = [...bedtimeFirst, ...rest];
  }

  if (readingGoal === 'daily') {
    const shortFirst = [...books].sort((a, b) => Number(isShortStory(b)) - Number(isShortStory(a)));
    books = shortFirst;
  }

  // Prefer unseen discoveries; fall back if filtering emptied the shelf
  if (!books.length) {
    books = prioritizeBooksForAge(excludeBookIds(publishedBooks, excludeIds), ageBand);
  }

  return books.slice(0, 12).map((book) => {
    if (isShortStory(book)) return withDiscoveryReason(book, t('discoverReasonShort'));
    if (favoriteWorlds.length) {
      return withDiscoveryReason(book, t('kidsHomePickedForYou'));
    }
    return withDiscoveryReason(book, t('forYou'));
  });
}

export function buildAudioDiscoveries(books = [], t, { excludeIds } = {}) {
  const audio = filterAudioBooks(excludeBookIds(books, excludeIds)).slice(0, 12);
  if (!audio.length) return [];
  return annotateBooksWithReasons(audio, t('kidsHomeListenDiscover'));
}

export function buildBedtimeShelf(books = [], readingGoal, t, { excludeIds } = {}) {
  const strategy = getCategoryContentStrategy('bedtime');
  const bedtime = excludeBookIds(books, excludeIds)
    .filter((book) => bookMatchesKidCategory(book, strategy))
    .slice(0, 12);
  if (!bedtime.length) return [];
  const reason = readingGoal === 'bedtime'
    ? t('kidsHomeBedtimeGoal')
    : t('discoverReasonBedtime');
  return annotateBooksWithReasons(bedtime, reason);
}

export function pickFeaturedBook({
  recommendedBooks = [],
  publishedBooks = [],
  continueReading = null,
  favoriteWorlds = [],
  ageBand,
  excludeIds,
}) {
  const continueId = continueReading?.book_id;
  const published = excludeBookIds(publishedBooks, excludeIds);
  const recommended = excludeBookIds(recommendedBooks, excludeIds);
  const ageFiltered = prioritizeBooksForAge(published, ageBand);
  const worldPool = filterBooksForWorlds(
    recommended.length ? recommended : ageFiltered,
    favoriteWorlds,
  );

  const candidate = worldPool.find((book) => book.id !== continueId)
    || ageFiltered.find((book) => book.id !== continueId)
    || recommended.find((book) => book.id !== continueId)
    || published[0]
    || null;

  return candidate;
}

export function buildSoftProgressSummary({
  progressRows = [],
  favoriteWorlds = [],
  t,
}) {
  const stats = storage.getReadingStats();
  const completedFromApi = progressRows.filter((row) => row.completed || Number(row.progress_percent || 0) >= 100).length;
  const completed = Math.max(completedFromApi, (stats.completedBookIds || []).length);
  const started = progressRows.filter((row) => Number(row.progress_percent || 0) > 0).length
    || storage.getReadingHistory().length;

  const sessions = Array.isArray(stats.sessions) ? stats.sessions : [];
  const dayKeys = new Set(
    sessions
      .map((session) => session?.endedAt || session?.startedAt || session?.date)
      .filter(Boolean)
      .map((value) => String(value).slice(0, 10)),
  );
  const readingDays = dayKeys.size;

  const worldLabels = favoriteWorlds
    .slice(0, 3)
    .map((worldId) => t(`onboardingWorld_${worldId}`))
    .filter(Boolean);

  return {
    completed,
    started,
    readingDays,
    worlds: worldLabels,
    hasSignal: completed > 0 || started > 0 || worldLabels.length > 0,
  };
}

export function shouldPrioritizeAudio(readingGoal, favoriteWorlds = []) {
  if (favoriteWorlds.includes('music')) return true;
  if (readingGoal === 'bedtime') return true;
  return false;
}

export function isAudioBook(book) {
  return isAudioContent(book);
}
