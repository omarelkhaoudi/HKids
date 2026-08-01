/**
 * Premium packs catalog — config-driven, no code changes for future packs.
 * Admin overrides merge via localStorage (see premiumPackStore.js).
 */

export const PREMIUM_FEATURE_FLAGS = {
  ai_stories: true,
  premium_books: true,
  seasonal_packs: true,
  exclusive_avatars: true,
  premium_games: true,
  premium_quizzes: true,
  premium_narrators: true,
};

export const SEASONAL_WINDOWS = [
  { id: 'ramadan', emoji: '🌙', months: [2, 3], labelKey: 'premSeasonRamadan' },
  { id: 'eid', emoji: '🎉', months: [3, 4], labelKey: 'premSeasonEid' },
  { id: 'summer', emoji: '☀️', months: [6, 7, 8], labelKey: 'premSeasonSummer' },
  { id: 'back_to_school', emoji: '🎒', months: [8, 9], labelKey: 'premSeasonBackToSchool' },
  { id: 'halloween', emoji: '🎃', months: [10], labelKey: 'premSeasonHalloween' },
  { id: 'christmas', emoji: '🎄', months: [11, 12], labelKey: 'premSeasonChristmas' },
  { id: 'new_year', emoji: '🎆', months: [12, 1], labelKey: 'premSeasonNewYear' },
  { id: 'spring', emoji: '🌸', months: [3, 4, 5], labelKey: 'premSeasonSpring' },
  { id: 'winter', emoji: '❄️', months: [12, 1, 2], labelKey: 'premSeasonWinter' },
];

/**
 * @typedef {object} PremiumPack
 * @property {string} id
 * @property {string} emoji
 * @property {string} gradient
 * @property {string} labelKey
 * @property {string} descKey
 * @property {string[]} themes - catalog theme matchers
 * @property {string[]} features - feature flag keys required
 * @property {boolean} [seasonal]
 * @property {string} [seasonId]
 * @property {boolean} [featured]
 * @property {boolean} [isNew]
 * @property {boolean} [ai]
 * @property {boolean} [published]
 * @property {boolean} [archived]
 * @property {string[]} [includes] - story|quiz|game|illustration|badge|avatar
 */

/** Default premium content packs — extend here or via admin overrides. */
export const DEFAULT_PREMIUM_PACKS = [
  {
    id: 'dinosaurs',
    emoji: '🦖',
    gradient: 'from-hkids-green to-hkids-green-dark',
    labelKey: 'premPackDinos',
    descKey: 'premPackDinosDesc',
    themes: ['dinosaurs', 'dino'],
    features: ['premium_books', 'premium_games'],
    featured: true,
    isNew: false,
    published: true,
    includes: ['story', 'quiz', 'game', 'badge', 'avatar'],
  },
  {
    id: 'space',
    emoji: '🚀',
    gradient: 'from-hkids-green to-hkids-brown-dark',
    labelKey: 'premPackSpace',
    descKey: 'premPackSpaceDesc',
    themes: ['space', 'planet', 'rocket'],
    features: ['premium_books', 'premium_quizzes'],
    featured: true,
    published: true,
    includes: ['story', 'quiz', 'illustration', 'badge'],
  },
  {
    id: 'princesses',
    emoji: '👸',
    gradient: 'from-hkids-brown to-hkids-brown',
    labelKey: 'premPackPrincess',
    descKey: 'premPackPrincessDesc',
    themes: ['princess', 'fairy', 'magic'],
    features: ['premium_books'],
    featured: false,
    published: true,
    includes: ['story', 'illustration', 'avatar'],
  },
  {
    id: 'bedtime',
    emoji: '🌙',
    gradient: 'from-hkids-green to-hkids-brown-dark',
    labelKey: 'premPackBedtime',
    descKey: 'premPackBedtimeDesc',
    themes: ['bedtime', 'sleep', 'night'],
    features: ['premium_books', 'premium_narrators'],
    featured: true,
    published: true,
    includes: ['story', 'illustration'],
  },
  {
    id: 'music',
    emoji: '🎵',
    gradient: 'from-hkids-brown to-hkids-brown',
    labelKey: 'premPackMusic',
    descKey: 'premPackMusicDesc',
    themes: ['music', 'rhyme', 'song'],
    features: ['premium_books'],
    featured: false,
    published: true,
    includes: ['story', 'game'],
  },
  {
    id: 'values',
    emoji: '🕌',
    gradient: 'from-hkids-brown to-hkids-brown-dark',
    labelKey: 'premPackValues',
    descKey: 'premPackValuesDesc',
    themes: ['values', 'spiritual', 'kindness', 'culture'],
    features: ['premium_books', 'premium_quizzes'],
    featured: false,
    published: true,
    includes: ['story', 'quiz', 'badge'],
  },
  {
    id: 'world',
    emoji: '🌍',
    gradient: 'from-hkids-green to-hkids-green-dark',
    labelKey: 'premPackWorld',
    descKey: 'premPackWorldDesc',
    themes: ['world', 'geography', 'travel'],
    features: ['premium_books'],
    featured: false,
    published: true,
    includes: ['story', 'quiz', 'illustration'],
  },
  {
    id: 'creativity',
    emoji: '🎨',
    gradient: 'from-hkids-brown to-hkids-brown',
    labelKey: 'premPackCreativity',
    descKey: 'premPackCreativityDesc',
    themes: ['creativity', 'art', 'colors'],
    features: ['premium_games', 'exclusive_avatars'],
    featured: false,
    isNew: true,
    published: true,
    includes: ['game', 'avatar', 'illustration'],
  },
  {
    id: 'brain',
    emoji: '🧠',
    gradient: 'from-primary-400 to-primary-600',
    labelKey: 'premPackBrain',
    descKey: 'premPackBrainDesc',
    themes: ['logic', 'math', 'shapes', 'numbers'],
    features: ['premium_games', 'premium_quizzes'],
    featured: true,
    isNew: true,
    published: true,
    includes: ['game', 'quiz', 'badge'],
  },
  {
    id: 'ai_stories',
    emoji: '✨',
    gradient: 'from-hkids-brown to-hkids-brown-dark',
    labelKey: 'premPackAi',
    descKey: 'premPackAiDesc',
    themes: ['ai', 'create'],
    features: ['ai_stories'],
    featured: true,
    ai: true,
    isNew: true,
    published: true,
    includes: ['story'],
  },
  {
    id: 'seasonal_ramadan',
    emoji: '🌙',
    gradient: 'from-hkids-green-dark to-hkids-green-darker',
    labelKey: 'premPackRamadan',
    descKey: 'premPackRamadanDesc',
    themes: ['ramadan', 'values'],
    features: ['seasonal_packs', 'premium_books'],
    seasonal: true,
    seasonId: 'ramadan',
    featured: true,
    published: true,
    includes: ['story', 'quiz', 'game', 'badge', 'avatar'],
  },
  {
    id: 'seasonal_eid',
    emoji: '🎁',
    gradient: 'from-hkids-brown to-hkids-brown',
    labelKey: 'premPackEid',
    descKey: 'premPackEidDesc',
    themes: ['eid', 'celebration'],
    features: ['seasonal_packs', 'premium_books'],
    seasonal: true,
    seasonId: 'eid',
    published: true,
    includes: ['story', 'badge', 'avatar'],
  },
  {
    id: 'seasonal_summer',
    emoji: '🏖️',
    gradient: 'from-hkids-green to-hkids-green',
    labelKey: 'premPackSummer',
    descKey: 'premPackSummerDesc',
    themes: ['summer', 'beach', 'ocean'],
    features: ['seasonal_packs', 'premium_books'],
    seasonal: true,
    seasonId: 'summer',
    published: true,
    includes: ['story', 'game', 'illustration'],
  },
  {
    id: 'seasonal_school',
    emoji: '📚',
    gradient: 'from-hkids-brown to-hkids-brown',
    labelKey: 'premPackSchool',
    descKey: 'premPackSchoolDesc',
    themes: ['school', 'alphabet', 'numbers'],
    features: ['seasonal_packs', 'premium_quizzes'],
    seasonal: true,
    seasonId: 'back_to_school',
    published: true,
    includes: ['story', 'quiz', 'game'],
  },
  {
    id: 'seasonal_halloween',
    emoji: '🎃',
    gradient: 'from-hkids-brown-dark to-hkids-brown-darker',
    labelKey: 'premPackHalloween',
    descKey: 'premPackHalloweenDesc',
    themes: ['halloween', 'spooky'],
    features: ['seasonal_packs'],
    seasonal: true,
    seasonId: 'halloween',
    published: true,
    includes: ['story', 'game', 'avatar'],
  },
  {
    id: 'seasonal_christmas',
    emoji: '🎄',
    gradient: 'from-hkids-brown to-hkids-green-dark',
    labelKey: 'premPackChristmas',
    descKey: 'premPackChristmasDesc',
    themes: ['christmas', 'winter', 'snow'],
    features: ['seasonal_packs', 'premium_books'],
    seasonal: true,
    seasonId: 'christmas',
    featured: true,
    published: true,
    includes: ['story', 'quiz', 'badge', 'avatar'],
  },
  {
    id: 'seasonal_new_year',
    emoji: '✨',
    gradient: 'from-hkids-brown-light to-hkids-brown-dark',
    labelKey: 'premPackNewYear',
    descKey: 'premPackNewYearDesc',
    themes: ['new year', 'celebration'],
    features: ['seasonal_packs'],
    seasonal: true,
    seasonId: 'new_year',
    published: true,
    includes: ['story', 'badge'],
  },
  {
    id: 'seasonal_spring',
    emoji: '🌷',
    gradient: 'from-hkids-brown-light to-hkids-green',
    labelKey: 'premPackSpring',
    descKey: 'premPackSpringDesc',
    themes: ['spring', 'nature', 'flower'],
    features: ['seasonal_packs'],
    seasonal: true,
    seasonId: 'spring',
    published: true,
    includes: ['story', 'illustration', 'game'],
  },
  {
    id: 'seasonal_winter',
    emoji: '⛄',
    gradient: 'from-hkids-green-light to-hkids-green',
    labelKey: 'premPackWinter',
    descKey: 'premPackWinterDesc',
    themes: ['winter', 'snow', 'ice'],
    features: ['seasonal_packs', 'premium_books'],
    seasonal: true,
    seasonId: 'winter',
    published: true,
    includes: ['story', 'game', 'avatar'],
  },
];

export function getActiveSeasonIds(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  return SEASONAL_WINDOWS
    .filter((season) => season.months.includes(month))
    .map((season) => season.id);
}

export function bookMatchesPack(book, pack) {
  if (!book || !pack) return false;
  const text = [book.title, book.theme, book.category_name, book.description, ...(book.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (book.is_premium && pack.themes?.some((theme) => text.includes(String(theme).toLowerCase()))) {
    return true;
  }
  return (pack.themes || []).some((theme) => text.includes(String(theme).toLowerCase()));
}
