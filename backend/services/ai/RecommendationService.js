import { AIProviderFactory } from './AIProviderFactory.js';
import { normalizeAIError } from './errors.js';

const SECTION_LIMIT = 8;
const DEFAULT_CONTEXT = {
  favorites: [],
  readingHistory: [],
  listeningHistory: [],
  readingStats: {},
};

function toIdSet(values = []) {
  return new Set(
    values
      .map((value) => Number(value?.bookId ?? value?.id ?? value))
      .filter((value) => Number.isFinite(value))
  );
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeContext(context = {}) {
  return {
    favorites: Array.isArray(context.favorites) ? context.favorites : [],
    readingHistory: Array.isArray(context.readingHistory) ? context.readingHistory : [],
    listeningHistory: Array.isArray(context.listeningHistory) ? context.listeningHistory : [],
    readingStats: context.readingStats && typeof context.readingStats === 'object' ? context.readingStats : {},
  };
}

function bookMatchesInterest(book, interest) {
  const query = normalizeText(interest);
  if (!query) return false;

  return [
    book.title,
    book.description,
    book.category_name,
    book.subcategory_name,
    book.theme,
    ...(Array.isArray(book.tags) ? book.tags : []),
  ].some((value) => normalizeText(value).includes(query));
}

function scoreContent(book, { kid, context, favoriteIds, historyIds, listeningIds, preferredCategories }) {
  let score = 0;
  const reasons = [];

  const kidAge = Number(kid?.age || 0);
  if (kidAge && Number(book.age_group_min) <= kidAge && Number(book.age_group_max) >= kidAge) {
    score += 28;
    reasons.push('age_match');
  }

  if (kid?.preferred_language && book.language === kid.preferred_language) {
    score += 22;
    reasons.push('language_match');
  }

  const interests = Array.isArray(kid?.interests) ? kid.interests : [];
  const interestMatches = interests.filter((interest) => bookMatchesInterest(book, interest));
  if (interestMatches.length > 0) {
    score += 18 + Math.min(12, interestMatches.length * 4);
    reasons.push('interest_match');
  }

  if (preferredCategories.has(Number(book.category_id))) {
    score += 16;
    reasons.push('preferred_category');
  }

  if (favoriteIds.has(Number(book.id))) {
    score += 12;
    reasons.push('favorite');
  }

  if (listeningIds.has(Number(book.id))) {
    score += 8;
    reasons.push('listening_history');
  }

  if (historyIds.has(Number(book.id))) {
    score += 6;
    reasons.push('reading_history');
  }

  const progressPercent = Number(book.kid_progress_percent || 0);
  if (progressPercent > 0 && progressPercent < 100) {
    score += 34;
    reasons.push('continue_reading');
  }

  if (book.is_recommended === true) {
    score += 12;
    reasons.push('editorial_recommended');
  }

  if (book.is_popular === true || Number(book.global_listens || 0) > 0) {
    score += Math.min(18, 8 + Number(book.global_listens || 0) * 2);
    reasons.push('popular');
  }

  if (book.is_new === true) {
    score += 14;
    reasons.push('new');
  }

  if (book.audio_url) {
    score += 6;
    reasons.push('has_audio');
  }

  const totalTimeSeconds = Number(context.readingStats?.totalTimeSeconds || 0);
  if (totalTimeSeconds > 0 && Number(book.duration_seconds || 0) > 0) {
    score += Math.max(0, 8 - Math.floor(Number(book.duration_seconds || 0) / 900));
    reasons.push('duration_fit');
  }

  return { score, reasons };
}

function sortByScore(items) {
  return [...items].sort((a, b) => {
    if (b.recommendation_score !== a.recommendation_score) {
      return b.recommendation_score - a.recommendation_score;
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function uniqueItems(items, limit = SECTION_LIMIT) {
  const seen = new Set();
  const nextItems = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    nextItems.push(item);
    if (nextItems.length >= limit) break;
  }

  return nextItems;
}

function createSection(id, title, subtitle, items) {
  return {
    id,
    title,
    subtitle,
    items: uniqueItems(items),
  };
}

export class RecommendationService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  async recommendContent({ kid, contents = [], context = DEFAULT_CONTEXT }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    const normalizedContext = normalizeContext(context);
    const favoriteIds = toIdSet(normalizedContext.favorites);
    const historyIds = toIdSet(normalizedContext.readingHistory);
    const listeningIds = toIdSet(normalizedContext.listeningHistory);
    const preferredCategories = this.getPreferredCategories(contents, {
      favoriteIds,
      historyIds,
      listeningIds,
    });

    const scoredContents = contents.map((book) => {
      const { score, reasons } = scoreContent(book, {
        kid,
        context: normalizedContext,
        favoriteIds,
        historyIds,
        listeningIds,
        preferredCategories,
      });

      return {
        ...book,
        recommendation_score: score,
        recommendation_reasons: reasons,
      };
    });

    const sorted = sortByScore(scoredContents);
    const continueReading = sortByScore(
      scoredContents.filter((book) => {
        const progress = Number(book.kid_progress_percent || 0);
        return progress > 0 && progress < 100;
      })
    );
    const popular = sortByScore(
      scoredContents.filter((book) => book.is_popular === true || Number(book.global_listens || 0) > 0)
    );
    const newest = sortByScore(
      scoredContents.filter((book) => book.is_new === true || book.created_at)
    );
    const becauseLiked = sortByScore(
      scoredContents.filter((book) => (
        !favoriteIds.has(Number(book.id))
        && !historyIds.has(Number(book.id))
        && preferredCategories.has(Number(book.category_id))
      ))
    );
    const discovery = sortByScore(
      scoredContents.filter((book) => (
        !favoriteIds.has(Number(book.id))
        && !historyIds.has(Number(book.id))
        && !listeningIds.has(Number(book.id))
      ))
    );

    return {
      sections: [
        createSection('recommended_for_you', 'Recommande pour toi', "Selon ton age, ta langue et tes centres d'interet.", sorted),
        createSection('continue_reading', 'Continue ton histoire', 'Reprends les histoires deja commencees.', continueReading),
        createSection('popular', 'Les plus populaires', 'Les contenus les plus ecoutes par les enfants.', popular),
        createSection('new', 'Nouveautes', 'Les dernieres histoires ajoutees.', newest),
        createSection('because_you_liked', 'Parce que tu as aime...', 'Des histoires proches de tes favoris et habitudes.', becauseLiked),
        createSection('discovery', 'Decouverte', 'Pour explorer de nouveaux univers.', discovery),
      ].filter((section) => section.items.length > 0),
      metadata: {
        provider: aiProvider.name,
        strategy: 'deterministic-score-v1',
        factors: [
          'age',
          'language',
          'interests',
          'listening_history',
          'favorites',
          'listening_time',
          'preferred_categories',
          'editorial_flags',
        ],
      },
    };
  }

  async providerRecommendations({ kid, contents = [], context = DEFAULT_CONTEXT }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    try {
      return await aiProvider.recommendContent({ kid, contents, context });
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'Recommendation service failed'
      });
    }
  }

  getPreferredCategories(contents, { favoriteIds, historyIds, listeningIds }) {
    const categoryCounts = new Map();

    contents.forEach((book) => {
      const bookId = Number(book.id);
      const categoryId = Number(book.category_id);
      if (!Number.isFinite(categoryId)) return;

      let weight = 0;
      if (favoriteIds.has(bookId)) weight += 4;
      if (listeningIds.has(bookId)) weight += 3;
      if (historyIds.has(bookId)) weight += 2;
      if (Number(book.kid_total_listening_seconds || 0) > 0) weight += 2;

      if (weight > 0) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + weight);
      }
    });

    return new Set(
      [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([categoryId]) => categoryId)
    );
  }
}
