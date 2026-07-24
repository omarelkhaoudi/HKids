import { beforeEach, describe, expect, it } from 'vitest';
import {
  claimDailyChest,
  getUniverseDashboard,
  loadUniverseProgress,
  recordBookCompleted,
  recordStoryQuizResult,
  setActiveAvatar,
} from '../learningUniverseProgress';
import { buildStoryQuiz, EXPLORER_HUB_TILES, UNIVERSE_MINI_GAMES, UNIVERSE_AVATARS } from '../../constants/learningUniverse';

describe('learning universe', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes explorer hub tiles and mini-games', () => {
    expect(EXPLORER_HUB_TILES.length).toBeGreaterThanOrEqual(10);
    expect(UNIVERSE_MINI_GAMES.length).toBeGreaterThanOrEqual(8);
    expect(UNIVERSE_AVATARS.some((a) => a.id === 'puppy')).toBe(true);
  });

  it('builds a story quiz from book theme', () => {
    const quiz = buildStoryQuiz({ id: 1, title: 'The Friendly Dragon', theme: 'dragons' });
    expect(quiz.options.some((o) => o.correct && o.label === '🐉')).toBe(true);
  });

  it('records book completion with XP and badges', () => {
    const { progress, newlyUnlocked } = recordBookCompleted('kid-u1', { bookId: 42, readSeconds: 90 });
    expect(progress.booksCompleted).toBe(1);
    expect(progress.xp).toBeGreaterThanOrEqual(30);
    expect(newlyUnlocked).toContain('first_book');
  });

  it('records story quiz results', () => {
    recordStoryQuizResult('kid-u2', { success: true, bookId: 9 });
    const progress = loadUniverseProgress('kid-u2');
    expect(progress.quizAttempts).toBe(1);
    expect(progress.quizCorrect).toBe(1);
  });

  it('claims daily chest once', () => {
    const first = claimDailyChest('kid-u3');
    expect(first.claimed).toBe(true);
    expect(first.reward).toBeTruthy();
    const second = claimDailyChest('kid-u3');
    expect(second.claimed).toBe(false);
  });

  it('sets active avatar when unlocked', () => {
    recordBookCompleted('kid-u4', { bookId: 1 });
    const progress = setActiveAvatar('kid-u4', 'puppy');
    expect(progress.activeAvatar).toBe('puppy');
  });

  it('exposes child dashboard fields', () => {
    recordBookCompleted('kid-u5', { bookId: 7, readSeconds: 120 });
    const dash = getUniverseDashboard('kid-u5');
    expect(dash.booksCompleted).toBe(1);
    expect(dash.level.level).toBeGreaterThanOrEqual(1);
    expect(dash.readMinutes).toBeGreaterThanOrEqual(2);
  });
});
