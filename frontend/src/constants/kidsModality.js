/**
 * Kids autonomy color-coding — stable modality tones (Vooks-style).
 * Blue = books · Yellow = audio · Teal = learn · Violet = create
 */

export const KIDS_MODALITY = {
  books: {
    id: 'books',
    tone: 'primary',
    gradient: 'from-primary-500 to-primary-700',
    activeBg: 'bg-primary-500',
    glow: 'kids-glow-books',
    shelfTint: 'text-primary-600',
    borderHover: 'hover:bg-primary-50',
  },
  audio: {
    id: 'audio',
    tone: 'accent',
    gradient: 'from-accent-400 to-accent-600',
    activeBg: 'bg-accent-500',
    glow: 'kids-glow-audio',
    shelfTint: 'text-accent-600',
    borderHover: 'hover:bg-accent-50',
  },
  learn: {
    id: 'learn',
    tone: 'secondary',
    gradient: 'from-secondary-400 to-secondary-600',
    activeBg: 'bg-secondary-500',
    glow: 'kids-glow-learn',
    shelfTint: 'text-secondary-600',
    borderHover: 'hover:bg-secondary-50',
  },
  create: {
    id: 'create',
    tone: 'violet',
    gradient: 'from-violet-400 to-primary-500',
    activeBg: 'bg-violet-500',
    glow: 'kids-glow-create',
    shelfTint: 'text-violet-600',
    borderHover: 'hover:bg-violet-50',
  },
  home: {
    id: 'home',
    tone: 'primary',
    gradient: 'from-primary-400 via-secondary-400 to-accent-300',
    activeBg: 'bg-primary-500',
    glow: 'kids-hero-glow',
    shelfTint: 'text-primary-600',
    borderHover: 'hover:bg-primary-50',
  },
  favorites: {
    id: 'favorites',
    tone: 'accent',
    gradient: 'from-accent-400 via-primary-400 to-primary-600',
    activeBg: 'bg-accent-500',
    glow: 'kids-glow-audio',
    shelfTint: 'text-accent-600',
    borderHover: 'hover:bg-accent-50',
  },
};

export function getKidsModality(id) {
  return KIDS_MODALITY[id] || KIDS_MODALITY.home;
}
