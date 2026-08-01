/**
 * Subtle category atmospheres — CSS class + decorative emoji motifs.
 * No heavy assets; presentation only.
 */

export const CATEGORY_ATMOSPHERE = {
  dinosaurs: {
    className: 'kids-cat-dino',
    motifs: ['🌿', '🦖', '🍃', '🦴'],
    tint: 'from-hkids-green-dark/25 via-hkids-green/15 to-transparent',
  },
  space: {
    className: 'kids-cat-space',
    motifs: ['⭐', '🪐', '✨', '🚀'],
    tint: 'from-primary-900/35 via-primary-800/20 to-transparent',
  },
  animals: {
    className: 'kids-cat-animals',
    motifs: ['🐻', '🍃', '🦋', '🌸'],
    tint: 'from-hkids-brown/20 via-hkids-green/15 to-transparent',
  },
  princesses: {
    className: 'kids-cat-fairy',
    motifs: ['🏰', '✨', '☁️', '🧚'],
    tint: 'from-hkids-brown/25 via-hkids-brown-light/15 to-transparent',
  },
  bedtime: {
    className: 'kids-cat-bedtime',
    motifs: ['🌙', '⭐', '💤', '☁️'],
    tint: 'from-hkids-green-darker/30 via-hkids-brown-dark/15 to-transparent',
  },
  ocean: {
    className: 'kids-cat-ocean',
    motifs: ['🫧', '🐟', '🌊', '🐚'],
    tint: 'from-primary-500/25 via-primary-400/15 to-transparent',
  },
  vehicles: {
    className: 'kids-cat-vehicles',
    motifs: ['🚗', '🛤️', '🚦', '☁️'],
    tint: 'from-hkids-green/20 via-hkids-brown-light/10 to-transparent',
  },
  world: {
    className: 'kids-cat-world',
    motifs: ['🌍', '🗺️', '✈️', '🌄'],
    tint: 'from-hkids-green/20 via-hkids-green/15 to-transparent',
  },
  colors: {
    className: 'kids-cat-colors',
    motifs: ['🎨', '🌈', '✏️', '💜'],
    tint: 'from-hkids-brown/20 via-hkids-brown-light/15 to-transparent',
  },
  spirituality: {
    className: 'kids-cat-spirit',
    motifs: ['🕊️', '✨', '🌅', '🙏'],
    tint: 'from-hkids-brown-light/25 via-hkids-green-light/15 to-transparent',
  },
  rhymes: {
    className: 'kids-cat-rhymes',
    motifs: ['🎵', '🎤', '⭐', '🎶'],
    tint: 'from-hkids-brown/25 via-primary-300/15 to-transparent',
  },
  alphabet: {
    className: 'kids-cat-abc',
    motifs: ['🔤', '🅰️', '📘', '✏️'],
    tint: 'from-primary-400/20 via-secondary-300/15 to-transparent',
  },
  numbers: {
    className: 'kids-cat-numbers',
    motifs: ['🔢', '1️⃣', '⭐', '🧮'],
    tint: 'from-secondary-400/20 via-hkids-brown/15 to-transparent',
  },
  jobs: {
    className: 'kids-cat-jobs',
    motifs: ['🚒', '🩺', '👷', '⭐'],
    tint: 'from-hkids-brown/20 via-hkids-green-light/15 to-transparent',
  },
};

export function getCategoryAtmosphere(categoryId) {
  return CATEGORY_ATMOSPHERE[categoryId] || {
    className: 'kids-cat-default',
    motifs: ['📚', '⭐', '✨'],
    tint: 'from-primary-400/20 via-secondary-300/10 to-transparent',
  };
}
