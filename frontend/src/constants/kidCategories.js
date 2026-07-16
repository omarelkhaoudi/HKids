import { normalizeLanguage } from '../utils/translations';
import { hubGradientAtIndex, ringAtIndex } from './brandTheme';

const categoryLabels = {
  fr: {
    dinosaurs: ['Dinosaures', 'Dino'],
    space: ['Espace', 'Fusée'],
    animals: ['Animaux', 'Animaux'],
    princesses: ['Contes', 'Conte'],
    jobs: ['Métiers', 'Métiers'],
    world: ['Découverte du monde', 'Monde'],
    bedtime: ['Avant de dormir', 'Dodo'],
    spirituality: ['Spiritualité', 'Foi'],
    ocean: ['Océan', 'Mer'],
    vehicles: ['Véhicules', 'Roule'],
    rhymes: ['Comptines', 'Chansons'],
    alphabet: ['Alphabet', 'Lettres'],
    numbers: ['Chiffres', 'Compter'],
    colors: ['Créativité', 'Couleurs'],
  },
  en: {
    dinosaurs: ['Dinosaurs', 'Dino'],
    space: ['Space', 'Rocket'],
    animals: ['Animals', 'Animals'],
    princesses: ['Fairy tales', 'Tale'],
    jobs: ['Jobs', 'Jobs'],
    world: ['Discover the world', 'World'],
    bedtime: ['Bedtime', 'Sleep'],
    spirituality: ['Spirituality', 'Faith'],
    ocean: ['Ocean', 'Sea'],
    vehicles: ['Vehicles', 'Go'],
    rhymes: ['Rhymes', 'Songs'],
    alphabet: ['Alphabet', 'Letters'],
    numbers: ['Numbers', 'Counting'],
    colors: ['Creativity', 'Colors'],
  },
  ar: {
    dinosaurs: ['ديناصورات', 'دينو'],
    space: ['الفضاء', 'صاروخ'],
    animals: ['حيوانات', 'حيوانات'],
    princesses: ['حكايات', 'حكاية'],
    jobs: ['مهن', 'مهن'],
    world: ['اكتشاف العالم', 'العالم'],
    bedtime: ['قبل النوم', 'نوم'],
    spirituality: ['روحانية', 'إيمان'],
    ocean: ['المحيط', 'بحر'],
    vehicles: ['مركبات', 'انطلق'],
    rhymes: ['أناشيد', 'أغاني'],
    alphabet: ['الحروف', 'حروف'],
    numbers: ['الأرقام', 'العد'],
    colors: ['إبداع', 'ألوان'],
  },
};

const CATEGORY_DEFS = [
  { id: 'dinosaurs', pictogram: '🦖', cue: 'Roar', match: ['dinosaur', 'dinosaure', 'dino'] },
  { id: 'space', pictogram: '🚀', cue: 'Zoom', match: ['space', 'espace', 'rocket', 'fusee', 'planete', 'planet'] },
  { id: 'animals', pictogram: '🐻', cue: 'Coucou', match: ['animal', 'animaux', 'nature'] },
  { id: 'princesses', pictogram: '🧚', cue: 'Magie', match: ['princess', 'princesse', 'fairy', 'conte', 'tale'] },
  { id: 'bedtime', pictogram: '🌙', cue: 'Dodo', match: ['bedtime', 'sleep', 'dormir', 'nuit', 'coucher', 'dodo'] },
  { id: 'spirituality', pictogram: '🙏', cue: 'Paix', match: ['spiritual', 'spiritualite', 'religion', 'foi', 'faith', 'prayer'] },
  { id: 'ocean', pictogram: '🌊', cue: 'Plouf', match: ['ocean', 'mer', 'sea', 'poisson', 'fish', 'plage'] },
  { id: 'vehicles', pictogram: '🚗', cue: 'Vroum', match: ['vehicle', 'vehicule', 'train', 'voiture', 'car', 'truck'] },
  { id: 'world', pictogram: '🌍', cue: 'Explore', match: ['world', 'monde', 'culture', 'voyage', 'science'] },
  { id: 'colors', pictogram: '🎨', cue: 'Peinture', match: ['color', 'couleur', 'peinture', 'dessin', 'art', 'creativ'] },
  { id: 'rhymes', pictogram: '🎵', cue: 'Musique', match: ['rhyme', 'comptine', 'chanson', 'musique', 'music'] },
  { id: 'alphabet', pictogram: '🔤', cue: 'ABC', match: ['alphabet', 'lettre', 'abc', 'letter'] },
  { id: 'numbers', pictogram: '🔢', cue: '123', match: ['number', 'chiffre', 'nombre', 'compter', 'math'] },
  { id: 'jobs', pictogram: '🚒', cue: 'Action', match: ['job', 'metier', 'doctor', 'pompier', 'teacher'] },
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
