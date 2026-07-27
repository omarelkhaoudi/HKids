import { recommendationsAPI } from '../../api/recommendations';
import { getKidsPersonalizationProfile } from '../../utils/kidsPersonalization';
import { contentMatchesSearch } from '../../utils/contentSearch';
import { storage } from '../../utils/storage';
import { resolveContinueReading } from './continueReadingService';
import {
  buildSignals,
  rankContents,
  rankRelatedBooks,
  rankSearchResults as rankSearchResultsLocally,
} from './scoringModel';

const CACHE_TTL_MS = 5 * 60 * 1000;
const recommendationCache = new Map();

export const RECOMMENDATION_SURFACES = [
  'home',
  'library',
  'explorer',
  'search',
  'premium',
  'favorites',
  'audio',
  'continue',
];

export function getRecommendationContext({
  language = 'fr',
  parentalPolicy = null,
} = {}) {
  const onboarding = getKidsPersonalizationProfile();
  return {
    favorites: storage.getFavorites(),
    readingHistory: storage.getReadingHistory(),
    listeningHistory: storage.getListeningHistory(),
    readingStats: storage.getReadingStats(),
    learningGoals: onboarding.favoriteWorlds || [],
    premiumUnlockedBookIds: parentalPolicy?.premium_unlocked_book_ids || [],
    hasPremiumAccess: parentalPolicy?.subscription?.status === 'active',
    language,
  };
}

export function buildProfileFingerprint(context = {}) {
  return JSON.stringify({
    favorites: context.favorites,
    readingHistory: context.readingHistory,
    listeningHistory: context.listeningHistory,
    readingStats: context.readingStats,
    learningGoals: context.learningGoals,
    premiumUnlockedBookIds: context.premiumUnlockedBookIds,
    hasPremiumAccess: context.hasPremiumAccess,
    language: context.language,
  });
}

export function invalidateRecommendationCache() {
  recommendationCache.clear();
}

function getCacheKey(surface, fingerprint) {
  return `${surface}:${fingerprint}`;
}

function readCache(surface, fingerprint) {
  const cached = recommendationCache.get(getCacheKey(surface, fingerprint));
  if (!cached) return null;
  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    recommendationCache.delete(getCacheKey(surface, fingerprint));
    return null;
  }
  return cached.value;
}

function writeCache(surface, fingerprint, value) {
  recommendationCache.set(getCacheKey(surface, fingerprint), {
    value,
    createdAt: Date.now(),
  });
  if (recommendationCache.size > 20) {
    const firstKey = recommendationCache.keys().next().value;
    recommendationCache.delete(firstKey);
  }
}

function buildLocalRecommendations({
  books = [],
  context = {},
  kid = null,
  surface = 'home',
}) {
  const signals = buildSignals({ kid, contents: books, context });
  const rankedBooks = rankContents(books, signals);
  const continueItems = resolveContinueReading({
    books,
    progressRows: [],
    apiContinueItems: rankedBooks.filter((book) => {
      const progress = Number(book.kid_progress_percent || 0);
      return progress > 0 && progress < 100;
    }),
    readingHistory: context.readingHistory,
  });

  const section = (id, title, subtitle, items) => ({
    id,
    title,
    subtitle,
    items: items.slice(0, 8),
  });

  const sections = [
    section('continue_reading', 'Continue', 'Resume', continueItems),
    section('recommended_for_you', 'Recommended', 'For you', rankedBooks),
    section('popular', 'Popular', 'Top picks', rankedBooks.filter((book) => book.is_popular)),
    section('new', 'New', 'Fresh stories', rankedBooks.filter((book) => book.is_new)),
    section('because_you_liked', 'Because you liked', 'More like this', rankedBooks),
    section('discovery', 'Discovery', 'Explore', rankedBooks),
    section('recently_played', 'Recently played', 'Again', rankedBooks),
    section('premium', 'Premium', 'Exclusive', rankedBooks.filter((book) => book.is_premium)),
    section('favorites', 'Favorites', 'Loved', rankedBooks.filter((book) => signals.favoriteIds.has(Number(book.id)))),
  ].filter((entry) => entry.items.length > 0);

  const surfaceSections = {
    home: ['continue_reading', 'recommended_for_you', 'because_you_liked', 'popular', 'new', 'discovery'],
    library: ['continue_reading', 'recommended_for_you', 'because_you_liked', 'popular', 'new', 'discovery'],
    explorer: ['recommended_for_you', 'discovery', 'new'],
    search: ['recommended_for_you'],
    premium: ['premium', 'recommended_for_you'],
    favorites: ['favorites', 'recommended_for_you'],
    audio: ['continue_reading', 'recommended_for_you', 'recently_played', 'popular'],
    continue: ['continue_reading'],
  };

  const allowed = new Set(surfaceSections[surface] || surfaceSections.home);
  return {
    sections: sections.filter((entry) => allowed.has(entry.id)),
    ranked_books: rankedBooks,
    continue_reading: continueItems,
    metadata: {
      provider: 'client',
      strategy: 'deterministic-score-v2',
      surface,
    },
  };
}

export async function loadRecommendations({
  surface = 'home',
  language = 'fr',
  books = [],
  kid = null,
  parentalPolicy = null,
  forceRefresh = false,
} = {}) {
  const context = getRecommendationContext({ language, parentalPolicy });
  const fingerprint = buildProfileFingerprint(context);
  const cacheKey = getCacheKey(surface, fingerprint);

  if (!forceRefresh) {
    const cached = readCache(surface, fingerprint);
    if (cached) return cached;
  }

  try {
    const response = await recommendationsAPI.getForKid({
      ...context,
      language,
      surface,
    });
    const payload = {
      ...response.data,
      continue_reading: resolveContinueReading({
        books,
        progressRows: [],
        apiContinueItems: response.data?.continue_reading || [],
        readingHistory: context.readingHistory,
      }),
    };
    writeCache(surface, fingerprint, payload);
    return payload;
  } catch {
    const local = buildLocalRecommendations({
      books,
      context,
      kid,
      surface,
    });
    writeCache(surface, fingerprint, local);
    return local;
  }
}

export function getSectionItems(recommendations, sectionId) {
  const section = (recommendations?.sections || []).find((entry) => entry.id === sectionId);
  return Array.isArray(section?.items) ? section.items : [];
}

export function getRankedBooks(recommendations) {
  if (Array.isArray(recommendations?.ranked_books) && recommendations.ranked_books.length) {
    return recommendations.ranked_books;
  }
  return getSectionItems(recommendations, 'recommended_for_you');
}

export function rankBooksLocally({
  books = [],
  context = {},
  kid = null,
} = {}) {
  const signals = buildSignals({ kid, contents: books, context });
  return rankContents(books, signals);
}

export async function rankSearchResults({
  query = '',
  books = [],
  context = {},
  kid = null,
  language = 'fr',
  parentalPolicy = null,
} = {}) {
  const normalizedQuery = String(query || '').trim();
  const matches = books.filter((book) => contentMatchesSearch(book, normalizedQuery));
  if (!matches.length) return [];

  const fullContext = {
    ...getRecommendationContext({ language, parentalPolicy }),
    ...context,
  };

  try {
    const response = await recommendationsAPI.rankSearch({
      ...fullContext,
      language,
      query: normalizedQuery,
    });
    return response.data?.items || [];
  } catch {
    const signals = buildSignals({ kid, contents: matches, context: fullContext });
    return rankSearchResultsLocally(matches, normalizedQuery, signals);
  }
}

export async function getRelatedBooks({
  source,
  candidates = [],
  context = {},
  kid = null,
  language = 'fr',
  parentalPolicy = null,
  limit = 8,
  excludeIds = [],
} = {}) {
  if (!source) return [];

  const fullContext = {
    ...getRecommendationContext({ language, parentalPolicy }),
    ...context,
  };

  try {
    const response = await recommendationsAPI.getRelated({
      ...fullContext,
      language,
      source_book_id: source.id,
      limit,
      exclude_ids: excludeIds,
    });
    return response.data?.items || [];
  } catch {
    const signals = buildSignals({ kid, contents: candidates, context: fullContext });
    return rankRelatedBooks(source, candidates, signals, { limit, excludeIds });
  }
}

export function getContinueReading({
  books = [],
  progressRows = [],
  recommendations = null,
  readingHistory = storage.getReadingHistory?.() || [],
} = {}) {
  return resolveContinueReading({
    books,
    progressRows,
    apiContinueItems: recommendations?.continue_reading || getSectionItems(recommendations, 'continue_reading'),
    readingHistory,
  });
}

export function orderBooksByRecommendationIds(books = [], orderedItems = []) {
  const order = new Map(
    orderedItems.map((item, index) => [String(item.id ?? item.book_id), index])
  );
  return [...books].sort((a, b) => {
    const aIndex = order.has(String(a.id)) ? order.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
    const bIndex = order.has(String(b.id)) ? order.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return Number(b.recommendation_score || 0) - Number(a.recommendation_score || 0);
  });
}
