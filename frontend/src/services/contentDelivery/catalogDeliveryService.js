/**
 * Catalog delivery — version check, safe apply/rollback, update history.
 * Local state lives in IndexedDB metadata so offline mode keeps working.
 */

import { offlineAPI } from '../../api/offline';
import { downloadContentPack } from './contentPackDownloadService';
import { DOWNLOAD_PRIORITY, enqueueBookDownload } from './smartDownloadService';
import { booksAPI } from '../../api/books';
import { offlineDb } from '../offline/offlineDb';

const META_ACTIVE = 'catalog:active';
const META_PREVIOUS = 'catalog:previous';
const META_DISMISSED = 'catalog:dismissed-version';
const META_HISTORY = 'catalog:update-history';
const META_LAST_SYNC = 'catalog:last-sync';
const META_PENDING = 'catalog:pending-update';

const EVENT_NAME = 'hkids:catalog-update';

function nowIso() {
  return new Date().toISOString();
}

async function getMeta(key, fallback = null) {
  try {
    const row = await offlineDb.get(offlineDb.stores.metadata, key);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

async function setMeta(key, value) {
  await offlineDb.put(offlineDb.stores.metadata, { key, value, updatedAt: nowIso() });
}

function emitCatalogEvent(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function subscribeCatalogUpdates(listener) {
  const handler = (event) => listener(event.detail || {});
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export async function getLocalCatalogState() {
  const [active, previous, dismissed, history, lastSync, pending] = await Promise.all([
    getMeta(META_ACTIVE, null),
    getMeta(META_PREVIOUS, null),
    getMeta(META_DISMISSED, null),
    getMeta(META_HISTORY, []),
    getMeta(META_LAST_SYNC, null),
    getMeta(META_PENDING, null),
  ]);
  return {
    active,
    previous,
    dismissedVersion: dismissed,
    history: Array.isArray(history) ? history : [],
    lastSync,
    pending,
  };
}

function compareSemver(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => Number(n) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => Number(n) || 0);
  for (let i = 0; i < 3; i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

export function isNewerCatalogVersion(remoteVersion, localVersion) {
  if (!remoteVersion) return false;
  if (!localVersion) return true;
  return compareSemver(remoteVersion, localVersion) > 0;
}

/**
 * Check remote catalog against local. Never auto-forces an update.
 */
export async function checkCatalogUpdate({ force = false } = {}) {
  try {
    const response = await offlineAPI.getManifest();
    const catalog = response.data?.catalog || null;
    const local = await getLocalCatalogState();
    await setMeta(META_LAST_SYNC, nowIso());

    if (!catalog?.version) {
      return { available: false, catalog: null, local };
    }

    // Bootstrap local pointer if first run
    if (!local.active?.version) {
      await setMeta(META_ACTIVE, {
        version: catalog.version,
        versionId: catalog.version_id,
        publishedAt: catalog.published_at,
        packageBytes: catalog.package_bytes,
        fingerprint: catalog.content_fingerprint,
        changelog: catalog.changelog || [],
        packs: catalog.packs || [],
        appliedAt: nowIso(),
      });
      emitCatalogEvent({ type: 'bootstrapped', catalog });
      return { available: false, catalog, local: await getLocalCatalogState(), bootstrapped: true };
    }

    const newer = isNewerCatalogVersion(catalog.version, local.active.version);
    const dismissed = local.dismissedVersion === catalog.version;
    const available = newer && (!dismissed || force);

    if (available) {
      await setMeta(META_PENDING, {
        version: catalog.version,
        versionId: catalog.version_id,
        publishedAt: catalog.published_at,
        packageBytes: catalog.package_bytes,
        fingerprint: catalog.content_fingerprint,
        changelog: catalog.changelog || [],
        packs: catalog.packs || [],
        detectedAt: nowIso(),
      });
      emitCatalogEvent({ type: 'available', catalog });
    }

    return { available, catalog, local, dismissed };
  } catch (error) {
    console.warn('Catalog update check failed:', error);
    return { available: false, catalog: null, local: await getLocalCatalogState(), error };
  }
}

function buildHistoryEntries(pending, appliedAt) {
  const entries = [];
  for (const change of pending.changelog || []) {
    entries.push({
      id: `${pending.version}:${change.type}:${change.category}:${change.summary}`,
      version: pending.version,
      type: change.type || 'updated',
      category: change.category || 'stories',
      summary: change.summary || '',
      at: appliedAt,
    });
  }
  if (!entries.length) {
    entries.push({
      id: `${pending.version}:applied`,
      version: pending.version,
      type: 'updated',
      category: 'stories',
      summary: `Catalog ${pending.version}`,
      at: appliedAt,
    });
  }
  return entries;
}

async function enqueuePendingPackDownloads(packs = []) {
  const tasks = (Array.isArray(packs) ? packs : []).map(async (pack) => {
    if (!pack) return;
    if (pack.id || pack.pack_id) {
      await downloadContentPack(pack, { language: 'fr' }).catch(() => {});
      return;
    }
    const bookId = pack.book_id ?? pack.bookId;
    if (!bookId) return;
    try {
      const response = await booksAPI.getBook(bookId);
      await enqueueBookDownload(response.data, {
        priority: DOWNLOAD_PRIORITY.PACK,
        reason: 'catalog_update',
        label: response.data?.title,
      });
    } catch {
      /* best effort */
    }
  });
  await Promise.allSettled(tasks);
}

/**
 * Apply pending catalog metadata safely. Keeps previous snapshot for rollback.
 * Does not delete existing offline blobs — incremental reuse.
 */
export async function applyCatalogUpdate(pendingOverride = null) {
  const local = await getLocalCatalogState();
  const pending = pendingOverride || local.pending;
  if (!pending?.version) {
    const err = new Error('No pending catalog update');
    err.code = 'NO_PENDING_UPDATE';
    throw err;
  }

  const snapshot = local.active ? { ...local.active } : null;
  const appliedAt = nowIso();

  try {
    if (snapshot) {
      await setMeta(META_PREVIOUS, snapshot);
    }

    const nextActive = {
      version: pending.version,
      versionId: pending.versionId,
      publishedAt: pending.publishedAt,
      packageBytes: pending.packageBytes,
      fingerprint: pending.fingerprint,
      changelog: pending.changelog || [],
      packs: pending.packs || [],
      appliedAt,
    };

    await setMeta(META_ACTIVE, nextActive);

    const history = [
      ...buildHistoryEntries(pending, appliedAt),
      ...(local.history || []),
    ].slice(0, 100);
    await setMeta(META_HISTORY, history);
    await setMeta(META_PENDING, null);
    await setMeta(META_DISMISSED, null);
    await setMeta(META_LAST_SYNC, appliedAt);

    emitCatalogEvent({ type: 'applied', catalog: nextActive });
    enqueuePendingPackDownloads(pending.packs || []).catch(() => {});
    return { active: nextActive, previous: snapshot };
  } catch (error) {
    // Restore previous pointer if write failed mid-flight
    if (snapshot) {
      await setMeta(META_ACTIVE, snapshot).catch(() => {});
    }
    emitCatalogEvent({ type: 'failed', error: error?.message });
    throw error;
  }
}

export async function dismissCatalogUpdate(version) {
  const local = await getLocalCatalogState();
  const target = version || local.pending?.version;
  if (!target) return local;
  await setMeta(META_DISMISSED, target);
  emitCatalogEvent({ type: 'dismissed', version: target });
  return getLocalCatalogState();
}

/**
 * Roll back to previous local catalog snapshot without corrupting downloads.
 */
export async function rollbackLocalCatalog() {
  const local = await getLocalCatalogState();
  if (!local.previous) {
    const err = new Error('No previous catalog snapshot');
    err.code = 'NO_PREVIOUS_CATALOG';
    throw err;
  }
  const failed = local.active ? { ...local.active } : null;
  await setMeta(META_ACTIVE, local.previous);
  await setMeta(META_PREVIOUS, failed);
  await setMeta(META_PENDING, null);
  const appliedAt = nowIso();
  const history = [
    {
      id: `rollback:${local.previous.version}:${appliedAt}`,
      version: local.previous.version,
      type: 'rollback',
      category: 'stories',
      summary: `Rolled back to ${local.previous.version}`,
      at: appliedAt,
    },
    ...(local.history || []),
  ].slice(0, 100);
  await setMeta(META_HISTORY, history);
  emitCatalogEvent({ type: 'rolled_back', catalog: local.previous });
  return getLocalCatalogState();
}

export async function getUpdateHistory({ limit = 40 } = {}) {
  const local = await getLocalCatalogState();
  return (local.history || []).slice(0, limit);
}

export function categorizeHistory(history = []) {
  const groups = {
    added: [],
    updated: [],
    removed: [],
    quizzes: [],
    games: [],
    worlds: [],
    rollback: [],
  };
  for (const entry of history) {
    if (entry.type === 'rollback') groups.rollback.push(entry);
    else if (entry.category === 'quizzes') groups.quizzes.push(entry);
    else if (entry.category === 'games') groups.games.push(entry);
    else if (entry.category === 'worlds') groups.worlds.push(entry);
    else if (entry.type === 'removed') groups.removed.push(entry);
    else if (entry.type === 'added') groups.added.push(entry);
    else groups.updated.push(entry);
  }
  return groups;
}
