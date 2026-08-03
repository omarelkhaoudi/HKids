import { AIProviderFactory } from '../ai/AIProviderFactory.js';
import { normalizeAIError } from '../ai/errors.js';
import { logAIEvent } from '../ai/aiLogger.js';
import {
  buildSignals,
  normalizeContext,
  rankContents,
  scoreRelatedBook,
  scoreSearchResult,
  sortByScore,
  uniqueItems,
} from '../recommendations/scoringModel.js';

const SECTION_LIMIT = 8;
const DEFAULT_CONTEXT = {
  favorites: [],
  readingHistory: [],
  listeningHistory: [],
  readingStats: {},
  language: 'fr',
  learningGoals: [],
  premiumUnlockedBookIds: [],
  hasPremiumAccess: false,
};

const SECTION_LABELS = {
  fr: {
    recommended_for_you: ['Recommandé pour toi', "Selon ton âge, ta langue et tes centres d'intérêt."],
    continue_reading: ['Continue ton histoire', 'Reprends les histoires déjà commencées.'],
    popular: ['Les plus populaires', 'Les contenus les plus écoutés par les enfants.'],
    new: ['Nouveautés', 'Les dernières histoires ajoutées.'],
    because_you_liked: ['Parce que tu as aimé...', 'Des histoires proches de tes favoris et habitudes.'],
    discovery: ['Découverte', 'Pour explorer de nouveaux univers.'],
    recently_played: ['Récemment écouté', 'Reprends tes histoires favorites.'],
    premium: ['Contenus premium', 'Des histoires exclusives pour toi.'],
    favorites: ['Tes favoris', 'Les histoires que tu aimes le plus.'],
  },
  en: {
    recommended_for_you: ['Recommended for you', 'Based on your age, language and interests.'],
    continue_reading: ['Continue your story', 'Pick up where you left off.'],
    popular: ['Most popular', 'Top picks among kids.'],
    new: ['New releases', 'The latest stories added.'],
    because_you_liked: ['Because you liked...', 'Stories close to your favorites.'],
    discovery: ['Discovery', 'Explore new worlds.'],
    recently_played: ['Recently played', 'Pick up your favorite stories.'],
    premium: ['Premium content', 'Exclusive stories for you.'],
    favorites: ['Your favorites', 'Stories you love most.'],
  },
  ar: {
    recommended_for_you: ['مقترح لك', 'حسب عمرك ولغتك واهتماماتك.'],
    continue_reading: ['تابع قصتك', 'استأنف القصص التي بدأتها.'],
    popular: ['الأكثر شعبية', 'محتوى يحبه الأطفال.'],
    new: ['جديد', 'أحدث القصص المضافة.'],
    because_you_liked: ['لأنك أحببت...', 'قصص قريبة من مفضلاتك.'],
    discovery: ['اكتشاف', 'استكشف عوالم جديدة.'],
    recently_played: ['استمعت مؤخراً', 'عد إلى قصصك المفضلة.'],
    premium: ['محتوى مميز', 'قصص حصرية لك.'],
    favorites: ['مفضلاتك', 'القصص التي تحبها أكثر.'],
  },
};

const SURFACE_SECTIONS = {
  home: ['continue_reading', 'recommended_for_you', 'because_you_liked', 'popular', 'new', 'discovery'],
  library: ['continue_reading', 'recommended_for_you', 'because_you_liked', 'popular', 'new', 'discovery'],
  explorer: ['recommended_for_you', 'discovery', 'new'],
  search: ['recommended_for_you'],
  premium: ['premium', 'recommended_for_you'],
  favorites: ['favorites', 'recommended_for_you'],
  audio: ['continue_reading', 'recommended_for_you', 'recently_played', 'popular'],
  continue: ['continue_reading'],
};

function sectionLabels(language = 'fr') {
  const lang = ['fr', 'en', 'ar'].includes(language) ? language : 'fr';
  return SECTION_LABELS[lang];
}

function createSection(id, title, subtitle, items) {
  return {
    id,
    title,
    subtitle,
    items: uniqueItems(items),
  };
}

function isAudioBook(book) {
  return Boolean(book?.audio_url)
    || book?.content_type === 'song'
    || book?.content_type === 'audio_story';
}

function filterSurfaceItems(items, surface) {
  if (surface === 'audio') {
    return items.filter(isAudioBook);
  }
  if (surface === 'premium') {
    return items.filter((book) => book.is_premium === true || book.is_premium === 1);
  }
  if (surface === 'favorites') {
    return items;
  }
  return items;
}

export class RecommendationService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  isProviderConfigured(provider) {
    return Boolean(String(provider?.apiKey || '').trim());
  }

  applyAiRanking(scoredContents, aiRecommendations = []) {
    if (!Array.isArray(aiRecommendations) || aiRecommendations.length === 0) {
      return scoredContents;
    }

    const aiRankWeights = new Map(
      aiRecommendations
        .map((book, index) => [Number(book.id), aiRecommendations.length - index])
        .filter(([id]) => Number.isFinite(id))
    );

    return scoredContents.map((book) => {
      const aiRank = aiRankWeights.get(Number(book.id));
      if (!aiRank) return book;

      return {
        ...book,
        recommendation_score: Number(book.recommendation_score || 0) + aiRank * 15,
        recommendation_reasons: [...(book.recommendation_reasons || []), 'ai_ranked'],
      };
    });
  }

  rankBooks({ kid, contents = [], context = DEFAULT_CONTEXT }) {
    const signals = buildSignals({ kid, contents, context });
    return rankContents(contents, signals);
  }

  rankSearchResults({ kid, contents = [], context = DEFAULT_CONTEXT, query = '' }) {
    const signals = buildSignals({ kid, contents, context });
    return sortByScore(
      contents.map((book) => {
        const { score, reasons } = scoreSearchResult(book, query, signals);
        return {
          ...book,
          recommendation_score: score,
          recommendation_reasons: reasons,
        };
      })
    );
  }

  getRelatedBooks({
    source,
    contents = [],
    kid,
    context = DEFAULT_CONTEXT,
    limit = 8,
    excludeIds = [],
  }) {
    const signals = buildSignals({ kid, contents, context });
    const excluded = new Set((excludeIds || []).map((id) => String(id)));

    return sortByScore(
      contents
        .filter((book) => book && book.id != null && String(book.id) !== String(source?.id))
        .filter((book) => !excluded.has(String(book.id)))
        .map((book) => ({
          ...book,
          recommendation_score: scoreRelatedBook(source, book, signals),
          recommendation_reasons: ['related_content'],
        }))
    ).slice(0, limit);
  }

  resolveContinueReading(contents = []) {
    return sortByScore(
      contents
        .filter((book) => {
          const progress = Number(book.kid_progress_percent || 0);
          return progress > 0 && progress < 100 && book.kid_completed !== true;
        })
        .map((book) => ({
          ...book,
          recommendation_score: Number(book.recommendation_score || 0) + 50,
          recommendation_reasons: [...(book.recommendation_reasons || []), 'continue_reading'],
        }))
    );
  }

  async recommendContent({
    kid,
    contents = [],
    context = DEFAULT_CONTEXT,
    surface = 'home',
  }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    const normalizedContext = normalizeContext(context);
    const signals = buildSignals({ kid, contents, context: normalizedContext });
    const { favoriteIds, historyIds, listeningIds, preferredCategories } = signals;

    let scoredContents = rankContents(contents, signals);
    let strategy = 'deterministic-score-v2';
    let aiMetadata = null;

    if (this.isProviderConfigured(aiProvider) && contents.length > 0) {
      try {
        const aiResult = await this.providerRecommendations({
          kid,
          contents,
          context: normalizedContext,
        });
        const aiRecommendations = Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [];
        if (aiRecommendations.length > 0) {
          scoredContents = this.applyAiRanking(scoredContents, aiRecommendations);
          scoredContents = sortByScore(scoredContents);
          strategy = 'ai-ranked-with-deterministic-fallback-v2';
          aiMetadata = aiResult.provider_metadata || null;
        }
      } catch (error) {
        const normalized = normalizeAIError(error, {
          provider: aiProvider.name,
          fallbackMessage: 'Recommendation service failed',
        });
        logAIEvent('warn', 'recommendation_fallback', {
          provider: aiProvider.name,
          operation: 'recommend_content',
          code: normalized.code,
          status: normalized.status,
          fallback: 'deterministic-score-v2'
        });
        // Rule-based scoring remains the safe fallback for kids content.
      }
    }

    const sorted = scoredContents;
    const continueReading = this.resolveContinueReading(scoredContents);
    const popular = sortByScore(
      scoredContents.filter((book) => book.is_popular === true || Number(book.global_listens || 0) > 0)
    );
    const newest = sortByScore(
      scoredContents.filter((book) => book.is_new === true)
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
    const recentlyPlayed = sortByScore(
      scoredContents.filter((book) => historyIds.has(Number(book.id)) || listeningIds.has(Number(book.id)))
    );
    const premium = sortByScore(
      scoredContents.filter((book) => book.is_premium === true || book.is_premium === 1)
    );
    const favorites = sortByScore(
      scoredContents.filter((book) => favoriteIds.has(Number(book.id)))
    );

    const labels = sectionLabels(normalizedContext.language);
    const allSections = {
      recommended_for_you: createSection('recommended_for_you', ...labels.recommended_for_you, sorted),
      continue_reading: createSection('continue_reading', ...labels.continue_reading, continueReading),
      popular: createSection('popular', ...labels.popular, popular),
      new: createSection('new', ...labels.new, newest),
      because_you_liked: createSection('because_you_liked', ...labels.because_you_liked, becauseLiked),
      discovery: createSection('discovery', ...labels.discovery, discovery),
      recently_played: createSection('recently_played', ...labels.recently_played, recentlyPlayed),
      premium: createSection('premium', ...labels.premium, premium),
      favorites: createSection('favorites', ...labels.favorites, favorites),
    };

    const sectionOrder = SURFACE_SECTIONS[surface] || SURFACE_SECTIONS.home;
    const sections = sectionOrder
      .map((sectionId) => {
        const section = allSections[sectionId];
        if (!section) return null;
        return {
          ...section,
          items: filterSurfaceItems(section.items, surface),
        };
      })
      .filter((section) => section && section.items.length > 0);

    return {
      sections,
      ranked_books: sorted,
      continue_reading: continueReading,
      metadata: {
        provider: aiProvider.name,
        strategy,
        surface,
        ai_metadata: aiMetadata,
        factors: [
          'age',
          'language',
          'interests',
          'learning_goals',
          'listening_history',
          'favorites',
          'reading_stats',
          'preferred_categories',
          'editorial_rank',
          'editorial_flags',
          'premium_eligibility',
          'seasonal_relevance',
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
        fallbackMessage: 'Recommendation service failed',
      });
    }
  }

  getPreferredCategories(contents, { favoriteIds, historyIds, listeningIds }) {
    return buildSignals({
      kid: null,
      contents,
      context: {
        favorites: [...favoriteIds].map((id) => ({ id })),
        readingHistory: [...historyIds].map((id) => ({ id })),
        listeningHistory: [...listeningIds].map((id) => ({ id })),
      },
    }).preferredCategories;
  }
}

// Backward-compatible exports for tests and direct scoring access.
export { scoreContent, sortByScore, uniqueItems } from '../recommendations/scoringModel.js';
