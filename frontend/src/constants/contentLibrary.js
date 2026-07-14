import { normalizeLanguage } from '../utils/translations';

const categoryLabels = {
  fr: {
    stories: ['Histoires', 'Récits audio et livres illustrés.'],
    education: ['Éducation', 'Contenus pour apprendre et découvrir.'],
    entertainment: ['Divertissement', 'Comptines et contenus ludiques.'],
    allAges: 'Tous les âges',
  },
  en: {
    stories: ['Stories', 'Audio tales and illustrated books.'],
    education: ['Education', 'Content to learn and discover.'],
    entertainment: ['Entertainment', 'Rhymes and playful content.'],
    allAges: 'All ages',
  },
  ar: {
    stories: ['قصص', 'حكايات صوتية وكتب مصورة.'],
    education: ['تعليم', 'محتوى للتعلم والاكتشاف.'],
    entertainment: ['ترفيه', 'أناشيد ومحتوى ممتع.'],
    allAges: 'كل الأعمار',
  },
};

export const CONTENT_LIBRARY_CATEGORIES = [
  {
    id: 'stories',
    label: categoryLabels.fr.stories[0],
    description: categoryLabels.fr.stories[1],
    pictogram: '📚',
    gradient: 'from-primary-500 via-secondary-500 to-accent-400',
    contentTypes: ['story', 'audio_story'],
  },
  {
    id: 'education',
    label: categoryLabels.fr.education[0],
    description: categoryLabels.fr.education[1],
    pictogram: '🎓',
    gradient: 'from-primary-500 via-primary-500 to-secondary-400',
    contentTypes: ['educational', 'quiz'],
  },
  {
    id: 'entertainment',
    label: categoryLabels.fr.entertainment[0],
    description: categoryLabels.fr.entertainment[1],
    pictogram: '🎵',
    gradient: 'from-primary-500 via-primary-500 to-rose-400',
    contentTypes: ['song'],
  },
];

export const CONTENT_AGE_FILTERS = [
  { id: 'all', label: categoryLabels.fr.allAges, labelKey: 'allAges', value: '' },
  { id: '0-3', label: '0-3 ans', value: '2' },
  { id: '4-6', label: '4-6 ans', value: '5' },
  { id: '7-9', label: '7-9 ans', value: '8' },
  { id: '10-12', label: '10-12 ans', value: '11' },
];

export function localizeContentLibraryCategory(category, language) {
  if (!category) return category;
  const normalized = normalizeLanguage(language);
  const [label, description] = categoryLabels[normalized]?.[category.id]
    || categoryLabels.fr[category.id]
    || [category.label, category.description];

  return {
    ...category,
    label,
    description,
  };
}

export function localizeContentLibraryCategories(language) {
  return CONTENT_LIBRARY_CATEGORIES.map((category) => localizeContentLibraryCategory(category, language));
}

export function localizeContentAgeFilters(language) {
  const normalized = normalizeLanguage(language);
  return CONTENT_AGE_FILTERS.map((filter) => ({
    ...filter,
    label: filter.labelKey ? (categoryLabels[normalized]?.[filter.labelKey] || categoryLabels.fr[filter.labelKey]) : filter.label,
  }));
}

export function getContentLibraryCategory(categoryId, language = 'fr') {
  const category = CONTENT_LIBRARY_CATEGORIES.find((item) => item.id === categoryId) || null;
  return category ? localizeContentLibraryCategory(category, language) : null;
}

export function getCategoryForContent(content, language = 'fr') {
  const category = CONTENT_LIBRARY_CATEGORIES.find((item) =>
    item.contentTypes.includes(content.content_type || 'story')
  ) || CONTENT_LIBRARY_CATEGORIES[0];

  return localizeContentLibraryCategory(category, language);
}
