import { normalizeLanguage } from '../utils/translations';

const labels = {
  fr: {
    story: 'Histoire',
    audio_story: 'Histoire audio',
    educational: 'Éducatif',
    song: 'Comptine',
    quiz: 'Quiz',
    french: 'Français',
    arabic: 'Arabe',
    english: 'Anglais',
    dinosaurs: 'Dinosaures',
    space: 'Espace',
    animals: 'Animaux',
    princesses: 'Princesses',
    jobs: 'Métiers',
    world: 'Découverte du monde',
    worldShort: 'Monde',
    all: 'Tous',
    allLanguages: 'Toutes',
  },
  en: {
    story: 'Story',
    audio_story: 'Audio story',
    educational: 'Educational',
    song: 'Rhyme',
    quiz: 'Quiz',
    french: 'French',
    arabic: 'Arabic',
    english: 'English',
    dinosaurs: 'Dinosaurs',
    space: 'Space',
    animals: 'Animals',
    princesses: 'Princesses',
    jobs: 'Jobs',
    world: 'Discover the world',
    worldShort: 'World',
    all: 'All',
    allLanguages: 'All',
  },
  ar: {
    story: 'قصة',
    audio_story: 'قصة صوتية',
    educational: 'تعليمي',
    song: 'أنشودة',
    quiz: 'اختبار',
    french: 'الفرنسية',
    arabic: 'العربية',
    english: 'الإنجليزية',
    dinosaurs: 'ديناصورات',
    space: 'الفضاء',
    animals: 'حيوانات',
    princesses: 'أميرات',
    jobs: 'مهن',
    world: 'اكتشاف العالم',
    worldShort: 'العالم',
    all: 'الكل',
    allLanguages: 'كل اللغات',
  },
};

function label(language, key) {
  const normalized = normalizeLanguage(language);
  return labels[normalized]?.[key] || labels.fr[key] || key;
}

export const CONTENT_TYPE_OPTIONS = [
  { id: 'story', label: labels.fr.story, labelKey: 'story' },
  { id: 'audio_story', label: labels.fr.audio_story, labelKey: 'audio_story' },
  { id: 'educational', label: labels.fr.educational, labelKey: 'educational' },
  { id: 'song', label: labels.fr.song, labelKey: 'song' },
  { id: 'quiz', label: labels.fr.quiz, labelKey: 'quiz' },
];

export const CONTENT_LANGUAGES = [
  { id: 'fr', label: labels.fr.french, shortLabel: 'FR', labelKey: 'french' },
  { id: 'ar', label: labels.fr.arabic, shortLabel: 'AR', labelKey: 'arabic' },
  { id: 'en', label: labels.fr.english, shortLabel: 'EN', labelKey: 'english' },
];

export const CONTENT_THEMES = [
  {
    id: 'dinosaurs',
    label: labels.fr.dinosaurs,
    labelKey: 'dinosaurs',
    pictogram: '🦖',
    gradient: 'from-lime-500 to-green-600',
    match: ['dinosaur', 'dinosaure', 'dino'],
  },
  {
    id: 'space',
    label: labels.fr.space,
    labelKey: 'space',
    pictogram: '🚀',
    gradient: 'from-indigo-500 to-cyan-500',
    match: ['space', 'espace', 'rocket', 'planete', 'planet'],
  },
  {
    id: 'animals',
    label: labels.fr.animals,
    labelKey: 'animals',
    pictogram: '🐻',
    gradient: 'from-accent-400 to-accent-500',
    match: ['animal', 'animaux', 'nature'],
  },
  {
    id: 'princesses',
    label: labels.fr.princesses,
    labelKey: 'princesses',
    pictogram: '👸',
    gradient: 'from-secondary-500 to-rose-500',
    match: ['princess', 'princesse', 'fairy', 'conte'],
  },
  {
    id: 'jobs',
    label: labels.fr.jobs,
    labelKey: 'jobs',
    pictogram: '🚒',
    gradient: 'from-primary-500 to-teal-500',
    match: ['job', 'metier', 'doctor', 'pompier', 'teacher'],
  },
  {
    id: 'world',
    label: labels.fr.world,
    libraryLabel: labels.fr.worldShort,
    labelKey: 'world',
    libraryLabelKey: 'worldShort',
    pictogram: '🌍',
    gradient: 'from-violet-500 to-fuchsia-500',
    match: ['world', 'monde', 'culture', 'voyage', 'science'],
  },
];

export const LIBRARY_THEME_FILTERS = [
  {
    id: 'all',
    label: labels.fr.all,
    labelKey: 'all',
    pictogram: '⭐',
    gradient: 'from-sky-500 to-emerald-400',
    match: [],
  },
  ...CONTENT_THEMES.map((theme) => ({
    ...theme,
    label: theme.libraryLabel || theme.label,
    labelKey: theme.libraryLabelKey || theme.labelKey,
  })),
];

export const LANGUAGE_FILTERS = [
  { id: 'all', label: labels.fr.allLanguages, labelKey: 'allLanguages' },
  ...CONTENT_LANGUAGES.map((language) => ({
    id: language.id,
    label: language.shortLabel,
    labelKey: language.labelKey,
  })),
];

export function localizeContentOption(option, language) {
  if (!option) return option;
  const localized = label(language, option.labelKey);
  return {
    ...option,
    label: localized,
    libraryLabel: option.libraryLabelKey ? label(language, option.libraryLabelKey) : option.libraryLabel,
  };
}

export function localizeContentOptions(options, language) {
  return options.map((option) => localizeContentOption(option, language));
}
