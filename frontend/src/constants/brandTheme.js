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

export const BRAND_SOFT_SURFACES = [
  'bg-primary-50',
  'bg-secondary-50',
  'bg-accent-50',
  'bg-primary-50/70',
];

export const BRAND_METRIC_TONES = [
  { bg: 'bg-primary-50', text: 'text-primary-600' },
  { bg: 'bg-secondary-50', text: 'text-secondary-600' },
  { bg: 'bg-accent-50', text: 'text-accent-600' },
  { bg: 'bg-primary-100', text: 'text-primary-700' },
];

export const BRAND_SEMANTIC = {
  success: { bg: 'bg-secondary-50', text: 'text-secondary-700', solid: 'bg-secondary-500', border: 'border-secondary-200' },
  warning: { bg: 'bg-accent-50', text: 'text-accent-700', solid: 'bg-accent-500', border: 'border-accent-200' },
  danger: { bg: 'bg-danger-50', text: 'text-danger-700', solid: 'bg-danger-500', border: 'border-danger-200' },
  info: { bg: 'bg-primary-50', text: 'text-primary-700', solid: 'bg-primary-500', border: 'border-primary-200' },
};

export const BRAND_CONFETTI = ['bg-primary-500', 'bg-secondary-500', 'bg-accent-500', 'bg-primary-400', 'bg-secondary-400'];

export function softSurfaceAtIndex(index) {
  return BRAND_SOFT_SURFACES[index % BRAND_SOFT_SURFACES.length];
}

export function metricToneAtIndex(index) {
  return BRAND_METRIC_TONES[index % BRAND_METRIC_TONES.length];
}

/** Gradients thématiques pour couvertures d'histoires (cycle brand) */
export const BRAND_STORY_GRADIENTS = [
  'from-primary-600 to-primary-800',
  'from-secondary-600 to-secondary-800',
  'from-accent-600 to-accent-800',
  'from-primary-500 to-secondary-700',
  'from-secondary-500 to-accent-700',
  'from-accent-500 to-primary-700',
  'from-primary-600 to-accent-800',
  'from-secondary-600 to-primary-800',
];

export function storyGradientAtIndex(index) {
  return BRAND_STORY_GRADIENTS[index % BRAND_STORY_GRADIENTS.length];
}

export function ringAtIndex(index) {
  return toneAtIndex(index).borderColor.replace('border-', 'ring-');
}
