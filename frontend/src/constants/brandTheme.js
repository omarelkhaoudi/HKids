/**
 * HKids visual identity — calm premium children's library
 * One dominant hue + soft accent per surface. Covers carry the color.
 */

export const BRAND_HERO_GRADIENT = 'from-primary-500 to-primary-700';

export const BRAND_HUB_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-primary-500 to-primary-700',
  'from-primary-300 to-primary-500',
  'from-primary-400 to-primary-700',
  'from-primary-500 to-primary-600',
  'from-primary-400 to-primary-500',
];

export const BRAND_QUICK_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-primary-500 to-primary-700',
  'from-hkids-brown-light to-hkids-brown',
  'from-hkids-brown to-hkids-brown',
  'from-primary-400 to-primary-600',
  'from-hkids-brown to-hkids-brown',
];

export const BRAND_TONES = {
  primary: {
    color: 'text-primary-700 dark:text-primary-300',
    bgColor: 'bg-primary-50 dark:bg-primary-900/40',
    borderColor: 'border-primary-200 dark:border-primary-800',
  },
  secondary: {
    color: 'text-secondary-800 dark:text-secondary-300',
    bgColor: 'bg-secondary-50 dark:bg-secondary-900/40',
    borderColor: 'border-secondary-200 dark:border-secondary-800',
  },
  accent: {
    color: 'text-hkids-brown-dark dark:text-hkids-brown-light',
    bgColor: 'bg-hkids-brown-soft dark:bg-hkids-brown-darker/40',
    borderColor: 'border-hkids-brown-light dark:border-hkids-brown-darker',
  },
  orange: {
    color: 'text-hkids-brown-dark dark:text-hkids-brown-light',
    bgColor: 'bg-hkids-brown-soft dark:bg-hkids-brown-darker/40',
    borderColor: 'border-hkids-brown-light dark:border-hkids-brown-darker',
  },
  success: {
    color: 'text-success-700 dark:text-success-300',
    bgColor: 'bg-success-50 dark:bg-success-900/40',
    borderColor: 'border-success-200 dark:border-success-800',
  },
  magic: {
    color: 'text-hkids-brown-dark dark:text-hkids-brown',
    bgColor: 'bg-hkids-brown-soft dark:bg-hkids-brown-darker/40',
    borderColor: 'border-hkids-brown-light dark:border-hkids-brown-darker',
  },
};

const TONE_CYCLE = ['primary', 'primary', 'primary', 'orange', 'magic'];

export function toneAtIndex(index) {
  return BRAND_TONES[TONE_CYCLE[index % TONE_CYCLE.length]];
}

export function hubGradientAtIndex(index) {
  return BRAND_HUB_GRADIENTS[index % BRAND_HUB_GRADIENTS.length];
}

export function quickGradientAtIndex(index) {
  return BRAND_QUICK_GRADIENTS[index % BRAND_QUICK_GRADIENTS.length];
}

const FEATURE_TILE_LABELS = {
  fr: [
    { title: 'Histoires personnalisées', desc: "Créées par IA selon l'âge, les intérêts et les valeurs de votre enfant." },
    { title: 'Apprentissage ludique', desc: 'Jeux et activités pour progresser en s\'amusant.' },
    { title: 'Contrôle parental', desc: 'Temps d\'écran, contenu validé et suivi depuis le tableau de bord.' },
    { title: 'Lecture partout', desc: 'Mobile, tablette et hors-ligne pour les trajets.' },
    { title: 'Magie créative', desc: 'Studio d\'histoires pour inventer ensemble.' },
    { title: 'Fait avec amour', desc: 'Conçu par des parents pour accompagner chaque famille.' },
  ],
  en: [
    { title: 'Personalized stories', desc: 'AI-made for your child’s age, interests, and values.' },
    { title: 'Playful learning', desc: 'Games and activities that make progress fun.' },
    { title: 'Parental controls', desc: 'Screen time, approved content, and reading progress.' },
    { title: 'Read anywhere', desc: 'Mobile, tablet, and offline for every trip.' },
    { title: 'Creative magic', desc: 'A story studio to invent together.' },
    { title: 'Made with love', desc: 'Designed by parents for every family.' },
  ],
  ar: [
    { title: 'قصص مخصصة', desc: 'مُنشأة بالذكاء الاصطناعي حسب العمر والاهتمامات.' },
    { title: 'تعلّم مرح', desc: 'ألعاب وأنشطة للتقدّم بمتعة.' },
    { title: 'رقابة أبوية', desc: 'وقت الشاشة والمحتوى المعتمد ومتابعة القراءة.' },
    { title: 'اقرأ في أي مكان', desc: 'هاتف وتابلت ودون اتصال.' },
    { title: 'سحر إبداعي', desc: 'استوديو قصص للاختراع معاً.' },
    { title: 'صُنع بحب', desc: 'صممه آباء لمرافقة كل عائلة.' },
  ],
};

const FEATURE_TILE_META = [
  { icon: '📖', tone: 'primary' },
  { icon: '🎓', tone: 'success' },
  { icon: '🛡️', tone: 'orange' },
  { icon: '📱', tone: 'primary' },
  { icon: '✨', tone: 'magic' },
  { icon: '👨‍👩‍👧', tone: 'secondary' },
];

export const BRAND_FEATURE_TILES = FEATURE_TILE_META.map((meta, i) => ({
  ...meta,
  ...FEATURE_TILE_LABELS.fr[i],
}));

export function localizeFeatureTiles(language = 'fr') {
  const lang = ['en', 'ar'].includes(language) ? language : 'fr';
  return FEATURE_TILE_META.map((meta, i) => ({
    ...meta,
    ...(FEATURE_TILE_LABELS[lang]?.[i] || FEATURE_TILE_LABELS.fr[i]),
  }));
}

export const BRAND_SOFT_SURFACES = [
  'bg-primary-50',
  'bg-surface-100',
  'bg-hkids-brown-soft',
  'bg-primary-50',
  'bg-hkids-brown-soft',
];

export const BRAND_METRIC_TONES = [
  { bg: 'bg-primary-50', text: 'text-primary-600' },
  { bg: 'bg-surface-100', text: 'text-foreground-secondary' },
  { bg: 'bg-hkids-brown-soft', text: 'text-hkids-brown-dark' },
  { bg: 'bg-success-50', text: 'text-success-600' },
  { bg: 'bg-hkids-brown-soft', text: 'text-hkids-brown-dark' },
];

export const BRAND_SEMANTIC = {
  success: { bg: 'bg-success-50', text: 'text-success-700', solid: 'bg-success-500', border: 'border-success-200' },
  warning: { bg: 'bg-secondary-50', text: 'text-secondary-800', solid: 'bg-secondary-500', border: 'border-secondary-200' },
  danger: { bg: 'bg-danger-50', text: 'text-danger-700', solid: 'bg-danger-500', border: 'border-danger-200' },
  info: { bg: 'bg-primary-50', text: 'text-primary-700', solid: 'bg-primary-500', border: 'border-primary-200' },
};

export const BRAND_CONFETTI = [
  'bg-primary-400',
  'bg-primary-500',
  'bg-hkids-brown',
  'bg-hkids-brown',
  'bg-primary-300',
];

export function softSurfaceAtIndex(index) {
  return BRAND_SOFT_SURFACES[index % BRAND_SOFT_SURFACES.length];
}

export function metricToneAtIndex(index) {
  return BRAND_METRIC_TONES[index % BRAND_METRIC_TONES.length];
}

/** Soft placeholder covers when no art — monochrome library blues with rare accents */
export const BRAND_STORY_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-primary-500 to-primary-700',
  'from-primary-300 to-primary-500',
  'from-primary-400 to-primary-700',
  'from-hkids-brown to-hkids-brown',
  'from-hkids-brown-light to-hkids-brown',
  'from-primary-500 to-primary-600',
  'from-primary-400 to-primary-500',
];

export function storyGradientAtIndex(index) {
  return BRAND_STORY_GRADIENTS[index % BRAND_STORY_GRADIENTS.length];
}

export function ringAtIndex(index) {
  return toneAtIndex(index).borderColor.replace('border-', 'ring-');
}
