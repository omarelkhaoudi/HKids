export const KID_CATEGORIES = [
  {
    id: 'dinosaurs',
    label: 'Dinosaures',
    pictogram: '🦖',
    gradient: 'from-lime-400 via-emerald-500 to-green-600',
    ring: 'ring-lime-200',
  },
  {
    id: 'space',
    label: 'Espace',
    pictogram: '🚀',
    gradient: 'from-indigo-500 via-sky-500 to-cyan-400',
    ring: 'ring-sky-200',
  },
  {
    id: 'animals',
    label: 'Animaux',
    pictogram: '🐻',
    gradient: 'from-amber-300 via-orange-400 to-rose-400',
    ring: 'ring-amber-200',
  },
  {
    id: 'princesses',
    label: 'Princesses',
    pictogram: '👸',
    gradient: 'from-pink-400 via-rose-500 to-fuchsia-500',
    ring: 'ring-pink-200',
  },
  {
    id: 'jobs',
    label: 'Metiers',
    pictogram: '🚒',
    gradient: 'from-red-500 via-orange-500 to-yellow-400',
    ring: 'ring-orange-200',
  },
  {
    id: 'world',
    label: 'Decouverte du monde',
    pictogram: '🌍',
    gradient: 'from-teal-400 via-blue-500 to-violet-500',
    ring: 'ring-teal-200',
  },
];

export function getKidCategory(categoryId) {
  return KID_CATEGORIES.find((category) => category.id === categoryId) || null;
}
