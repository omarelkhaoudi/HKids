import { getImageUrl } from './imageUrl';

/**
 * Local illustrated covers live in `frontend/public/books/covers/`.
 *
 * Replace forever with one file drop:
 *   frontend/public/books/covers/{slug}.webp
 */
export const LOCAL_BOOK_COVERS_BASE = '/books/covers';

const ILLUSTRATED_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

const THEME_ALIASES = {
  dinosaurs: 'dinosaurs',
  dino: 'dinosaurs',
  space: 'space',
  animals: 'animals',
  animal: 'animals',
  bedtime: 'bedtime',
  night: 'bedtime',
  sleep: 'bedtime',
  spiritual: 'bedtime',
  spirituality: 'bedtime',
  faith: 'bedtime',
  religious: 'bedtime',
  princesses: 'princesses',
  princess: 'princesses',
  magic: 'princesses',
  colors: 'colors',
  colour: 'colors',
  world: 'world',
  nature: 'world',
  garden: 'alphabet',
  ocean: 'ocean',
  sea: 'ocean',
  jobs: 'jobs',
  alphabet: 'alphabet',
  numbers: 'numbers',
  shapes: 'numbers',
  rhymes: 'rhymes',
  song: 'rhymes',
  comptine: 'rhymes',
  vehicles: 'jobs',
};

/** Titles on /stories mapped to theme packs (no seed SVG). */
const TITLE_THEME_HINTS = [
  [/ange|angel|veille|gratitude|spiritual/i, 'bedtime'],
  [/poisson|fish|baleine|whale/i, 'ocean'],
  [/tap tap|mains|clap|comptine|chanson|soleil/i, 'rhymes'],
  [/vache|cow|chat|animal|chien|oiseau|abeille|poule/i, 'animals'],
  [/vent|feuille|fleur|jardin|nature/i, 'world'],
  [/dino|dinosaur/i, 'dinosaurs'],
  [/lune|étoile|etoile|space|fusée|fusee/i, 'space'],
  [/princesse|dragon|fée|fee|fairy/i, 'princesses'],
];

/**
 * Seed catalog covers (SVG emoji blocks, or /uploads/books/* placeholders).
 * Never show these in the kids/public UI — local illustrated art wins.
 */
export function isSeedCatalogCover(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  const path = imagePath.split('?')[0].toLowerCase();
  if (path.endsWith('.svg') || path.includes('.svg')) return true;
  if (path.includes('data:image/svg')) return true;
  // Catalog seed / synced placeholders live under uploads/books
  if (path.includes('/uploads/books/')) return true;
  if (path.includes('/object/public/') && path.includes('-cover')) return true;
  return false;
}

export function isIllustratedCoverPath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  if (isSeedCatalogCover(imagePath)) return false;
  const path = imagePath.split('?')[0].toLowerCase();
  if (ILLUSTRATED_EXT.test(path)) return true;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return !path.includes('.svg');
  }
  return false;
}

export function deriveBookSlug(book = {}) {
  if (book.slug) return String(book.slug).trim();
  if (book.cover_slug) return String(book.cover_slug).trim();
  const fromCover = String(book.cover_image || '')
    .split('?')[0]
    .split('/')
    .pop()
    ?.replace(/-cover\.(svg|png|jpe?g|webp)$/i, '')
    ?.replace(/\.(svg|png|jpe?g|webp)$/i, '');
  if (fromCover && fromCover !== 'cover') return fromCover;
  return null;
}

export function deriveBookTheme(book = {}) {
  const raw = book.theme || book._themeId || book.category_theme || '';
  const key = String(raw).toLowerCase().trim();
  if (key && THEME_ALIASES[key]) return THEME_ALIASES[key];

  const haystack = [book.title, book.description, book.category_name, book.author]
    .filter(Boolean)
    .join(' ');

  for (const [pattern, theme] of TITLE_THEME_HINTS) {
    if (pattern.test(haystack)) return theme;
  }

  return null;
}

/**
 * Ordered cover candidates — LOCAL illustrated art first, seed API covers never.
 */
export function buildBookCoverSources(book = {}) {
  const sources = [];
  const slug = deriveBookSlug(book);
  const theme = deriveBookTheme(book);

  // 1) Local slug file (one-line replace later)
  if (slug) {
    sources.push(`${LOCAL_BOOK_COVERS_BASE}/${slug}.webp`);
  }

  // 2) Local theme pack
  if (theme) {
    sources.push(`${LOCAL_BOOK_COVERS_BASE}/themes/${theme}.webp`);
  }

  // 3) Default illustrated cover
  sources.push(`${LOCAL_BOOK_COVERS_BASE}/default.webp`);
  sources.push(`${LOCAL_BOOK_COVERS_BASE}/themes/default.webp`);

  // 4) Real external illustrated art only (never seed /uploads SVG-or-placeholder)
  if (isIllustratedCoverPath(book.cover_image)) {
    const apiUrl = getImageUrl(book.cover_image);
    if (apiUrl) sources.push(apiUrl);
  }
  if (isIllustratedCoverPath(book.cover_image_url)) {
    const apiUrl = getImageUrl(book.cover_image_url);
    if (apiUrl) sources.push(apiUrl);
  }

  return [...new Set(sources.filter(Boolean))];
}

export function resolveBookCoverUrl(coverImageOrBook, maybeBook) {
  if (coverImageOrBook && typeof coverImageOrBook === 'object') {
    return buildBookCoverSources(coverImageOrBook)[0] || `${LOCAL_BOOK_COVERS_BASE}/default.webp`;
  }
  if (maybeBook && typeof maybeBook === 'object') {
    return buildBookCoverSources({ ...maybeBook, cover_image: coverImageOrBook })[0]
      || `${LOCAL_BOOK_COVERS_BASE}/default.webp`;
  }
  if (isIllustratedCoverPath(coverImageOrBook)) {
    return getImageUrl(coverImageOrBook);
  }
  return buildBookCoverSources({ cover_image: coverImageOrBook })[0]
    || `${LOCAL_BOOK_COVERS_BASE}/default.webp`;
}
