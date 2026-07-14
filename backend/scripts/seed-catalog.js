import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { initDatabase, getDatabase } from '../database/init.js';
import { CATALOG } from '../content/catalog.js';
import { renderCoverSvg, renderPageSvg } from '../content/svgAssets.js';
import { ensureSpeechMp3, estimateDurationSeconds } from '../content/audioAssets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads/books');
const contentAudioDir = path.join(__dirname, '../content/audio');

const forceAssets = process.argv.includes('--force');
const skipAudio = process.argv.includes('--skip-audio');

async function writeTextAsset(filename, content) {
  const fullPath = path.join(uploadsDir, filename);
  await fs.ensureDir(uploadsDir);
  await fs.writeFile(fullPath, content, 'utf8');
  return `/uploads/books/${filename}`;
}

async function copyAudioAsset(sourcePath, filename) {
  const dest = path.join(uploadsDir, filename);
  await fs.ensureDir(uploadsDir);
  await fs.copy(sourcePath, dest);
  return `/uploads/books/${filename}`;
}

async function upsertBook(client, item, coverPath, audioPath, pageCount, durationSeconds) {
  const categoryResult = await client.query(
    'SELECT id FROM categories WHERE name = $1 LIMIT 1',
    [item.category_name]
  );
  const categoryId = categoryResult.rows[0]?.id || null;

  const existing = await client.query('SELECT id FROM books WHERE slug = $1 LIMIT 1', [item.slug]);
  const flags = {
    is_published: true,
    moderation_status: 'approved',
    is_premium: Boolean(item.is_premium),
    is_recommended: Boolean(item.is_recommended),
    is_popular: Boolean(item.is_popular),
    is_new: Boolean(item.is_new),
  };

  if (existing.rows[0]) {
    const bookId = existing.rows[0].id;
    await client.query(
      `UPDATE books SET
        title = $2, author = $3, description = $4, cover_image = $5, file_path = $6,
        content_type = $7, language = $8, theme = $9, category_id = $10,
        age_group_min = $11, age_group_max = $12, audio_url = $13, duration_seconds = $14,
        page_count = $15, is_published = $16, moderation_status = $17,
        is_premium = $18, is_recommended = $19, is_popular = $20, is_new = $21,
        updated_at = NOW()
       WHERE id = $1`,
      [
        bookId, item.title, item.author, item.description, coverPath,
        audioPath || coverPath || `/uploads/books/${item.slug}-cover.svg`,
        item.content_type, item.language, item.theme, categoryId,
        item.age_group_min, item.age_group_max, audioPath, durationSeconds,
        pageCount, flags.is_published, flags.moderation_status,
        flags.is_premium, flags.is_recommended, flags.is_popular, flags.is_new,
      ]
    );
    return bookId;
  }

  const inserted = await client.query(
    `INSERT INTO books (
      title, slug, author, description, cover_image, file_path, content_type, language, theme,
      category_id, age_group_min, age_group_max, audio_url, duration_seconds, page_count,
      is_published, moderation_status, is_premium, is_recommended, is_popular, is_new
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
    ) RETURNING id`,
    [
      item.title, item.slug, item.author, item.description, coverPath,
      audioPath || coverPath || `/uploads/books/${item.slug}-cover.svg`,
      item.content_type, item.language, item.theme, categoryId,
      item.age_group_min, item.age_group_max, audioPath, durationSeconds,
      pageCount, flags.is_published, flags.moderation_status,
      flags.is_premium, flags.is_recommended, flags.is_popular, flags.is_new,
    ]
  );
  return inserted.rows[0].id;
}

async function upsertPages(client, bookId, item, pagePaths) {
  await client.query('DELETE FROM book_pages WHERE book_id = $1', [bookId]);
  for (let index = 0; index < pagePaths.length; index += 1) {
    const page = item.pages[index];
    await client.query(
      `INSERT INTO book_pages (book_id, page_number, image_path, content)
       VALUES ($1, $2, $3, $4)`,
      [bookId, index + 1, pagePaths[index], page?.text || null]
    );
  }
}

async function upsertLocalization(client, bookId, locale, title, description) {
  await client.query(
    `INSERT INTO content_localizations (content_type, content_id, locale, title, description)
     VALUES ('book', $1, $2, $3, $4)
     ON CONFLICT (content_type, content_id, locale)
     DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()`,
    [bookId, locale, title, description]
  );
}

async function upsertAudioTrack(client, bookId, locale, audioPath, durationSeconds, isDefault = false) {
  if (!audioPath) return;
  await client.query(
    `INSERT INTO book_audio_tracks (book_id, locale, audio_url, duration_seconds, is_default)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (book_id, locale)
     DO UPDATE SET audio_url = EXCLUDED.audio_url, duration_seconds = EXCLUDED.duration_seconds, is_default = EXCLUDED.is_default`,
    [bookId, locale, audioPath, durationSeconds, isDefault]
  );
}

async function seedItem(client, item) {
  const coverFilename = `${item.slug}-cover.svg`;
  const coverPath = await writeTextAsset(
    coverFilename,
    renderCoverSvg({ title: item.title, emoji: item.emoji, gradient: item.gradient })
  );

  const pagePaths = [];
  const pages = Array.isArray(item.pages) ? item.pages : [];
  for (let index = 0; index < pages.length; index += 1) {
    const pageFilename = `${item.slug}-p${index + 1}.svg`;
    pagePaths.push(await writeTextAsset(
      pageFilename,
      renderPageSvg({
        text: pages[index].text,
        emoji: item.emoji,
        gradient: item.gradient,
        pageNumber: index + 1,
        totalPages: pages.length,
      })
    ));
  }

  let audioPath = null;
  let durationSeconds = item.duration_seconds || 0;
  const generatedAudio = [];

  if (!skipAudio && item.audio_text) {
    const localesToGenerate = [
      { locale: item.language, text: item.audio_text },
      ...Object.entries(item.localizations || {})
        .filter(([, loc]) => loc.audio_text)
        .map(([locale, loc]) => ({ locale, text: loc.audio_text })),
    ];

    for (const { locale, text } of localesToGenerate) {
      const sourceFile = path.join(contentAudioDir, `${item.slug}-${locale}.mp3`);
      await ensureSpeechMp3({ text, locale, outputPath: sourceFile, force: forceAssets });
      const uploadName = `${item.slug}-${locale}.mp3`;
      const storedPath = await copyAudioAsset(sourceFile, uploadName);
      const trackDuration = await estimateDurationSeconds(sourceFile, item.duration_seconds || 10);
      generatedAudio.push({ locale, storedPath, trackDuration });
      if (locale === item.language) {
        audioPath = storedPath;
        durationSeconds = trackDuration;
      }
    }
  }

  const bookId = await upsertBook(client, item, coverPath, audioPath, pagePaths.length, durationSeconds);
  await upsertPages(client, bookId, item, pagePaths);

  await upsertLocalization(client, bookId, item.language, item.title, item.description);
  if (item.localizations) {
    for (const [locale, loc] of Object.entries(item.localizations)) {
      await upsertLocalization(client, bookId, locale, loc.title, loc.description);
    }
  }

  for (const track of generatedAudio) {
    await upsertAudioTrack(
      client,
      bookId,
      track.locale,
      track.storedPath,
      track.trackDuration,
      track.locale === item.language
    );
  }

  return { slug: item.slug, bookId, pages: pagePaths.length, audio: Boolean(audioPath) };
}

async function main() {
  console.log('📚 HKids — seed catalogue contenu réel');
  console.log(`   Items: ${CATALOG.length} | force: ${forceAssets} | skip-audio: ${skipAudio}`);

  await initDatabase();
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const results = [];
    for (const item of CATALOG) {
      const result = await seedItem(client, item);
      results.push(result);
      console.log(`   ✅ ${result.slug} — ${result.pages} page(s)${result.audio ? ' + audio' : ''}`);
    }
    await client.query('COMMIT');
    console.log(`\n✅ Catalogue prêt : ${results.length} contenus publiés dans uploads/books/`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Échec seed catalogue:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
