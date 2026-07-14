/**
 * Regenerates and uploads catalog cover images, then updates books.cover_image.
 * Use when DB rows exist but cover files are missing in production.
 */
import '../config/env.js';
import { initDatabase, getDatabase } from '../database/init.js';
import { CATALOG } from '../content/catalog.js';
import { renderCoverSvg } from '../content/svgAssets.js';
import { persistBookAsset, getSupabaseStorageConfig } from '../services/storage/bookAssetStorage.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads/books');
const force = process.argv.includes('--force');

async function main() {
  const storage = getSupabaseStorageConfig();
  console.log('🖼️  HKids — sync couvertures catalogue');
  console.log(`   Items: ${CATALOG.length} | Supabase: ${storage.enabled ? storage.bucket : 'local only'} | force: ${force}`);

  await initDatabase();
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let updated = 0;

    for (const item of CATALOG) {
      const existing = await client.query('SELECT id, cover_image FROM books WHERE slug = $1 LIMIT 1', [item.slug]);
      if (!existing.rows[0]) {
        console.log(`   ⏭️  ${item.slug} — absent de la base`);
        continue;
      }

      const coverFilename = `${item.slug}-cover.svg`;
      const coverPath = await persistBookAsset({
        buffer: Buffer.from(renderCoverSvg({
          title: item.title,
          emoji: item.emoji,
          gradient: item.gradient,
          theme: item.theme,
          slug: item.slug,
        }), 'utf8'),
        filename: coverFilename,
        localDir: uploadsDir,
      });

      if (!force && existing.rows[0].cover_image === coverPath) {
        console.log(`   ↩️  ${item.slug} — deja a jour`);
        continue;
      }

      await client.query(
        'UPDATE books SET cover_image = $2, updated_at = NOW() WHERE id = $1',
        [existing.rows[0].id, coverPath]
      );
      updated += 1;
      console.log(`   ✅ ${item.slug} → ${coverPath.startsWith('http') ? 'Supabase' : 'local'}`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ ${updated} couverture(s) synchronisee(s)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Echec sync couvertures:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
