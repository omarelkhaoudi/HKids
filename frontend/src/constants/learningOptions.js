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
  { id: 'find_image', label: 'Trouve l image' },
  { id: 'listen_answer', label: 'Ecoute et reponds' },
  { id: 'true_false', label: 'Vrai ou faux' },
  { id: 'image_word_match', label: 'Image-mot' },
  { id: 'sequence_order', label: 'Ordre' },
];

export const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyen' },
  { id: 'hard', label: 'Difficile' },
];

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
