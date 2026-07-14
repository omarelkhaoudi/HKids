import { normalizeLanguage } from '../utils/translations';
import { hubGradientAtIndex } from './brandTheme';

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

const THEME_DEFS = [
  { id: 'dinosaurs', labelKey: 'dinosaurs', pictogram: '🦖', match: ['dinosaur', 'dinosaure', 'dino'] },
  { id: 'space', labelKey: 'space', pictogram: '🚀', match: ['space', 'espace', 'rocket', 'planete', 'planet'] },
  { id: 'animals', labelKey: 'animals', pictogram: '🐻', match: ['animal', 'animaux', 'nature'] },
  { id: 'princesses', labelKey: 'princesses', pictogram: '👸', match: ['princess', 'princesse', 'fairy', 'conte'] },
  { id: 'jobs', labelKey: 'jobs', pictogram: '🚒', match: ['job', 'metier', 'doctor', 'pompier', 'teacher'] },
  {
    id: 'world',
    labelKey: 'world',
    libraryLabelKey: 'worldShort',
    pictogram: '🌍',
    match: ['world', 'monde', 'culture', 'voyage', 'science'],
  },
];

export const CONTENT_THEMES = THEME_DEFS.map((theme, index) => ({
  ...theme,
  label: labels.fr[theme.labelKey],
  libraryLabel: theme.libraryLabelKey ? labels.fr[theme.libraryLabelKey] : undefined,
  gradient: hubGradientAtIndex(index),
}));

export const LIBRARY_THEME_FILTERS = [
  {
    id: 'all',
    label: labels.fr.all,
    labelKey: 'all',
    pictogram: '⭐',
    gradient: hubGradientAtIndex(0),
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
