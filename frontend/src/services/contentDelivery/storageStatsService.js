/**
 * Smart storage stats over IndexedDB downloads + blobs.
 */

import { getDownloads } from '../offline/offlineContentService';
import { offlineDb } from '../offline/offlineDb';
import { getLocalCatalogState } from './catalogDeliveryService';
import { formatBytes } from './downloadQueueService';

async function estimateBlobBytes() {
  try {
    const blobs = await offlineDb.getAll(offlineDb.stores.blobs);
    return blobs.reduce((sum, entry) => sum + (entry?.blob?.size || 0), 0);
  } catch {
    return 0;
  }
}

async function estimateAvailableStorage() {
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: Math.max(0, (estimate.quota || 0) - (estimate.usage || 0)),
      };
    }
  } catch {
    /* ignore */
  }
  return { quota: 0, usage: 0, available: 0 };
}

export async function getStorageStats() {
  const [downloads, blobBytes, disk, catalog] = await Promise.all([
    getDownloads({ includeRestricted: true }),
    estimateBlobBytes(),
    estimateAvailableStorage(),
    getLocalCatalogState(),
  ]);

  const byType = downloads.reduce((acc, item) => {
    const key = item.type || 'other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const packs = downloads.filter((d) => d.type === 'pack');
  const books = downloads.filter((d) => d.type === 'book' && d.status === 'downloaded');
  const failed = downloads.filter((d) => d.status === 'failed');
  const downloading = downloads.filter((d) => d.status === 'downloading' || d.status === 'paused');

  return {
    downloadedBytes: blobBytes,
    downloadedBytesLabel: formatBytes(blobBytes),
    availableBytes: disk.available,
    availableBytesLabel: formatBytes(disk.available),
    quotaBytes: disk.quota,
    usageBytes: disk.usage,
    lastSync: catalog.lastSync,
    catalogVersion: catalog.active?.version || null,
    counts: {
      total: downloads.length,
      books: books.length,
      packs: packs.length,
      failed: failed.length,
      downloading: downloading.length,
      byType,
    },
    packs: packs.map((p) => ({
      id: p.id,
      sourceId: p.sourceId,
      title: p.title,
      status: p.status,
      progress: p.progress || 0,
      updatedAt: p.updatedAt,
      bytes: p.bytes || 0,
    })),
  };
}

export async function clearFailedDownloads() {
  const downloads = await getDownloads({ includeRestricted: true });
  const failed = downloads.filter((d) => d.status === 'failed');
  const { removeDownload } = await import('../offline/offlineContentService');
  await Promise.all(failed.map((item) => removeDownload(item.id)));
  return failed.length;
}

export async function optimizeStorage() {
  const downloads = await getDownloads({ includeRestricted: true });
  const { removeDownload } = await import('../offline/offlineContentService');

  // Remove failed first, then oldest completed beyond soft limit (50)
  const failed = downloads.filter((d) => d.status === 'failed');
  await Promise.all(failed.map((item) => removeDownload(item.id)));

  const completed = downloads
    .filter((d) => d.status === 'downloaded' && d.type !== 'pack')
    .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));

  const softLimit = 50;
  const excess = completed.slice(0, Math.max(0, completed.length - softLimit));
  await Promise.all(excess.map((item) => removeDownload(item.id)));

  return {
    removedFailed: failed.length,
    removedOld: excess.length,
  };
}

export async function clearAllOfflineCache() {
  const downloads = await getDownloads({ includeRestricted: true });
  const { removeDownload } = await import('../offline/offlineContentService');
  await Promise.all(downloads.map((item) => removeDownload(item.id)));
  try {
    await offlineDb.clear(offlineDb.stores.blobs);
  } catch {
    /* ignore */
  }
  return downloads.length;
}
