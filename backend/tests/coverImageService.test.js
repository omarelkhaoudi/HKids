import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoverIllustrationPrompt } from '../content/coverPrompts.js';
import {
  coverPngFilename,
  resolveCoverImageProvider,
} from '../services/ai/coverImageService.js';

test('buildCoverIllustrationPrompt includes title and forbids text on cover', () => {
  const prompt = buildCoverIllustrationPrompt({
    title: 'Le petit dinosaure courageux',
    theme: 'dinosaurs',
    content_type: 'story',
    description: 'Une histoire douce sur la confiance.',
  });
  assert.match(prompt, /Le petit dinosaure courageux/);
  assert.match(prompt, /No text/i);
  assert.match(prompt, /dinosaur/i);
});

test('coverPngFilename uses slug', () => {
  assert.equal(coverPngFilename('demo-dino-courage'), 'demo-dino-courage-cover.png');
});

test('resolveCoverImageProvider prefers openai when key is set', () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  try {
    assert.equal(resolveCoverImageProvider(), 'openai');
    assert.equal(resolveCoverImageProvider('pollinations'), 'pollinations');
  } finally {
    process.env.OPENAI_API_KEY = previous;
  }
});

test('resolveCoverImageProvider falls back to pollinations without key', () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    assert.equal(resolveCoverImageProvider(), 'pollinations');
  } finally {
    process.env.OPENAI_API_KEY = previous;
  }
});
