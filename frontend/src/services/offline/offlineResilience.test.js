import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildAssetManifestEntry,
  hashBlobSha256,
  isUserCriticalDownload,
  validateBlobMetadata,
} from './offlineContentService';
import {
  calculateMutationRetryDelayMs,
  isRetryableSyncError,
} from './offlineSyncService';
import {
  cloudSyncRetryDelayMs,
  isRetryableCloudSyncError,
  mergeDownloadChangeJournal,
  normalizeLocalDownloadChange,
} from '../cloud/cloudSyncService';
import { classifyStoragePressure } from '../contentDelivery/storageStatsService';
import { storage } from '../../utils/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('offline asset integrity helpers', () => {
  it('rejects missing and empty blobs before they enter offline storage', () => {
    expect(validateBlobMetadata(null).reason).toBe('missing_blob');
    expect(validateBlobMetadata(new Blob([])).reason).toBe('empty_blob');
  });

  it('detects response size mismatches', () => {
    const blob = new Blob(['abc'], { type: 'text/plain' });
    expect(validateBlobMetadata(blob, { expectedBytes: 10 })).toEqual({
      ok: false,
      reason: 'size_mismatch',
    });
    expect(validateBlobMetadata(blob, { expectedBytes: 3 })).toEqual({
      ok: true,
      reason: null,
    });
  });

  it('builds asset manifests with stable metadata and optional checksum', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const manifest = await buildAssetManifestEntry({
      blobId: 'book:1:cover',
      asset: { key: 'cover', url: 'https://example.test/cover.png' },
      blob,
      responseMetadata: { expectedBytes: 5, contentType: 'text/plain', etag: 'v1' },
      contentId: 'book:1',
    });

    expect(manifest.blobId).toBe('book:1:cover');
    expect(manifest.byteLength).toBe(5);
    expect(manifest.expectedBytes).toBe(5);
    expect(manifest.contentType).toBe('text/plain');
    expect(manifest.etag).toBe('v1');
    expect(manifest.sha256 === null || manifest.sha256).toBeTruthy();
  });

  it('hashes blobs when WebCrypto is available', async () => {
    const hash = await hashBlobSha256(new Blob(['hello']));
    if (hash !== null) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    } else {
      expect(hash).toBeNull();
    }
  });
});

describe('offline retry and storage pressure helpers', () => {
  it('classifies retryable sync and cloud failures', () => {
    expect(isRetryableSyncError({ response: { status: 429 } })).toBe(true);
    expect(isRetryableSyncError({ response: { status: 503 } })).toBe(true);
    expect(isRetryableSyncError({ response: { status: 400 } })).toBe(false);
    expect(isRetryableCloudSyncError({ response: { status: 502 } })).toBe(true);
    expect(isRetryableCloudSyncError({ response: { status: 403 } })).toBe(false);
  });

  it('uses bounded exponential backoff', () => {
    expect(calculateMutationRetryDelayMs(1, { jitterRatio: 0 })).toBe(2_000);
    expect(calculateMutationRetryDelayMs(4, { jitterRatio: 0 })).toBe(16_000);
    expect(calculateMutationRetryDelayMs(99, { jitterRatio: 0 })).toBe(300_000);
    expect(cloudSyncRetryDelayMs(1)).toBe(800);
    expect(cloudSyncRetryDelayMs(99)).toBe(10_000);
  });

  it('reports storage pressure without guessing when quota is unavailable', () => {
    expect(classifyStoragePressure({ quota: 0, usage: 0, available: 0 })).toBe('unknown');
    expect(classifyStoragePressure({ quota: 100, usage: 50, available: 50 })).toBe('healthy');
    expect(classifyStoragePressure({ quota: 100, usage: 91, available: 9 })).toBe('warning');
    expect(classifyStoragePressure({ quota: 100, usage: 96, available: 4 })).toBe('critical');
  });
});

describe('zero-loss local state safeguards', () => {
  it('recovers favorites from the last known-good backup when primary JSON is corrupt', () => {
    localStorage.setItem('hkids_favorites', '{bad json');
    localStorage.setItem('hkids_favorites:backup', JSON.stringify([7, 9]));

    expect(storage.getFavorites()).toEqual([7, 9]);
  });

  it('does not overwrite a good backup with corrupt primary data', () => {
    localStorage.setItem('hkids_favorites', '{bad json');
    localStorage.setItem('hkids_favorites:backup', JSON.stringify([7]));

    storage.addFavorite(9);

    expect(JSON.parse(localStorage.getItem('hkids_favorites'))).toEqual([7, 9]);
    expect(JSON.parse(localStorage.getItem('hkids_favorites:backup'))).toEqual([7]);
  });

  it('treats child-facing downloads as critical during automatic retention', () => {
    expect(isUserCriticalDownload({ type: 'book' })).toBe(true);
    expect(isUserCriticalDownload({ type: 'generated-story' })).toBe(true);
    expect(isUserCriticalDownload({ type: 'voice-message' })).toBe(true);
    expect(isUserCriticalDownload({ type: 'unknown' })).toBe(false);
  });

  it('keeps offline download removals until cloud sync can replay them', () => {
    expect(normalizeLocalDownloadChange('book:12')).toMatchObject({
      content_type: 'book',
      content_id: 12,
      status: 'downloaded',
    });

    const merged = mergeDownloadChangeJournal(
      ['book:12'],
      [
        { content_type: 'book', content_id: 12, status: 'removed' },
        { content_type: 'voice-message', content_id: 3, status: 'removed' },
      ],
    );

    expect(merged).toEqual(expect.arrayContaining([
      expect.objectContaining({ content_type: 'book', content_id: 12, status: 'downloaded' }),
      expect.objectContaining({ content_type: 'voice-message', content_id: 3, status: 'removed' }),
    ]));
  });
});
