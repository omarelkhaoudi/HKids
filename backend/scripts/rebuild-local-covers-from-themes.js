/**
 * Rebuild local slug covers from illustrated theme packs (never SVG icon cards).
 *
 * Usage:
 *   node backend/scripts/rebuild-local-covers-from-themes.js
 *   node backend/scripts/rebuild-local-covers-from-themes.js --force
 *   node backend/scripts/rebuild-local-covers-from-themes.js --only-small
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CATALOG } from '../content/catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERS_DIR = path.resolve(__dirname, '../../frontend/public/books/covers');
const THEMES_DIR = path.join(COVERS_DIR, 'themes');

const THEME_ALIASES = {
  dinosaurs: 'dinosaurs',
  space: 'space',
  animals: 'animals',
  princesses: 'princesses',
  bedtime: 'bedtime',
  spiritual: 'bedtime',
  spirituality: 'bedtime',
  ocean: 'ocean',
  world: 'world',
  nature: 'world',
  colors: 'colors',
  jobs: 'jobs',
  alphabet: 'alphabet',
  numbers: 'numbers',
  shapes: 'numbers',
  rhymes: 'rhymes',
  vehicles: 'jobs',
};

const SMALL_BYTES = 20000;

function parseArgs(argv) {
  return {
    force: argv.includes('--force'),
    onlySmall: argv.includes('--only-small'),
  };
}

function hashSlug(slug = '') {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveTheme(item) {
  const key = String(item.theme || '').toLowerCase().trim();
  if (THEME_ALIASES[key]) return THEME_ALIASES[key];
  const hay = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  if (/dino|dinosaur/.test(hay)) return 'dinosaurs';
  if (/espace|lune|étoile|etoile|space|fusée|fusee/.test(hay)) return 'space';
  if (/ange|nuit|sommeil|gratitude|spiritual/.test(hay)) return 'bedtime';
  if (/princesse|fée|fee|dragon|licorne/.test(hay)) return 'princesses';
  if (/ocean|mer|poisson|baleine/.test(hay)) return 'ocean';
  if (/comptine|chanson|musique/.test(hay)) return 'rhymes';
  if (/animal|chat|lapin|vache|poule|abeille/.test(hay)) return 'animals';
  if (/couleur|arc-en-ciel/.test(hay)) return 'colors';
  if (/lettre|alphabet|abc/.test(hay)) return 'alphabet';
  if (/nombre|compte|chiffre|forme/.test(hay)) return 'numbers';
  return 'world';
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildUniqueCover(sharp, themePath, slug, outPath) {
  const hash = hashSlug(slug);
  const left = (hash % 18) / 100;
  const top = ((hash >> 4) % 16) / 100;
  const width = 0.78 + ((hash >> 8) % 12) / 100;
  const height = 0.78 + ((hash >> 12) % 12) / 100;
  const hue = ((hash >> 3) % 24) - 12;
  const sat = 1 + (((hash >> 6) % 10) - 5) / 40;
  const bright = 1 + (((hash >> 9) % 8) - 4) / 50;

  const meta = await sharp(themePath).metadata();
  const srcW = meta.width || 640;
  const srcH = meta.height || 800;
  const extractW = Math.min(srcW, Math.max(280, Math.floor(srcW * Math.min(width, 0.9))));
  const extractH = Math.min(srcH, Math.max(360, Math.floor(srcH * Math.min(height, 0.9))));
  const maxLeft = Math.max(0, srcW - extractW);
  const maxTop = Math.max(0, srcH - extractH);
  const extractLeft = Math.max(0, Math.min(Math.floor(srcW * left), maxLeft));
  const extractTop = Math.max(0, Math.min(Math.floor(srcH * top), maxTop));

  const vignette = Buffer.from(
    `<svg width="640" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="72%">
          <stop offset="55%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
          <stop offset="100%" stop-color="rgb(20,16,12)" stop-opacity="0.28"/>
        </radialGradient>
      </defs>
      <rect width="640" height="800" fill="url(#g)"/>
    </svg>`
  );

  await sharp(themePath)
    .extract({ left: extractLeft, top: extractTop, width: extractW, height: extractH })
    .resize(640, 800, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: bright, saturation: sat, hue })
    .composite([{ input: await sharp(vignette).png().toBuffer(), blend: 'over' }])
    .webp({ quality: 84 })
    .toFile(outPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sharp = (await import('sharp')).default;
  await fs.mkdir(COVERS_DIR, { recursive: true });

  let updated = 0;
  let skipped = 0;

  for (const item of CATALOG) {
    const outPath = path.join(COVERS_DIR, `${item.slug}.webp`);
    const already = await exists(outPath);
    let size = 0;
    if (already) {
      size = (await fs.stat(outPath)).size;
    }

    const isSmall = size > 0 && size < SMALL_BYTES;
    const shouldWrite = args.force
      || !already
      || (args.onlySmall && isSmall)
      || (!args.onlySmall && isSmall);

    if (!shouldWrite) {
      skipped += 1;
      continue;
    }

    const theme = resolveTheme(item);
    const themePath = path.join(THEMES_DIR, `${theme}.webp`);
    const fallbackTheme = path.join(THEMES_DIR, 'default.webp');
    const sourceTheme = (await exists(themePath)) ? themePath : fallbackTheme;

    await buildUniqueCover(sharp, sourceTheme, item.slug, outPath);
    updated += 1;
    console.log(`✅ ${item.slug}.webp ← themes/${path.basename(sourceTheme)} (${theme})`);
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
