import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../storage', () => {
  const store = {
    favorites: [],
    history: [],
    listening: [],
    stats: { completedBookIds: [], sessions: [], totalTimeSeconds: 0, totalSessions: 0 },
    pinned: [],
  };
  return {
    storage: {
      getFavorites: () => store.favorites,
      getReadingHistory: () => store.history,
      getListeningHistory: () => store.listening,
      getReadingStats: () => store.stats,
      getPinnedFavorites: () => store.pinned,
      togglePinnedFavorite: (id) => {
        store.pinned = store.pinned.includes(id)
          ? store.pinned.filter((x) => x !== id)
          : [id, ...store.pinned];
        return store.pinned;
      },
      __store: store,
    },
  };
});

vi.mock('../kidsPersonalization', async () => {
  const actual = await vi.importActual('../kidsPersonalization');
  return {
    ...actual,
    getKidsPersonalizationProfile: () => ({
      nickname: 'Lina',
      ageBand: '5-6',
      favoriteWorlds: ['dinosaurs', 'animals'],
      readingGoal: 'explore',
    }),
  };
});

vi.mock('../onboarding', async () => {
  const actual = await vi.importActual('../onboarding');
  return {
    ...actual,
    getOnboardingProfile: () => ({
      nickname: 'Lina',
      ageBand: '5-6',
      favoriteWorlds: ['dinosaurs', 'animals'],
      readingGoal: 'explore',
    }),
  };
});

import { storage } from '../storage';
import {
  buildSmartHomeSections,
  evaluatePersonalizationAchievements,
  rebuildLearningProfile,
  scoreBookForChild,
  rankBooksForChild,
  recordShownBooks,
  getRecentlyShownBookIds,
} from '../personalizationEngine';

const books = [
  {
    id: 1,
    title: 'Dino Park',
    theme: 'dinosaurs',
    category_name: 'dinosaurs',
    age_group_min: 4,
    age_group_max: 7,
    is_popular: 1,
    created_at: '2026-07-01',
    duration_minutes: 10,
    page_count: 12,
  },
  {
    id: 2,
    title: 'Space Trip',
    theme: 'space',
    author: 'Nora',
    age_group_min: 5,
    age_group_max: 8,
    is_new: 1,
    created_at: '2026-07-20',
  },
  {
    id: 3,
    title: 'Quiet Night',
    theme: 'bedtime',
    audio_url: '/a.mp3',
    content_type: 'audio_story',
    age_group_min: 3,
    age_group_max: 6,
    duration_minutes: 5,
  },
  {
    id: 4,
    title: 'Animal Friends',
    theme: 'animals',
    age_group_min: 4,
    age_group_max: 6,
    is_recommended: 1,
  },
  {
    id: 5,
    title: 'Finished Tale',
    theme: 'animals',
    age_group_min: 4,
    age_group_max: 6,
  },
];

describe('personalizationEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.__store.favorites = [4];
    storage.__store.history = [{ bookId: 1, bookTitle: 'Dino Park', lastRead: '2026-07-22T10:00:00.000Z' }];
    storage.__store.listening = [{ bookId: 3, bookTitle: 'Quiet Night', listenedAt: '2026-07-21T20:00:00.000Z' }];
    storage.__store.stats = {
      completedBookIds: [5],
      sessions: [
        { bookId: 1, date: '2026-07-22T10:00:00.000Z', finished: false },
        { bookId: 5, date: '2026-07-20T18:00:00.000Z', finished: true },
      ],
      totalTimeSeconds: 120,
      totalSessions: 2,
    };
  });

  it('rebuilds a local learning profile from activity', () => {
    const profile = rebuildLearningProfile({
      publishedBooks: books,
      favoriteBooks: [books[3]],
      progressRows: [
        { book_id: 1, progress_percent: 40, book_title: 'Dino Park' },
        { book_id: 5, completed: true, progress_percent: 100 },
      ],
    });
    expect(profile.favoriteThemes.length).toBeGreaterThan(0);
    expect(profile.themeCounts.dinosaurs || profile.themeCounts.animals).toBeTruthy();
    expect(profile.updatedAt).toBeTruthy();
  });

  it('scores favorite themes higher and completed books lower', () => {
    const profile = rebuildLearningProfile({
      publishedBooks: books,
      favoriteBooks: [books[0]],
      progressRows: [{ book_id: 5, completed: true, progress_percent: 100 }],
    });
    const dinoScore = scoreBookForChild(books[0], profile, {
      completedIds: new Set(['5']),
      recentlyShown: [],
    });
    const finishedScore = scoreBookForChild(books[4], profile, {
      completedIds: new Set(['5']),
      recentlyShown: [],
    });
    expect(dinoScore).toBeGreaterThan(finishedScore);
  });

  it('ranks books for a child', () => {
    const profile = rebuildLearningProfile({
      publishedBooks: books,
      favoriteBooks: [books[0]],
      progressRows: [],
    });
    const ranked = rankBooksForChild(books, profile, {
      completedIds: new Set(['5']),
      recentlyShown: ['2'],
    });
    expect(ranked[0]._recommendationScore).toBeGreaterThanOrEqual(ranked[ranked.length - 1]._recommendationScore);
  });

  it('builds dynamic smart home sections', () => {
    const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key);
    const result = buildSmartHomeSections({
      publishedBooks: books,
      recommendedBooks: [books[3]],
      progressRows: [
        { book_id: 1, progress_percent: 35, book_title: 'Dino Park', updated_at: '2026-07-22T10:00:00.000Z' },
        { book_id: 5, completed: true, progress_percent: 100 },
      ],
      favoriteBooks: [books[3]],
      t,
      language: 'en',
    });
    expect(result.sections.length).toBeGreaterThan(2);
    expect(result.sections.some((s) => s.type === 'continue')).toBe(true);
    expect(result.sections.some((s) => s.id === 'recommended_for_you' || s.type === 'because' || s.type === 'recommended')).toBe(true);
    expect(result.continueBooks[0].remaining_minutes).toBeTruthy();
    expect(result.achievements.length).toBeGreaterThan(0);
  });

  it('rotates recently shown books', () => {
    recordShownBooks([1, 2]);
    expect(getRecentlyShownBookIds()).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('evaluates lightweight achievements', () => {
    const profile = rebuildLearningProfile({
      publishedBooks: books,
      favoriteBooks: [books[3], books[0]],
      progressRows: [
        { book_id: 5, completed: true },
        { book_id: 4, completed: true },
      ],
    });
    const achievements = evaluatePersonalizationAchievements({
      progressRows: [
        { book_id: 5, completed: true },
        { book_id: 4, completed: true },
      ],
      profile,
    });
    expect(achievements.find((a) => a.id === 'first_story')?.earned).toBe(true);
  });
});
