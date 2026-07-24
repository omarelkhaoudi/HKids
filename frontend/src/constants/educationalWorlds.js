/**
 * Educational Worlds — single source of truth for HKids learning realms.
 * Extensible: add a world here and it appears in Kids Learning + parent views.
 */

export const EDUCATIONAL_WORLDS = [
  {
    id: 'alphabet',
    emoji: '🔤',
    gradient: 'from-rose-400 to-orange-400',
    soft: 'bg-rose-50',
    labelKey: 'eduWorldAlphabet',
    descKey: 'eduWorldAlphabetDesc',
    catalogKeys: ['alphabet'],
    path: [
      { id: 'a-f', labelKey: 'eduPathLettersAF', filter: /[a-f]/i },
      { id: 'g-l', labelKey: 'eduPathLettersGL', filter: /[g-l]/i },
      { id: 'm-r', labelKey: 'eduPathLettersMR', filter: /[m-r]/i },
      { id: 's-z', labelKey: 'eduPathLettersSZ', filter: /[s-z]/i },
      { id: 'master', labelKey: 'eduPathAlphabetMaster', master: true },
    ],
    challengeTypes: ['find_image', 'multiple_choice', 'listen_answer'],
  },
  {
    id: 'numbers',
    emoji: '🔢',
    gradient: 'from-sky-400 to-blue-500',
    soft: 'bg-sky-50',
    labelKey: 'eduWorldNumbers',
    descKey: 'eduWorldNumbersDesc',
    catalogKeys: ['numbers'],
    path: [
      { id: '1-5', labelKey: 'eduPathNumbers15' },
      { id: '6-10', labelKey: 'eduPathNumbers610' },
      { id: 'master', labelKey: 'eduPathNumbersMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'sequence_order'],
  },
  {
    id: 'colors',
    emoji: '🎨',
    gradient: 'from-fuchsia-400 to-pink-500',
    soft: 'bg-fuchsia-50',
    labelKey: 'eduWorldColors',
    descKey: 'eduWorldColorsDesc',
    catalogKeys: ['colors'],
    path: [
      { id: 'primary', labelKey: 'eduPathColorsPrimary' },
      { id: 'mix', labelKey: 'eduPathColorsMix' },
      { id: 'master', labelKey: 'eduPathColorsMaster', master: true },
    ],
    challengeTypes: ['find_image', 'image_word_match'],
  },
  {
    id: 'shapes',
    emoji: '🔷',
    gradient: 'from-violet-400 to-indigo-500',
    soft: 'bg-violet-50',
    labelKey: 'eduWorldShapes',
    descKey: 'eduWorldShapesDesc',
    catalogKeys: ['shapes'],
    path: [
      { id: 'basic', labelKey: 'eduPathShapesBasic' },
      { id: 'complex', labelKey: 'eduPathShapesComplex' },
      { id: 'master', labelKey: 'eduPathShapesMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'find_image'],
  },
  {
    id: 'logic',
    emoji: '🧩',
    gradient: 'from-amber-400 to-yellow-500',
    soft: 'bg-amber-50',
    labelKey: 'eduWorldLogic',
    descKey: 'eduWorldLogicDesc',
    catalogKeys: ['shapes', 'numbers'],
    path: [
      { id: 'patterns', labelKey: 'eduPathLogicPatterns' },
      { id: 'memory', labelKey: 'eduPathLogicMemory' },
      { id: 'master', labelKey: 'eduPathLogicMaster', master: true },
    ],
    challengeTypes: ['sequence_order', 'game'],
  },
  {
    id: 'mathematics',
    emoji: '➕',
    gradient: 'from-emerald-400 to-teal-500',
    soft: 'bg-emerald-50',
    labelKey: 'eduWorldMath',
    descKey: 'eduWorldMathDesc',
    catalogKeys: ['numbers'],
    path: [
      { id: 'count', labelKey: 'eduPathMathCount' },
      { id: 'add', labelKey: 'eduPathMathAdd' },
      { id: 'master', labelKey: 'eduPathMathMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'sequence_order'],
  },
  {
    id: 'science',
    emoji: '🔬',
    gradient: 'from-cyan-400 to-sky-600',
    soft: 'bg-cyan-50',
    labelKey: 'eduWorldScience',
    descKey: 'eduWorldScienceDesc',
    catalogKeys: ['animals', 'colors'],
    path: [
      { id: 'observe', labelKey: 'eduPathScienceObserve' },
      { id: 'discover', labelKey: 'eduPathScienceDiscover' },
      { id: 'master', labelKey: 'eduPathScienceMaster', master: true },
    ],
    challengeTypes: ['true_false', 'find_image'],
  },
  {
    id: 'geography',
    emoji: '🌍',
    gradient: 'from-lime-400 to-green-600',
    soft: 'bg-lime-50',
    labelKey: 'eduWorldGeography',
    descKey: 'eduWorldGeographyDesc',
    catalogKeys: ['languages', 'animals'],
    path: [
      { id: 'places', labelKey: 'eduPathGeoPlaces' },
      { id: 'world', labelKey: 'eduPathGeoWorld' },
      { id: 'master', labelKey: 'eduPathGeoMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'listen_answer'],
  },
  {
    id: 'animals',
    emoji: '🦁',
    gradient: 'from-orange-400 to-amber-600',
    soft: 'bg-orange-50',
    labelKey: 'eduWorldAnimals',
    descKey: 'eduWorldAnimalsDesc',
    catalogKeys: ['animals'],
    path: [
      { id: 'pets', labelKey: 'eduPathAnimalsPets' },
      { id: 'wild', labelKey: 'eduPathAnimalsWild' },
      { id: 'master', labelKey: 'eduPathAnimalsMaster', master: true },
    ],
    challengeTypes: ['find_image', 'listen_answer', 'game'],
  },
  {
    id: 'space',
    emoji: '🚀',
    gradient: 'from-indigo-500 to-purple-700',
    soft: 'bg-indigo-50',
    labelKey: 'eduWorldSpace',
    descKey: 'eduWorldSpaceDesc',
    catalogKeys: ['numbers', 'shapes'],
    path: [
      { id: 'planets', labelKey: 'eduPathSpacePlanets' },
      { id: 'stars', labelKey: 'eduPathSpaceStars' },
      { id: 'master', labelKey: 'eduPathSpaceMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'find_image'],
  },
  {
    id: 'dinosaurs',
    emoji: '🦕',
    gradient: 'from-green-500 to-emerald-700',
    soft: 'bg-green-50',
    labelKey: 'eduWorldDinos',
    descKey: 'eduWorldDinosDesc',
    catalogKeys: ['animals'],
    path: [
      { id: 'names', labelKey: 'eduPathDinoNames' },
      { id: 'facts', labelKey: 'eduPathDinoFacts' },
      { id: 'master', labelKey: 'eduPathDinoMaster', master: true },
    ],
    challengeTypes: ['find_image', 'true_false'],
  },
  {
    id: 'music',
    emoji: '🎼',
    gradient: 'from-pink-400 to-rose-600',
    soft: 'bg-pink-50',
    labelKey: 'eduWorldMusic',
    descKey: 'eduWorldMusicDesc',
    catalogKeys: ['languages', 'colors'],
    path: [
      { id: 'listen', labelKey: 'eduPathMusicListen' },
      { id: 'rhythm', labelKey: 'eduPathMusicRhythm' },
      { id: 'master', labelKey: 'eduPathMusicMaster', master: true },
    ],
    challengeTypes: ['listen_answer', 'sequence_order'],
  },
  {
    id: 'nature',
    emoji: '🌱',
    gradient: 'from-teal-400 to-green-500',
    soft: 'bg-teal-50',
    labelKey: 'eduWorldNature',
    descKey: 'eduWorldNatureDesc',
    catalogKeys: ['animals', 'colors'],
    path: [
      { id: 'plants', labelKey: 'eduPathNaturePlants' },
      { id: 'weather', labelKey: 'eduPathNatureWeather' },
      { id: 'master', labelKey: 'eduPathNatureMaster', master: true },
    ],
    challengeTypes: ['find_image', 'true_false'],
  },
  {
    id: 'creativity',
    emoji: '💡',
    gradient: 'from-yellow-400 to-orange-500',
    soft: 'bg-yellow-50',
    labelKey: 'eduWorldCreativity',
    descKey: 'eduWorldCreativityDesc',
    catalogKeys: ['colors', 'shapes'],
    path: [
      { id: 'imagine', labelKey: 'eduPathCreativityImagine' },
      { id: 'create', labelKey: 'eduPathCreativityCreate' },
      { id: 'master', labelKey: 'eduPathCreativityMaster', master: true },
    ],
    challengeTypes: ['image_word_match', 'game'],
  },
  {
    id: 'emotions',
    emoji: '❤️',
    gradient: 'from-red-400 to-pink-500',
    soft: 'bg-red-50',
    labelKey: 'eduWorldEmotions',
    descKey: 'eduWorldEmotionsDesc',
    catalogKeys: ['languages', 'colors'],
    path: [
      { id: 'feelings', labelKey: 'eduPathEmotionsFeelings' },
      { id: 'express', labelKey: 'eduPathEmotionsExpress' },
      { id: 'master', labelKey: 'eduPathEmotionsMaster', master: true },
    ],
    challengeTypes: ['multiple_choice', 'listen_answer'],
  },
  {
    id: 'kindness',
    emoji: '🤝',
    gradient: 'from-sky-300 to-indigo-400',
    soft: 'bg-sky-50',
    labelKey: 'eduWorldKindness',
    descKey: 'eduWorldKindnessDesc',
    catalogKeys: ['languages'],
    path: [
      { id: 'share', labelKey: 'eduPathKindnessShare' },
      { id: 'help', labelKey: 'eduPathKindnessHelp' },
      { id: 'master', labelKey: 'eduPathKindnessMaster', master: true },
    ],
    challengeTypes: ['true_false', 'multiple_choice'],
  },
  {
    id: 'culture',
    emoji: '🕌',
    gradient: 'from-amber-500 to-orange-700',
    soft: 'bg-amber-50',
    labelKey: 'eduWorldCulture',
    descKey: 'eduWorldCultureDesc',
    catalogKeys: ['languages'],
    path: [
      { id: 'words', labelKey: 'eduPathCultureWords' },
      { id: 'values', labelKey: 'eduPathCultureValues' },
      { id: 'master', labelKey: 'eduPathCultureMaster', master: true },
    ],
    challengeTypes: ['listen_answer', 'multiple_choice'],
  },
];

export const LEARNING_ACHIEVEMENTS = [
  { id: 'first_story', emoji: '⭐', labelKey: 'eduBadgeFirstStory', test: (s) => s.successes >= 1 },
  { id: 'reading_explorer', emoji: '🧭', labelKey: 'eduBadgeReadingExplorer', test: (s) => s.successes >= 5 },
  { id: 'animal_expert', emoji: '🦁', labelKey: 'eduBadgeAnimalExpert', test: (s) => (s.byWorld.animals || 0) >= 3 },
  { id: 'space_explorer', emoji: '🚀', labelKey: 'eduBadgeSpaceExplorer', test: (s) => (s.byWorld.space || 0) >= 2 },
  { id: 'math_genius', emoji: '➕', labelKey: 'eduBadgeMathGenius', test: (s) => (s.byWorld.mathematics || 0) + (s.byWorld.numbers || 0) >= 5 },
  { id: 'daily_reader', emoji: '📖', labelKey: 'eduBadgeDailyReader', test: (s) => s.todaySuccesses >= 1 },
  { id: 'streak_7', emoji: '🔥', labelKey: 'eduBadgeStreak7', test: (s) => s.streakDays >= 7 },
  { id: 'quiz_champion', emoji: '🏆', labelKey: 'eduBadgeQuizChampion', test: (s) => s.perfectScores >= 3 },
  { id: 'story_collector', emoji: '📚', labelKey: 'eduBadgeStoryCollector', test: (s) => s.worldsExplored >= 5 },
  { id: 'alphabet_master', emoji: '🔤', labelKey: 'eduBadgeAlphabetMaster', test: (s) => (s.byWorld.alphabet || 0) >= 4 },
];

export const XP_PER_SUCCESS = 25;
export const XP_PER_ATTEMPT = 5;
export const LEVEL_XP = 100;

export function getEducationalWorld(worldId) {
  return EDUCATIONAL_WORLDS.find((world) => world.id === worldId) || null;
}

export function contentMatchesWorld(content, world) {
  if (!content || !world) return false;
  const code = String(content.category_code || content.category_name || content.content_type || '').toLowerCase();
  const title = String(content.title || '').toLowerCase();
  const metaWorld = content.metadata?.world_id || content.world_id;
  if (metaWorld && metaWorld === world.id) return true;
  if (world.catalogKeys.some((key) => code.includes(key))) return true;
  if (title.includes(world.id)) return true;
  return false;
}

export function filterContentsForWorld(contents = [], worldId) {
  const world = getEducationalWorld(worldId);
  if (!world) return contents;
  return contents.filter((content) => contentMatchesWorld(content, world));
}

export function xpToLevel(xp = 0) {
  const safe = Math.max(0, Number(xp) || 0);
  const level = Math.floor(safe / LEVEL_XP) + 1;
  const intoLevel = safe % LEVEL_XP;
  return {
    level,
    xp: safe,
    intoLevel,
    nextLevelXp: LEVEL_XP,
    percent: Math.round((intoLevel / LEVEL_XP) * 100),
  };
}
