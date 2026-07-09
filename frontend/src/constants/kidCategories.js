import { normalizeLanguage } from '../utils/translations';

const categoryLabels = {
  fr: {
    dinosaurs: ['Dinosaures', 'Dino'],
    space: ['Espace', 'Fusée'],
    animals: ['Animaux', 'Animaux'],
    princesses: ['Princesses', 'Conte'],
    jobs: ['Métiers', 'Métiers'],
    world: ['Découverte du monde', 'Monde'],
    rhymes: ['Comptines', 'Chansons'],
    alphabet: ['Alphabet', 'Lettres'],
    numbers: ['Chiffres', 'Compter'],
    colors: ['Couleurs', 'Couleurs'],
  },
  en: {
    dinosaurs: ['Dinosaurs', 'Dino'],
    space: ['Space', 'Rocket'],
    animals: ['Animals', 'Animals'],
    princesses: ['Princesses', 'Fairy tale'],
    jobs: ['Jobs', 'Jobs'],
    world: ['Discover the world', 'World'],
    rhymes: ['Rhymes', 'Songs'],
    alphabet: ['Alphabet', 'Letters'],
    numbers: ['Numbers', 'Counting'],
    colors: ['Colors', 'Colors'],
  },
  ar: {
    dinosaurs: ['ديناصورات', 'دينو'],
    space: ['الفضاء', 'صاروخ'],
    animals: ['حيوانات', 'حيوانات'],
    princesses: ['أميرات', 'حكاية'],
    jobs: ['مهن', 'مهن'],
    world: ['اكتشاف العالم', 'العالم'],
    rhymes: ['أناشيد', 'أغاني'],
    alphabet: ['الحروف', 'حروف'],
    numbers: ['الأرقام', 'العد'],
    colors: ['الألوان', 'ألوان'],
  },
};

export const KID_CATEGORIES = [
  {
    id: 'dinosaurs',
    label: categoryLabels.fr.dinosaurs[0],
    shortLabel: categoryLabels.fr.dinosaurs[1],
    pictogram: '🦖',
    cue: 'Roar',
    gradient: 'from-lime-400 via-emerald-500 to-green-600',
    ring: 'ring-lime-200',
    match: ['dinosaur', 'dinosaure', 'dino'],
  },
  {
    id: 'space',
    label: categoryLabels.fr.space[0],
    shortLabel: categoryLabels.fr.space[1],
    pictogram: '🚀',
    cue: 'Zoom',
    gradient: 'from-indigo-500 via-sky-500 to-cyan-400',
    ring: 'ring-sky-200',
    match: ['space', 'espace', 'rocket', 'fusee', 'planete', 'planet'],
  },
  {
    id: 'animals',
    label: categoryLabels.fr.animals[0],
    shortLabel: categoryLabels.fr.animals[1],
    pictogram: '🐻',
    cue: 'Coucou',
    gradient: 'from-accent-300 via-accent-400 to-rose-400',
    ring: 'ring-accent-200',
    match: ['animal', 'animaux', 'nature'],
  },
  {
    id: 'princesses',
    label: categoryLabels.fr.princesses[0],
    shortLabel: categoryLabels.fr.princesses[1],
    pictogram: '👸',
    cue: 'Magie',
    gradient: 'from-secondary-400 via-rose-500 to-fuchsia-500',
    ring: 'ring-secondary-200',
    match: ['princess', 'princesse', 'fairy', 'conte'],
  },
  {
    id: 'jobs',
    label: categoryLabels.fr.jobs[0],
    shortLabel: categoryLabels.fr.jobs[1],
    pictogram: '🚒',
    cue: 'Action',
    gradient: 'from-primary-500 via-accent-500 to-yellow-400',
    ring: 'ring-accent-200',
    match: ['job', 'metier', 'doctor', 'pompier', 'teacher'],
  },
  {
    id: 'world',
    label: categoryLabels.fr.world[0],
    shortLabel: categoryLabels.fr.world[1],
    pictogram: '🌍',
    cue: 'Explore',
    gradient: 'from-teal-400 via-primary-500 to-violet-500',
    ring: 'ring-teal-200',
    match: ['world', 'monde', 'culture', 'voyage', 'science'],
  },
  {
    id: 'rhymes',
    label: categoryLabels.fr.rhymes[0],
    shortLabel: categoryLabels.fr.rhymes[1],
    pictogram: '🎵',
    cue: 'Musique',
    gradient: 'from-pink-400 via-rose-500 to-red-500',
    ring: 'ring-pink-200',
    match: ['rhyme', 'comptine', 'chanson', 'musique', 'music'],
  },
  {
    id: 'alphabet',
    label: categoryLabels.fr.alphabet[0],
    shortLabel: categoryLabels.fr.alphabet[1],
    pictogram: '🔤',
    cue: 'ABC',
    gradient: 'from-blue-400 via-indigo-500 to-violet-600',
    ring: 'ring-blue-200',
    match: ['alphabet', 'lettre', 'abc', 'letter'],
  },
  {
    id: 'numbers',
    label: categoryLabels.fr.numbers[0],
    shortLabel: categoryLabels.fr.numbers[1],
    pictogram: '🔢',
    cue: '123',
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
    ring: 'ring-orange-200',
    match: ['number', 'chiffre', 'nombre', 'compter', 'math'],
  },
  {
    id: 'colors',
    label: categoryLabels.fr.colors[0],
    shortLabel: categoryLabels.fr.colors[1],
    pictogram: '🎨',
    cue: 'Peinture',
    gradient: 'from-fuchsia-400 via-purple-500 to-indigo-500',
    ring: 'ring-fuchsia-200',
    match: ['color', 'couleur', 'peinture', 'dessin', 'art'],
  },
];

export function localizeKidCategory(category, language) {
  if (!category) return category;
  const normalized = normalizeLanguage(language);
  const [label, shortLabel] = categoryLabels[normalized]?.[category.id]
    || categoryLabels.fr[category.id]
    || [category.label, category.shortLabel];

  return {
    ...category,
    label,
    shortLabel,
  };
}

export function localizeKidCategories(language) {
  return KID_CATEGORIES.map((category) => localizeKidCategory(category, language));
}

export function getKidCategory(categoryId, language = 'fr') {
  const category = KID_CATEGORIES.find((item) => item.id === categoryId) || null;
  return category ? localizeKidCategory(category, language) : null;
}
