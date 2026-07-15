/** Demo learning catalog: 20 quizzes + 20 educational games. */

const CATEGORIES = ['alphabet', 'numbers', 'colors', 'shapes', 'languages', 'animals'];

const CATEGORY_TRANSLATIONS = {
  alphabet: { en: 'Alphabet', ar: 'الحروف' },
  numbers: { en: 'Numbers', ar: 'الأرقام' },
  colors: { en: 'Colors', ar: 'الألوان' },
  shapes: { en: 'Shapes', ar: 'الأشكال' },
  languages: { en: 'Languages', ar: 'اللغات' },
  animals: { en: 'Animals', ar: 'الحيوانات' },
};

const QUIZ_TEMPLATES = [
  {
    slug: 'quiz-letter-a', title: 'Trouve la lettre A', category: 'alphabet', quiz_type: 'find_image',
    titleEn: 'Find the letter A', titleAr: 'ابحث عن الحرف أ',
    prompt: 'Touche la lettre A',
    options: [{ id: 'a', label: 'A', pictogram: 'A' }, { id: 'b', label: 'B', pictogram: 'B' }, { id: 'c', label: 'C', pictogram: 'C' }],
    answer: 'a', explanation: 'Bravo, c est la lettre A.',
    questionEn: { prompt: 'Touch the letter A', explanation: 'Well done, it is the letter A.', options: ['A', 'B', 'C'] },
    questionAr: { prompt: 'المس الحرف أ', explanation: 'أحسنت، هذا هو الحرف أ.', options: ['أ', 'ب', 'ت'] },
  },
  {
    slug: 'quiz-letter-b', title: 'Trouve la lettre B', category: 'alphabet', quiz_type: 'find_image',
    titleEn: 'Find the letter B', titleAr: 'ابحث عن الحرف ب',
    prompt: 'Touche la lettre B',
    options: [{ id: 'a', label: 'A', pictogram: 'A' }, { id: 'b', label: 'B', pictogram: 'B' }, { id: 'd', label: 'D', pictogram: 'D' }],
    answer: 'b', explanation: 'B comme ballon.',
    questionEn: { prompt: 'Touch the letter B', explanation: 'B as in ball.', options: ['A', 'B', 'D'] },
    questionAr: { prompt: 'المس الحرف ب', explanation: 'ب مثل بالون.', options: ['أ', 'ب', 'د'] },
  },
  {
    slug: 'quiz-count-2', title: 'Compte jusqu a 2', category: 'numbers', quiz_type: 'multiple_choice',
    titleEn: 'Count to 2', titleAr: 'عد حتى 2',
    prompt: 'Combien de pommes ?',
    options: [{ id: '1', label: '1', pictogram: '🍎' }, { id: '2', label: '2', pictogram: '🍎🍎' }, { id: '3', label: '3', pictogram: '🍎🍎🍎' }],
    answer: '2', explanation: 'Il y a deux pommes.',
    questionEn: { prompt: 'How many apples?', explanation: 'There are two apples.', options: ['1', '2', '3'] },
    questionAr: { prompt: 'كم عدد التفاحات؟', explanation: 'هناك تفاحتان.', options: ['1', '2', '3'] },
  },
  {
    slug: 'quiz-count-3', title: 'Compte jusqu a 3', category: 'numbers', quiz_type: 'multiple_choice',
    titleEn: 'Count to 3', titleAr: 'عد حتى 3',
    prompt: 'Combien d etoiles ?',
    options: [{ id: '2', label: '2', pictogram: '⭐⭐' }, { id: '3', label: '3', pictogram: '⭐⭐⭐' }, { id: '4', label: '4', pictogram: '⭐⭐⭐⭐' }],
    answer: '3', explanation: 'Trois etoiles brillent.',
    questionEn: { prompt: 'How many stars?', explanation: 'Three stars shine.', options: ['2', '3', '4'] },
    questionAr: { prompt: 'كم عدد النجوم؟', explanation: 'ثلاث نجوم تلمع.', options: ['2', '3', '4'] },
  },
  {
    slug: 'quiz-red', title: 'Touche le rouge', category: 'colors', quiz_type: 'find_image',
    titleEn: 'Touch the red', titleAr: 'المس الأحمر',
    prompt: 'Quelle couleur est rouge ?',
    options: [{ id: 'red', label: 'Rouge', pictogram: '🔴' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }, { id: 'green', label: 'Vert', pictogram: '🟢' }],
    answer: 'red', explanation: 'Rouge comme une fraise.',
    questionEn: { prompt: 'Which color is red?', explanation: 'Red like a strawberry.', options: ['Red', 'Blue', 'Green'] },
    questionAr: { prompt: 'أي لون هو الأحمر؟', explanation: 'أحمر مثل الفراولة.', options: ['أحمر', 'أزرق', 'أخضر'] },
  },
  {
    slug: 'quiz-blue', title: 'Touche le bleu', category: 'colors', quiz_type: 'find_image',
    titleEn: 'Touch the blue', titleAr: 'المس الأزرق',
    prompt: 'Quelle couleur est bleue ?',
    options: [{ id: 'yellow', label: 'Jaune', pictogram: '🟡' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }, { id: 'pink', label: 'Rose', pictogram: '🩷' }],
    answer: 'blue', explanation: 'Bleu comme la mer.',
    questionEn: { prompt: 'Which color is blue?', explanation: 'Blue like the sea.', options: ['Yellow', 'Blue', 'Pink'] },
    questionAr: { prompt: 'أي لون هو الأزرق؟', explanation: 'أزرق مثل البحر.', options: ['أصفر', 'أزرق', 'وردي'] },
  },
  {
    slug: 'quiz-circle', title: 'Forme ronde', category: 'shapes', quiz_type: 'multiple_choice',
    titleEn: 'Round shape', titleAr: 'الشكل الدائري',
    prompt: 'Touche la forme ronde',
    options: [{ id: 'circle', label: 'Rond', pictogram: '⚫' }, { id: 'square', label: 'Carre', pictogram: '⬛' }, { id: 'triangle', label: 'Triangle', pictogram: '🔺' }],
    answer: 'circle', explanation: 'Un cercle est rond.',
    questionEn: { prompt: 'Touch the round shape', explanation: 'A circle is round.', options: ['Circle', 'Square', 'Triangle'] },
    questionAr: { prompt: 'المس الشكل الدائري', explanation: 'الدائرة مستديرة.', options: ['دائرة', 'مربع', 'مثلث'] },
  },
  {
    slug: 'quiz-square', title: 'Forme carree', category: 'shapes', quiz_type: 'multiple_choice',
    titleEn: 'Square shape', titleAr: 'الشكل المربع',
    prompt: 'Touche le carre',
    options: [{ id: 'circle', label: 'Rond', pictogram: '⚫' }, { id: 'square', label: 'Carre', pictogram: '⬛' }, { id: 'star', label: 'Etoile', pictogram: '⭐' }],
    answer: 'square', explanation: 'Un carre a quatre cotes.',
    questionEn: { prompt: 'Touch the square', explanation: 'A square has four sides.', options: ['Circle', 'Square', 'Star'] },
    questionAr: { prompt: 'المس المربع', explanation: 'المربع له أربعة أضلاع.', options: ['دائرة', 'مربع', 'نجمة'] },
  },
  {
    slug: 'quiz-hello', title: 'Hello veut dire', category: 'languages', quiz_type: 'listen_answer',
    titleEn: 'Hello means', titleAr: 'معنى Hello',
    prompt: 'Hello veut dire ?',
    options: [{ id: 'bonjour', label: 'Bonjour', pictogram: '👋' }, { id: 'nuit', label: 'Nuit', pictogram: '🌙' }, { id: 'chat', label: 'Chat', pictogram: '🐱' }],
    answer: 'bonjour', explanation: 'Hello veut dire bonjour.',
    questionEn: { prompt: 'What does Hello mean?', explanation: 'Hello means hi.', options: ['Hello', 'Night', 'Cat'] },
    questionAr: { prompt: 'ماذا تعني Hello؟', explanation: 'Hello تعني مرحبا.', options: ['مرحبا', 'ليل', 'قطة'] },
  },
  {
    slug: 'quiz-cat-en', title: 'Cat veut dire', category: 'languages', quiz_type: 'listen_answer',
    titleEn: 'Cat means', titleAr: 'معنى Cat',
    prompt: 'Cat veut dire ?',
    options: [{ id: 'chat', label: 'Chat', pictogram: '🐱' }, { id: 'chien', label: 'Chien', pictogram: '🐶' }, { id: 'oiseau', label: 'Oiseau', pictogram: '🐦' }],
    answer: 'chat', explanation: 'Cat veut dire chat.',
    questionEn: { prompt: 'What does Cat mean?', explanation: 'Cat means cat.', options: ['Cat', 'Dog', 'Bird'] },
    questionAr: { prompt: 'ماذا تعني Cat؟', explanation: 'Cat تعني قطة.', options: ['قطة', 'كلب', 'عصفور'] },
  },
  {
    slug: 'quiz-dog', title: 'Quel animal aboie', category: 'animals', quiz_type: 'find_image',
    titleEn: 'Which animal barks', titleAr: 'أي حيوان ينبح',
    prompt: 'Qui fait ouaf ?',
    options: [{ id: 'dog', label: 'Chien', pictogram: '🐶' }, { id: 'cat', label: 'Chat', pictogram: '🐱' }, { id: 'cow', label: 'Vache', pictogram: '🐄' }],
    answer: 'dog', explanation: 'Le chien fait ouaf.',
    questionEn: { prompt: 'Who goes woof?', explanation: 'The dog goes woof.', options: ['Dog', 'Cat', 'Cow'] },
    questionAr: { prompt: 'من يقول هو هو؟', explanation: 'الكلب ينبح.', options: ['كلب', 'قطة', 'بقرة'] },
  },
  {
    slug: 'quiz-cat', title: 'Quel animal miaule', category: 'animals', quiz_type: 'find_image',
    titleEn: 'Which animal meows', titleAr: 'أي حيوان يموء',
    prompt: 'Qui fait miaou ?',
    options: [{ id: 'cat', label: 'Chat', pictogram: '🐱' }, { id: 'duck', label: 'Canard', pictogram: '🦆' }, { id: 'bear', label: 'Ours', pictogram: '🐻' }],
    answer: 'cat', explanation: 'Le chat fait miaou.',
    questionEn: { prompt: 'Who goes meow?', explanation: 'The cat goes meow.', options: ['Cat', 'Duck', 'Bear'] },
    questionAr: { prompt: 'من يقول مياو؟', explanation: 'القطة تموء.', options: ['قطة', 'بطة', 'دب'] },
  },
  {
    slug: 'quiz-true-night', title: 'La lune brille la nuit', category: 'numbers', quiz_type: 'true_false',
    titleEn: 'The moon shines at night', titleAr: 'القمر يضيء في الليل',
    prompt: 'La lune brille la nuit ?',
    options: [{ id: 'true', label: 'Vrai', pictogram: '✅' }, { id: 'false', label: 'Faux', pictogram: '❌' }],
    answer: 'true', explanation: 'Oui, la lune brille la nuit.',
    questionEn: { prompt: 'Does the moon shine at night?', explanation: 'Yes, the moon shines at night.', options: ['True', 'False'] },
    questionAr: { prompt: 'هل القمر يضيء في الليل؟', explanation: 'نعم، القمر يضيء في الليل.', options: ['صحيح', 'خطأ'] },
  },
  {
    slug: 'quiz-true-sun', title: 'Le soleil est froid', category: 'colors', quiz_type: 'true_false',
    titleEn: 'The sun is cold', titleAr: 'الشمس باردة',
    prompt: 'Le soleil est froid ?',
    options: [{ id: 'true', label: 'Vrai', pictogram: '✅' }, { id: 'false', label: 'Faux', pictogram: '❌' }],
    answer: 'false', explanation: 'Non, le soleil est chaud.',
    questionEn: { prompt: 'Is the sun cold?', explanation: 'No, the sun is hot.', options: ['True', 'False'] },
    questionAr: { prompt: 'هل الشمس باردة؟', explanation: 'لا، الشمس حارة.', options: ['صحيح', 'خطأ'] },
  },
  {
    slug: 'quiz-count-4', title: 'Compte jusqu a 4', category: 'numbers', quiz_type: 'multiple_choice',
    titleEn: 'Count to 4', titleAr: 'عد حتى 4',
    prompt: 'Combien de fleurs ?',
    options: [{ id: '3', label: '3', pictogram: '🌸🌸🌸' }, { id: '4', label: '4', pictogram: '🌸🌸🌸🌸' }, { id: '5', label: '5', pictogram: '🌸🌸🌸🌸🌸' }],
    answer: '4', explanation: 'Quatre fleurs dans le jardin.',
    questionEn: { prompt: 'How many flowers?', explanation: 'Four flowers in the garden.', options: ['3', '4', '5'] },
    questionAr: { prompt: 'كم عدد الزهور؟', explanation: 'أربع زهور في الحديقة.', options: ['3', '4', '5'] },
  },
  {
    slug: 'quiz-letter-c', title: 'Trouve la lettre C', category: 'alphabet', quiz_type: 'find_image',
    titleEn: 'Find the letter C', titleAr: 'ابحث عن الحرف ت',
    prompt: 'Touche la lettre C',
    options: [{ id: 'c', label: 'C', pictogram: 'C' }, { id: 'e', label: 'E', pictogram: 'E' }, { id: 'f', label: 'F', pictogram: 'F' }],
    answer: 'c', explanation: 'C comme chenille.',
    questionEn: { prompt: 'Touch the letter C', explanation: 'C as in caterpillar.', options: ['C', 'E', 'F'] },
    questionAr: { prompt: 'المس الحرف ت', explanation: 'ت مثل تمساح.', options: ['ت', 'ث', 'ج'] },
  },
  {
    slug: 'quiz-yellow', title: 'Touche le jaune', category: 'colors', quiz_type: 'find_image',
    titleEn: 'Touch the yellow', titleAr: 'المس الأصفر',
    prompt: 'Quelle couleur est jaune ?',
    options: [{ id: 'yellow', label: 'Jaune', pictogram: '🟡' }, { id: 'purple', label: 'Violet', pictogram: '🟣' }, { id: 'orange', label: 'Orange', pictogram: '🟠' }],
    answer: 'yellow', explanation: 'Jaune comme le soleil.',
    questionEn: { prompt: 'Which color is yellow?', explanation: 'Yellow like the sun.', options: ['Yellow', 'Purple', 'Orange'] },
    questionAr: { prompt: 'أي لون هو الأصفر؟', explanation: 'أصفر مثل الشمس.', options: ['أصفر', 'بنفسجي', 'برتقالي'] },
  },
  {
    slug: 'quiz-green', title: 'Touche le vert', category: 'colors', quiz_type: 'find_image',
    titleEn: 'Touch the green', titleAr: 'المس الأخضر',
    prompt: 'Quelle couleur est verte ?',
    options: [{ id: 'green', label: 'Vert', pictogram: '🟢' }, { id: 'red', label: 'Rouge', pictogram: '🔴' }, { id: 'blue', label: 'Bleu', pictogram: '🔵' }],
    answer: 'green', explanation: 'Vert comme l herbe.',
    questionEn: { prompt: 'Which color is green?', explanation: 'Green like grass.', options: ['Green', 'Red', 'Blue'] },
    questionAr: { prompt: 'أي لون هو الأخضر؟', explanation: 'أخضر مثل العشب.', options: ['أخضر', 'أحمر', 'أزرق'] },
  },
  {
    slug: 'quiz-bird', title: 'Qui vole dans le ciel', category: 'animals', quiz_type: 'find_image',
    titleEn: 'Who flies in the sky', titleAr: 'من يطير في السماء',
    prompt: 'Quel animal vole ?',
    options: [{ id: 'bird', label: 'Oiseau', pictogram: '🐦' }, { id: 'fish', label: 'Poisson', pictogram: '🐠' }, { id: 'snail', label: 'Escargot', pictogram: '🐌' }],
    answer: 'bird', explanation: 'L oiseau vole dans le ciel.',
    questionEn: { prompt: 'Which animal flies?', explanation: 'The bird flies in the sky.', options: ['Bird', 'Fish', 'Snail'] },
    questionAr: { prompt: 'أي حيوان يطير؟', explanation: 'العصفور يطير في السماء.', options: ['عصفور', 'سمكة', 'حلزون'] },
  },
  {
    slug: 'quiz-thank-you', title: 'Merci en anglais', category: 'languages', quiz_type: 'listen_answer',
    titleEn: 'Thank you in English', titleAr: 'شكرا بالإنجليزية',
    prompt: 'Thank you veut dire ?',
    options: [{ id: 'merci', label: 'Merci', pictogram: '🙏' }, { id: 'pardon', label: 'Pardon', pictogram: '😊' }, { id: 'salut', label: 'Salut', pictogram: '👋' }],
    answer: 'merci', explanation: 'Thank you veut dire merci.',
    questionEn: { prompt: 'What does Thank you mean?', explanation: 'Thank you means thanks.', options: ['Thanks', 'Sorry', 'Hi'] },
    questionAr: { prompt: 'ماذا تعني Thank you؟', explanation: 'Thank you تعني شكرا.', options: ['شكرا', 'عفوا', 'مرحبا'] },
  },
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
    const catEn = CATEGORY_TRANSLATIONS[category]?.en || category;
    const catAr = CATEGORY_TRANSLATIONS[category]?.ar || category;
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
      localizations: {
        en: {
          title: template.titleEn,
          description: `${catEn} quiz for ${age.level} year olds.`,
          question: template.questionEn,
        },
        ar: {
          title: template.titleAr,
          description: `اختبار ${catAr} لعمر ${age.level} سنوات.`,
          question: template.questionAr,
        },
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
      localizations: {
        en: {
          title: `Memory ${pairs[0].pictogram} ${pairs[1].pictogram}`,
          description: `Memory game for ${age.level} year olds.`,
        },
        ar: {
          title: `ذاكرة ${pairs[0].pictogram} ${pairs[1].pictogram}`,
          description: `لعبة ذاكرة لعمر ${age.level} سنوات.`,
        },
      },
    };
  });
}

export const LEARNING_CATALOG = [
  ...buildLearningQuizzes(),
  ...buildLearningGames(),
];
