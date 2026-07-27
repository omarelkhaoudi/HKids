import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, CATALOG_STATS } from '../content/catalog.js';
import { BOOK_CATEGORIES } from '../content/catalogMeta.js';
import { LEARNING_CATALOG } from '../content/learningCatalog.js';
import { RecommendationService } from '../services/ai/RecommendationService.js';

const REQUIRED_AREAS = [
  'audiobooks',
  'languages',
  'educational-activities',
  'religion',
  'rhymes',
  'science',
  'geography',
  'creativity',
  'characters',
];

test('final catalog meets production volume targets', () => {
  assert.ok(CATALOG_STATS.total >= 290, `total books: ${CATALOG_STATS.total}`);
  assert.ok(CATALOG_STATS.audio_stories >= 40, `audio stories: ${CATALOG_STATS.audio_stories}`);
  assert.ok(CATALOG_STATS.songs >= 20, `comptines: ${CATALOG_STATS.songs}`);
  assert.ok(CATALOG_STATS.religious >= 12, `religious: ${CATALOG_STATS.religious}`);
  assert.ok(CATALOG_STATS.illustrated_stories >= 100, `illustrated: ${CATALOG_STATS.illustrated_stories}`);
  assert.ok(CATALOG_STATS.final_expansion >= 20, `final expansion: ${CATALOG_STATS.final_expansion}`);
  assert.equal(CATALOG_STATS.localized_en_ar, CATALOG.length);
});

test('catalog covers all requested educational areas', () => {
  for (const area of REQUIRED_AREAS) {
    const count = CATALOG_STATS.catalog_areas[area] || 0;
    assert.ok(count >= 3, `${area} coverage too low: ${count}`);
  }
});

test('every catalog item has production metadata', () => {
  const categoryNames = new Set(BOOK_CATEGORIES.map((category) => category.name));
  const slugs = new Set();

  for (const item of CATALOG) {
    assert.ok(item.slug, 'slug required');
    assert.equal(slugs.has(item.slug), false, `duplicate slug ${item.slug}`);
    slugs.add(item.slug);
    assert.ok(item.title);
    assert.ok(item.description);
    assert.ok(item.content_type);
    assert.ok(item.theme);
    assert.ok(categoryNames.has(item.category_name), `unknown category ${item.category_name}`);
    assert.ok(item.emoji);
    assert.ok(Array.isArray(item.gradient) && item.gradient.length === 2);
    assert.ok(Array.isArray(item.pages) && item.pages.length >= 4, `${item.slug} needs pages`);
    assert.ok(item.localizations?.en?.title && item.localizations?.ar?.title, `${item.slug} localizations`);
    assert.ok(item.metadata?.schema_version === 2, `${item.slug} metadata schema`);
    assert.ok(item.metadata?.catalog_area, `${item.slug} catalog_area`);
    assert.ok(Array.isArray(item.metadata?.search_terms) && item.metadata.search_terms.length > 0);
    assert.ok(item.metadata?.cover?.strategy);
    assert.equal(item.metadata.localization_status.en, true);
    assert.equal(item.metadata.localization_status.ar, true);
    assert.ok(!/[A-Za-z]{4}/.test(item.localizations.ar.title), `${item.slug} AR title mixed script`);
  }
});

test('category labels are localized for FR/EN/AR', () => {
  for (const category of BOOK_CATEGORIES) {
    assert.ok(category.name);
    assert.ok(category.en?.name);
    assert.ok(category.ar?.name);
    assert.ok(category.en?.description);
    assert.ok(category.ar?.description);
  }
});

test('learning catalog includes educational activities for final areas', () => {
  const quizzes = LEARNING_CATALOG.filter((item) => item.content_type !== 'game');
  const games = LEARNING_CATALOG.filter((item) => item.content_type === 'game');
  const activities = LEARNING_CATALOG.filter((item) => String(item.slug || '').startsWith('activity-'));
  assert.ok(quizzes.length >= 32, `quizzes: ${quizzes.length}`);
  assert.equal(games.length, 20);
  assert.ok(activities.length >= 12, `activities: ${activities.length}`);

  for (const code of ['languages', 'science', 'geography', 'creativity', 'values']) {
    assert.ok(
      LEARNING_CATALOG.some((item) => item.category_code === code),
      `missing learning category ${code}`
    );
  }
});

test('recommendation ranking prefers unfinished and localized content', async () => {
  const service = new RecommendationService({ aiProvider: { name: 'none', apiKey: '' } });
  const contents = [
    {
      id: 1,
      title: 'Science unfinished',
      language: 'fr',
      theme: 'science',
      category_id: 1,
      age_group_min: 5,
      age_group_max: 9,
      kid_progress_percent: 40,
      is_recommended: true,
      metadata: { catalog_area: 'science', editorial_rank: 90, localization_status: { fr: true, en: true, ar: true } },
    },
    {
      id: 2,
      title: 'Completed story',
      language: 'fr',
      theme: 'animals',
      category_id: 2,
      age_group_min: 5,
      age_group_max: 9,
      kid_progress_percent: 100,
      kid_completed: true,
      metadata: { catalog_area: 'stories', editorial_rank: 90, localization_status: { fr: true, en: true, ar: true } },
    },
    {
      id: 3,
      title: 'Discovery geography',
      language: 'fr',
      theme: 'geography',
      category_id: 3,
      age_group_min: 5,
      age_group_max: 9,
      metadata: { catalog_area: 'geography', editorial_rank: 80, localization_status: { fr: true, en: true, ar: true } },
    },
  ];

  const result = await service.recommendContent({
    kid: { age: 7, preferred_language: 'en', interests: ['science', 'map'] },
    contents,
    context: { language: 'en', favorites: [], readingHistory: [], listeningHistory: [], readingStats: {} },
  });

  const recommended = result.sections.find((section) => section.id === 'recommended_for_you')?.items || [];
  assert.ok(recommended.length >= 2);
  assert.equal(recommended[0].id, 1);
  assert.ok(!recommended.slice(0, 2).some((item) => item.id === 2));
});
