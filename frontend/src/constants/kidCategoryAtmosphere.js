/**
 * Subtle category atmospheres — CSS class + decorative emoji motifs.
 * No heavy assets; presentation only.
 */

export const CATEGORY_ATMOSPHERE = {
  dinosaurs: {
    className: 'kids-cat-dino',
    motifs: ['🌿', '🦖', '🍃', '🦴'],
    tint: 'from-emerald-600/25 via-lime-500/15 to-transparent',
  },
  space: {
    className: 'kids-cat-space',
    motifs: ['⭐', '🪐', '✨', '🚀'],
    tint: 'from-indigo-900/35 via-blue-800/20 to-transparent',
  },
  animals: {
    className: 'kids-cat-animals',
    motifs: ['🐻', '🍃', '🦋', '🌸'],
    tint: 'from-amber-500/20 via-green-400/15 to-transparent',
  },
  princesses: {
    className: 'kids-cat-fairy',
    motifs: ['🏰', '✨', '☁️', '🧚'],
    tint: 'from-fuchsia-400/25 via-violet-300/15 to-transparent',
  },
  bedtime: {
    className: 'kids-cat-bedtime',
    motifs: ['🌙', '⭐', '💤', '☁️'],
    tint: 'from-indigo-800/30 via-violet-700/15 to-transparent',
  },
  ocean: {
    className: 'kids-cat-ocean',
    motifs: ['🫧', '🐟', '🌊', '🐚'],
    tint: 'from-cyan-500/25 via-blue-400/15 to-transparent',
  },
  vehicles: {
    className: 'kids-cat-vehicles',
    motifs: ['🚗', '🛤️', '🚦', '☁️'],
    tint: 'from-sky-400/20 via-orange-300/10 to-transparent',
  },
  world: {
    className: 'kids-cat-world',
    motifs: ['🌍', '🗺️', '✈️', '🌄'],
    tint: 'from-teal-500/20 via-sky-400/15 to-transparent',
  },
  colors: {
    className: 'kids-cat-colors',
    motifs: ['🎨', '🌈', '✏️', '💜'],
    tint: 'from-pink-400/20 via-yellow-300/15 to-transparent',
  },
  spirituality: {
    className: 'kids-cat-spirit',
    motifs: ['🕊️', '✨', '🌅', '🙏'],
    tint: 'from-amber-200/25 via-sky-200/15 to-transparent',
  },
  rhymes: {
    className: 'kids-cat-rhymes',
    motifs: ['🎵', '🎤', '⭐', '🎶'],
    tint: 'from-accent-400/25 via-primary-300/15 to-transparent',
  },
  alphabet: {
    className: 'kids-cat-abc',
    motifs: ['🔤', '🅰️', '📘', '✏️'],
    tint: 'from-primary-400/20 via-secondary-300/15 to-transparent',
  },
  numbers: {
    className: 'kids-cat-numbers',
    motifs: ['🔢', '1️⃣', '⭐', '🧮'],
    tint: 'from-secondary-400/20 via-accent-300/15 to-transparent',
  },
  jobs: {
    className: 'kids-cat-jobs',
    motifs: ['🚒', '🩺', '👷', '⭐'],
    tint: 'from-red-400/20 via-sky-300/15 to-transparent',
  },
};

export function getCategoryAtmosphere(categoryId) {
  return CATEGORY_ATMOSPHERE[categoryId] || {
    className: 'kids-cat-default',
    motifs: ['📚', '⭐', '✨'],
    tint: 'from-primary-400/20 via-secondary-300/10 to-transparent',
  };
}
