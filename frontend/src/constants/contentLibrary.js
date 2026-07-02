export const CONTENT_LIBRARY_CATEGORIES = [
  {
    id: 'stories',
    label: 'Histoires',
    description: 'Recits audio et livres illustres.',
    pictogram: '📚',
    gradient: 'from-red-500 via-pink-500 to-orange-400',
    contentTypes: ['story', 'audio_story'],
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Contenus pour apprendre et decouvrir.',
    pictogram: '🎓',
    gradient: 'from-sky-500 via-cyan-500 to-emerald-400',
    contentTypes: ['educational', 'quiz'],
  },
  {
    id: 'entertainment',
    label: 'Divertissement',
    description: 'Comptines et contenus ludiques.',
    pictogram: '🎵',
    gradient: 'from-violet-500 via-fuchsia-500 to-rose-400',
    contentTypes: ['song'],
  },
];

export const CONTENT_AGE_FILTERS = [
  { id: 'all', label: 'Tous les ages', value: '' },
  { id: '0-3', label: '0-3 ans', value: '2' },
  { id: '4-6', label: '4-6 ans', value: '5' },
  { id: '7-9', label: '7-9 ans', value: '8' },
  { id: '10-12', label: '10-12 ans', value: '11' },
];

export function getContentLibraryCategory(categoryId) {
  return CONTENT_LIBRARY_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function getCategoryForContent(content) {
  return CONTENT_LIBRARY_CATEGORIES.find((category) =>
    category.contentTypes.includes(content.content_type || 'story')
  ) || CONTENT_LIBRARY_CATEGORIES[0];
}
