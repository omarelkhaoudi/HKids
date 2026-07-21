/**
 * Warm, calm greeting engine for Kids Home.
 * Rotates by day + hour + interests — never gamified, never repetitive.
 */

import { ONBOARDING_WORLDS } from './onboarding';

const HOUR_BUCKETS = [
  { max: 12, key: 'morning' },
  { max: 18, key: 'afternoon' },
  { max: 24, key: 'evening' },
];

function daySeed(date = new Date()) {
  return date.getFullYear() * 1000 + date.getMonth() * 40 + date.getDate();
}

function pickIndex(seed, length) {
  if (!length) return 0;
  return Math.abs(seed) % length;
}

function hourBucket(date = new Date()) {
  const hour = date.getHours();
  return HOUR_BUCKETS.find((bucket) => hour < bucket.max)?.key || 'evening';
}

function primaryWorldId(favoriteWorlds = []) {
  return favoriteWorlds[0] || null;
}

/**
 * Build a personalized greeting line for the header caption.
 * Returns { primary, secondary } — secondary is optional supporting line.
 */
export function buildKidsGreeting({
  t,
  nickname = '',
  favoriteWorlds = [],
  readingGoal = 'explore',
  hasContinue = false,
  completedCount = 0,
  date = new Date(),
} = {}) {
  const name = (nickname || '').trim();
  const bucket = hourBucket(date);
  const seed = daySeed(date) + pickIndex(name.length * 7, 5);
  const worldId = primaryWorldId(favoriteWorlds);
  const worldLabel = worldId ? t(`onboardingWorld_${worldId}`) : '';

  const timeGreetingKey = {
    morning: 'goodMorning',
    afternoon: 'goodAfternoon',
    evening: 'goodEvening',
  }[bucket];

  const welcomeVariants = name
    ? [
        t('kidsGreetingWelcomeBack', { name }),
        t('kidsGreetingHelloName', { name }),
        t('kidsGreetingReadyName', { name }),
      ]
    : [
        t(timeGreetingKey),
        t('kidsGreetingWelcomeFriend'),
        t('kidsGreetingReadyFriend'),
      ];

  let primary = welcomeVariants[pickIndex(seed, welcomeVariants.length)];

  // Prefer time-of-day line sometimes so it doesn't feel locked to name only
  if (!name || pickIndex(seed + 3, 4) === 0) {
    primary = name
      ? `${t(timeGreetingKey)}, ${name}`
      : t(timeGreetingKey);
  }

  const secondaryCandidates = [];

  if (hasContinue) {
    secondaryCandidates.push(t('kidsGreetingContinueAdventure'));
  }

  if (worldId && worldLabel) {
    secondaryCandidates.push(t('kidsGreetingWorldWaiting', { world: worldLabel }));
    secondaryCandidates.push(t('kidsGreetingWorldReady', { world: worldLabel }));
  }

  if (readingGoal === 'bedtime' && bucket === 'evening') {
    secondaryCandidates.push(t('kidsGreetingBedtimeReady'));
  } else if (readingGoal === 'daily') {
    secondaryCandidates.push(t('kidsGreetingDailyReady'));
  } else {
    secondaryCandidates.push(t('kidsGreetingExploreReady'));
  }

  if (completedCount >= 3) {
    secondaryCandidates.push(t('kidsGreetingProgressSoft', { count: completedCount }));
  }

  secondaryCandidates.push(t('kidsGreetingAdventureWaiting'));

  const secondary = secondaryCandidates[pickIndex(seed + 11, secondaryCandidates.length)];

  return {
    primary,
    secondary,
    worldId,
    worldEmoji: ONBOARDING_WORLDS.find((world) => world.id === worldId)?.emoji || '📚',
  };
}
