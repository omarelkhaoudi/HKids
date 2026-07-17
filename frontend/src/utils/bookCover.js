import { getImageUrl } from './imageUrl';

/**
 * Local illustrated covers live in `frontend/public/books/covers/`.
 *
 * One-line replacement later:
 *   drop `{slug}.webp` (or .png / .jpg) into that folder —
 *   it automatically wins over theme/default temps.
 */
export const LOCAL_BOOK_COVERS_BASE = '/books/covers';

const ILLUSTRATED_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
const LOCAL_EXTS = ['webp', 'png', 'jpg', 'jpeg'];

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

/**
 * Seed catalog SVG covers are gradient + emoji blocks — never treat as art.
 */
export function isIllustratedCoverPath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  const path = imagePath.split('?')[0].toLowerCase();
  if (path.endsWith('.svg')) return false;
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
    .join(' ')
    .toLowerCase();

  if (/dino|dinosaur/.test(haystack)) return 'dinosaurs';
  if (/lune|moon|étoile|etoile|star|space|fusée|fusee|rocket/.test(haystack)) return 'space';
  if (/princesse|princess|dragon gentil|fee|fée|fairy/.test(haystack)) return 'princesses';
  if (/couleur|color|colour|fée des couleurs/.test(haystack)) return 'colors';
  if (/ange|angel|spiritual|foi|faith|gratitude|veille/.test(haystack)) return 'bedtime';
  if (/ours|bear|nuit|night|dormir|bonne nuit|bedtime|sleep|soleil se couche/.test(haystack)) return 'bedtime';
  if (/poisson|fish|baleine|whale|océan|ocean|mer|sea/.test(haystack)) return 'ocean';
  if (/vache|cow|chat|cat|animal|chien|dog|oiseau|bird|abeille|bee|poule|hen/.test(haystack)) return 'animals';
  if (/vent|feuille|leaf|fleur|flower|jardin|garden|nature/.test(haystack)) return 'world';
  if (/pompier|firefighter|camion|truck|métier|job/.test(haystack)) return 'jobs';
  if (/abc|alphabet|lettre|letter/.test(haystack)) return 'alphabet';
  if (/compte|count|nombre|number|pomme|apple|forme|shape/.test(haystack)) return 'numbers';
  if (/comptine|chanson|song|rhyme|tap tap|matin|morning|soleil/.test(haystack)) return 'rhymes';
  if (/cochon|pig|world|monde|marché|marche/.test(haystack)) return 'world';
  return null;
}

function pushLocalVariants(list, relativeBase) {
  LOCAL_EXTS.forEach((ext) => {
    list.push(`${LOCAL_BOOK_COVERS_BASE}/${relativeBase}.${ext}`);
  });
}

/**
 * Ordered cover candidates for a book.
 * First successful image load wins.
 */
export function buildBookCoverSources(book = {}) {
  const sources = [];
  const slug = deriveBookSlug(book);
  const theme = deriveBookTheme(book);

  // 1) Real API / CDN illustrated art
  if (isIllustratedCoverPath(book.cover_image)) {
    const apiUrl = getImageUrl(book.cover_image);
    if (apiUrl) sources.push(apiUrl);
  }
  if (isIllustratedCoverPath(book.cover_image_url)) {
    const apiUrl = getImageUrl(book.cover_image_url);
    if (apiUrl) sources.push(apiUrl);
  }

  // 2) Local slug file — drop `{slug}.webp` here to replace forever
  if (slug) pushLocalVariants(sources, slug);

  // 3) Local theme temp art
  if (theme) pushLocalVariants(sources, `themes/${theme}`);

  // 4) Default illustrated cover
  pushLocalVariants(sources, 'default');
  pushLocalVariants(sources, 'themes/default');

  return [...new Set(sources.filter(Boolean))];
}

/** @deprecated Prefer buildBookCoverSources(book) — kept for callers that pass a path string */
export function resolveBookCoverUrl(coverImageOrBook, maybeBook) {
  if (coverImageOrBook && typeof coverImageOrBook === 'object') {
    return buildBookCoverSources(coverImageOrBook)[0] || null;
  }
  if (maybeBook && typeof maybeBook === 'object') {
    return buildBookCoverSources({ ...maybeBook, cover_image: coverImageOrBook })[0] || null;
  }
  if (isIllustratedCoverPath(coverImageOrBook)) {
    return getImageUrl(coverImageOrBook);
  }
  return buildBookCoverSources({ cover_image: coverImageOrBook })[0] || `${LOCAL_BOOK_COVERS_BASE}/default.webp`;
}
