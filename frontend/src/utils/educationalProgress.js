/**
 * Local educational progress — XP, streaks, badges, recommendations.
 * Works offline; syncs with API attempts when available.
 */

import {
  EDUCATIONAL_WORLDS,
  LEARNING_ACHIEVEMENTS,
  XP_PER_ATTEMPT,
  XP_PER_SUCCESS,
  filterContentsForWorld,
  getEducationalWorld,
  xpToLevel,
} from '../constants/educationalWorlds';

const STORAGE_PREFIX = 'hkids_edu_progress_v1_';

function storageKey(kidId) {
  return `${STORAGE_PREFIX}${kidId || 'guest'}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptyProgress() {
  return {
    xp: 0,
    successes: 0,
    attempts: 0,
    perfectScores: 0,
    byWorld: {},
    completedContentIds: [],
    completedChallenges: [],
    badges: [],
    daily: {},
    lastActiveDate: null,
    streakDays: 0,
    timeSpentSeconds: 0,
    favoriteWorldIds: [],
    weeklyHistory: {},
    monthlyHistory: {},
  };
}

export function loadEducationalProgress(kidId) {
  try {
    const raw = localStorage.getItem(storageKey(kidId));
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
  }
}

export function saveEducationalProgress(kidId, progress) {
  try {
    localStorage.setItem(storageKey(kidId), JSON.stringify(progress));
  } catch {
    /* ignore quota */
  }
  return progress;
}

function bumpStreak(progress) {
  const today = todayKey();
  if (progress.lastActiveDate === today) return progress;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  const nextStreak = progress.lastActiveDate === yKey ? (progress.streakDays || 0) + 1 : 1;
  return {
    ...progress,
    lastActiveDate: today,
    streakDays: nextStreak,
  };
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/**
 * Record a learning attempt (quiz/game/challenge).
 */
export function recordLearningAttempt(kidId, {
  worldId,
  contentId,
  success = false,
  scorePercent = 0,
  durationSeconds = 0,
  challengeId = null,
} = {}) {
  let progress = bumpStreak(loadEducationalProgress(kidId));
  const xpGain = (success ? XP_PER_SUCCESS : 0) + XP_PER_ATTEMPT;
  const today = todayKey();
  const week = weekKey();
  const month = monthKey();

  progress = {
    ...progress,
    xp: (progress.xp || 0) + xpGain,
    attempts: (progress.attempts || 0) + 1,
    successes: (progress.successes || 0) + (success ? 1 : 0),
    perfectScores: (progress.perfectScores || 0) + (success && scorePercent >= 100 ? 1 : 0),
    timeSpentSeconds: (progress.timeSpentSeconds || 0) + Math.max(0, Number(durationSeconds) || 0),
    byWorld: {
      ...progress.byWorld,
      ...(worldId
        ? { [worldId]: (progress.byWorld?.[worldId] || 0) + (success ? 1 : 0) }
        : {}),
    },
    completedContentIds: success && contentId
      ? Array.from(new Set([...(progress.completedContentIds || []), String(contentId)]))
      : progress.completedContentIds || [],
    completedChallenges: success && challengeId
      ? Array.from(new Set([...(progress.completedChallenges || []), String(challengeId)]))
      : progress.completedChallenges || [],
    daily: {
      ...(progress.daily || {}),
      [today]: {
        successes: ((progress.daily?.[today]?.successes) || 0) + (success ? 1 : 0),
        xp: ((progress.daily?.[today]?.xp) || 0) + xpGain,
      },
    },
    weeklyHistory: {
      ...(progress.weeklyHistory || {}),
      [week]: ((progress.weeklyHistory?.[week]) || 0) + (success ? 1 : 0),
    },
    monthlyHistory: {
      ...(progress.monthlyHistory || {}),
      [month]: ((progress.monthlyHistory?.[month]) || 0) + (success ? 1 : 0),
    },
  };

  if (worldId && success) {
    const fav = progress.favoriteWorldIds || [];
    if (!fav.includes(worldId)) {
      progress.favoriteWorldIds = [worldId, ...fav].slice(0, 5);
    }
  }

  const stats = buildStats(progress);
  const newlyUnlocked = [];
  LEARNING_ACHIEVEMENTS.forEach((badge) => {
    if ((progress.badges || []).includes(badge.id)) return;
    if (badge.test(stats)) {
      progress.badges = [...(progress.badges || []), badge.id];
      newlyUnlocked.push(badge.id);
    }
  });

  saveEducationalProgress(kidId, progress);
  return { progress, xpGain, newlyUnlocked, level: xpToLevel(progress.xp) };
}

export function buildStats(progress) {
  const today = todayKey();
  const worldsExplored = Object.keys(progress.byWorld || {}).filter((k) => (progress.byWorld[k] || 0) > 0).length;
  return {
    successes: progress.successes || 0,
    attempts: progress.attempts || 0,
    perfectScores: progress.perfectScores || 0,
    byWorld: progress.byWorld || {},
    todaySuccesses: progress.daily?.[today]?.successes || 0,
    streakDays: progress.streakDays || 0,
    worldsExplored,
    xp: progress.xp || 0,
  };
}

export function getWorldPathProgress(kidId, worldId) {
  const world = getEducationalWorld(worldId);
  const progress = loadEducationalProgress(kidId);
  if (!world) return { steps: [], completed: 0, percent: 0 };
  const wins = progress.byWorld?.[worldId] || 0;
  const steps = world.path.map((step, index) => {
    const required = step.master ? world.path.length : index + 1;
    const done = wins >= required;
    return { ...step, done, unlocked: index === 0 || wins >= index };
  });
  const completed = steps.filter((s) => s.done).length;
  return {
    steps,
    completed,
    percent: Math.round((completed / Math.max(1, steps.length)) * 100),
    wins,
  };
}

export function buildRecommendations({
  kidId,
  contents = [],
  ageGroup = null,
  favoriteWorldIds = [],
  parentalAllowedWorlds = null,
} = {}) {
  const progress = loadEducationalProgress(kidId);
  const stats = buildStats(progress);
  const fav = favoriteWorldIds.length ? favoriteWorldIds : (progress.favoriteWorldIds || []);
  const weakWorld = EDUCATIONAL_WORLDS
    .map((w) => ({ id: w.id, score: progress.byWorld?.[w.id] || 0 }))
    .sort((a, b) => a.score - b.score)[0];

  let worlds = EDUCATIONAL_WORLDS;
  if (Array.isArray(parentalAllowedWorlds) && parentalAllowedWorlds.length) {
    worlds = worlds.filter((w) => parentalAllowedWorlds.includes(w.id));
  }

  const continueWorld = fav[0] || weakWorld?.id || 'alphabet';
  const continueContents = filterContentsForWorld(contents, continueWorld).slice(0, 3);
  const practiceAgain = (progress.completedContentIds || [])
    .slice(-5)
    .map((id) => contents.find((c) => String(c.id) === String(id)))
    .filter(Boolean)
    .slice(0, 3);

  const unexplored = worlds.filter((w) => !(progress.byWorld?.[w.id]));
  const exploreMore = unexplored.slice(0, 4);

  const ageHint = (() => {
    if (!ageGroup) return null;
    if (['0-2', '2-4', '3-5'].includes(ageGroup)) return ['colors', 'shapes', 'animals', 'alphabet'];
    if (['4-6', '5-7', '6-8'].includes(ageGroup)) return ['alphabet', 'numbers', 'animals', 'nature'];
    return ['mathematics', 'science', 'geography', 'logic', 'space'];
  })();

  const recommendedWorlds = (ageHint || worlds.map((w) => w.id))
    .map((id) => getEducationalWorld(id))
    .filter(Boolean)
    .filter((w) => !parentalAllowedWorlds || parentalAllowedWorlds.includes(w.id))
    .slice(0, 4);

  return {
    continueLearning: { worldId: continueWorld, contents: continueContents },
    recommendedForYou: recommendedWorlds,
    practiceAgain,
    newChallenge: exploreMore[0] || worlds[0],
    exploreMore,
    stats,
    level: xpToLevel(progress.xp),
    progress,
  };
}

export function claimDailyReward(kidId) {
  const progress = loadEducationalProgress(kidId);
  const today = todayKey();
  if (progress.daily?.[today]?.rewardClaimed) {
    return { claimed: false, progress, reason: 'already_claimed' };
  }
  const bonus = 15;
  const next = {
    ...progress,
    xp: (progress.xp || 0) + bonus,
    daily: {
      ...(progress.daily || {}),
      [today]: {
        ...(progress.daily?.[today] || {}),
        rewardClaimed: true,
        xp: ((progress.daily?.[today]?.xp) || 0) + bonus,
      },
    },
  };
  saveEducationalProgress(kidId, next);
  return { claimed: true, bonus, progress: next, level: xpToLevel(next.xp) };
}

export function getDashboardSnapshot(kidId) {
  const progress = loadEducationalProgress(kidId);
  const stats = buildStats(progress);
  const week = weekKey();
  const month = monthKey();
  return {
    storiesCompleted: progress.completedContentIds?.length || 0,
    challengesCompleted: progress.completedChallenges?.length || 0,
    quizScore: progress.attempts
      ? Math.round(((progress.successes || 0) / progress.attempts) * 100)
      : 0,
    level: xpToLevel(progress.xp),
    worldsExplored: stats.worldsExplored,
    timeSpentMinutes: Math.round((progress.timeSpentSeconds || 0) / 60),
    weeklyProgress: progress.weeklyHistory?.[week] || 0,
    monthlyProgress: progress.monthlyHistory?.[month] || 0,
    streakDays: progress.streakDays || 0,
    badges: progress.badges || [],
    byWorld: progress.byWorld || {},
    favoriteWorldIds: progress.favoriteWorldIds || [],
  };
}
