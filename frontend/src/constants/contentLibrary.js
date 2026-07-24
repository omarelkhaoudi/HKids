import { normalizeLanguage } from '../utils/translations';
import { AGE_GROUPS, ALL_AGES_ID, formatAgeGroupLabel } from './ageGroups';

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

/** Derived from official AGE_GROUPS — never hardcode separate ranges. */
export const CONTENT_AGE_FILTERS = [
  { id: ALL_AGES_ID, labelKey: 'allAges', value: '' },
  ...AGE_GROUPS.map((group) => ({
    id: group.id,
    label: formatAgeGroupLabel(group, 'fr'),
    value: group.id,
    emoji: group.emoji,
  })),
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
  return CONTENT_AGE_FILTERS.map((filter) => {
    if (filter.id === ALL_AGES_ID || filter.labelKey === 'allAges') {
      return {
        ...filter,
        label: categoryLabels[normalized]?.allAges || categoryLabels.fr.allAges,
      };
    }
    const group = AGE_GROUPS.find((item) => item.id === filter.id);
    return {
      ...filter,
      label: group ? formatAgeGroupLabel(group, normalized) : filter.label,
    };
  });
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
