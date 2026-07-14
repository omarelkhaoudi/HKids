/**
 * Generates real PNG cover illustrations for catalog books (OpenAI or Pollinations),
 * uploads them to Supabase when configured, and updates books.cover_image.
 *
 * Usage:
 *   npm run generate:catalog-covers
 *   npm run generate:catalog-covers -- --limit 5
 *   npm run generate:catalog-covers -- --slug demo-dino-courage --force
 *   npm run generate:catalog-covers -- --provider pollinations --concurrency 4
 */
import '../config/env.js';
import { initDatabase, getDatabase } from '../database/init.js';
import { CATALOG } from '../content/catalog.js';
import {
  coverPngFilename,
  generateCoverPngBuffer,
  resolveCoverImageProvider,
} from '../services/ai/coverImageService.js';
import { persistBookAsset, getSupabaseStorageConfig } from '../services/storage/bookAssetStorage.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads/books');

function parseArgs(argv) {
  const limitIdx = argv.indexOf('--limit');
  const slugIdx = argv.indexOf('--slug');
  const providerIdx = argv.indexOf('--provider');
  const concurrencyIdx = argv.indexOf('--concurrency');
  const concurrency = concurrencyIdx >= 0
    ? Math.max(1, Number.parseInt(argv[concurrencyIdx + 1], 10) || 1)
    : (argv.includes('--fast') ? 4 : 2);
  return {
    force: argv.includes('--force'),
    limit: limitIdx >= 0 ? Number.parseInt(argv[limitIdx + 1], 10) : null,
    slug: slugIdx >= 0 ? argv[slugIdx + 1] : null,
    provider: providerIdx >= 0 ? argv[providerIdx + 1] : null,
    concurrency,
  };
}

async function processItem(client, item, { provider, force, index, total }) {
  const existing = await client.query(
    'SELECT id, cover_image FROM books WHERE slug = $1 LIMIT 1',
    [item.slug]
  );
  if (!existing.rows[0]) {
    console.log(`   ⏭️  ${item.slug} — absent de la base`);
    return { status: 'skipped' };
  }

  const coverFilename = coverPngFilename(item.slug);
  const alreadyPng = String(existing.rows[0].cover_image || '').includes(`${item.slug}-cover.png`);
  if (!force && alreadyPng) {
    console.log(`   ↩️  ${item.slug} — PNG deja en place`);
    return { status: 'skipped' };
  }

  console.log(`   🖌️  ${item.slug} — generation (${index + 1}/${total})...`);
  const { buffer: pngBuffer, source } = await generateCoverPngBuffer(item, { provider });
  const coverPath = await persistBookAsset({
    buffer: pngBuffer,
    filename: coverFilename,
    localDir: uploadsDir,
  });

  await client.query(
    'UPDATE books SET cover_image = $2, updated_at = NOW() WHERE id = $1',
    [existing.rows[0].id, coverPath]
  );

  const where = coverPath.startsWith('http') ? 'Supabase' : 'local';
  const note = source === 'svg-fallback' ? ' (fallback SVG→PNG)' : ` via ${source}`;
  console.log(`   ✅ ${item.slug} → ${where} PNG${note}`);
  return { status: 'updated', source };
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  let updated = 0;
  let failed = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      try {
        const result = await worker(item, index);
        if (result.status === 'updated') updated += 1;
      } catch (error) {
        failed += 1;
        console.error(`   ❌ ${item.slug} — ${error.message || error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runNext()));
  return { updated, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = resolveCoverImageProvider(args.provider);
  const storage = getSupabaseStorageConfig();

  let items = [...CATALOG];
  if (args.slug) items = items.filter((item) => item.slug === args.slug);
  if (args.limit && args.limit > 0) items = items.slice(0, args.limit);

  if (!items.length) {
    console.error('❌ Aucune histoire correspondante dans le catalogue.');
    process.exitCode = 1;
    return;
  }

  console.log('🎨 HKids — generation couvertures PNG');
  console.log(`   Histoires: ${items.length} | Provider: ${provider} | Concurrency: ${args.concurrency} | Supabase: ${storage.enabled ? storage.bucket : 'local'}`);

  await initDatabase();
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    const { updated, failed } = await runPool(items, args.concurrency, (item, index) =>
      processItem(client, item, {
        provider,
        force: args.force,
        index,
        total: items.length,
      })
    );

    console.log(`\n✅ ${updated} couverture(s) PNG generee(s)`);
    if (failed) console.log(`⚠️  ${failed} echec(s) — relancez la commande pour les histoires manquantes`);
    if (provider === 'pollinations') {
      console.log('   Astuce: OPENAI_API_KEY + --provider openai pour une qualite premium.');
    }
    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error('❌ Echec generation couvertures:', error.message || error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
