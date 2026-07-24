/**
 * Learning Universe progress — books, XP, chest, avatars, streaks.
 * Extends educational progress; offline-first, kid-scoped.
 */

import {
  CHEST_REWARDS,
  UNIVERSE_AVATARS,
  UNIVERSE_BADGES,
} from '../constants/learningUniverse';
import {
  loadEducationalProgress,
  saveEducationalProgress,
  recordLearningAttempt,
  buildStats,
} from './educationalProgress';
import { LEVEL_XP, xpToLevel } from '../constants/educationalWorlds';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function ensureUniverseFields(progress) {
  return {
    ...progress,
    booksCompleted: progress.booksCompleted || 0,
    booksCompletedIds: progress.booksCompletedIds || [],
    quizAttempts: progress.quizAttempts || 0,
    quizCorrect: progress.quizCorrect || 0,
    listenSeconds: progress.listenSeconds || 0,
    readSeconds: progress.readSeconds || 0,
    unlockedAvatars: progress.unlockedAvatars || ['puppy'],
    activeAvatar: progress.activeAvatar || 'puppy',
    stickers: progress.stickers || [],
    chestsOpened: progress.chestsOpened || 0,
    universeBadges: progress.universeBadges || [],
    todayBooks: progress.todayBooks || 0,
    weekBooks: progress.weekBooks || 0,
  };
}

export function loadUniverseProgress(kidId) {
  return ensureUniverseFields(loadEducationalProgress(kidId));
}

export function saveUniverseProgress(kidId, progress) {
  return saveEducationalProgress(kidId, ensureUniverseFields(progress));
}

function universeSignal(progress) {
  const stats = buildStats(progress);
  return {
    booksCompleted: progress.booksCompleted || 0,
    quizAttempts: progress.quizAttempts || 0,
    quizCorrect: progress.quizCorrect || 0,
    worldsExplored: stats.worldsExplored,
    byWorld: progress.byWorld || {},
    streakDays: progress.streakDays || 0,
    chestsOpened: progress.chestsOpened || 0,
    xp: progress.xp || 0,
  };
}

function unlockBadges(progress) {
  const signal = universeSignal(progress);
  const earned = new Set(progress.universeBadges || []);
  const newly = [];
  UNIVERSE_BADGES.forEach((badge) => {
    if (earned.has(badge.id)) return;
    if (badge.test(signal)) {
      earned.add(badge.id);
      newly.push(badge.id);
    }
  });
  return {
    progress: { ...progress, universeBadges: [...earned] },
    newlyUnlocked: newly,
  };
}

function unlockAvatarsByXp(progress) {
  const xp = progress.xp || 0;
  const unlocked = new Set(progress.unlockedAvatars || ['puppy']);
  const newly = [];
  UNIVERSE_AVATARS.forEach((avatar) => {
    if (unlocked.has(avatar.id)) return;
    if (xp >= avatar.unlockAt) {
      unlocked.add(avatar.id);
      newly.push(avatar.id);
    }
  });
  return {
    progress: { ...progress, unlockedAvatars: [...unlocked] },
    newlyUnlocked: newly,
  };
}

export function recordBookCompleted(kidId, { bookId, readSeconds = 0 } = {}) {
  let progress = loadUniverseProgress(kidId);
  const id = String(bookId || '');
  const already = id && (progress.booksCompletedIds || []).includes(id);
  const today = todayKey();
  const week = weekKey();

  if (!already && id) {
    progress = {
      ...progress,
      booksCompleted: (progress.booksCompleted || 0) + 1,
      booksCompletedIds: [...(progress.booksCompletedIds || []), id],
      xp: (progress.xp || 0) + 30,
      readSeconds: (progress.readSeconds || 0) + Math.max(0, readSeconds),
      todayBooks: (progress.daily?.[today]?.books || 0) + 1,
      weekBooks: (progress.weeklyHistory?.[week] || 0) + 1,
      daily: {
        ...(progress.daily || {}),
        [today]: {
          ...(progress.daily?.[today] || {}),
          books: ((progress.daily?.[today]?.books) || 0) + 1,
          xp: ((progress.daily?.[today]?.xp) || 0) + 30,
        },
      },
      weeklyHistory: {
        ...(progress.weeklyHistory || {}),
        [week]: ((progress.weeklyHistory?.[week]) || 0) + 1,
      },
    };
  } else {
    progress = {
      ...progress,
      readSeconds: (progress.readSeconds || 0) + Math.max(0, readSeconds),
      xp: (progress.xp || 0) + 5,
    };
  }

  const badgeResult = unlockBadges(progress);
  const avatarResult = unlockAvatarsByXp(badgeResult.progress);
  saveUniverseProgress(kidId, avatarResult.progress);
  return {
    progress: avatarResult.progress,
    newlyUnlocked: [...badgeResult.newlyUnlocked, ...avatarResult.newlyUnlocked],
    level: xpToLevel(avatarResult.progress.xp),
  };
}

export function recordListenTime(kidId, seconds = 0) {
  const progress = loadUniverseProgress(kidId);
  const next = {
    ...progress,
    listenSeconds: (progress.listenSeconds || 0) + Math.max(0, seconds),
    xp: (progress.xp || 0) + Math.min(15, Math.floor(Math.max(0, seconds) / 60) * 2),
  };
  saveUniverseProgress(kidId, next);
  return next;
}

export function recordStoryQuizResult(kidId, { success = false, bookId = null } = {}) {
  const base = recordLearningAttempt(kidId, {
    worldId: null,
    contentId: bookId ? `story-quiz-${bookId}` : 'story-quiz',
    success,
    scorePercent: success ? 100 : 0,
    challengeId: 'story-quiz',
  });
  let progress = ensureUniverseFields(base.progress);
  progress = {
    ...progress,
    quizAttempts: (progress.quizAttempts || 0) + 1,
    quizCorrect: (progress.quizCorrect || 0) + (success ? 1 : 0),
  };
  const badgeResult = unlockBadges(progress);
  const avatarResult = unlockAvatarsByXp(badgeResult.progress);
  saveUniverseProgress(kidId, avatarResult.progress);
  return {
    ...base,
    progress: avatarResult.progress,
    newlyUnlocked: [...(base.newlyUnlocked || []), ...badgeResult.newlyUnlocked, ...avatarResult.newlyUnlocked],
  };
}

export function claimDailyChest(kidId) {
  let progress = loadUniverseProgress(kidId);
  const today = todayKey();
  if (progress.daily?.[today]?.chestClaimed) {
    return { claimed: false, reason: 'already_claimed', progress };
  }

  const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];
  progress = {
    ...progress,
    chestsOpened: (progress.chestsOpened || 0) + 1,
    daily: {
      ...(progress.daily || {}),
      [today]: {
        ...(progress.daily?.[today] || {}),
        chestClaimed: true,
        chestReward: reward,
      },
    },
  };

  if (reward.type === 'xp') {
    progress.xp = (progress.xp || 0) + (reward.amount || 20);
  }
  if (reward.type === 'avatar' && reward.avatarId) {
    progress.unlockedAvatars = Array.from(new Set([...(progress.unlockedAvatars || []), reward.avatarId]));
  }
  if (reward.type === 'sticker' && reward.stickerId) {
    progress.stickers = Array.from(new Set([...(progress.stickers || []), reward.stickerId]));
  }
  if (reward.type === 'badge' && reward.badgeId) {
    progress.universeBadges = Array.from(new Set([...(progress.universeBadges || []), reward.badgeId]));
  }

  const badgeResult = unlockBadges(progress);
  const avatarResult = unlockAvatarsByXp(badgeResult.progress);
  saveUniverseProgress(kidId, avatarResult.progress);
  return {
    claimed: true,
    reward,
    progress: avatarResult.progress,
    newlyUnlocked: [...badgeResult.newlyUnlocked, ...avatarResult.newlyUnlocked],
    level: xpToLevel(avatarResult.progress.xp),
  };
}

export function setActiveAvatar(kidId, avatarId) {
  const progress = loadUniverseProgress(kidId);
  if (!(progress.unlockedAvatars || []).includes(avatarId)) {
    return progress;
  }
  const next = { ...progress, activeAvatar: avatarId };
  saveUniverseProgress(kidId, next);
  return next;
}

export function getUniverseDashboard(kidId) {
  const progress = loadUniverseProgress(kidId);
  const today = todayKey();
  const week = weekKey();
  const level = xpToLevel(progress.xp || 0);
  const favoriteWorlds = Object.entries(progress.byWorld || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  return {
    level,
    xp: progress.xp || 0,
    nextLevelXp: LEVEL_XP,
    intoLevel: level.intoLevel,
    percent: level.percent,
    badges: progress.universeBadges || [],
    eduBadges: progress.badges || [],
    booksCompleted: progress.booksCompleted || 0,
    quizAttempts: progress.quizAttempts || 0,
    quizCorrect: progress.quizCorrect || 0,
    listenMinutes: Math.round((progress.listenSeconds || 0) / 60),
    readMinutes: Math.round((progress.readSeconds || 0) / 60),
    streakDays: progress.streakDays || 0,
    todayBooks: progress.daily?.[today]?.books || 0,
    todayXp: progress.daily?.[today]?.xp || 0,
    weekBooks: progress.weeklyHistory?.[week] || 0,
    favoriteWorlds,
    unlockedAvatars: progress.unlockedAvatars || ['puppy'],
    activeAvatar: progress.activeAvatar || 'puppy',
    stickers: progress.stickers || [],
    chestsOpened: progress.chestsOpened || 0,
    chestClaimedToday: Boolean(progress.daily?.[today]?.chestClaimed),
    challengesCompleted: (progress.completedChallenges || []).length,
    successes: progress.successes || 0,
  };
}

export { xpToLevel };
