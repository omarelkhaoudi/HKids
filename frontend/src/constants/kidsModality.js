/**
 * Kids modality worlds — calm single-hue atmospheres.
 * Blue = books · Soft peach/orange = audio · Soft green = learn · Soft lavender = create
 */

export const KIDS_MODALITY = {
  books: {
    id: 'books',
    tone: 'primary',
    gradient: 'from-primary-500 to-primary-700',
    activeBg: 'bg-primary-500',
    glow: 'kids-glow-books',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-primary-50',
  },
  audio: {
    id: 'audio',
    tone: 'orange',
    gradient: 'from-orange-300 to-orange-500',
    activeBg: 'bg-orange-400',
    glow: 'kids-glow-audio',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-orange-50',
  },
  learn: {
    id: 'learn',
    tone: 'success',
    gradient: 'from-success-400 to-success-600',
    activeBg: 'bg-success-500',
    glow: 'kids-glow-learn',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-success-50',
  },
  create: {
    id: 'create',
    tone: 'magic',
    gradient: 'from-magic-300 to-magic-500',
    activeBg: 'bg-magic-500',
    glow: 'kids-glow-create',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-magic-50',
  },
  home: {
    id: 'home',
    tone: 'primary',
    gradient: 'from-primary-500 to-primary-700',
    activeBg: 'bg-primary-500',
    glow: 'kids-hero-glow',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-primary-50',
  },
  favorites: {
    id: 'favorites',
    tone: 'orange',
    gradient: 'from-orange-300 to-orange-500',
    activeBg: 'bg-orange-400',
    glow: 'kids-glow-audio',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-orange-50',
  },
};

export function getKidsModality(id) {
  return KIDS_MODALITY[id] || KIDS_MODALITY.home;
}
