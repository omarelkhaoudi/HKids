import { beforeEach, describe, expect, it } from 'vitest';
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
});
