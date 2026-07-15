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

const FEATURE_TILE_LABELS = {
  fr: [
    { title: 'Histoires personnalisées', desc: "Créées par IA selon l'âge, les intérêts et les valeurs de votre enfant." },
    { title: 'Éducatif et bienveillant', desc: "Développe l'empathie, la confiance et l'amour de l'apprentissage." },
    { title: 'Sans publicité', desc: "Un environnement sûr et sans distraction pour apprendre en s'amusant." },
    { title: 'Disponible partout', desc: 'Sur mobile, tablette et ordinateur, même hors connexion.' },
    { title: 'Créé avec amour', desc: 'Conçu par des parents pour accompagner chaque famille.' },
    { title: 'Contrôle parental', desc: "Temps d'écran, contenus autorisés et suivi de lecture depuis votre tableau de bord." },
  ],
  en: [
    { title: 'Personalized stories', desc: 'AI-created based on your child\'s age, interests and values.' },
    { title: 'Educational & caring', desc: 'Develops empathy, confidence and a love of learning.' },
    { title: 'Ad-free', desc: 'A safe, distraction-free environment for learning through fun.' },
    { title: 'Available everywhere', desc: 'On mobile, tablet and computer, even offline.' },
    { title: 'Made with love', desc: 'Designed by parents to support every family.' },
    { title: 'Parental controls', desc: 'Screen time, approved content and reading tracking from your dashboard.' },
  ],
  ar: [
    { title: 'قصص مخصصة', desc: 'أُنشئت بالذكاء الاصطناعي حسب عمر طفلك واهتماماته وقيمه.' },
    { title: 'تعليمي ورعاية', desc: 'ينمّي التعاطف والثقة وحب التعلم.' },
    { title: 'بدون إعلانات', desc: 'بيئة آمنة وخالية من التشتت للتعلم بمرح.' },
    { title: 'متاح في كل مكان', desc: 'على الهاتف والجهاز اللوحي والكمبيوتر، حتى بدون اتصال.' },
    { title: 'صُنع بحب', desc: 'صممه آباء لمرافقة كل عائلة.' },
    { title: 'رقابة أبوية', desc: 'وقت الشاشة والمحتوى المعتمد ومتابعة القراءة من لوحة التحكم.' },
  ],
};

const FEATURE_TILE_META = [
  { icon: '📖', tone: 'primary' },
  { icon: '🎓', tone: 'secondary' },
  { icon: '🛡️', tone: 'accent' },
  { icon: '📱', tone: 'primary' },
  { icon: '💜', tone: 'secondary' },
  { icon: '👨‍👩‍👧', tone: 'accent' },
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
