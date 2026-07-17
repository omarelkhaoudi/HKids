/**
 * Generate unique local WebP covers for catalog books missing slug art.
 * Saves to frontend/public/books/covers/{slug}.webp (UI-first, no API/DB changes).
 *
 * Usage (from repo root):
 *   node backend/scripts/generate-local-cover-webps.js
 *   node backend/scripts/generate-local-cover-webps.js --limit 10
 *   node backend/scripts/generate-local-cover-webps.js --slug spiritual-10 --force
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CATALOG } from '../content/catalog.js';
import {
  generateCoverPngBuffer,
  resolveCoverImageProvider,
} from '../services/ai/coverImageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../frontend/public/books/covers');

function parseArgs(argv) {
  const limitIdx = argv.indexOf('--limit');
  const slugIdx = argv.indexOf('--slug');
  const concurrencyIdx = argv.indexOf('--concurrency');
  return {
    force: argv.includes('--force'),
    limit: limitIdx >= 0 ? Number.parseInt(argv[limitIdx + 1], 10) : null,
    slug: slugIdx >= 0 ? argv[slugIdx + 1] : null,
    concurrency: concurrencyIdx >= 0
      ? Math.max(1, Number.parseInt(argv[concurrencyIdx + 1], 10) || 2)
      : 2,
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function saveAsWebp(pngBuffer, outPath) {
  const sharp = (await import('sharp')).default;
  await sharp(pngBuffer)
    .resize(640, 800, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(outPath);
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      try {
        const result = await worker(item, index);
        if (result === 'updated') updated += 1;
        else if (result === 'skipped') skipped += 1;
      } catch (error) {
        failed += 1;
        console.error(`   ❌ ${item.slug} — ${error.message || error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runNext()));
  return { updated, skipped, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(OUT_DIR, { recursive: true });

  let items = [...CATALOG];
  if (args.slug) items = items.filter((item) => item.slug === args.slug);
  if (args.limit != null && Number.isFinite(args.limit)) items = items.slice(0, args.limit);

  const provider = resolveCoverImageProvider('pollinations');
  console.log(`🎨 Local covers → ${OUT_DIR}`);
  console.log(`   provider=${provider} books=${items.length} concurrency=${args.concurrency}`);

  const { updated, skipped, failed } = await runPool(items, args.concurrency, async (item, index) => {
    const outPath = path.join(OUT_DIR, `${item.slug}.webp`);
    if (!args.force && await fileExists(outPath)) {
      console.log(`   ↩️  ${item.slug} — already exists`);
      return 'skipped';
    }

    console.log(`   🖌️  ${item.slug} — (${index + 1}/${items.length})`);
    const { buffer, source } = await generateCoverPngBuffer(item, { provider });
    if (source === 'svg-fallback') {
      throw new Error('Refusing SVG icon-card fallback — use rebuild-local-covers-from-themes.js');
    }
    await saveAsWebp(buffer, outPath);
    console.log(`   ✅ ${item.slug}.webp`);
    return 'updated';
  });

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
