import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasCloudSyncChanges,
  normalizeDownloadChange,
  sanitizeCloudSyncChanges,
} from '../services/cloud/cloudSyncService.js';

test('sanitizeCloudSyncChanges bounds and normalizes offline payloads', () => {
  const clean = sanitizeCloudSyncChanges({
    favorites: {
      add: [1, '2', 'bad', 2, -1],
      remove: [{ book_id: 3 }, { bookId: 0 }],
      favorited_at: 'bad-date',
    },
    progress: [
      {
        book_id: '9',
        current_page: 12.7,
        total_pages: 10_000,
        duration_seconds: 100_000,
        completed: true,
        client_session_id: 'session-1',
      },
      { book_id: 'nope' },
    ],
    history: {
      reading: [{ bookId: 4, page: -2, lastRead: '2026-08-03T10:00:00.000Z' }],
      listening: [{ book_id: 5, listenedSeconds: 60, duration: 120, completed: true }],
    },
    downloads: [
      { content_type: 'book', content_id: '7', status: 'downloaded' },
      { content_type: 'script', content_id: '8', status: 'downloaded' },
      { content_type: 'book', content_id: '9', status: 'unknown' },
    ],
    preferences: {
      language: 'fr',
      darkMode: true,
      readingMode: 'audio',
      unexpected: '<script>',
    },
  });

  assert.deepEqual(clean.favorites.add, [1, 2]);
  assert.deepEqual(clean.favorites.remove, [3]);
  assert.equal(clean.favorites.favorited_at, null);
  assert.equal(clean.progress.length, 1);
  assert.equal(clean.progress[0].current_page, 12);
  assert.equal(clean.progress[0].total_pages, 2_000);
  assert.equal(clean.progress[0].duration_seconds, 86_400);
  assert.equal(clean.history.reading[0].last_page, 0);
  assert.equal(clean.downloads.length, 1);
  assert.equal(clean.downloads[0].content_type, 'book');
  assert.deepEqual(clean.preferences, {
    language: 'fr',
    darkMode: true,
    reading_mode: 'audio',
  });
});

test('normalizeDownloadChange rejects unsupported content and status', () => {
  assert.equal(normalizeDownloadChange({ content_type: 'book', content_id: 3 })?.status, 'downloaded');
  assert.equal(normalizeDownloadChange({ content_type: 'voice-message', content_id: '5', status: 'removed' })?.content_id, 5);
  assert.equal(normalizeDownloadChange({ content_type: 'unsafe', content_id: 3 }), null);
  assert.equal(normalizeDownloadChange({ content_type: 'book', content_id: 0 }), null);
  assert.equal(normalizeDownloadChange({ content_type: 'book', content_id: 3, status: 'failed' }), null);
});

test('hasCloudSyncChanges includes preference-only updates', () => {
  assert.equal(hasCloudSyncChanges({ preferences: { language: 'ar' } }), true);
  assert.equal(hasCloudSyncChanges({ preferences: { unexpected: 'value' } }), false);
  assert.equal(hasCloudSyncChanges({ downloads: [{ content_type: 'book', content_id: 1 }] }), true);
});
