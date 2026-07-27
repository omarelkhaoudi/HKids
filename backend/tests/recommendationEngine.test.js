import test from 'node:test';
import assert from 'node:assert/strict';
import { RecommendationService } from '../services/ai/RecommendationService.js';

const SAMPLE_BOOKS = [
  {
    id: 1,
    title: 'Science Explorer',
    language: 'fr',
    theme: 'science',
    category_id: 10,
    age_group_min: 5,
    age_group_max: 9,
    kid_progress_percent: 45,
    is_recommended: true,
    metadata: {
      catalog_area: 'science',
      editorial_rank: 90,
      localization_status: { fr: true, en: true, ar: true },
    },
  },
  {
    id: 2,
    title: 'Finished Animals',
    language: 'fr',
    theme: 'animals',
    category_id: 11,
    age_group_min: 5,
    age_group_max: 9,
    kid_progress_percent: 100,
    kid_completed: true,
    is_popular: true,
    metadata: { catalog_area: 'stories', editorial_rank: 80, localization_status: { fr: true, en: true, ar: true } },
  },
  {
    id: 3,
    title: 'Map Adventure',
    language: 'fr',
    theme: 'geography',
    category_id: 12,
    age_group_min: 6,
    age_group_max: 10,
    is_new: true,
    metadata: { catalog_area: 'geography', editorial_rank: 75, localization_status: { fr: true, en: true, ar: true } },
  },
  {
    id: 4,
    title: 'Premium Hero',
    language: 'fr',
    theme: 'characters',
    category_id: 13,
    age_group_min: 6,
    age_group_max: 10,
    is_premium: true,
    metadata: { catalog_area: 'characters', editorial_rank: 95, localization_status: { fr: true, en: true, ar: true } },
  },
];

const KID = { age: 7, preferred_language: 'en', interests: ['science', 'map'] };
const CONTEXT = {
  favorites: [{ id: 3 }],
  readingHistory: [{ bookId: 2 }],
  listeningHistory: [],
  readingStats: { totalTimeSeconds: 1200 },
  language: 'en',
  learningGoals: ['science'],
  hasPremiumAccess: true,
};

test('unified ranking is identical across home and library surfaces', async () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const home = await service.recommendContent({ kid: KID, contents: SAMPLE_BOOKS, context: CONTEXT, surface: 'home' });
  const library = await service.recommendContent({ kid: KID, contents: SAMPLE_BOOKS, context: CONTEXT, surface: 'library' });

  const homeIds = home.ranked_books.map((book) => book.id);
  const libraryIds = library.ranked_books.map((book) => book.id);
  assert.deepEqual(homeIds, libraryIds);
});

test('search ranking boosts matching localized and age-fit content', () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const ranked = service.rankSearchResults({
    kid: KID,
    contents: SAMPLE_BOOKS,
    context: CONTEXT,
    query: 'science',
  });

  assert.equal(ranked[0].id, 1);
  assert.ok(ranked[0].recommendation_reasons.includes('search_exact_match'));
});

test('related books use unified affinity scoring', () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const related = service.getRelatedBooks({
    source: SAMPLE_BOOKS[0],
    contents: SAMPLE_BOOKS,
    kid: KID,
    context: CONTEXT,
    limit: 2,
    excludeIds: [2],
  });

  assert.equal(related.length, 2);
  assert.ok(!related.some((book) => book.id === 2));
});

test('continue reading uses a single progress source of truth', () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const continueItems = service.resolveContinueReading(
    SAMPLE_BOOKS.map((book) => ({ ...book, recommendation_score: 10 }))
  );

  assert.equal(continueItems.length, 1);
  assert.equal(continueItems[0].id, 1);
});

test('new section only includes editorial new releases', async () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const withCreatedAt = SAMPLE_BOOKS.map((book) => ({
    ...book,
    created_at: '2026-01-01T00:00:00.000Z',
    is_new: book.id === 3,
  }));
  const result = await service.recommendContent({
    kid: KID,
    contents: withCreatedAt,
    context: CONTEXT,
    surface: 'library',
  });
  const newest = result.sections.find((section) => section.id === 'new');
  assert.equal(newest.items.length, 1);
  assert.equal(newest.items[0].id, 3);
});
