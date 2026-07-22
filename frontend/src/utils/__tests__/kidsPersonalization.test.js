import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../storage', () => ({
  storage: {
    getReadingStats: () => ({
      completedBookIds: [10, 20],
      sessions: [{ endedAt: '2026-07-20T10:00:00.000Z' }],
    }),
    getReadingHistory: () => [],
  },
}));

vi.mock('../onboarding', () => ({
  ONBOARDING_WORLDS: [
    { id: 'animals', emoji: '🐾', categoryId: 'animals' },
    { id: 'space', emoji: '🚀', categoryId: 'space' },
    { id: 'dreams', emoji: '🌙', categoryId: 'bedtime' },
  ],
  filterBooksForWorlds: (books) => books,
  getOnboardingProfile: () => ({
    nickname: 'Lina',
    ageBand: '5-6',
    favoriteWorlds: ['animals', 'space'],
    favoriteAnimals: [],
    readingGoal: 'explore',
  }),
}));

import {
  collectCompletedBookIds,
  excludeBookIds,
  reorderThemesByWorlds,
  buildPersonalizedRecommended,
} from '../kidsPersonalization';

describe('kidsPersonalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges completed ids from stats and progress rows', () => {
    const ids = collectCompletedBookIds([
      { book_id: 30, completed: true },
      { book_id: 40, progress_percent: 100 },
      { book_id: 50, progress_percent: 40 },
    ]);
    expect(ids.has('10')).toBe(true);
    expect(ids.has('20')).toBe(true);
    expect(ids.has('30')).toBe(true);
    expect(ids.has('40')).toBe(true);
    expect(ids.has('50')).toBe(false);
  });

  it('excludes finished books from pools', () => {
    const books = [{ id: 1 }, { id: 10 }, { id: 3 }];
    expect(excludeBookIds(books, new Set(['10'])).map((b) => b.id)).toEqual([1, 3]);
  });

  it('keeps all first when reordering themes by worlds', () => {
    const themes = [
      { id: 'all' },
      { id: 'bedtime' },
      { id: 'animals' },
      { id: 'space' },
    ];
    expect(reorderThemesByWorlds(themes, ['space', 'animals']).map((t) => t.id)).toEqual([
      'all',
      'space',
      'animals',
      'bedtime',
    ]);
  });

  it('builds recommendations that skip completed books', () => {
    const books = [
      { id: 10, title: 'Done', page_count: 8 },
      { id: 11, title: 'Fresh', page_count: 8 },
      { id: 12, title: 'Also', page_count: 20 },
    ];
    const recommended = buildPersonalizedRecommended({
      publishedBooks: books,
      recommendedBooks: books,
      favoriteWorlds: ['animals'],
      ageBand: '5-6',
      readingGoal: 'explore',
      t: (key) => key,
      excludeIds: new Set(['10']),
    });
    expect(recommended.every((book) => String(book.id) !== '10')).toBe(true);
    expect(recommended.length).toBeGreaterThan(0);
  });
});
