import { describe, expect, it } from 'vitest';
import {
  estimateRemainingMinutes,
  isAudioBook,
  isPremiumBook,
  pickDailyFeatured,
  pickEditorsChoice,
  pickPopularThisWeek,
  pickRandomExplore,
} from '../discoveryRails';

const sample = [
  { id: 1, title: 'A', is_popular: 1, duration_seconds: 600, page_count: 10 },
  { id: 2, title: 'B', is_recommended: 1, is_premium: 1, content_type: 'audio_story', audio_url: '/a.mp3' },
  { id: 3, title: 'C', is_new: 1, duration_minutes: 8 },
  { id: 4, title: 'D' },
];

describe('premium library discovery helpers', () => {
  it('detects audio and premium books', () => {
    expect(isAudioBook(sample[1])).toBe(true);
    expect(isPremiumBook(sample[1])).toBe(true);
    expect(isAudioBook(sample[0])).toBe(false);
  });

  it('estimates remaining minutes from progress', () => {
    expect(estimateRemainingMinutes(sample[0], 50)).toBe(5);
    expect(estimateRemainingMinutes(sample[3], 10)).toBeNull();
  });

  it('picks daily, popular, editors and random shelves', () => {
    expect(pickDailyFeatured(sample)?.id).toBeTruthy();
    expect(pickPopularThisWeek(sample, 2)[0].id).toBe(1);
    expect(pickEditorsChoice(sample, 2).some((book) => book.id === 2)).toBe(true);
    expect(pickRandomExplore(sample, 2).length).toBe(2);
  });
});
