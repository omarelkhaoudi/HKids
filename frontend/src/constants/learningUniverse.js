/**
 * HKids Learning Universe — Explorer hub tiles, games, badges, avatars, chest.
 * Frontend-only; reuses educational worlds + local progress.
 */

export const EXPLORER_HUB_TILES = [
  { id: 'stories', emoji: '📚', gradient: 'from-amber-400 to-orange-500', path: '/kids/library', ambiance: 'warm', mascot: '📖' },
  { id: 'colors', emoji: '🎨', gradient: 'from-fuchsia-400 to-pink-500', path: '/kids/learning/colors', worldId: 'colors', ambiance: 'bright', mascot: '🌈' },
  { id: 'alphabet', emoji: '🔠', gradient: 'from-rose-400 to-orange-400', path: '/kids/learning/alphabet', worldId: 'alphabet', ambiance: 'playful', mascot: '✏️' },
  { id: 'numbers', emoji: '🔢', gradient: 'from-sky-400 to-blue-500', path: '/kids/learning/numbers', worldId: 'numbers', ambiance: 'focus', mascot: '⭐' },
  { id: 'animals', emoji: '🐶', gradient: 'from-orange-400 to-amber-600', path: '/kids/learning/animals', worldId: 'animals', ambiance: 'wild', mascot: '🦁' },
  { id: 'space', emoji: '🚀', gradient: 'from-indigo-500 to-purple-700', path: '/kids/learning/space', worldId: 'space', ambiance: 'cosmic', mascot: '🛸' },
  { id: 'dinosaurs', emoji: '🦖', gradient: 'from-green-500 to-emerald-700', path: '/kids/learning/dinosaurs', worldId: 'dinosaurs', ambiance: 'jungle', mascot: '🦕' },
  { id: 'geography', emoji: '🌎', gradient: 'from-lime-400 to-green-600', path: '/kids/learning/geography', worldId: 'geography', ambiance: 'travel', mascot: '🧭' },
  { id: 'music', emoji: '🎵', gradient: 'from-pink-400 to-rose-600', path: '/kids/learning/music', worldId: 'music', ambiance: 'melody', mascot: '🎧' },
  { id: 'games', emoji: '🧩', gradient: 'from-violet-400 to-indigo-500', path: '/kids/explore?tab=games', tab: 'games', ambiance: 'fun', mascot: '🎮' },
  { id: 'quiz', emoji: '🧠', gradient: 'from-cyan-400 to-sky-600', path: '/kids/explore?tab=quiz', tab: 'quiz', ambiance: 'smart', mascot: '💡' },
  { id: 'discover', emoji: '✨', gradient: 'from-yellow-400 to-amber-500', path: '/kids/library', ambiance: 'magic', mascot: '🌟' },
];

export const UNIVERSE_MINI_GAMES = [
  { id: 'memory', type: 'memory', emoji: '🧠', labelKey: 'luGameMemory' },
  { id: 'puzzle', type: 'puzzle', emoji: '🧩', labelKey: 'luGamePuzzle' },
  { id: 'find_animal', type: 'find', emoji: '🐶', labelKey: 'luGameFindAnimal', worldId: 'animals' },
  { id: 'image_word', type: 'match', emoji: '🖼️', labelKey: 'luGameImageWord', worldId: 'animals' },
  { id: 'count', type: 'count', emoji: '🔢', labelKey: 'luGameCount', worldId: 'numbers' },
  { id: 'alphabet', type: 'find', emoji: '🔠', labelKey: 'luGameAlphabet', worldId: 'alphabet' },
  { id: 'colors', type: 'match', emoji: '🎨', labelKey: 'luGameColors', worldId: 'colors' },
  { id: 'shadows', type: 'shadow', emoji: '🌑', labelKey: 'luGameShadows' },
  { id: 'sizes', type: 'size', emoji: '📏', labelKey: 'luGameSizes' },
  { id: 'shapes', type: 'find', emoji: '🔷', labelKey: 'luGameShapes', worldId: 'shapes' },
];

export const UNIVERSE_AVATARS = [
  { id: 'puppy', emoji: '🐶', labelKey: 'luAvatarPuppy', unlockAt: 0 },
  { id: 'kitten', emoji: '🐱', labelKey: 'luAvatarKitten', unlockAt: 50 },
  { id: 'robot', emoji: '🤖', labelKey: 'luAvatarRobot', unlockAt: 100 },
  { id: 'princess', emoji: '👸', labelKey: 'luAvatarPrincess', unlockAt: 150 },
  { id: 'astronaut', emoji: '🧑‍🚀', labelKey: 'luAvatarAstronaut', unlockAt: 200 },
  { id: 'dragon', emoji: '🐉', labelKey: 'luAvatarDragon', unlockAt: 300 },
  { id: 'unicorn', emoji: '🦄', labelKey: 'luAvatarUnicorn', unlockAt: 400 },
  { id: 'dino', emoji: '🦕', labelKey: 'luAvatarDino', unlockAt: 250 },
  { id: 'fox', emoji: '🦊', labelKey: 'luAvatarFox', unlockAt: 120 },
  { id: 'owl', emoji: '🦉', labelKey: 'luAvatarOwl', unlockAt: 180 },
];

export const UNIVERSE_BADGES = [
  { id: 'first_book', emoji: '📘', labelKey: 'luBadgeFirstBook', test: (s) => s.booksCompleted >= 1 },
  { id: 'books_10', emoji: '📚', labelKey: 'luBadgeBooks10', test: (s) => s.booksCompleted >= 10 },
  { id: 'books_100', emoji: '🏛️', labelKey: 'luBadgeBooks100', test: (s) => s.booksCompleted >= 100 },
  { id: 'first_quiz', emoji: '🧠', labelKey: 'luBadgeFirstQuiz', test: (s) => s.quizAttempts >= 1 },
  { id: 'quiz_100', emoji: '💯', labelKey: 'luBadgeQuiz100', test: (s) => s.quizCorrect >= 100 },
  { id: 'explorer', emoji: '🧭', labelKey: 'luBadgeExplorer', test: (s) => s.worldsExplored >= 5 },
  { id: 'dino_expert', emoji: '🦖', labelKey: 'luBadgeDinoExpert', test: (s) => (s.byWorld.dinosaurs || 0) >= 3 },
  { id: 'astronaut', emoji: '🚀', labelKey: 'luBadgeAstronaut', test: (s) => (s.byWorld.space || 0) >= 3 },
  { id: 'little_scientist', emoji: '🔬', labelKey: 'luBadgeScientist', test: (s) => (s.byWorld.science || 0) >= 2 },
  { id: 'music_star', emoji: '🎵', labelKey: 'luBadgeMusicStar', test: (s) => (s.byWorld.music || 0) >= 2 },
  { id: 'streak_3', emoji: '🔥', labelKey: 'luBadgeStreak3', test: (s) => s.streakDays >= 3 },
  { id: 'chest_opener', emoji: '🎁', labelKey: 'luBadgeChest', test: (s) => s.chestsOpened >= 1 },
];

export const CHEST_REWARDS = [
  { type: 'xp', amount: 20, emoji: '⭐', labelKey: 'luChestXp' },
  { type: 'badge', badgeId: 'chest_opener', emoji: '🏅', labelKey: 'luChestBadge' },
  { type: 'avatar', avatarId: 'fox', emoji: '🦊', labelKey: 'luChestAvatar' },
  { type: 'sticker', stickerId: 'star', emoji: '🌟', labelKey: 'luChestSticker' },
  { type: 'sound', soundId: 'cheer', emoji: '🔊', labelKey: 'luChestSound' },
  { type: 'story_hint', emoji: '📖', labelKey: 'luChestStory' },
];

/** Theme → story quiz pictogram packs (after a story). */
const STORY_QUIZ_THEMES = {
  dinosaurs: {
    promptKey: 'luStoryQuizWho',
    correct: { id: 'dino', label: '🦖' },
    options: [{ id: 'dino', label: '🦖' }, { id: 'bear', label: '🐻' }, { id: 'elephant', label: '🐘' }],
  },
  animals: {
    promptKey: 'luStoryQuizWho',
    correct: { id: 'lion', label: '🦁' },
    options: [{ id: 'lion', label: '🦁' }, { id: 'car', label: '🚗' }, { id: 'tree', label: '🌳' }],
  },
  space: {
    promptKey: 'luStoryQuizWhat',
    correct: { id: 'rocket', label: '🚀' },
    options: [{ id: 'rocket', label: '🚀' }, { id: 'boat', label: '⛵' }, { id: 'bike', label: '🚲' }],
  },
  dragons: {
    promptKey: 'luStoryQuizWho',
    correct: { id: 'dragon', label: '🐉' },
    options: [{ id: 'dragon', label: '🐉' }, { id: 'bear', label: '🐻' }, { id: 'elephant', label: '🐘' }],
  },
  default: {
    promptKey: 'luStoryQuizHero',
    correct: { id: 'star', label: '⭐' },
    options: [{ id: 'star', label: '⭐' }, { id: 'cloud', label: '☁️' }, { id: 'moon', label: '🌙' }],
  },
};

export function buildStoryQuiz(book = {}) {
  const text = [book.title, book.theme, book.category_name, book.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let pack = STORY_QUIZ_THEMES.default;
  if (/dino|saurus|tyranno/.test(text)) pack = STORY_QUIZ_THEMES.dinosaurs;
  else if (/dragon|dragón|dragon/.test(text)) pack = STORY_QUIZ_THEMES.dragons;
  else if (/space|planet|rocket|étoile|etoile|fusée|fusee/.test(text)) pack = STORY_QUIZ_THEMES.space;
  else if (/animal|lion|cat|dog|zoo|chat|chien/.test(text)) pack = STORY_QUIZ_THEMES.animals;

  return {
    id: `story-quiz-${book.id || 'x'}`,
    promptKey: pack.promptKey,
    bookTitle: book.title || '',
    options: pack.options.map((opt) => ({
      ...opt,
      correct: opt.id === pack.correct.id,
    })),
  };
}

export function getExtraMiniGame(gameId) {
  const extras = {
    shadows: {
      id: 'shadows-1',
      type: 'shadow',
      pictogram: '🌑',
      prompt: '🐱',
      options: [
        { id: 'cat', label: '⬛🐱', correct: true },
        { id: 'dog', label: '⬛🐶' },
        { id: 'bird', label: '⬛🐦' },
      ],
    },
    sizes: {
      id: 'sizes-1',
      type: 'size',
      pictogram: '📏',
      prompt: 'big',
      options: [
        { id: 'big', label: '🐘', correct: true },
        { id: 'mid', label: '🐕' },
        { id: 'small', label: '🐜' },
      ],
    },
    puzzle: {
      id: 'puzzle-1',
      type: 'puzzle',
      pictogram: '🧩',
      pieces: ['🟥', '🟦', '🟩', '🟨'],
      answerOrder: ['🟥', '🟦', '🟩', '🟨'],
    },
    memory: {
      id: 'memory-1',
      type: 'memory',
      pictogram: '🧠',
      pairs: [
        { id: '1', pictogram: '🐶' },
        { id: '2', pictogram: '🐱' },
        { id: '3', pictogram: '🐻' },
        { id: '4', pictogram: '🦊' },
      ],
    },
  };
  return extras[gameId] || null;
}
