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

export function deriveReaderMood(book = {}) {
  const theme = deriveBookTheme(book);
  return THEME_TO_MOOD[theme] || 'warm';
}

export default deriveReaderMood;
