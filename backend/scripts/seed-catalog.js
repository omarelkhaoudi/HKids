import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import '../config/env.js';
import { initDatabase, getDatabase } from '../database/init.js';
import { CATALOG, CATALOG_STATS } from '../content/catalog.js';
import { BOOK_CATEGORIES } from '../content/catalogMeta.js';
import { LEARNING_CATALOG } from '../content/learningCatalog.js';
import { STORY_TEMPLATES } from '../content/storyTemplatesCatalog.js';
import { renderCoverSvg, renderPageSvg } from '../content/svgAssets.js';
import { ensureSpeechMp3, estimateDurationSeconds } from '../content/audioAssets.js';
import { persistBookAsset, readBookAssetBuffer } from '../services/storage/bookAssetStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads/books');
const contentAudioDir = path.join(__dirname, '../content/audio');

const forceAssets = process.argv.includes('--force');
const skipAudio = process.argv.includes('--skip-audio');

async function writeTextAsset(filename, content) {
  return persistBookAsset({
    buffer: Buffer.from(content, 'utf8'),
    filename,
    localDir: uploadsDir,
  });
}

async function copyAudioAsset(sourcePath, filename) {
  const buffer = await fs.readFile(sourcePath);
  return persistBookAsset({
    buffer,
    filename,
    localDir: uploadsDir,
  });
}

async function ensureBookCategories(client) {
  for (const { name, description, en, ar } of BOOK_CATEGORIES) {
    const result = await client.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [name, description]
    );
    const categoryId = result.rows[0].id;
    await upsertCategoryLocalization(client, categoryId, 'fr', name, description);
    await upsertCategoryLocalization(client, categoryId, 'en', en.name, en.description);
    await upsertCategoryLocalization(client, categoryId, 'ar', ar.name, ar.description);
  }
}

async function upsertBook(client, item, coverPath, audioPath, pageCount, durationSeconds) {
  const categoryResult = await client.query(
    'SELECT id FROM categories WHERE name = $1 LIMIT 1',
    [item.category_name]
  );
  const categoryId = categoryResult.rows[0]?.id || null;
  const level = item.age_group_max <= 4 ? '2-4' : item.age_group_max <= 7 ? '5-7' : '8-10';
  const tags = Array.isArray(item.tags) && item.tags.length
    ? item.tags
    : [`level:${level}`, item.theme, item.content_type].filter(Boolean);

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
        tags = $22, updated_at = NOW()
       WHERE id = $1`,
      [
        bookId, item.title, item.author, item.description, coverPath,
        audioPath || coverPath || `/uploads/books/${item.slug}-cover.svg`,
        item.content_type, item.language, item.theme, categoryId,
        item.age_group_min, item.age_group_max, audioPath, durationSeconds,
        pageCount, flags.is_published, flags.moderation_status,
        flags.is_premium, flags.is_recommended, flags.is_popular, flags.is_new,
        tags,
      ]
    );
    return bookId;
  }

  const inserted = await client.query(
    `INSERT INTO books (
      title, slug, author, description, cover_image, file_path, content_type, language, theme,
      category_id, age_group_min, age_group_max, audio_url, duration_seconds, page_count,
      is_published, moderation_status, is_premium, is_recommended, is_popular, is_new, tags
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
    ) RETURNING id`,
    [
      item.title, item.slug, item.author, item.description, coverPath,
      audioPath || coverPath || `/uploads/books/${item.slug}-cover.svg`,
      item.content_type, item.language, item.theme, categoryId,
      item.age_group_min, item.age_group_max, audioPath, durationSeconds,
      pageCount, flags.is_published, flags.moderation_status,
      flags.is_premium, flags.is_recommended, flags.is_popular, flags.is_new,
      tags,
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

async function upsertCategoryLocalization(client, categoryId, locale, name, description) {
  await client.query(
    `INSERT INTO content_localizations (content_type, content_id, locale, title, description)
     VALUES ('category', $1, $2, $3, $4)
     ON CONFLICT (content_type, content_id, locale)
     DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()`,
    [categoryId, locale, name, description]
  );
}

async function upsertLearningLocalization(client, contentId, locale, title, description) {
  await client.query(
    `INSERT INTO content_localizations (content_type, content_id, locale, title, description)
     VALUES ('learning_content', $1, $2, $3, $4)
     ON CONFLICT (content_type, content_id, locale)
     DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()`,
    [contentId, locale, title, description]
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
    renderCoverSvg({
      title: item.title,
      emoji: item.emoji,
      gradient: item.gradient,
      theme: item.theme,
      slug: item.slug,
    })
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

async function upsertLearningContent(client, item) {
  const category = await client.query(
    'SELECT id FROM learning_categories WHERE code = $1 LIMIT 1',
    [item.category_code]
  );
  const reward = await client.query(
    'SELECT id FROM learning_rewards WHERE code = $1 LIMIT 1',
    [item.reward_code]
  );

  const existing = await client.query(
    `SELECT id FROM learning_contents
     WHERE metadata->>'slug' = $1
     LIMIT 1`,
    [item.slug]
  );

  const metadata = { ...item.metadata, slug: item.slug };
  let contentId;

  if (existing.rows[0]) {
    contentId = existing.rows[0].id;
    await client.query(
      `UPDATE learning_contents SET
        title = $2, description = $3, content_type = $4, quiz_type = $5,
        category_id = $6, age_group_min = $7, age_group_max = $8,
        language = $9, difficulty = $10, reward_id = $11, status = 'published',
        metadata = $12::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [
        contentId, item.title, item.description, item.content_type, item.quiz_type,
        category.rows[0]?.id || null, item.age_group_min, item.age_group_max,
        item.language, item.difficulty, reward.rows[0]?.id || null, JSON.stringify(metadata),
      ]
    );
  } else {
    const inserted = await client.query(
      `INSERT INTO learning_contents (
        title, description, content_type, quiz_type, category_id,
        age_group_min, age_group_max, language, difficulty, reward_id, status, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11::jsonb)
      RETURNING id`,
      [
        item.title, item.description, item.content_type, item.quiz_type,
        category.rows[0]?.id || null, item.age_group_min, item.age_group_max,
        item.language, item.difficulty, reward.rows[0]?.id || null, JSON.stringify(metadata),
      ]
    );
    contentId = inserted.rows[0].id;
  }

  if (item.question) {
    await client.query('DELETE FROM learning_questions WHERE content_id = $1', [contentId]);
    await client.query(
      `INSERT INTO learning_questions (
        content_id, question_type, prompt, options, correct_answer, explanation, position
      ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,1)`,
      [
        contentId,
        item.question.question_type,
        item.question.prompt,
        JSON.stringify(item.question.options),
        JSON.stringify(item.question.correct_answer),
        item.question.explanation,
      ]
    );
  }

  await upsertLearningLocalization(client, contentId, item.language || 'fr', item.title, item.description);
  if (item.localizations) {
    for (const [locale, loc] of Object.entries(item.localizations)) {
      await upsertLearningLocalization(client, contentId, locale, loc.title, loc.description);
    }
  }

  return { slug: item.slug, contentId, type: item.content_type };
}

async function seedStoryTemplates(client) {
  const kids = await client.query('SELECT id FROM kids_profiles');
  let inserted = 0;

  for (const kid of kids.rows) {
    for (const template of STORY_TEMPLATES) {
      const exists = await client.query(
        `SELECT id FROM generated_stories
         WHERE kid_profile_id = $1
           AND prompt_metadata->>'slug' = $2
         LIMIT 1`,
        [kid.id, template.slug]
      );
      if (exists.rows[0]) continue;

      await client.query(
        `INSERT INTO generated_stories (
          kid_profile_id, title, story_text, summary, language, theme, age_level,
          characters, estimated_duration_minutes, prompt_metadata, generation_metadata,
          provider, saved, moderation_status, is_hidden
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,'demo',TRUE,'approved',FALSE
        )`,
        [
          kid.id,
          template.title,
          template.story_text,
          template.summary,
          template.language,
          template.theme,
          template.age_level,
          template.characters,
          5,
          JSON.stringify({ ...template.prompt_metadata, slug: template.slug }),
          JSON.stringify({ seeded: true, source: 'seed-catalog' }),
        ]
      );
      inserted += 1;
    }
  }

  return inserted;
}

async function main() {
  console.log('📚 HKids — seed catalogue demo complet');
  console.log(`   Livres: ${CATALOG.length} | Learning: ${LEARNING_CATALOG.length} | Templates: ${STORY_TEMPLATES.length}`);
  console.log(`   Stats livres → audio: ${CATALOG_STATS.audio_stories}, comptines: ${CATALOG_STATS.songs}, religieux: ${CATALOG_STATS.religious}`);
  console.log(`   Options: force=${forceAssets} skip-audio=${skipAudio}`);

  await initDatabase();
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureBookCategories(client);

    const bookResults = [];
    for (const item of CATALOG) {
      const result = await seedItem(client, item);
      bookResults.push(result);
      console.log(`   ✅ book ${result.slug} — ${result.pages} page(s)${result.audio ? ' + audio' : ''}`);
    }

    const learningResults = [];
    for (const item of LEARNING_CATALOG) {
      const result = await upsertLearningContent(client, item);
      learningResults.push(result);
      console.log(`   ✅ learning ${result.slug} (${result.type})`);
    }

    const templateCount = await seedStoryTemplates(client);
    if (templateCount > 0) {
      console.log(`   ✅ ${templateCount} histoires personnalisables injectees`);
    } else {
      console.log('   ℹ️  Aucun profil enfant — templates seront ajoutes apres creation d un enfant');
    }

    await client.query('COMMIT');
    console.log(`\n✅ Catalogue demo pret : ${bookResults.length} livres, ${learningResults.length} activites learning`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Echec seed catalogue:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
