import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/recommendations', () => ({
  recommendationsAPI: {
    getForKid: vi.fn(),
    rankSearch: vi.fn(),
    getRelated: vi.fn(),
  },
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getFavorites: () => [3],
    getReadingHistory: () => [{ bookId: 1, page: 2 }],
    getListeningHistory: () => [],
    getReadingStats: () => ({ totalTimeSeconds: 900, completedBookIds: [2] }),
    getLastPage: () => 2,
  },
}));

vi.mock('../../../utils/kidsPersonalization', () => ({
  getKidsPersonalizationProfile: () => ({
    favoriteWorlds: ['science', 'geography'],
    ageBand: '6-7',
    readingGoal: 'explore',
  }),
}));

import {
  buildProfileFingerprint,
  getContinueReading,
  getSectionItems,
  invalidateRecommendationCache,
  loadRecommendations,
  rankBooksLocally,
  rankSearchResults,
} from '../recommendationEngine';

const books = [
  {
    id: 1,
    title: 'Science Quest',
    theme: 'science',
    category_id: 10,
    age_group_min: 5,
    age_group_max: 9,
    kid_progress_percent: 40,
    metadata: { catalog_area: 'science', editorial_rank: 90, localization_status: { fr: true, en: true } },
  },
  {
    id: 2,
    title: 'Animal Tales',
    theme: 'animals',
    category_id: 11,
    age_group_min: 5,
    age_group_max: 9,
    kid_completed: true,
    kid_progress_percent: 100,
    metadata: { catalog_area: 'stories', editorial_rank: 70, localization_status: { fr: true, en: true } },
  },
  {
    id: 3,
    title: 'Map World',
    theme: 'geography',
    category_id: 12,
    age_group_min: 6,
    age_group_max: 10,
    is_new: true,
    metadata: { catalog_area: 'geography', editorial_rank: 80, localization_status: { fr: true, en: true } },
  },
];

describe('unified recommendation engine', () => {
  beforeEach(() => {
    invalidateRecommendationCache();
  });

  it('returns identical local ordering across home and library surfaces', async () => {
    const home = await loadRecommendations({
      surface: 'home',
      language: 'en',
      books,
      kid: { age: 7, preferred_language: 'en', interests: ['science'] },
      forceRefresh: true,
    });
    const library = await loadRecommendations({
      surface: 'library',
      language: 'en',
      books,
      kid: { age: 7, preferred_language: 'en', interests: ['science'] },
      forceRefresh: true,
    });

    const homeIds = home.ranked_books.map((book) => book.id);
    const libraryIds = library.ranked_books.map((book) => book.id);
    expect(homeIds).toEqual(libraryIds);
  });

  it('resolves continue reading from unified progress sources', () => {
    const recommendations = {
      continue_reading: [{ id: 1, kid_progress_percent: 40 }],
      sections: [{ id: 'continue_reading', items: [{ id: 1, kid_progress_percent: 40 }] }],
    };
    const items = getContinueReading({ books, recommendations });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(1);
    expect(items[0].progress).toBeGreaterThan(0);
  });

  it('ranks search results with recommendation boosts', async () => {
    const ranked = await rankSearchResults({
      query: 'science',
      books,
      kid: { age: 7, preferred_language: 'en', interests: ['science'] },
      language: 'en',
    });
    expect(ranked[0].id).toBe(1);
  });

  it('memoizes recommendations until profile fingerprint changes', async () => {
    const context = {
      favorites: [3],
      readingHistory: [],
      listeningHistory: [],
      readingStats: {},
      learningGoals: ['science'],
      premiumUnlockedBookIds: [],
      hasPremiumAccess: false,
      language: 'en',
    };
    const first = buildProfileFingerprint(context);
    const second = buildProfileFingerprint({ ...context, favorites: [3, 4] });
    expect(first).not.toEqual(second);

    const ranked = rankBooksLocally({
      books,
      context,
      kid: { age: 7, preferred_language: 'en' },
    });
    expect(getSectionItems({ sections: [{ id: 'recommended_for_you', items: ranked }] }, 'recommended_for_you')).toHaveLength(3);
  });
});
