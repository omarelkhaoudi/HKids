import { deriveBookTheme } from './bookCover';

/** Soft emotional atmospheres — desaturated, calm (Quiet Wonder). */
const THEME_TO_MOOD = {
  animals: 'golden',
  world: 'forest',
  nature: 'forest',
  ocean: 'ocean',
  bedtime: 'night',
  spiritual: 'night',
  princesses: 'fairy',
  magic: 'fairy',
  space: 'twilight',
  dinosaurs: 'earth',
  colors: 'fairy',
  rhymes: 'golden',
  jobs: 'golden',
  alphabet: 'golden',
  numbers: 'golden',
};

/** Desaturated ambient tints derived from story mood (cover theme). */
export const MOOD_AMBIENT = {
  warm: { a: '#e8dcc8', b: '#d4c4a8' },
  forest: { a: '#c8d8c4', b: '#9eb89a' },
  ocean: { a: '#c4d8e4', b: '#9eb8cc' },
  night: { a: '#3a4660', b: '#2a3448' },
  fairy: { a: '#dcd0ec', b: '#c4b4dc' },
  golden: { a: '#e8dcb8', b: '#d4c088' },
  twilight: { a: '#b8c0d8', b: '#9098b8' },
  earth: { a: '#dcd0c0', b: '#c0b098' },
};

export function deriveReaderMood(book = {}) {
  const theme = deriveBookTheme(book);
  return THEME_TO_MOOD[theme] || 'warm';
}

export function getReaderAmbientStyle(mood = 'warm') {
  const colors = MOOD_AMBIENT[mood] || MOOD_AMBIENT.warm;
  return {
    '--reader-ambient-a': colors.a,
    '--reader-ambient-b': colors.b,
  };
}

export default deriveReaderMood;
