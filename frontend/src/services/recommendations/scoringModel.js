const SEASONAL_KEYWORDS = {
  winter: ['winter', 'hiver', 'snow', 'neige', 'noel', 'christmas', 'froid', 'ice', 'ramadan'],
  spring: ['spring', 'printemps', 'flower', 'fleur', 'easter', 'paques', 'jardin'],
  summer: ['summer', 'ete', 'été', 'beach', 'plage', 'soleil', 'sun', 'vacation', 'vacances'],
  autumn: ['autumn', 'fall', 'automne', 'leaf', 'feuille', 'pumpkin', 'citrouille'],
};

export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

export function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function toIdSet(values = []) {
  return new Set(
    values
      .map((value) => Number(value?.bookId ?? value?.id ?? value))
      .filter((value) => Number.isFinite(value))
  );
}

export function normalizeContext(context = {}) {
  const language = String(context.language || 'fr').trim().toLowerCase().slice(0, 2);
  return {
    favorites: Array.isArray(context.favorites) ? context.favorites : [],
    readingHistory: Array.isArray(context.readingHistory) ? context.readingHistory : [],
    listeningHistory: Array.isArray(context.listeningHistory) ? context.listeningHistory : [],
    readingStats: context.readingStats && typeof context.readingStats === 'object' ? context.readingStats : {},
    language: ['fr', 'en', 'ar'].includes(language) ? language : 'fr',
    learningGoals: Array.isArray(context.learningGoals) ? context.learningGoals : [],
    premiumUnlockedBookIds: Array.isArray(context.premiumUnlockedBookIds)
      ? context.premiumUnlockedBookIds.map(Number).filter(Number.isFinite)
      : [],
    hasPremiumAccess: context.hasPremiumAccess === true,
    season: context.season || getCurrentSeason(),
  };
}

export function bookMatchesInterest(book, interest) {
  const query = normalizeText(interest);
  if (!query) return false;

  return [
    book.title,
    book.description,
    book.category_name,
    book.subcategory_name,
    book.theme,
    ...(Array.isArray(book.tags) ? book.tags : []),
    ...(Array.isArray(book.metadata?.subjects) ? book.metadata.subjects : []),
    ...(Array.isArray(book.metadata?.skills) ? book.metadata.skills : []),
    ...(Array.isArray(book.metadata?.search_terms) ? book.metadata.search_terms : []),
    book.metadata?.catalog_area,
    book.metadata?.character,
  ].some((value) => normalizeText(value).includes(query));
}

export function getPreferredCategories(contents, { favoriteIds, historyIds, listeningIds }) {
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

function bookSearchText(book) {
  return [
    book.title,
    book.description,
    book.author,
    book.category_name,
    book.theme,
    ...(Array.isArray(book.tags) ? book.tags : []),
    ...(Array.isArray(book.search_terms) ? book.search_terms : []),
    ...(Array.isArray(book.metadata?.search_terms) ? book.metadata.search_terms : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isSeasonalMatch(book, season) {
  const keywords = SEASONAL_KEYWORDS[season] || SEASONAL_KEYWORDS.spring;
  const text = bookSearchText(book);
  return keywords.some((keyword) => text.includes(keyword));
}

function isPremiumEligible(book, context) {
  if (book?.is_premium !== true && book?.is_premium !== 1) return true;
  if (context.hasPremiumAccess) return true;
  return context.premiumUnlockedBookIds.includes(Number(book.id));
}

function ageOverlapScore(source = {}, candidate = {}) {
  const sMin = Number(source.age_group_min);
  const sMax = Number(source.age_group_max);
  const cMin = Number(candidate.age_group_min);
  const cMax = Number(candidate.age_group_max);

  const sourceHasAge = Number.isFinite(sMin) || Number.isFinite(sMax);
  const candidateHasAge = Number.isFinite(cMin) || Number.isFinite(cMax);
  if (!sourceHasAge || !candidateHasAge) return 0;

  const a0 = Number.isFinite(sMin) ? sMin : sMax;
  const a1 = Number.isFinite(sMax) ? sMax : sMin;
  const b0 = Number.isFinite(cMin) ? cMin : cMax;
  const b1 = Number.isFinite(cMax) ? cMax : cMin;
  if (a1 < b0 || b1 < a0) return 0;

  const overlap = Math.min(a1, b1) - Math.max(a0, b0) + 1;
  if (overlap >= 3) return 3;
  if (overlap >= 1) return 2;
  return 1;
}

export function scoreContent(book, {
  kid,
  context,
  favoriteIds,
  historyIds,
  listeningIds,
  preferredCategories,
} = {}) {
  let score = 0;
  const reasons = [];

  const kidAge = Number(kid?.age || 0);
  if (kidAge && Number(book.age_group_min) <= kidAge && Number(book.age_group_max) >= kidAge) {
    score += 28;
    reasons.push('age_match');
  }

  const preferredLanguage = normalizeText(kid?.preferred_language || context.language).slice(0, 2);
  const hasPreferredLocalization = Boolean(book.metadata?.localization_status?.[preferredLanguage]);
  if (preferredLanguage && (book.language === preferredLanguage || hasPreferredLocalization)) {
    score += 22;
    reasons.push('language_match');
  }

  const interests = [
    ...(Array.isArray(kid?.interests) ? kid.interests : []),
    ...(Array.isArray(context.learningGoals) ? context.learningGoals : []),
  ];
  const interestMatches = interests.filter((interest) => bookMatchesInterest(book, interest));
  if (interestMatches.length > 0) {
    score += 18 + Math.min(12, interestMatches.length * 4);
    reasons.push('interest_match');
  }

  if (preferredCategories?.has(Number(book.category_id))) {
    score += 16;
    reasons.push('preferred_category');
  }

  if (favoriteIds?.has(Number(book.id))) {
    score += 12;
    reasons.push('favorite');
  }

  if (listeningIds?.has(Number(book.id))) {
    score += 8;
    reasons.push('listening_history');
  }

  if (historyIds?.has(Number(book.id))) {
    score -= 4;
    reasons.push('reading_history');
  }

  const progressPercent = Number(book.kid_progress_percent || 0);
  if (progressPercent > 0 && progressPercent < 100) {
    score += 34;
    reasons.push('continue_reading');
  }
  if (book.kid_completed === true || progressPercent >= 100) {
    score -= 30;
    reasons.push('already_completed');
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

  const editorialRank = Math.max(0, Math.min(100, Number(book.metadata?.editorial_rank || book.editorial_rank || 0)));
  if (editorialRank > 0) {
    score += Math.round(editorialRank / 10);
    reasons.push('editorial_quality');
  }

  if (book.audio_url || book.content_type === 'audio_story' || book.content_type === 'song') {
    score += 6;
    reasons.push('has_audio');
  }

  const totalTimeSeconds = Number(context.readingStats?.totalTimeSeconds || 0);
  if (totalTimeSeconds > 0 && Number(book.duration_seconds || 0) > 0) {
    score += Math.max(0, 8 - Math.floor(Number(book.duration_seconds || 0) / 900));
    reasons.push('duration_fit');
  }

  if (isSeasonalMatch(book, context.season)) {
    score += 10;
    reasons.push('seasonal_relevance');
  }

  if (isPremiumEligible(book, context)) {
    if (book.is_premium === true || book.is_premium === 1) {
      score += 4;
      reasons.push('premium_eligible');
    }
  } else {
    score -= 24;
    reasons.push('premium_locked');
  }

  return { score, reasons };
}

export function scoreRelatedBook(source, candidate, signals = {}) {
  if (!source || !candidate || source.id == null || candidate.id == null) return -1;
  if (String(source.id) === String(candidate.id)) return -1;

  const { score } = scoreContent(candidate, signals);
  let relatedScore = score;

  if (
    source.category_id != null
    && candidate.category_id != null
    && String(source.category_id) === String(candidate.category_id)
  ) {
    relatedScore += 5;
  }

  if (
    source.theme
    && candidate.theme
    && normalizeText(source.theme) === normalizeText(candidate.theme)
  ) {
    relatedScore += 4;
  }

  const sourceArea = source.metadata?.catalog_area || source.catalog_area;
  const candidateArea = candidate.metadata?.catalog_area || candidate.catalog_area;
  if (sourceArea && candidateArea && sourceArea === candidateArea) {
    relatedScore += 3;
  }

  const sourceSubjects = new Set([
    ...(source.subjects || []),
    ...(source.metadata?.subjects || []),
  ].map(String));
  const candidateSubjects = [
    ...(candidate.subjects || []),
    ...(candidate.metadata?.subjects || []),
  ].map(String);
  if (candidateSubjects.some((subject) => sourceSubjects.has(subject))) {
    relatedScore += 2;
  }

  relatedScore += ageOverlapScore(source, candidate);
  return relatedScore;
}

export function scoreSearchResult(book, query, signals = {}) {
  const normalizedQuery = normalizeText(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const haystack = bookSearchText(book);
  const { score, reasons } = scoreContent(book, signals);

  let searchScore = score;
  const searchReasons = [...reasons];

  if (!terms.length) {
    return { score: searchScore, reasons: searchReasons };
  }

  const matchedTerms = terms.filter((term) => haystack.includes(term));
  if (matchedTerms.length === terms.length) {
    searchScore += 20;
    searchReasons.push('search_exact_match');
  } else if (matchedTerms.length > 0) {
    searchScore += matchedTerms.length * 8;
    searchReasons.push('search_partial_match');
  } else {
    searchScore -= 40;
    searchReasons.push('search_miss');
  }

  if (terms.some((term) => normalizeText(book.title).includes(term))) {
    searchScore += 6;
    searchReasons.push('search_title_match');
  }

  return { score: searchScore, reasons: searchReasons };
}

export function sortByScore(items) {
  return [...items].sort((a, b) => {
    if (b.recommendation_score !== a.recommendation_score) {
      return b.recommendation_score - a.recommendation_score;
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

export function buildSignals({ kid, contents = [], context = {} }) {
  const normalizedContext = normalizeContext(context);
  const favoriteIds = toIdSet(normalizedContext.favorites);
  const historyIds = toIdSet(normalizedContext.readingHistory);
  const listeningIds = toIdSet(normalizedContext.listeningHistory);
  const preferredCategories = getPreferredCategories(contents, {
    favoriteIds,
    historyIds,
    listeningIds,
  });

  return {
    kid,
    context: normalizedContext,
    favoriteIds,
    historyIds,
    listeningIds,
    preferredCategories,
  };
}

export function rankContents(contents = [], signals = {}) {
  return sortByScore(
    contents.map((book) => {
      const { score, reasons } = scoreContent(book, signals);
      return {
        ...book,
        recommendation_score: score,
        recommendation_reasons: reasons,
      };
    })
  );
}

export function rankSearchResults(contents = [], query = '', signals = {}) {
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

export function rankRelatedBooks(source, contents = [], signals = {}, { limit = 8, excludeIds = [] } = {}) {
  const excludedValues = excludeIds instanceof Set ? [...excludeIds] : (excludeIds || []);
  const excluded = new Set(excludedValues.map((id) => String(id)));
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
