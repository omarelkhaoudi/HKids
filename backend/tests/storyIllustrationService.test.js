import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitStoryIntoScenes, buildScenePrompt, buildStoryCoverPrompt } from '../services/ai/storyIllustrationService.js';

describe('splitStoryIntoScenes', () => {
  it('splits paragraphs into scenes', () => {
    const text = [
      'Il etait une fois un petit dragon vert qui vivait dans une grotte.',
      '',
      'Un jour, il decida de partir a l aventure dans la foret enchantee.',
      '',
      'Il rencontra un lapin bleu qui devint son meilleur ami.',
      '',
      'Ensemble, ils trouverent un tresor magique cache sous un chene.',
      '',
      'Ils rentrerent chez eux heureux et s endormirent sous les etoiles.',
    ].join('\n');

    const scenes = splitStoryIntoScenes(text, { maxScenes: 3 });
    assert.ok(scenes.length <= 3, `Expected max 3 scenes but got ${scenes.length}`);
    assert.ok(scenes[0].excerpt.length > 0, 'First scene should have content');
    assert.strictEqual(scenes[0].index, 0);
  });

  it('returns all paragraphs when fewer than maxScenes', () => {
    const text = 'Premier paragraphe long assez pour passer le filtre.\n\nDeuxieme paragraphe long assez pour passer le filtre.';
    const scenes = splitStoryIntoScenes(text, { maxScenes: 5 });
    assert.strictEqual(scenes.length, 2);
  });

  it('filters out very short paragraphs', () => {
    const text = 'OK\n\nUn paragraphe assez long pour etre considere comme un scene.';
    const scenes = splitStoryIntoScenes(text);
    assert.strictEqual(scenes.length, 1);
  });
});

describe('buildScenePrompt', () => {
  it('includes title and scene excerpt', () => {
    const story = { title: 'Le Dragon Vert', theme: 'aventure' };
    const scene = { index: 0, excerpt: 'Le dragon vole au dessus des montagnes.' };
    const prompt = buildScenePrompt(story, scene);

    assert.ok(prompt.includes('Le Dragon Vert'), 'Should include title');
    assert.ok(prompt.includes('dragon vole'), 'Should include excerpt');
    assert.ok(prompt.includes('adventure'), 'Should include theme hint');
    assert.ok(prompt.includes('No text'), 'Should forbid text');
  });
});

describe('buildStoryCoverPrompt', () => {
  it('builds a kid-safe cover prompt', () => {
    const story = { title: 'Space Explorer', theme: 'espace', summary: 'A child travels to the moon.' };
    const prompt = buildStoryCoverPrompt(story);

    assert.ok(prompt.includes('Space Explorer'), 'Should include title');
    assert.ok(prompt.includes('starry sky'), 'Should include space theme hint');
    assert.ok(prompt.includes('kid-safe'), 'Should be kid-safe');
    assert.ok(prompt.includes('No text'), 'Should forbid text');
  });

  it('handles missing theme gracefully', () => {
    const story = { title: 'My Story', theme: '', summary: '' };
    const prompt = buildStoryCoverPrompt(story);
    assert.ok(prompt.includes('My Story'));
    assert.ok(prompt.includes('warm cozy'), 'Should use default hint');
  });
});

describe('illustrationQueue exports', async () => {
  const { enqueueIllustrationJob, getIllustrationJobStatus, getQueueStats } = await import('../services/ai/illustrationQueue.js');

  it('getQueueStats returns stats object', () => {
    const stats = getQueueStats();
    assert.strictEqual(typeof stats.queued, 'number');
    assert.strictEqual(typeof stats.active, 'number');
    assert.strictEqual(typeof stats.completed, 'number');
  });

  it('getIllustrationJobStatus returns unknown for non-existent', () => {
    const status = getIllustrationJobStatus(999999);
    assert.strictEqual(status.status, 'unknown');
  });
});
