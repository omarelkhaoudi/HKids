import { describe, expect, it, vi } from 'vitest';
import {
  beginSync,
  completeSync,
  getSyncStatus,
  SYNC_PHASE,
  subscribeSyncStatus,
} from '../../services/offline/syncStatusService.js';

describe('syncStatusService', () => {
  it('tracks syncing and success phases', () => {
    const states = [];
    const unsubscribe = subscribeSyncStatus((status) => states.push(status.phase));

    beginSync({ queuePending: 2 });
    completeSync({ queueSynced: 2, queueFailed: 0, queuePending: 0, cloudUnchanged: true });

    expect(states).toContain(SYNC_PHASE.syncing);
    expect(getSyncStatus().phase).toBe(SYNC_PHASE.success);
    unsubscribe();
  });
});

describe('cloud sync hydration', () => {
  it('stores last cloud favorites after hydration', async () => {
    localStorage.clear();
    const { hydrateLocalFromCloud } = await import('../../services/cloud/cloudSyncService.js');

    hydrateLocalFromCloud({
      favorites: [{ book_id: 1 }, { book_id: 3 }],
      history: { reading: [], listening: [] },
      progress: [],
      downloads: [],
    }, 42);

    const lastCloud = JSON.parse(localStorage.getItem('hkids_last_cloud_favorites:kid:42') || '[]');
    expect(lastCloud.sort((a, b) => a - b)).toEqual([1, 3]);
    localStorage.clear();
  });

  it('merges remote reading progress into local sessions', async () => {
    localStorage.clear();
    localStorage.setItem('hkids_reading_stats:kid:7', JSON.stringify({
      sessions: [{ bookId: 10, currentPage: 2, totalPages: 12, finished: false }],
      completedBookIds: [],
    }));

    const { hydrateLocalFromCloud } = await import('../../services/cloud/cloudSyncService.js');
    hydrateLocalFromCloud({
      favorites: [],
      history: { reading: [], listening: [] },
      progress: [{ book_id: 10, current_page: 8, total_pages: 12, completed: false }],
      downloads: [],
    }, 7);

    const stats = JSON.parse(localStorage.getItem('hkids_reading_stats:kid:7') || '{}');
    expect(stats.sessions[0].currentPage).toBe(8);
    localStorage.clear();
  });
});

describe('browserTextToSpeech fallback', () => {
  it('reports browser support helper', async () => {
    const { isTextToSpeechSupported } = await import('../../services/ai/browserTextToSpeech.js');
    expect(typeof isTextToSpeechSupported()).toBe('boolean');
  });

  it('falls back to server synthesis when browser speech is unavailable', async () => {
    vi.stubGlobal('speechSynthesis', null);
    vi.stubGlobal('localStorage', {
      getItem: () => 'token',
      setItem: () => {},
      removeItem: () => {},
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(['audio'], { type: 'audio/mpeg' }),
    })));
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:audio'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('Audio', class {
      constructor() {
        queueMicrotask(() => this.onended?.());
      }
      play() {
        return Promise.resolve();
      }
      pause() {}
    });

    const { speakText } = await import('../../services/ai/browserTextToSpeech.js');
    const result = await speakText('Bonjour', { language: 'fr-FR' });
    expect(result.provider).toBe('server');
    expect(result.fallback).toBe(true);
  });
});
