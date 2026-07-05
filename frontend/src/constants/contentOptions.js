export const CONTENT_TYPE_OPTIONS = [
  { id: 'story', label: 'Histoire' },
  { id: 'audio_story', label: 'Histoire audio' },
  { id: 'educational', label: 'Educatif' },
  { id: 'song', label: 'Comptine' },
  { id: 'quiz', label: 'Quiz' },
];

export const CONTENT_LANGUAGES = [
  { id: 'fr', label: 'Francais', shortLabel: 'FR' },
  { id: 'ar', label: 'Arabe', shortLabel: 'AR' },
  { id: 'en', label: 'Anglais', shortLabel: 'EN' },
];

export const CONTENT_THEMES = [
  {
    id: 'dinosaurs',
    label: 'Dinosaures',
    pictogram: 'D',
    gradient: 'from-lime-500 to-green-600',
    match: ['dinosaur', 'dinosaure', 'dino'],
  },
  {
    id: 'space',
    label: 'Espace',
    pictogram: 'R',
    gradient: 'from-indigo-500 to-cyan-500',
    match: ['space', 'espace', 'rocket', 'planete', 'planet'],
  },
  {
    id: 'animals',
    label: 'Animaux',
    pictogram: 'A',
    gradient: 'from-accent-400 to-accent-500',
    match: ['animal', 'animaux', 'nature'],
  },
  {
    id: 'princesses',
    label: 'Princesses',
    pictogram: 'P',
    gradient: 'from-secondary-500 to-rose-500',
    match: ['princess', 'princesse', 'fairy', 'conte'],
  },
  {
    id: 'jobs',
    label: 'Metiers',
    pictogram: 'M',
    gradient: 'from-primary-500 to-teal-500',
    match: ['job', 'metier', 'doctor', 'pompier', 'teacher'],
  },
  {
    id: 'world',
    label: 'Decouverte du monde',
    libraryLabel: 'Monde',
    pictogram: 'G',
    gradient: 'from-violet-500 to-fuchsia-500',
    match: ['world', 'monde', 'culture', 'voyage', 'science'],
  },
];

export const LIBRARY_THEME_FILTERS = [
  {
    id: 'all',
    label: 'Tous',
    pictogram: '*',
    gradient: 'from-sky-500 to-emerald-400',
    match: [],
  },
  ...CONTENT_THEMES.map((theme) => ({
    ...theme,
    label: theme.libraryLabel || theme.label,
  })),
];

export const LANGUAGE_FILTERS = [
  { id: 'all', label: 'Toutes' },
  ...CONTENT_LANGUAGES.map((language) => ({
    id: language.id,
    label: language.shortLabel,
  })),
];
