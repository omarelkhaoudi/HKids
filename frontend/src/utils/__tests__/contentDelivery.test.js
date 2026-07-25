import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/offline/offlineContentService', () => ({
  getDownload: vi.fn(async () => null),
  downloadBook: vi.fn(async () => ({ status: 'downloaded' })),
  offlineContentIds: { book: (id) => `book:${id}` },
}));

vi.mock('../../services/contentDelivery/offlineAnalyticsService', () => ({
  recordOfflineEvent: vi.fn(async () => ({})),
  getOfflineAnalytics: vi.fn(async () => ({})),
}));

import {
  categorizeHistory,
  isNewerCatalogVersion,
} from '../../services/contentDelivery/catalogDeliveryService';
import {
  formatBytes,
  formatEta,
  getQueueSnapshot,
  pauseJob,
  upsertJob,
  cancelJob,
  clearJob,
  markJobComplete,
} from '../../services/contentDelivery/downloadQueueService';
import {
  DOWNLOAD_PRIORITY,
  bookJobId,
  enqueueBookDownload,
  getOrderedJobs,
} from '../../services/contentDelivery/smartDownloadService';
import {
  getOfflinePrefs,
  setOfflinePref,
  OFFLINE_PREF_KEYS,
  shouldDeferForNetwork,
} from '../../services/contentDelivery/offlinePrefs';

describe('catalogDeliveryService', () => {
  it('compares semver versions correctly', () => {
    expect(isNewerCatalogVersion('1.0.1', '1.0.0')).toBe(true);
    expect(isNewerCatalogVersion('1.1.0', '1.0.9')).toBe(true);
    expect(isNewerCatalogVersion('2.0.0', '1.9.9')).toBe(true);
    expect(isNewerCatalogVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerCatalogVersion('1.0.0', '1.0.1')).toBe(false);
    expect(isNewerCatalogVersion('1.0.0', null)).toBe(true);
  });

  it('groups update history by category', () => {
    const groups = categorizeHistory([
      { id: '1', type: 'added', category: 'stories', summary: 'New dino story' },
      { id: '2', type: 'updated', category: 'stories', summary: 'Cover refresh' },
      { id: '3', type: 'removed', category: 'stories', summary: 'Retired title' },
      { id: '4', type: 'added', category: 'quizzes', summary: 'Space quiz' },
      { id: '5', type: 'added', category: 'games', summary: 'Memory game' },
      { id: '6', type: 'added', category: 'worlds', summary: 'Science world' },
      { id: '7', type: 'rollback', category: 'stories', summary: 'Rollback' },
    ]);
    expect(groups.added).toHaveLength(1);
    expect(groups.updated).toHaveLength(1);
    expect(groups.removed).toHaveLength(1);
    expect(groups.quizzes).toHaveLength(1);
    expect(groups.games).toHaveLength(1);
    expect(groups.worlds).toHaveLength(1);
    expect(groups.rollback).toHaveLength(1);
  });
});

describe('downloadQueueService', () => {
  beforeEach(() => {
    clearJob('pack:test');
    clearJob(bookJobId(42));
    clearJob(bookJobId(7));
  });

  it('tracks progress, pause and cancel', () => {
    upsertJob('pack:test', { status: 'downloading', progress: 40, label: 'Test' });
    expect(getQueueSnapshot().jobs['pack:test'].progress).toBe(40);
    pauseJob('pack:test');
    expect(getQueueSnapshot().jobs['pack:test'].status).toBe('paused');
    cancelJob('pack:test');
    expect(getQueueSnapshot().jobs['pack:test'].status).toBe('cancelled');
    markJobComplete('pack:test');
    expect(getQueueSnapshot().jobs['pack:test'].progress).toBe(100);
  });

  it('formats bytes and ETA', () => {
    expect(formatBytes(512)).toContain('B');
    expect(formatBytes(2048)).toContain('KB');
    expect(formatBytes(2_000_000)).toContain('MB');
    expect(formatEta(30)).toBe('30s');
    expect(formatEta(120)).toContain('m');
    expect(formatEta(null)).toBe('—');
  });

  it('orders jobs by priority', () => {
    upsertJob(bookJobId(1), { status: 'queued', priority: DOWNLOAD_PRIORITY.PREDICTIVE, label: 'low' });
    upsertJob(bookJobId(2), { status: 'queued', priority: DOWNLOAD_PRIORITY.FAVORITE, label: 'high' });
    upsertJob(bookJobId(3), { status: 'queued', priority: DOWNLOAD_PRIORITY.MANUAL, label: 'mid' });
    const ordered = getOrderedJobs();
    expect(ordered[0].priority).toBe(DOWNLOAD_PRIORITY.FAVORITE);
    expect(ordered[1].priority).toBe(DOWNLOAD_PRIORITY.MANUAL);
    expect(ordered[2].priority).toBe(DOWNLOAD_PRIORITY.PREDICTIVE);
    clearJob(bookJobId(1));
    clearJob(bookJobId(2));
    clearJob(bookJobId(3));
  });
});

describe('offlinePrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads defaults and persists toggles', () => {
    const defaults = getOfflinePrefs();
    expect(defaults.autoDownloadFavorites).toBe(false);
    expect(defaults.predictiveDownloads).toBe(true);
    expect(defaults.protectFavorites).toBe(true);

    setOfflinePref(OFFLINE_PREF_KEYS.autoDownloadFavorites, true);
    setOfflinePref(OFFLINE_PREF_KEYS.wifiOnly, true);
    const next = getOfflinePrefs();
    expect(next.autoDownloadFavorites).toBe(true);
    expect(next.wifiOnly).toBe(true);
  });

  it('defers on cellular when wifi-only is enabled', () => {
    setOfflinePref(OFFLINE_PREF_KEYS.wifiOnly, true);
    const original = navigator.connection;
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { type: 'cellular', effectiveType: '4g' },
    });
    expect(shouldDeferForNetwork()).toBe(true);
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { type: 'wifi', effectiveType: '4g' },
    });
    expect(shouldDeferForNetwork()).toBe(false);
    Object.defineProperty(navigator, 'connection', { configurable: true, value: original });
  });
});

describe('smartDownloadService dedupe', () => {
  beforeEach(() => {
    clearJob(bookJobId(99));
  });

  it('skips duplicate enqueue while job is already queued', async () => {
    const book = { id: 99, title: 'Moon Story' };
    upsertJob(bookJobId(99), {
      status: 'queued',
      priority: DOWNLOAD_PRIORITY.MANUAL,
      label: book.title,
      kind: 'book',
      sourceId: 99,
    });
    const second = await enqueueBookDownload(book, {
      priority: DOWNLOAD_PRIORITY.PREDICTIVE,
      reason: 'predictive',
    });
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('already_queued');
    const promoted = await enqueueBookDownload(book, {
      priority: DOWNLOAD_PRIORITY.FAVORITE,
      reason: 'favorite',
    });
    expect(promoted.accepted).toBe(false);
    expect(getQueueSnapshot().jobs[bookJobId(99)].priority).toBe(DOWNLOAD_PRIORITY.FAVORITE);
  });
});
