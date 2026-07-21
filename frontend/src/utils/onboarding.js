import { getCategoryContentStrategy, bookMatchesKidCategory } from './kidCategoryContent';
import { storage } from './storage';

export const ONBOARDING_VERSION = 1;

export const ONBOARDING_WORLDS = [
  { id: 'animals', emoji: '🐾', categoryId: 'animals' },
  { id: 'dinosaurs', emoji: '🦕', categoryId: 'dinosaurs' },
  { id: 'magic', emoji: '✨', categoryId: 'princesses' },
  { id: 'space', emoji: '🚀', categoryId: 'space' },
  { id: 'ocean', emoji: '🌊', categoryId: 'ocean' },
  { id: 'nature', emoji: '🌿', categoryId: 'world' },
  { id: 'adventure', emoji: '🗺️', categoryId: 'dinosaurs' },
  { id: 'friendship', emoji: '💛', categoryId: 'world' },
  { id: 'dreams', emoji: '🌙', categoryId: 'bedtime' },
  { id: 'music', emoji: '🎵', categoryId: 'rhymes' },
];

export const ONBOARDING_AVATARS = ['🦊', '🐻', '🦁', '🐰', '🦄', '🐼', '🐨', '🐯'];
export const ONBOARDING_AGE_BANDS = ['3-4', '5-6', '7-8', '9+'];
export const ONBOARDING_ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🦊', '🦁', '🐼', '🐨', '🐸', '🦋'];
export const ONBOARDING_READING_GOALS = ['explore', 'bedtime', 'daily'];

const PROFILE_KEY = 'hkids_onboarding_profile';

function scopedCompleteKey(audience) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'kid' && user?.kid_profile_id) {
      return `hkids_onboarding_complete:kid:${user.kid_profile_id}`;
    }
    if (user?.role === 'parent' || user?.role === 'admin') {
      return 'hkids_onboarding_complete:parent';
    }
  } catch {
    // fall through
  }
  return audience === 'parent' ? 'hkids_onboarding_complete:parent' : 'hkids_onboarding_complete:guest';
}

export function getDefaultOnboardingProfile() {
  return {
    audience: null,
    nickname: '',
    avatar: ONBOARDING_AVATARS[0],
    ageBand: ONBOARDING_AGE_BANDS[1],
    favoriteAnimals: [],
    readingGoal: 'explore',
    favoriteWorlds: [],
    version: ONBOARDING_VERSION,
  };
}

export function getOnboardingProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return getDefaultOnboardingProfile();
    return { ...getDefaultOnboardingProfile(), ...JSON.parse(raw) };
  } catch {
    return getDefaultOnboardingProfile();
  }
}

export function saveOnboardingProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      ...profile,
      updatedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION,
    }));
    storage.setPreference('onboardingProfile', profile);
  } catch (error) {
    console.warn('Could not save onboarding profile:', error);
  }
}

export function isOnboardingComplete(audience = 'kid') {
  try {
    const key = scopedCompleteKey(audience);
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.version === ONBOARDING_VERSION;
  } catch {
    return false;
  }
}

export function setOnboardingComplete(audience = 'kid') {
  try {
    const key = scopedCompleteKey(audience);
    localStorage.setItem(key, JSON.stringify({
      completedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION,
    }));
    storage.setPreference('onboardingComplete', true);
  } catch (error) {
    console.warn('Could not mark onboarding complete:', error);
  }
}

export function shouldShowKidOnboarding(user) {
  if (user?.role !== 'kid') return false;
  return !isOnboardingComplete('kid');
}

export function filterBooksForWorlds(books = [], worldIds = []) {
  if (!worldIds.length) return books.slice(0, 12);
  const categoryIds = worldIds
    .map((id) => ONBOARDING_WORLDS.find((world) => world.id === id)?.categoryId)
    .filter(Boolean);

  const matched = books.filter((book) =>
    categoryIds.some((categoryId) => {
      const strategy = getCategoryContentStrategy(categoryId);
      return bookMatchesKidCategory(book, strategy);
    }),
  );

  return (matched.length ? matched : books).slice(0, 12);
}

export function groupBooksByWorlds(books = [], worldIds = [], t) {
  return worldIds.slice(0, 3).map((worldId) => {
    const world = ONBOARDING_WORLDS.find((item) => item.id === worldId);
    const strategy = world ? getCategoryContentStrategy(world.categoryId) : null;
    const shelfBooks = strategy
      ? books.filter((book) => bookMatchesKidCategory(book, strategy)).slice(0, 6)
      : books.slice(0, 6);
    return {
      worldId,
      world,
      books: shelfBooks,
      reason: t('onboardingBecauseWorld', { world: t(`onboardingWorld_${worldId}`) }),
    };
  }).filter((shelf) => shelf.books.length > 0);
}
