import { normalizeLanguage } from '../utils/translations';
import { hubGradientAtIndex, ringAtIndex } from './brandTheme';

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

const CATEGORY_DEFS = [
  { id: 'dinosaurs', pictogram: '🦖', cue: 'Roar', match: ['dinosaur', 'dinosaure', 'dino'] },
  { id: 'space', pictogram: '🚀', cue: 'Zoom', match: ['space', 'espace', 'rocket', 'fusee', 'planete', 'planet'] },
  { id: 'animals', pictogram: '🐻', cue: 'Coucou', match: ['animal', 'animaux', 'nature'] },
  { id: 'princesses', pictogram: '👸', cue: 'Magie', match: ['princess', 'princesse', 'fairy', 'conte'] },
  { id: 'jobs', pictogram: '🚒', cue: 'Action', match: ['job', 'metier', 'doctor', 'pompier', 'teacher'] },
  { id: 'world', pictogram: '🌍', cue: 'Explore', match: ['world', 'monde', 'culture', 'voyage', 'science'] },
  { id: 'rhymes', pictogram: '🎵', cue: 'Musique', match: ['rhyme', 'comptine', 'chanson', 'musique', 'music'] },
  { id: 'alphabet', pictogram: '🔤', cue: 'ABC', match: ['alphabet', 'lettre', 'abc', 'letter'] },
  { id: 'numbers', pictogram: '🔢', cue: '123', match: ['number', 'chiffre', 'nombre', 'compter', 'math'] },
  { id: 'colors', pictogram: '🎨', cue: 'Peinture', match: ['color', 'couleur', 'peinture', 'dessin', 'art'] },
];

export const KID_CATEGORIES = CATEGORY_DEFS.map((category, index) => ({
  ...category,
  label: categoryLabels.fr[category.id][0],
  shortLabel: categoryLabels.fr[category.id][1],
  gradient: hubGradientAtIndex(index),
  ring: ringAtIndex(index),
}));

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
