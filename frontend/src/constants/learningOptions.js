import { normalizeLanguage } from '../utils/translations';

const learningLabels = {
  fr: {
    quiz: 'Quiz', game: 'Jeu', alphabet: 'Alphabet', numbers: 'Chiffres',
    colors: 'Couleurs', shapes: 'Formes', languages: 'Langues',
    multiple_choice: 'Choix multiple', find_image: 'Trouve l\'image',
    listen_answer: 'Écoute et réponds', true_false: 'Vrai ou faux',
    image_word_match: 'Image-mot', sequence_order: 'Ordre',
    easy: 'Facile', medium: 'Moyen', hard: 'Difficile',
  },
  en: {
    quiz: 'Quiz', game: 'Game', alphabet: 'Alphabet', numbers: 'Numbers',
    colors: 'Colors', shapes: 'Shapes', languages: 'Languages',
    multiple_choice: 'Multiple choice', find_image: 'Find the image',
    listen_answer: 'Listen and answer', true_false: 'True or false',
    image_word_match: 'Image-word', sequence_order: 'Order',
    easy: 'Easy', medium: 'Medium', hard: 'Hard',
  },
  ar: {
    quiz: 'مسابقة', game: 'لعبة', alphabet: 'الحروف', numbers: 'الأرقام',
    colors: 'الألوان', shapes: 'الأشكال', languages: 'اللغات',
    multiple_choice: 'اختيار متعدد', find_image: 'ابحث عن الصورة',
    listen_answer: 'استمع وأجب', true_false: 'صح أو خطأ',
    image_word_match: 'صورة-كلمة', sequence_order: 'ترتيب',
    easy: 'سهل', medium: 'متوسط', hard: 'صعب',
  },
};

function l(id, lang = 'fr') {
  const norm = normalizeLanguage(lang);
  return learningLabels[norm]?.[id] || learningLabels.fr[id] || id;
}

export const LEARNING_CONTENT_TYPES = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'game', label: 'Jeu' },
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'numbers', label: 'Chiffres' },
  { id: 'colors', label: 'Couleurs' },
  { id: 'shapes', label: 'Formes' },
  { id: 'languages', label: 'Langues' },
];

export const QUIZ_TYPE_OPTIONS = [
  { id: 'multiple_choice', label: 'Choix multiple' },
  { id: 'find_image', label: 'Trouve l\'image' },
  { id: 'listen_answer', label: 'Écoute et réponds' },
  { id: 'true_false', label: 'Vrai ou faux' },
  { id: 'image_word_match', label: 'Image-mot' },
  { id: 'sequence_order', label: 'Ordre' },
];

export const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyen' },
  { id: 'hard', label: 'Difficile' },
];

export function localizeLearningOptions(language = 'fr') {
  const contentTypes = LEARNING_CONTENT_TYPES.map((item) => ({ ...item, label: l(item.id, language) }));
  const quizTypes = QUIZ_TYPE_OPTIONS.map((item) => ({ ...item, label: l(item.id, language) }));
  const difficulties = DIFFICULTY_OPTIONS.map((item) => ({ ...item, label: l(item.id, language) }));
  return { contentTypes, quizTypes, difficulties };
}

export const EMPTY_QUESTION = () => ({
  question_type: 'multiple_choice',
  prompt: '',
  options: [
    { id: 'a', label: 'A', pictogram: 'A' },
    { id: 'b', label: 'B', pictogram: 'B' },
  ],
  correct_answer: { value: 'a' },
  explanation: '',
  position: 1,
});

export const EMPTY_LEARNING_FORM = {
  title: '',
  description: '',
  content_type: 'quiz',
  quiz_type: 'multiple_choice',
  category_id: '',
  age_group_min: 3,
  age_group_max: 8,
  language: 'fr',
  difficulty: 'easy',
  status: 'draft',
  questions: [EMPTY_QUESTION()],
};
