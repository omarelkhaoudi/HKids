import { describe, expect, it } from 'vitest';
import {
  buildParentInsights,
  buildWeeklyProgress,
  getTodayReadingSeconds,
  collectFavoriteThemes,
} from '../parentInsights';

describe('parentInsights', () => {
  const sample = {
    summary: {
      books_completed: 3,
      reading_streak_days: 4,
    },
    daily_activity: [
      { day: '2026-07-14', reading_seconds: 600 },
      { day: '2026-07-15', reading_seconds: 900 },
      { day: '2026-07-20', reading_seconds: 1080 },
    ],
    favorites: {
      items: [
        { book_id: 1, title: 'Les animaux de la forêt' },
        { book_id: 2, title: 'Voyage dans l\'espace' },
      ],
    },
    progress: {
      items: [
        { book_id: 3, title: 'Bonne nuit mon ours', completed: true, progress_percent: 100 },
        { book_id: 4, title: 'Les dinosaures', completed: false, progress_percent: 40 },
      ],
    },
    timeline: {
      items: [
        { title: 'Lecture', created_at: '2026-07-19T19:30:00.000Z' },
        { title: 'Lecture', created_at: '2026-07-18T20:10:00.000Z' },
      ],
    },
  };

  it('reads today seconds from daily_activity', () => {
    expect(getTodayReadingSeconds(sample, new Date('2026-07-20T12:00:00.000Z'))).toBe(1080);
    expect(getTodayReadingSeconds(sample, new Date('2026-07-21T12:00:00.000Z'))).toBe(0);
  });

  it('collects themes from book titles', () => {
    const themes = collectFavoriteThemes(sample, 3);
    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0]).toHaveProperty('id');
  });

  it('builds narrative insights', () => {
    const insights = buildParentInsights(sample, 'Emma');
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]).toHaveProperty('messageKey');
    expect(insights.some((item) => item.params?.name === 'Emma')).toBe(true);
  });

  it('builds weekly progress bars', () => {
    const weekly = buildWeeklyProgress(sample, 7);
    expect(weekly.days.length).toBe(3);
    expect(weekly.totalReadingSeconds).toBe(2580);
    expect(weekly.days.every((day) => day.heightPercent >= 0)).toBe(true);
  });
});
