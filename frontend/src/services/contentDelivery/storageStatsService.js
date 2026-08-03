/**
 * Smart storage stats over IndexedDB downloads + blobs.
 * Optimizer protects favorites when preference is on and honors soft limits.
 */

import {
  auditOfflineDownloads,
  getDownloads,
  isUserCriticalDownload,
  offlineContentIds,
  removeDownload,
} from '../offline/offlineContentService';
import { offlineDb } from '../offline/offlineDb';
import { storage } from '../../utils/storage';
import { getLocalCatalogState } from './catalogDeliveryService';
import { formatBytes } from './downloadQueueService';
import { getOfflinePrefs } from './offlinePrefs';
import { recordOfflineEvent } from './offlineAnalyticsService';

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

export function classifyStoragePressure(disk = {}) {
  const quota = Number(disk.quota || 0);
  const usage = Number(disk.usage || 0);
  const available = Number(disk.available || 0);
  if (!quota) return 'unknown';
  const usageRatio = usage / quota;
  const availableRatio = available / quota;
  if (usageRatio >= 0.95 || availableRatio <= 0.03) return 'critical';
  if (usageRatio >= 0.9 || availableRatio <= 0.08) return 'warning';
  return 'healthy';
}

function favoriteDownloadIds() {
  try {
    return new Set((storage.getFavorites() || []).map((id) => offlineContentIds.book(id)));
  } catch {
    return new Set();
  }
}

export async function getStorageStats() {
  const [downloads, blobBytes, disk, catalog, lastIntegrityAudit] = await Promise.all([
    getDownloads({ includeRestricted: true }),
    estimateBlobBytes(),
    estimateAvailableStorage(),
    getLocalCatalogState(),
    offlineDb.get(offlineDb.stores.metadata, 'offline:integrity:last-audit').catch(() => null),
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
  const prefs = getOfflinePrefs();
  const protectedIds = prefs.protectFavorites ? favoriteDownloadIds() : new Set();

  return {
    downloadedBytes: blobBytes,
    downloadedBytesLabel: formatBytes(blobBytes),
    availableBytes: disk.available,
    availableBytesLabel: formatBytes(disk.available),
    quotaBytes: disk.quota,
    usageBytes: disk.usage,
    storagePressure: classifyStoragePressure(disk),
    lastSync: catalog.lastSync,
    catalogVersion: catalog.active?.version || null,
    softLimit: prefs.softLimit,
    protectFavorites: prefs.protectFavorites,
    integrity: lastIntegrityAudit?.value || null,
    counts: {
      total: downloads.length,
      books: books.length,
      packs: packs.length,
      failed: failed.length,
      downloading: downloading.length,
      protected: [...protectedIds].filter((id) => downloads.some((d) => d.id === id)).length,
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
  const removable = failed.filter((item) => !isUserCriticalDownload(item) && !(item.assetKeys || []).length);
  await Promise.all(removable.map((item) => removeDownload(item.id, {
    syncCloud: false,
    reason: 'clear_failed_downloads'
  })));
  return removable.length;
}

/**
 * Smart optimize:
 * 1) remove failed
 * 2) remove oldest non-protected completed items beyond soft limit
 * 3) if quota nearly full, keep trimming unprotected oldest
 */
export async function optimizeStorage({ aggressive = false, automatic = false } = {}) {
  const prefs = getOfflinePrefs();
  const integrity = await auditOfflineDownloads({ repair: true, removeOrphans: aggressive && !automatic });
  const downloads = await getDownloads({ includeRestricted: true });
  const protectedIds = prefs.protectFavorites ? favoriteDownloadIds() : new Set();

  const failed = automatic
    ? []
    : downloads.filter((d) => (
      d.status === 'failed'
      && !isUserCriticalDownload(d)
      && !(d.assetKeys || []).length
    ));
  await Promise.all(failed.map((item) => removeDownload(item.id, {
    syncCloud: false,
    reason: 'storage_optimize_failed'
  })));

  const completed = downloads
    .filter((d) => d.status === 'downloaded' && d.type !== 'pack')
    .filter((d) => !protectedIds.has(d.id))
    .filter((d) => !isUserCriticalDownload(d))
    .sort((a, b) => String(a.updatedAt || '').localeCompare(String(b.updatedAt || '')));

  const softLimit = prefs.softLimit;
  const protectedCount = downloads.filter(
    (d) => d.status === 'downloaded' && d.type !== 'pack' && protectedIds.has(d.id),
  ).length;
  const allowedUnprotected = Math.max(0, softLimit - protectedCount);
  let excess = completed.slice(0, Math.max(0, completed.length - allowedUnprotected));

  if (aggressive && !automatic) {
    const disk = await estimateAvailableStorage();
    if (disk.quota && disk.usage / disk.quota > 0.9) {
      excess = completed;
    }
  }

  await Promise.all(excess.map((item) => removeDownload(item.id, {
    syncCloud: false,
    reason: aggressive ? 'storage_optimize_aggressive' : 'storage_optimize_soft_limit'
  })));

  const result = {
    removedFailed: failed.length,
    removedOld: excess.length,
    protectedKept: protectedCount,
    preservedCritical: downloads.filter((d) => isUserCriticalDownload(d)).length,
    automatic,
    repairedCorrupted: integrity.repaired || 0,
    removedOrphans: integrity.removedOrphans || 0,
  };

  await recordOfflineEvent('optimize_run', {
    removed: result.removedFailed + result.removedOld + result.removedOrphans,
    repaired: result.repairedCorrupted,
  });

  return result;
}

export async function clearAllOfflineCache({ keepFavorites = false } = {}) {
  const downloads = await getDownloads({ includeRestricted: true });
  const protectedIds = keepFavorites && getOfflinePrefs().protectFavorites
    ? favoriteDownloadIds()
    : new Set();

  const removable = downloads.filter((d) => !protectedIds.has(d.id));
  await Promise.all(removable.map((item) => removeDownload(item.id, {
    syncCloud: false,
    reason: 'clear_offline_cache'
  })));

  if (!keepFavorites) {
    try {
      await offlineDb.clear(offlineDb.stores.blobs);
    } catch {
      /* ignore */
    }
  } else {
    await auditOfflineDownloads({ repair: false, removeOrphans: true }).catch(() => {});
  }

  return removable.length;
}

/** Suggest items the optimizer would remove (for parent UI). */
export async function suggestCacheCleanup() {
  const prefs = getOfflinePrefs();
  const downloads = await getDownloads({ includeRestricted: true });
  const protectedIds = prefs.protectFavorites ? favoriteDownloadIds() : new Set();
  const failed = downloads.filter((d) => d.status === 'failed');
  const completed = downloads
    .filter((d) => d.status === 'downloaded' && d.type !== 'pack')
    .filter((d) => !protectedIds.has(d.id))
    .filter((d) => !isUserCriticalDownload(d))
    .sort((a, b) => String(a.updatedAt || '').localeCompare(String(b.updatedAt || '')));

  const protectedCount = downloads.filter(
    (d) => d.status === 'downloaded' && d.type !== 'pack' && protectedIds.has(d.id),
  ).length;
  const allowedUnprotected = Math.max(0, prefs.softLimit - protectedCount);
  const excess = completed.slice(0, Math.max(0, completed.length - allowedUnprotected));

  return {
    failed,
    excess,
    protectedCount,
    softLimit: prefs.softLimit,
  };
}
