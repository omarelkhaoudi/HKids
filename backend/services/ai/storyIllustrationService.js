/**
 * Generates cover + per-scene illustrations for AI-generated stories.
 * Reuses the existing coverImageService infrastructure (OpenAI / Pollinations / SVG fallback)
 * and stores assets in Supabase via bookAssetStorage.
 */

import { generateCoverPngBuffer, resolveCoverImageProvider } from './coverImageService.js';
import { persistBookAsset } from '../storage/bookAssetStorage.js';
import { getDatabase } from '../../database/init.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads/books');

const SCENE_THEME_HINTS = {
  espace: 'starry sky, rockets, planets, cosmic colors, deep blue and purple',
  space: 'starry sky, rockets, planets, cosmic colors, deep blue and purple',
  foret: 'enchanted forest, tall trees, woodland creatures, soft greens',
  nature: 'nature scene, flowers, sunshine, gentle meadow',
  animaux: 'cute animals, friendly creatures, warm natural setting',
  animals: 'cute animals, friendly creatures, warm natural setting',
  magie: 'magical sparkles, wands, wizards, mystical glow',
  magic: 'magical sparkles, wands, wizards, mystical glow',
  ocean: 'underwater scene, friendly sea creatures, coral reef, turquoise',
  mer: 'underwater scene, friendly sea creatures, coral reef, turquoise',
  chevalier: 'brave knight, castle, dragon friend, medieval fantasy',
  dragon: 'friendly dragon, castle, medieval fantasy',
  reve: 'dreamscape, floating clouds, soft moonlight, stars',
  nuit: 'gentle night scene, moon, stars, cozy bedtime',
  aventure: 'adventure journey, path through landscape, discovery',
  adventure: 'adventure journey, path through landscape, discovery',
  default: 'warm cozy children illustration, soft colors',
};

function matchThemeHint(theme) {
  const t = (theme || '').toLowerCase();
  for (const [key, hint] of Object.entries(SCENE_THEME_HINTS)) {
    if (key !== 'default' && t.includes(key)) return hint;
  }
  return SCENE_THEME_HINTS.default;
}

export function splitStoryIntoScenes(storyText, { maxScenes = 4 } = {}) {
  const paragraphs = storyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  if (paragraphs.length <= maxScenes) {
    return paragraphs.map((text, i) => ({ index: i, excerpt: text.slice(0, 300) }));
  }

  const step = paragraphs.length / maxScenes;
  const scenes = [];
  for (let i = 0; i < maxScenes; i++) {
    const idx = Math.min(Math.floor(i * step), paragraphs.length - 1);
    scenes.push({ index: i, excerpt: paragraphs[idx].slice(0, 300) });
  }
  return scenes;
}

export function buildScenePrompt(story, scene) {
  const themeHint = matchThemeHint(story.theme);
  const excerpt = scene.excerpt.slice(0, 200);

  return [
    `Children's book illustration for a scene from "${story.title}".`,
    `Scene: ${excerpt}`,
    `Visual style: ${themeHint}.`,
    'Soft watercolor and gouache style, rounded shapes, kid-safe, wholesome, no scary elements.',
    'Landscape composition, single scene, rich details, professional picture book quality.',
    'No text, no letters, no words, no watermark.',
  ].join(' ');
}

export function buildStoryCoverPrompt(story) {
  const themeHint = matchThemeHint(story.theme);
  const summary = (story.summary || story.title || '').slice(0, 200);

  return [
    `Children's book cover illustration for "${story.title}".`,
    `${themeHint}.`,
    `Story mood: ${summary}.`,
    'Soft watercolor and gouache style, rounded shapes, kid-safe, wholesome, no scary elements.',
    'Portrait composition 4:5, single scene, one clear focal character, rich details.',
    'No text, no letters, no words, no watermark, no logo.',
  ].join(' ');
}

function storyAssetFilename(storyId, type, index) {
  if (type === 'cover') return `story-${storyId}-cover.png`;
  return `story-${storyId}-scene-${index}.png`;
}

async function generateAndUpload(prompt, filename, { provider } = {}) {
  const item = {
    title: prompt.slice(0, 80),
    description: prompt,
    theme: 'default',
    content_type: 'story',
    emoji: '📖',
    gradient: ['#7b3eb8', '#389d85'],
    slug: filename.replace('.png', ''),
  };

  const { buffer, source } = await generateCoverPngBuffer(item, { provider });
  const url = await persistBookAsset({
    buffer,
    filename,
    localDir: uploadsDir,
    folder: 'stories',
  });

  return { url, source };
}

export async function generateStoryIllustrations(storyId, { provider, force = false } = {}) {
  const pool = getDatabase();

  const storyResult = await pool.query(
    'SELECT id, title, story_text, summary, theme, illustration_plan FROM generated_stories WHERE id = $1',
    [storyId]
  );
  const story = storyResult.rows[0];
  if (!story) throw new Error(`Story ${storyId} not found`);

  const plan = story.illustration_plan || {};
  if (!force && plan.status === 'completed') {
    return plan;
  }

  await pool.query(
    `UPDATE generated_stories SET illustration_plan = jsonb_set(COALESCE(illustration_plan, '{}'), '{status}', '"processing"'), updated_at = NOW() WHERE id = $1`,
    [storyId]
  );

  const resolvedProvider = provider || undefined;
  const scenes = splitStoryIntoScenes(story.story_text);
  const result = { status: 'completed', cover: null, scenes: [] };

  try {
    const coverPrompt = buildStoryCoverPrompt(story);
    const coverFilename = storyAssetFilename(storyId, 'cover');
    const cover = await generateAndUpload(coverPrompt, coverFilename, { provider: resolvedProvider });
    result.cover = { url: cover.url, source: cover.source, prompt: coverPrompt.slice(0, 200) };

    await pool.query(
      'UPDATE generated_stories SET cover_image_url = $2, updated_at = NOW() WHERE id = $1',
      [storyId, cover.url]
    );
  } catch (err) {
    console.warn(`[illustrations] cover failed for story ${storyId}:`, err.message);
    result.cover = { url: null, error: err.message };
  }

  for (const scene of scenes) {
    try {
      const scenePrompt = buildScenePrompt(story, scene);
      const sceneFilename = storyAssetFilename(storyId, 'scene', scene.index);
      const img = await generateAndUpload(scenePrompt, sceneFilename, { provider: resolvedProvider });
      result.scenes.push({
        index: scene.index,
        excerpt: scene.excerpt.slice(0, 100),
        url: img.url,
        source: img.source,
        prompt: scenePrompt.slice(0, 200),
      });
    } catch (err) {
      console.warn(`[illustrations] scene ${scene.index} failed for story ${storyId}:`, err.message);
      result.scenes.push({
        index: scene.index,
        excerpt: scene.excerpt.slice(0, 100),
        url: null,
        error: err.message,
      });
    }
  }

  const hasAnyFailure = !result.cover?.url || result.scenes.some((s) => !s.url);
  if (hasAnyFailure && result.cover?.url) {
    result.status = 'partial';
  } else if (!result.cover?.url && result.scenes.every((s) => !s.url)) {
    result.status = 'failed';
  }

  await pool.query(
    'UPDATE generated_stories SET illustration_plan = $2::jsonb, updated_at = NOW() WHERE id = $1',
    [storyId, JSON.stringify(result)]
  );

  return result;
}
