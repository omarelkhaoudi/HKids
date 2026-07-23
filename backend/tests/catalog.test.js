import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, CATALOG_STATS } from '../content/catalog.js';
import { LEARNING_CATALOG } from '../content/learningCatalog.js';
import { STORY_TEMPLATES } from '../content/storyTemplatesCatalog.js';

test('demo catalog meets minimum content targets', () => {
  assert.ok(CATALOG_STATS.total >= 270, `total books: ${CATALOG_STATS.total}`);
  assert.ok(CATALOG_STATS.audio_stories >= 30, `audio stories: ${CATALOG_STATS.audio_stories}`);
  assert.ok(CATALOG_STATS.songs >= 20, `comptines: ${CATALOG_STATS.songs}`);
  assert.ok(CATALOG_STATS.religious >= 10, `religious: ${CATALOG_STATS.religious}`);
  assert.ok(CATALOG_STATS.illustrated_stories >= 90, `illustrated: ${CATALOG_STATS.illustrated_stories}`);
  assert.ok(CATALOG_STATS.premium_expansion >= 100, `premium expansion: ${CATALOG_STATS.premium_expansion}`);
  assert.equal(CATALOG_STATS.plus_100_expansion, 100, `plus-100: ${CATALOG_STATS.plus_100_expansion}`);
});

test('catalog items expose required metadata fields', () => {
  const slugs = new Set();
  for (const item of CATALOG) {
    assert.ok(item.slug, 'slug required');
    assert.equal(slugs.has(item.slug), false, `duplicate slug ${item.slug}`);
    slugs.add(item.slug);
    assert.ok(item.title);
    assert.ok(item.content_type);
    assert.ok(item.language);
    assert.ok(item.theme);
    assert.ok(item.category_name);
    assert.ok(Number.isFinite(item.age_group_min));
    assert.ok(Number.isFinite(item.age_group_max));
    assert.ok(item.emoji);
    assert.ok(Array.isArray(item.gradient) && item.gradient.length === 2);
  }
});

test('premium expansion books are localized en/ar', () => {
  const premium = CATALOG.filter((item) => String(item.slug || '').startsWith('prem-'));
  assert.ok(premium.length >= 100);
  for (const item of premium) {
    assert.ok(item.localizations?.en?.title, `${item.slug} missing EN title`);
    assert.ok(item.localizations?.ar?.title, `${item.slug} missing AR title`);
    assert.ok(item.localizations?.en?.description, `${item.slug} missing EN description`);
    assert.ok(item.localizations?.ar?.description, `${item.slug} missing AR description`);
  }
});

test('plus-100 expansion is complete and unique', () => {
  const plus = CATALOG.filter((item) => String(item.slug || '').startsWith('plus-'));
  assert.equal(plus.length, 100);
  const titles = new Set();
  for (const item of plus) {
    assert.ok(item.localizations?.en?.title, `${item.slug} missing EN`);
    assert.ok(item.localizations?.ar?.title, `${item.slug} missing AR`);
    assert.ok(item.pages?.length >= 5, `${item.slug} needs 5+ pages`);
    assert.ok(Number.isFinite(item.duration_seconds) && item.duration_seconds > 0, `${item.slug} duration`);
    assert.equal(titles.has(item.title), false, `duplicate title ${item.title}`);
    titles.add(item.title);
  }
});

test('learning catalog contains 20 quizzes and 20 games', () => {
  const quizzes = LEARNING_CATALOG.filter((item) => item.content_type !== 'game');
  const games = LEARNING_CATALOG.filter((item) => item.content_type === 'game');
  assert.equal(quizzes.length, 20);
  assert.equal(games.length, 20);
  for (const item of LEARNING_CATALOG) {
    assert.ok(item.slug);
    assert.ok(item.difficulty);
    assert.ok(item.metadata?.level);
    assert.ok(Array.isArray(item.metadata?.tags));
  }
});

test('story templates catalog has 10 customizable entries', () => {
  assert.equal(STORY_TEMPLATES.length, 10);
  for (const template of STORY_TEMPLATES) {
    assert.ok(template.slug);
    assert.equal(template.prompt_metadata?.customizable, true);
    assert.ok(template.story_text.length > 20);
  }
});

test('catalog covers all age bands', () => {
  const bands = {
    '2-4': CATALOG.some((item) => item.age_group_min <= 4 && item.age_group_max >= 2),
    '5-7': CATALOG.some((item) => item.age_group_min <= 7 && item.age_group_max >= 5),
    '8-10': CATALOG.some((item) => item.age_group_min <= 10 && item.age_group_max >= 8),
  };
  assert.equal(bands['2-4'], true);
  assert.equal(bands['5-7'], true);
  assert.equal(bands['8-10'], true);
});

test('every catalog book has complete reading pages', () => {
  for (const item of CATALOG) {
    assert.ok(Array.isArray(item.pages), `${item.slug} must expose pages`);
    assert.ok(item.pages.length >= 4, `${item.slug} must have at least 4 pages (${item.pages.length})`);
    for (const [index, page] of item.pages.entries()) {
      assert.ok(typeof page.text === 'string' && page.text.trim().length > 12, `${item.slug} page ${index + 1} needs text`);
    }
  }
});
