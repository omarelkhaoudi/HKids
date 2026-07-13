/**
 * HKids / Le Lit Qui Lit — identité visuelle unifiée
 * Primary (violet) · Secondary (menthe) · Accent (corail)
 */

export const BRAND_HERO_GRADIENT = 'from-primary-600 via-secondary-500 to-accent-500';

export const BRAND_HUB_GRADIENTS = [
  'from-primary-500 to-primary-700',
  'from-secondary-500 to-secondary-700',
  'from-accent-500 to-accent-700',
];

export const BRAND_QUICK_GRADIENTS = [
  'from-primary-400 to-secondary-500',
  'from-secondary-400 to-primary-500',
  'from-accent-400 to-primary-500',
  'from-primary-500 to-accent-500',
];

export const BRAND_TONES = {
  primary: {
    color: 'text-primary-700 dark:text-primary-300',
    bgColor: 'bg-primary-100 dark:bg-primary-900/40',
    borderColor: 'border-primary-200 dark:border-primary-800',
  },
  secondary: {
    color: 'text-secondary-700 dark:text-secondary-300',
    bgColor: 'bg-secondary-100 dark:bg-secondary-900/40',
    borderColor: 'border-secondary-200 dark:border-secondary-800',
  },
  accent: {
    color: 'text-accent-700 dark:text-accent-300',
    bgColor: 'bg-accent-100 dark:bg-accent-900/40',
    borderColor: 'border-accent-200 dark:border-accent-800',
  },
};

const TONE_CYCLE = ['primary', 'secondary', 'accent'];

export function toneAtIndex(index) {
  return BRAND_TONES[TONE_CYCLE[index % TONE_CYCLE.length]];
}

export function hubGradientAtIndex(index) {
  return BRAND_HUB_GRADIENTS[index % BRAND_HUB_GRADIENTS.length];
}

export function quickGradientAtIndex(index) {
  return BRAND_QUICK_GRADIENTS[index % BRAND_QUICK_GRADIENTS.length];
}

export const BRAND_FEATURE_TILES = [
  { title: 'Histoires personnalisées', desc: "Créées par IA selon l'âge, les intérêts et les valeurs de votre enfant.", icon: '📖', tone: 'primary' },
  { title: 'Éducatif et bienveillant', desc: "Développe l'empathie, la confiance et l'amour de l'apprentissage.", icon: '🎓', tone: 'secondary' },
  { title: 'Sans publicité', desc: "Un environnement sûr et sans distraction pour apprendre en s'amusant.", icon: '🛡️', tone: 'accent' },
  { title: 'Disponible partout', desc: 'Sur mobile, tablette et ordinateur, même hors connexion.', icon: '📱', tone: 'primary' },
  { title: 'Créé avec amour', desc: 'Conçu par des parents pour accompagner chaque famille.', icon: '💜', tone: 'secondary' },
  { title: 'Contrôle parental', desc: "Temps d'écran, contenus autorisés et suivi de lecture depuis votre tableau de bord.", icon: '👨‍👩‍👧', tone: 'accent' },
];
