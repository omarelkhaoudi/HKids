import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLocale,
  isNarrationConfigured,
  getNarrationTracks,
} from '../services/ai/storyNarrationService.js';

describe('normalizeLocale', () => {
  it('returns fr for empty input', () => {
    assert.strictEqual(normalizeLocale(''), 'fr');
    assert.strictEqual(normalizeLocale(null), 'fr');
    assert.strictEqual(normalizeLocale(undefined), 'fr');
  });

  it('normalizes valid locales', () => {
    assert.strictEqual(normalizeLocale('fr'), 'fr');
    assert.strictEqual(normalizeLocale('en'), 'en');
    assert.strictEqual(normalizeLocale('ar'), 'ar');
    assert.strictEqual(normalizeLocale('EN'), 'en');
    assert.strictEqual(normalizeLocale('FR-FR'), 'fr');
  });

  it('falls back for unknown locales', () => {
    assert.strictEqual(normalizeLocale('de'), 'fr');
    assert.strictEqual(normalizeLocale('jp'), 'fr');
  });
});

describe('isNarrationConfigured', () => {
  it('returns a boolean', () => {
    const result = isNarrationConfigured();
    assert.strictEqual(typeof result, 'boolean');
  });
});

describe('getNarrationTracks', () => {
  it('returns empty tracks for null metadata', () => {
    const tracks = getNarrationTracks(null);
    assert.strictEqual(tracks.length, 3);
    assert.ok(tracks.every((t) => !t.available));
  });

  it('returns empty tracks for empty metadata', () => {
    const tracks = getNarrationTracks({});
    assert.strictEqual(tracks.length, 3);
    assert.ok(tracks.every((t) => !t.available));
  });

  it('returns available tracks when present', () => {
    const metadata = {
      tracks: {
        fr: { url: 'https://example.com/fr.mp3', generated_at: '2025-01-01' },
        en: { url: 'https://example.com/en.mp3', generated_at: '2025-01-01' },
      },
    };
    const tracks = getNarrationTracks(metadata);
    assert.strictEqual(tracks.length, 3);

    const fr = tracks.find((t) => t.locale === 'fr');
    assert.strictEqual(fr.available, true);
    assert.strictEqual(fr.url, 'https://example.com/fr.mp3');

    const en = tracks.find((t) => t.locale === 'en');
    assert.strictEqual(en.available, true);

    const ar = tracks.find((t) => t.locale === 'ar');
    assert.strictEqual(ar.available, false);
    assert.strictEqual(ar.url, null);
  });
});
