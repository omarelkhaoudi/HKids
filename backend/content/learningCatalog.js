/** Demo learning catalog: 20 quizzes + 20 educational games. */

const CATEGORIES = ['alphabet', 'numbers', 'colors', 'shapes', 'languages', 'animals'];

const QUIZ_TEMPLATES = [
  { slug: 'quiz-letter-a', title: 'Trouve la lettre A', category: 'alphabet', quiz_type: 'find_image', prompt: 'Touche la lettre A', options: [{ id: 'a', label: 'A', pictogram: 'A' }, { id: 'b', label: 'B', pictogram: 'B' }, { id: 'c', label: 'C', pictogram: 'C' }], answer: 'a', explanation: 'Bravo, c est la lettre A.' },
  { slug: 'quiz-letter-b', title: 'Trouve la lettre B', category: 'alphabet', quiz_type: 'find_image', prompt: 'Touche la lettre B', options: [{ id: 'a', label: 'A', pictogram: 'A' }, { id: 'b', label: 'B', pictogram: 'B' }, { id: 'd', label: 'D', pictogram: 'D' }], answer: 'b', explanation: 'B comme ballon.' },
  { slug: 'quiz-count-2', title: 'Compte jusqu a 2', category: 'numbers', quiz_type: 'multiple_choice', prompt: 'Combien de pommes ?', options: [{ id: '1', label: '1', pictogram: '🍎' }, { id: '2', label: '2', pictogram: '🍎🍎' }, { id: '3', label: '3', pictogram: '🍎🍎🍎' }], answer: '2', explanation: 'Il y a deux pommes.' },
  { slug: 'quiz-count-3', title: 'Compte jusqu a 3', category: 'numbers', quiz_type: 'multiple_choice', prompt: 'Combien d etoiles ?', options: [{ id: '2', label: '2', pictogram: '⭐⭐' }, { id: '3', label: '3', pictogram: '⭐⭐⭐' }, { id: '4', label: '4', pictogram: '⭐⭐⭐⭐' }], answer: '3', explanation: 'Trois etoiles brillent.' },
  { slug: 'quiz-red', title: 'Touche le rouge', category: 'colors', quiz_type: 'find_image', prompt: 'Quelle couleur est rouge ?', options: [{ id: 'red', label: 'Rouge', pictogram: '🔴' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }, { id: 'green', label: 'Vert', pictogram: '🟢' }], answer: 'red', explanation: 'Rouge comme une fraise.' },
  { slug: 'quiz-blue', title: 'Touche le bleu', category: 'colors', quiz_type: 'find_image', prompt: 'Quelle couleur est bleue ?', options: [{ id: 'yellow', label: 'Jaune', pictogram: '🟡' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }, { id: 'pink', label: 'Rose', pictogram: '🩷' }], answer: 'blue', explanation: 'Bleu comme la mer.' },
  { slug: 'quiz-circle', title: 'Forme ronde', category: 'shapes', quiz_type: 'multiple_choice', prompt: 'Touche la forme ronde', options: [{ id: 'circle', label: 'Rond', pictogram: '⚫' }, { id: 'square', label: 'Carre', pictogram: '⬛' }, { id: 'triangle', label: 'Triangle', pictogram: '🔺' }], answer: 'circle', explanation: 'Un cercle est rond.' },
  { slug: 'quiz-square', title: 'Forme carree', category: 'shapes', quiz_type: 'multiple_choice', prompt: 'Touche le carre', options: [{ id: 'circle', label: 'Rond', pictogram: '⚫' }, { id: 'square', label: 'Carre', pictogram: '⬛' }, { id: 'star', label: 'Etoile', pictogram: '⭐' }], answer: 'square', explanation: 'Un carre a quatre cotes.' },
  { slug: 'quiz-hello', title: 'Hello veut dire', category: 'languages', quiz_type: 'listen_answer', prompt: 'Hello veut dire ?', options: [{ id: 'bonjour', label: 'Bonjour', pictogram: '👋' }, { id: 'nuit', label: 'Nuit', pictogram: '🌙' }, { id: 'chat', label: 'Chat', pictogram: '🐱' }], answer: 'bonjour', explanation: 'Hello veut dire bonjour.' },
  { slug: 'quiz-cat-en', title: 'Cat veut dire', category: 'languages', quiz_type: 'listen_answer', prompt: 'Cat veut dire ?', options: [{ id: 'chat', label: 'Chat', pictogram: '🐱' }, { id: 'chien', label: 'Chien', pictogram: '🐶' }, { id: 'oiseau', label: 'Oiseau', pictogram: '🐦' }], answer: 'chat', explanation: 'Cat veut dire chat.' },
  { slug: 'quiz-dog', title: 'Quel animal aboie', category: 'animals', quiz_type: 'find_image', prompt: 'Qui fait ouaf ?', options: [{ id: 'dog', label: 'Chien', pictogram: '🐶' }, { id: 'cat', label: 'Chat', pictogram: '🐱' }, { id: 'cow', label: 'Vache', pictogram: '🐄' }], answer: 'dog', explanation: 'Le chien fait ouaf.' },
  { slug: 'quiz-cat', title: 'Quel animal miaule', category: 'animals', quiz_type: 'find_image', prompt: 'Qui fait miaou ?', options: [{ id: 'cat', label: 'Chat', pictogram: '🐱' }, { id: 'duck', label: 'Canard', pictogram: '🦆' }, { id: 'bear', label: 'Ours', pictogram: '🐻' }], answer: 'cat', explanation: 'Le chat fait miaou.' },
  { slug: 'quiz-true-night', title: 'La lune brille la nuit', category: 'numbers', quiz_type: 'true_false', prompt: 'La lune brille la nuit ?', options: [{ id: 'true', label: 'Vrai', pictogram: '✅' }, { id: 'false', label: 'Faux', pictogram: '❌' }], answer: 'true', explanation: 'Oui, la lune brille la nuit.' },
  { slug: 'quiz-true-sun', title: 'Le soleil est froid', category: 'colors', quiz_type: 'true_false', prompt: 'Le soleil est froid ?', options: [{ id: 'true', label: 'Vrai', pictogram: '✅' }, { id: 'false', label: 'Faux', pictogram: '❌' }], answer: 'false', explanation: 'Non, le soleil est chaud.' },
  { slug: 'quiz-count-4', title: 'Compte jusqu a 4', category: 'numbers', quiz_type: 'multiple_choice', prompt: 'Combien de fleurs ?', options: [{ id: '3', label: '3', pictogram: '🌸🌸🌸' }, { id: '4', label: '4', pictogram: '🌸🌸🌸🌸' }, { id: '5', label: '5', pictogram: '🌸🌸🌸🌸🌸' }], answer: '4', explanation: 'Quatre fleurs dans le jardin.' },
  { slug: 'quiz-letter-c', title: 'Trouve la lettre C', category: 'alphabet', quiz_type: 'find_image', prompt: 'Touche la lettre C', options: [{ id: 'c', label: 'C', pictogram: 'C' }, { id: 'e', label: 'E', pictogram: 'E' }, { id: 'f', label: 'F', pictogram: 'F' }], answer: 'c', explanation: 'C comme chenille.' },
  { slug: 'quiz-yellow', title: 'Touche le jaune', category: 'colors', quiz_type: 'find_image', prompt: 'Quelle couleur est jaune ?', options: [{ id: 'yellow', label: 'Jaune', pictogram: '🟡' }, { id: 'purple', label: 'Violet', pictogram: '🟣' }, { id: 'orange', label: 'Orange', pictogram: '🟠' }], answer: 'yellow', explanation: 'Jaune comme le soleil.' },
  { slug: 'quiz-green', title: 'Touche le vert', category: 'colors', quiz_type: 'find_image', prompt: 'Quelle couleur est verte ?', options: [{ id: 'green', label: 'Vert', pictogram: '🟢' }, { id: 'red', label: 'Rouge', pictogram: '🔴' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }], answer: 'green', explanation: 'Vert comme l herbe.' },
  { slug: 'quiz-bird', title: 'Qui vole dans le ciel', category: 'animals', quiz_type: 'find_image', prompt: 'Quel animal vole ?', options: [{ id: 'bird', label: 'Oiseau', pictogram: '🐦' }, { id: 'fish', label: 'Poisson', pictogram: '🐠' }, { id: 'snail', label: 'Escargot', pictogram: '🐌' }], answer: 'bird', explanation: 'L oiseau vole dans le ciel.' },
  { slug: 'quiz-thank-you', title: 'Merci en anglais', category: 'languages', quiz_type: 'listen_answer', prompt: 'Thank you veut dire ?', options: [{ id: 'merci', label: 'Merci', pictogram: '🙏' }, { id: 'pardon', label: 'Pardon', pictogram: '😊' }, { id: 'salut', label: 'Salut', pictogram: '👋' }], answer: 'merci', explanation: 'Thank you veut dire merci.' },
];

const GAME_PAIR_SETS = [
  [{ id: '1', pictogram: '🐶' }, { id: '2', pictogram: '🐱' }, { id: '3', pictogram: '🐻' }, { id: '4', pictogram: '🦊' }],
  [{ id: '1', pictogram: '🍎' }, { id: '2', pictogram: '🍌' }, { id: '3', pictogram: '🍇' }, { id: '4', pictogram: '🍓' }],
  [{ id: '1', pictogram: '🚀' }, { id: '2', pictogram: '🌙' }, { id: '3', pictogram: '⭐' }, { id: '4', pictogram: '🪐' }],
  [{ id: '1', pictogram: '🔴' }, { id: '2', pictogram: '🔵' }, { id: '3', pictogram: '🟢' }, { id: '4', pictogram: '🟡' }],
  [{ id: '1', pictogram: '⚽' }, { id: '2', pictogram: '🏀' }, { id: '3', pictogram: '🎾' }, { id: '4', pictogram: '🏐' }],
  [{ id: '1', pictogram: '🦖' }, { id: '2', pictogram: '🦕' }, { id: '3', pictogram: '🐊' }, { id: '4', pictogram: '🐢' }],
  [{ id: '1', pictogram: '👸' }, { id: '2', pictogram: '🤴' }, { id: '3', pictogram: '🧚' }, { id: '4', pictogram: '🦄' }],
  [{ id: '1', pictogram: '🚒' }, { id: '2', pictogram: '🚑' }, { id: '3', pictogram: '🚓' }, { id: '4', pictogram: '🚕' }],
  [{ id: '1', pictogram: '🌸' }, { id: '2', pictogram: '🌻' }, { id: '3', pictogram: '🌷' }, { id: '4', pictogram: '🌹' }],
  [{ id: '1', pictogram: '🎵' }, { id: '2', pictogram: '🎸' }, { id: '3', pictogram: '🥁' }, { id: '4', pictogram: '🎺' }],
  [{ id: '1', pictogram: '🐧' }, { id: '2', pictogram: '🐠' }, { id: '3', pictogram: '🦀' }, { id: '4', pictogram: '🐙' }],
  [{ id: '1', pictogram: '🍞' }, { id: '2', pictogram: '🧀' }, { id: '3', pictogram: '🥛' }, { id: '4', pictogram: '🍯' }],
  [{ id: '1', pictogram: '🔤' }, { id: '2', pictogram: '🔢' }, { id: '3', pictogram: '🎨' }, { id: '4', pictogram: '🔺' }],
  [{ id: '1', pictogram: '🏠' }, { id: '2', pictogram: '🏫' }, { id: '3', pictogram: '🏰' }, { id: '4', pictogram: '⛺' }],
  [{ id: '1', pictogram: '🌞' }, { id: '2', pictogram: '🌈' }, { id: '3', pictogram: '☁️' }, { id: '4', pictogram: '❄️' }],
  [{ id: '1', pictogram: '🦋' }, { id: '2', pictogram: '🐝' }, { id: '3', pictogram: '🐞' }, { id: '4', pictogram: '🐌' }],
  [{ id: '1', pictogram: '🎁' }, { id: '2', pictogram: '🎈' }, { id: '3', pictogram: '🎉' }, { id: '4', pictogram: '🧸' }],
  [{ id: '1', pictogram: '📚' }, { id: '2', pictogram: '✏️' }, { id: '3', pictogram: '🖍️' }, { id: '4', pictogram: '📐' }],
  [{ id: '1', pictogram: '🌍' }, { id: '2', pictogram: '🗺️' }, { id: '3', pictogram: '🧭' }, { id: '4', pictogram: '⛵' }],
  [{ id: '1', pictogram: '🕊️' }, { id: '2', pictogram: '💖' }, { id: '3', pictogram: '🤝' }, { id: '4', pictogram: '🙏' }],
];

const DIFFICULTIES = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'];

function ageForIndex(index) {
  const bands = [
    { min: 2, max: 4, level: '2-4' },
    { min: 5, max: 7, level: '5-7' },
    { min: 8, max: 10, level: '8-10' },
  ];
  return bands[index % bands.length];
}

export function buildLearningQuizzes() {
  return QUIZ_TEMPLATES.map((template, index) => {
    const age = ageForIndex(index);
    const category = template.category || CATEGORIES[index % CATEGORIES.length];
    return {
      slug: template.slug,
      title: template.title,
      description: `Quiz ${category} pour ${age.level} ans.`,
      content_type: category,
      quiz_type: template.quiz_type,
      category_code: category,
      age_group_min: age.min,
      age_group_max: age.max,
      language: 'fr',
      difficulty: DIFFICULTIES[index % DIFFICULTIES.length],
      reward_code: index % 3 === 0 ? 'star_big' : 'star_small',
      metadata: {
        pictogram: category === 'alphabet' ? '🔤' : category === 'numbers' ? '🔢' : category === 'colors' ? '🎨' : category === 'shapes' ? '🔵' : category === 'languages' ? '🌍' : '🐻',
        level: age.level,
        tags: [category, `level:${age.level}`, `difficulty:${DIFFICULTIES[index % DIFFICULTIES.length]}`],
      },
      question: {
        question_type: template.quiz_type,
        prompt: template.prompt,
        options: template.options,
        correct_answer: Array.isArray(template.answer) ? { value: template.answer } : { value: template.answer },
        explanation: template.explanation,
      },
    };
  });
}

export function buildLearningGames() {
  return GAME_PAIR_SETS.map((pairs, index) => {
    const age = ageForIndex(index + 1);
    const category = CATEGORIES[index % CATEGORIES.length];
    return {
      slug: `game-memory-${String(index + 1).padStart(2, '0')}`,
      title: `Memo ${pairs[0].pictogram} ${pairs[1].pictogram}`,
      description: `Jeu de memoire pour ${age.level} ans.`,
      content_type: 'game',
      quiz_type: null,
      category_code: category,
      age_group_min: age.min,
      age_group_max: age.max,
      language: 'fr',
      difficulty: DIFFICULTIES[index % DIFFICULTIES.length],
      reward_code: 'star_small',
      metadata: {
        pictogram: '🎮',
        game_type: 'memory',
        pairs,
        level: age.level,
        tags: ['game', 'memory', category, `level:${age.level}`],
      },
    };
  });
}

export const LEARNING_CATALOG = [
  ...buildLearningQuizzes(),
  ...buildLearningGames(),
];
