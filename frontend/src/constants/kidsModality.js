/**
 * Kids modality worlds — calm single-hue atmospheres.
 * HKids sage = books/learn · HKids beige-brown = audio/create
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
    gradient: 'from-hkids-brown-light to-hkids-brown',
    activeBg: 'bg-hkids-brown',
    glow: 'kids-glow-audio',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-hkids-brown-soft',
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
    gradient: 'from-hkids-brown to-hkids-brown',
    activeBg: 'bg-hkids-brown',
    glow: 'kids-glow-create',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-hkids-brown-soft',
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
    gradient: 'from-hkids-brown-light to-hkids-brown',
    activeBg: 'bg-hkids-brown',
    glow: 'kids-glow-audio',
    shelfTint: 'text-foreground',
    borderHover: 'hover:bg-hkids-brown-soft',
  },
};

export function getKidsModality(id) {
  return KIDS_MODALITY[id] || KIDS_MODALITY.home;
}
