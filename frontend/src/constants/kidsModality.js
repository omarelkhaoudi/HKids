/**
 * Kids autonomy color-coding — HKids modality worlds.
 * Blue = books · Orange = audio · Green = learn · Purple = create
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
    tone: 'orange',
    gradient: 'from-orange-400 to-orange-600',
    activeBg: 'bg-orange-500',
    glow: 'kids-glow-audio',
    shelfTint: 'text-orange-600',
    borderHover: 'hover:bg-orange-50',
  },
  learn: {
    id: 'learn',
    tone: 'success',
    gradient: 'from-success-400 to-success-600',
    activeBg: 'bg-success-500',
    glow: 'kids-glow-learn',
    shelfTint: 'text-success-600',
    borderHover: 'hover:bg-success-50',
  },
  create: {
    id: 'create',
    tone: 'magic',
    gradient: 'from-magic-400 to-magic-600',
    activeBg: 'bg-magic-500',
    glow: 'kids-glow-create',
    shelfTint: 'text-magic-600',
    borderHover: 'hover:bg-magic-50',
  },
  home: {
    id: 'home',
    tone: 'primary',
    gradient: 'from-primary-400 via-secondary-400 to-orange-300',
    activeBg: 'bg-primary-500',
    glow: 'kids-hero-glow',
    shelfTint: 'text-primary-600',
    borderHover: 'hover:bg-primary-50',
  },
  favorites: {
    id: 'favorites',
    tone: 'orange',
    gradient: 'from-orange-400 via-primary-400 to-primary-600',
    activeBg: 'bg-orange-500',
    glow: 'kids-glow-audio',
    shelfTint: 'text-orange-600',
    borderHover: 'hover:bg-orange-50',
  },
};

export function getKidsModality(id) {
  return KIDS_MODALITY[id] || KIDS_MODALITY.home;
}
