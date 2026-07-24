import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EDUCATIONAL_WORLDS,
  LEARNING_ACHIEVEMENTS,
  contentMatchesWorld,
  filterContentsForWorld,
  getEducationalWorld,
  xpToLevel,
} from '../../constants/educationalWorlds';
import { getWorldChallenges } from '../../constants/worldChallenges';
import { eduLabel } from '../../constants/educationalWorldLabels';
import {
  buildRecommendations,
  claimDailyReward,
  getDashboardSnapshot,
  getWorldPathProgress,
  loadEducationalProgress,
  recordLearningAttempt,
  saveEducationalProgress,
} from '../educationalProgress';

describe('educational worlds catalog', () => {
  it('exposes 17 educational worlds', () => {
    expect(EDUCATIONAL_WORLDS).toHaveLength(17);
    expect(EDUCATIONAL_WORLDS.map((w) => w.id)).toEqual([
      'alphabet', 'numbers', 'colors', 'shapes', 'logic', 'mathematics',
      'science', 'geography', 'animals', 'space', 'dinosaurs', 'music',
      'nature', 'creativity', 'emotions', 'kindness', 'culture',
    ]);
  });

  it('gives each world a learning path with a master step', () => {
    EDUCATIONAL_WORLDS.forEach((world) => {
      expect(world.path.length).toBeGreaterThanOrEqual(2);
      expect(world.path.some((step) => step.master)).toBe(true);
      expect(getWorldChallenges(world.id).length).toBeGreaterThan(0);
    });
  });

  it('maps catalog content into matching worlds', () => {
    const alphabetQuiz = { category_code: 'alphabet', title: 'Letters' };
    const animalsGame = { category_code: 'animals', title: 'Zoo' };
    expect(contentMatchesWorld(alphabetQuiz, getEducationalWorld('alphabet'))).toBe(true);
    expect(filterContentsForWorld([alphabetQuiz, animalsGame], 'animals')).toHaveLength(1);
  });

  it('computes XP levels', () => {
    expect(xpToLevel(0).level).toBe(1);
    expect(xpToLevel(100).level).toBe(2);
    expect(xpToLevel(250).level).toBe(3);
  });

  it('localizes world labels in FR/EN/AR', () => {
    expect(eduLabel('eduWorldAlphabet', 'en')).toBe('Alphabet');
    expect(eduLabel('eduWorldAlphabet', 'fr')).toBe('Alphabet');
    expect(eduLabel('eduWorldAnimals', 'ar')).toContain('حيوان');
  });

  it('defines achievement badges', () => {
    expect(LEARNING_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(9);
    expect(LEARNING_ACHIEVEMENTS.find((b) => b.id === 'first_story')).toBeTruthy();
  });
});

describe('educational progress', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    });
  });

  it('records attempts, XP, and unlocks first badge', () => {
    const { progress, newlyUnlocked, level } = recordLearningAttempt('kid-1', {
      worldId: 'alphabet',
      contentId: 'c1',
      success: true,
      scorePercent: 100,
      durationSeconds: 30,
    });
    expect(progress.successes).toBe(1);
    expect(progress.byWorld.alphabet).toBe(1);
    expect(progress.xp).toBeGreaterThan(0);
    expect(level.level).toBeGreaterThanOrEqual(1);
    expect(newlyUnlocked).toContain('first_story');
  });

  it('tracks world path progression', () => {
    saveEducationalProgress('kid-2', {
      ...loadEducationalProgress('kid-2'),
      byWorld: { alphabet: 3 },
    });
    const path = getWorldPathProgress('kid-2', 'alphabet');
    expect(path.completed).toBeGreaterThanOrEqual(2);
    expect(path.steps[0].done).toBe(true);
  });

  it('builds recommendation rails', () => {
    recordLearningAttempt('kid-3', { worldId: 'animals', success: true, contentId: 'a1' });
    const recs = buildRecommendations({
      kidId: 'kid-3',
      contents: [
        { id: 'a1', title: 'Zoo', category_code: 'animals' },
        { id: 'b1', title: 'ABC', category_code: 'alphabet' },
      ],
      ageGroup: '4-6',
    });
    expect(recs.continueLearning.worldId).toBeTruthy();
    expect(recs.recommendedForYou.length).toBeGreaterThan(0);
    expect(recs.exploreMore.length).toBeGreaterThan(0);
    expect(recs.stats.worldsExplored).toBeGreaterThanOrEqual(1);
  });

  it('claims daily reward once', () => {
    const first = claimDailyReward('kid-4');
    expect(first.claimed).toBe(true);
    const second = claimDailyReward('kid-4');
    expect(second.claimed).toBe(false);
  });

  it('exposes dashboard snapshot fields', () => {
    recordLearningAttempt('kid-5', {
      worldId: 'space',
      challengeId: 'space-find',
      success: true,
      scorePercent: 100,
      durationSeconds: 60,
    });
    const snap = getDashboardSnapshot('kid-5');
    expect(snap).toMatchObject({
      worldsExplored: expect.any(Number),
      quizScore: expect.any(Number),
      timeSpentMinutes: expect.any(Number),
      weeklyProgress: expect.any(Number),
      monthlyProgress: expect.any(Number),
    });
    expect(snap.challengesCompleted).toBeGreaterThanOrEqual(1);
  });
});
