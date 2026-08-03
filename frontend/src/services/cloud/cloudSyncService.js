import { parentalAPI } from '../../api/parental';
import { offlineDb } from '../offline/offlineDb';
import { getPendingMutations } from '../offline/offlineSyncService';

const SYNC_METADATA_KEY = (kidId) => `cloud-sync-state:kid:${kidId}`;
const PROFILE_CACHE_KEY = (kidId) => `kid-profile-cache:kid:${kidId}`;
const LAST_CLOUD_FAVORITES_KEY = (kidId) => `hkids_last_cloud_favorites:kid:${kidId}`;
const SYNC_DIAGNOSTICS_KEY = (kidId) => `cloud-sync-diagnostics:kid:${kidId}`;
const DOWNLOAD_CHANGE_JOURNAL_KEY = (kidId) => `cloud-sync-download-changes:kid:${kidId}`;
const CLOUD_SYNC_TIMEOUT_MS = 15_000;
const MAX_CLOUD_SYNC_ATTEMPTS = 3;
const MAX_DOWNLOAD_CHANGES = 60;
const MAX_DOWNLOAD_CHANGE_JOURNAL = 120;
const RETRYABLE_CLOUD_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const ALLOWED_DOWNLOAD_TYPES = new Set(['book', 'generated-story', 'voice-message', 'pack', 'quiz', 'game']);
const ALLOWED_DOWNLOAD_STATUSES = new Set(['downloaded', 'removed']);

function currentKidUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === 'kid' && user?.kid_profile_id ? user : null;
  } catch {
    return null;
  }
}

function scopedKey(baseKey, kidId) {
  return kidId ? `${baseKey}:kid:${kidId}` : baseKey;
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function backupKey(key) {
  return `${key}:backup`;
}

function setJsonWithBackup(key, value) {
  const previous = localStorage.getItem(key);
  if (previous !== null) {
    try {
      JSON.parse(previous);
      localStorage.setItem(backupKey(key), previous);
    } catch {
      /* best effort backup */
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function snapshotLocalStorageKeys(keys) {
  return keys.reduce((snapshot, key) => {
    snapshot[key] = localStorage.getItem(key);
    return snapshot;
  }, {});
}

function restoreLocalStorageSnapshot(snapshot) {
  for (const [key, value] of Object.entries(snapshot || {})) {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }
}

function downloadChangeKey(change) {
  return `${change.content_type}:${change.content_id}`;
}

export function normalizeLocalDownloadChange(entry) {
  if (entry == null) return null;

  if (typeof entry === 'string' || typeof entry === 'number') {
    const raw = String(entry);
    if (raw.includes(':')) {
      const [contentType, contentId] = raw.split(':');
      return normalizeLocalDownloadChange({
        content_type: contentType,
        content_id: contentId,
        status: 'downloaded'
      });
    }
    return normalizeLocalDownloadChange({
      content_type: 'book',
      content_id: raw,
      status: 'downloaded'
    });
  }

  const contentType = String(entry.content_type || entry.contentType || '').trim();
  const contentId = Number(entry.content_id ?? entry.contentId);
  const status = entry.status || 'downloaded';
  if (!ALLOWED_DOWNLOAD_TYPES.has(contentType)) return null;
  if (!Number.isInteger(contentId) || contentId <= 0) return null;
  if (!ALLOWED_DOWNLOAD_STATUSES.has(status)) return null;

  return {
    content_type: contentType,
    content_id: contentId,
    status,
    downloaded_at: entry.downloaded_at || entry.downloadedAt || entry.changed_at || new Date().toISOString()
  };
}

export function mergeDownloadChangeJournal(currentDownloads = [], pendingChanges = []) {
  const byKey = new Map();

  for (const entry of pendingChanges) {
    const change = normalizeLocalDownloadChange(entry);
    if (change) byKey.set(downloadChangeKey(change), change);
  }

  for (const entry of currentDownloads) {
    const change = normalizeLocalDownloadChange(entry);
    if (change) byKey.set(downloadChangeKey(change), { ...change, status: 'downloaded' });
  }

  return [...byKey.values()].slice(0, MAX_DOWNLOAD_CHANGES);
}

function readDownloadChangeJournal(kidId) {
  return parseJson(localStorage.getItem(DOWNLOAD_CHANGE_JOURNAL_KEY(kidId)), []);
}

function writeDownloadChangeJournal(kidId, changes) {
  setJsonWithBackup(DOWNLOAD_CHANGE_JOURNAL_KEY(kidId), changes.slice(-MAX_DOWNLOAD_CHANGE_JOURNAL));
}

function rememberDownloadChange(kidId, change) {
  if (!kidId) return;
  const normalized = normalizeLocalDownloadChange(change);
  if (!normalized) return;
  const existing = readDownloadChangeJournal(kidId);
  const next = [
    ...existing.filter((item) => downloadChangeKey(normalizeLocalDownloadChange(item) || {}) !== downloadChangeKey(normalized)),
    { ...normalized, changed_at: new Date().toISOString() }
  ];
  writeDownloadChangeJournal(kidId, next);
}

function clearDownloadChangeJournal(kidId) {
  if (!kidId) return;
  localStorage.removeItem(DOWNLOAD_CHANGE_JOURNAL_KEY(kidId));
}

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function wait(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer?.unref === 'function') timer.unref();
  });
}

function nowMs() {
  return globalThis.performance?.now ? globalThis.performance.now() : Date.now();
}

function withTimeout(promise, timeoutMs = CLOUD_SYNC_TIMEOUT_MS) {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('Cloud synchronization timed out');
      error.code = 'CLOUD_SYNC_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function isRetryableCloudSyncError(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  if (!status) return true;
  return RETRYABLE_CLOUD_STATUS.has(status);
}

export function cloudSyncRetryDelayMs(attempt) {
  return Math.min(10_000, 800 * Math.max(1, attempt) ** 2);
}

async function recordCloudSyncDiagnostics(kidId, patch) {
  if (!kidId) return null;
  const previous = await offlineDb.get(offlineDb.stores.metadata, SYNC_DIAGNOSTICS_KEY(kidId)).catch(() => null);
  const value = {
    attempts: 0,
    successes: 0,
    failures: 0,
    lastLatencyMs: null,
    lastError: null,
    updatedAt: new Date().toISOString(),
    ...(previous?.value || {}),
    ...patch
  };
  await offlineDb.put(offlineDb.stores.metadata, {
    key: SYNC_DIAGNOSTICS_KEY(kidId),
    value,
    updatedAt: value.updatedAt
  }).catch(() => {});
  return value;
}

async function executeCloudRequest(kidId, requestFactory) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_CLOUD_SYNC_ATTEMPTS; attempt += 1) {
    const startedAt = nowMs();
    await recordCloudSyncDiagnostics(kidId, {
      attempts: attempt,
      lastAttemptAt: new Date().toISOString()
    });
    try {
      const response = await withTimeout(requestFactory());
      const latencyMs = Math.round(nowMs() - startedAt);
      await recordCloudSyncDiagnostics(kidId, {
        successes: ((await offlineDb.get(offlineDb.stores.metadata, SYNC_DIAGNOSTICS_KEY(kidId)).catch(() => null))?.value?.successes || 0) + 1,
        lastLatencyMs: latencyMs,
        lastError: null,
        updatedAt: new Date().toISOString()
      });
      return response;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableCloudSyncError(error);
      await recordCloudSyncDiagnostics(kidId, {
        failures: ((await offlineDb.get(offlineDb.stores.metadata, SYNC_DIAGNOSTICS_KEY(kidId)).catch(() => null))?.value?.failures || 0) + 1,
        lastError: error.message || String(error),
        retryable,
        updatedAt: new Date().toISOString()
      });
      if (!retryable || attempt >= MAX_CLOUD_SYNC_ATTEMPTS) throw error;
      await wait(cloudSyncRetryDelayMs(attempt));
    }
  }
  throw lastError || new Error('Cloud synchronization failed');
}

function mergeHistoryByBook(localItems = [], remoteItems = [], { listened = false } = {}) {
  const merged = new Map();
  for (const item of [...localItems, ...remoteItems]) {
    const bookId = item.bookId ?? item.book_id;
    if (!bookId) continue;
    const current = merged.get(bookId);
    const occurredAt = listened
      ? (item.listenedAt || item.last_listened_at || item.lastRead || item.last_opened_at)
      : (item.lastRead || item.last_opened_at || item.occurred_at);
    const candidate = {
      bookId,
      bookTitle: item.bookTitle || item.book_title || current?.bookTitle || '',
      page: Math.max(Number(current?.page || 0), Number(item.page ?? item.last_page ?? 0)),
      lastRead: occurredAt || current?.lastRead || new Date().toISOString(),
      listenedSeconds: Math.max(Number(current?.listenedSeconds || 0), Number(item.listenedSeconds ?? item.listened_seconds ?? 0)),
      duration: Math.max(Number(current?.duration || 0), Number(item.duration ?? item.audio_duration_seconds ?? 0)),
      completed: Boolean(current?.completed || item.completed),
      listenedAt: listened ? (occurredAt || current?.listenedAt) : current?.listenedAt
    };
    if (!current || toTimestamp(candidate.lastRead) >= toTimestamp(current.lastRead)) {
      merged.set(bookId, candidate);
    }
  }
  return [...merged.values()]
    .sort((a, b) => toTimestamp(b.lastRead) - toTimestamp(a.lastRead))
    .slice(0, 50);
}

function mergeFavorites(localIds = [], remoteFavorites = []) {
  const remoteIds = remoteFavorites.map((item) => item.book_id ?? item.bookId).filter(Boolean);
  return [...new Set([...localIds, ...remoteIds])].slice(0, 20);
}

function mergeProgress(localStats, remoteProgress = []) {
  const pageByBook = new Map();
  for (const item of remoteProgress) {
    pageByBook.set(item.book_id, {
      page: item.current_page,
      totalPages: item.total_pages,
      completed: item.completed,
      updatedAt: item.updated_at || item.last_read_at
    });
  }

  const sessions = Array.isArray(localStats?.sessions) ? [...localStats.sessions] : [];
  for (const item of remoteProgress) {
    const existing = pageByBook.get(item.book_id);
    const localPage = sessions.find((session) => session.bookId === item.book_id)?.currentPage;
    pageByBook.set(item.book_id, {
      page: Math.max(Number(existing?.page || 0), Number(localPage || 0)),
      totalPages: item.total_pages,
      completed: Boolean(existing?.completed || item.completed),
      updatedAt: item.updated_at || item.last_read_at
    });
  }
  return pageByBook;
}

export function hydrateLocalFromCloud(snapshot, kidId) {
  if (!snapshot || snapshot.unchanged) return { hydrated: false };

  const favoritesKey = scopedKey('hkids_favorites', kidId);
  const historyKey = scopedKey('hkids_history', kidId);
  const listeningKey = scopedKey('hkids_listening_history', kidId);
  const statsKey = scopedKey('hkids_reading_stats', kidId);
  const downloadsKey = scopedKey('hkids_downloaded_content', kidId);
  const prefsKey = scopedKey('hkids_preferences', kidId);
  const lastCloudFavoritesKey = LAST_CLOUD_FAVORITES_KEY(kidId);

  const localFavorites = parseJson(localStorage.getItem(favoritesKey), []);
  const localHistory = parseJson(localStorage.getItem(historyKey), []);
  const localListening = parseJson(localStorage.getItem(listeningKey), []);
  const localStats = parseJson(localStorage.getItem(statsKey), { sessions: [], completedBookIds: [] });
  const localDownloads = parseJson(localStorage.getItem(downloadsKey), []);

  const mergedFavorites = mergeFavorites(localFavorites, snapshot.favorites || []);
  const mergedReading = mergeHistoryByBook(localHistory, snapshot.history?.reading || [], { listened: false });
  const mergedListening = mergeHistoryByBook(localListening, snapshot.history?.listening || [], { listened: true });
  const progressMap = mergeProgress(localStats, snapshot.progress || []);

  const completedBookIds = [...new Set([
    ...(localStats.completedBookIds || []),
    ...(snapshot.progress || []).filter((item) => item.completed).map((item) => item.book_id)
  ])];

  const mergedSessions = [...(localStats.sessions || [])];
  for (const [bookId, remote] of progressMap.entries()) {
    const index = mergedSessions.findIndex((session) => session.bookId === bookId);
    const nextSession = {
      bookId,
      currentPage: Math.max(Number(mergedSessions[index]?.currentPage || 0), Number(remote.page || 0)),
      totalPages: remote.totalPages ?? mergedSessions[index]?.totalPages ?? 0,
      finished: Boolean(mergedSessions[index]?.finished || remote.completed),
      durationSeconds: mergedSessions[index]?.durationSeconds || 0,
      clientSessionId: mergedSessions[index]?.clientSessionId || null,
    };
    if (index >= 0) mergedSessions[index] = { ...mergedSessions[index], ...nextSession };
    else mergedSessions.unshift(nextSession);
  }

  const mergedStats = {
    ...localStats,
    completedBookIds,
    sessions: mergedSessions.slice(0, 50)
  };

  const remoteDownloadIds = (snapshot.downloads || [])
    .filter((item) => item.status !== 'removed')
    .flatMap((item) => {
      const canonical = `${item.content_type}:${item.content_id}`;
      if (item.content_type === 'book') return [canonical, item.content_id];
      return [canonical];
    });
  const mergedDownloads = [...new Set([...localDownloads, ...remoteDownloadIds])];
  const localStorageSnapshot = snapshotLocalStorageKeys([
    favoritesKey,
    historyKey,
    listeningKey,
    lastCloudFavoritesKey,
    statsKey,
    downloadsKey,
    prefsKey,
    'hkids_preferences',
  ]);

  try {
    setJsonWithBackup(favoritesKey, mergedFavorites);
    setJsonWithBackup(historyKey, mergedReading);
    setJsonWithBackup(listeningKey, mergedListening);
    setJsonWithBackup(lastCloudFavoritesKey, mergedFavorites);
    setJsonWithBackup(statsKey, mergedStats);
    setJsonWithBackup(downloadsKey, mergedDownloads);

    if (snapshot.preferences && typeof snapshot.preferences === 'object') {
      const localPrefs = parseJson(localStorage.getItem(prefsKey), parseJson(localStorage.getItem('hkids_preferences'), {}));
      const mergedPrefs = { ...localPrefs, ...snapshot.preferences };
      setJsonWithBackup(prefsKey, mergedPrefs);
      if (!localStorage.getItem('hkids_preferences')) {
        setJsonWithBackup('hkids_preferences', mergedPrefs);
      }
    }
  } catch (error) {
    restoreLocalStorageSnapshot(localStorageSnapshot);
    throw error;
  }

  if (snapshot.profile) {
    offlineDb.put(offlineDb.stores.metadata, {
      key: PROFILE_CACHE_KEY(kidId),
      value: snapshot.profile,
      updatedAt: new Date().toISOString()
    }).catch(() => {});
  }

  return { hydrated: true };
}

async function collectLocalChanges(kidId) {
  const favorites = parseJson(localStorage.getItem(scopedKey('hkids_favorites', kidId)), []);
  const lastCloudFavorites = parseJson(localStorage.getItem(LAST_CLOUD_FAVORITES_KEY(kidId)), []);
  const favoriteRemovals = lastCloudFavorites.filter((bookId) => !favorites.includes(bookId));
  const history = parseJson(localStorage.getItem(scopedKey('hkids_history', kidId)), []);
  const listening = parseJson(localStorage.getItem(scopedKey('hkids_listening_history', kidId)), []);
  const stats = parseJson(localStorage.getItem(scopedKey('hkids_reading_stats', kidId)), { sessions: [] });
  const downloads = parseJson(localStorage.getItem(scopedKey('hkids_downloaded_content', kidId)), []);
  const indexedDownloads = await offlineDb.getAll(offlineDb.stores.downloads).catch(() => []);
  const indexedDownloadChanges = indexedDownloads
    .filter((item) => item?.status === 'downloaded' && item.type && item.sourceId)
    .map((item) => ({
      content_type: item.type,
      content_id: item.sourceId,
      status: 'downloaded',
      downloaded_at: item.updatedAt || new Date().toISOString()
    }));
  const downloadChanges = mergeDownloadChangeJournal(
    [...downloads, ...indexedDownloadChanges],
    readDownloadChangeJournal(kidId)
  );
  const preferences = parseJson(
    localStorage.getItem(scopedKey('hkids_preferences', kidId)),
    parseJson(localStorage.getItem('hkids_preferences'), {})
  );

  const progress = (stats.sessions || []).slice(0, 50).map((session) => ({
    book_id: session.bookId,
    current_page: session.currentPage ?? 0,
    total_pages: session.totalPages ?? 0,
    duration_seconds: session.durationSeconds ?? 0,
    completed: Boolean(session.finished),
    client_session_id: session.clientSessionId || null
  }));

  return {
    favorites: {
      add: favorites.slice(0, 20),
      remove: favoriteRemovals.slice(0, 20)
    },
    progress,
    history: {
      reading: history.slice(0, 50).map((item) => ({
        book_id: item.bookId,
        last_page: item.page ?? 0,
        occurred_at: item.lastRead
      })),
      listening: listening.slice(0, 50).map((item) => ({
        book_id: item.bookId,
        last_page: item.page ?? 0,
        listened_seconds: item.listenedSeconds ?? 0,
        audio_duration_seconds: item.duration ?? 0,
        completed: Boolean(item.completed),
        occurred_at: item.listenedAt || item.lastRead
      }))
    },
    downloads: downloadChanges,
    preferences: {
      language: preferences.language || null,
      darkMode: preferences.darkMode ?? null,
      reading_mode: preferences.reading_mode || null,
    }
  };
}

async function getStoredSyncToken(kidId) {
  const record = await offlineDb.get(offlineDb.stores.metadata, SYNC_METADATA_KEY(kidId));
  return record?.value?.sync_token || null;
}

async function storeSyncState(kidId, payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('Malformed cloud synchronization response');
    error.code = 'MALFORMED_CLOUD_SYNC_RESPONSE';
    throw error;
  }
  await offlineDb.put(offlineDb.stores.metadata, {
    key: SYNC_METADATA_KEY(kidId),
    value: {
      sync_token: payload.sync_token,
      generated_at: payload.generated_at || new Date().toISOString(),
      unchanged: Boolean(payload.unchanged)
    },
    updatedAt: new Date().toISOString()
  });

  if (!payload.unchanged && Array.isArray(payload.favorites)) {
    const favoriteIds = payload.favorites.map((item) => item.book_id).filter(Boolean);
    setJsonWithBackup(LAST_CLOUD_FAVORITES_KEY(kidId), favoriteIds);
  }
}

let activeCloudSync = null;

export async function performCloudSync({ pushLocal = true } = {}) {
  const user = currentKidUser();
  if (!user || !navigator.onLine) {
    return { skipped: true, reason: !user ? 'not_kid' : 'offline' };
  }

  if (activeCloudSync) return activeCloudSync;

  activeCloudSync = (async () => {
    const kidId = user.kid_profile_id;
    const syncToken = await getStoredSyncToken(kidId);
    const pending = await getPendingMutations();
    const shouldPush = pushLocal && pending.length === 0;
    const changes = shouldPush ? await collectLocalChanges(kidId) : null;

    const response = shouldPush
      ? await executeCloudRequest(kidId, () => parentalAPI.pushCloudSync({
        sync_token: syncToken,
        changes
      }))
      : await executeCloudRequest(kidId, () => parentalAPI.pullCloudSync(syncToken));

    const snapshot = response.data;
    await storeSyncState(kidId, snapshot);
    if (!snapshot.unchanged) {
      hydrateLocalFromCloud(snapshot, kidId);
    } else {
      const favorites = parseJson(localStorage.getItem(scopedKey('hkids_favorites', kidId)), []);
      setJsonWithBackup(LAST_CLOUD_FAVORITES_KEY(kidId), favorites);
    }
    if (shouldPush) clearDownloadChangeJournal(kidId);

    return {
      unchanged: Boolean(snapshot.unchanged),
      conflicts_resolved: snapshot.conflicts_resolved || 0,
      sync_token: snapshot.sync_token
    };
  })().finally(() => {
    activeCloudSync = null;
  });

  return activeCloudSync;
}

export async function getCachedKidProfile(kidId) {
  const record = await offlineDb.get(offlineDb.stores.metadata, PROFILE_CACHE_KEY(kidId));
  return record?.value || null;
}

export async function getCloudSyncDiagnostics(kidId) {
  const record = await offlineDb.get(offlineDb.stores.metadata, SYNC_DIAGNOSTICS_KEY(kidId));
  return record?.value || null;
}

export async function registerDownloadInCloud(contentType, contentId) {
  const user = currentKidUser();
  if (!user) return;
  const change = {
    content_type: contentType,
    content_id: contentId,
    status: 'downloaded',
    downloaded_at: new Date().toISOString()
  };
  if (!navigator.onLine) {
    rememberDownloadChange(user.kid_profile_id, change);
    return;
  }
  try {
    await parentalAPI.pushCloudSync({
      changes: {
        downloads: [change]
      }
    });
  } catch (error) {
    rememberDownloadChange(user.kid_profile_id, change);
    console.warn('Could not register download in cloud:', error);
  }
}

export async function unregisterDownloadInCloud(contentType, contentId) {
  const user = currentKidUser();
  if (!user) return;
  const change = {
    content_type: contentType,
    content_id: contentId,
    status: 'removed',
    downloaded_at: new Date().toISOString()
  };
  if (!navigator.onLine) {
    rememberDownloadChange(user.kid_profile_id, change);
    return;
  }
  try {
    await parentalAPI.pushCloudSync({
      changes: {
        downloads: [change]
      }
    });
  } catch (error) {
    rememberDownloadChange(user.kid_profile_id, change);
    console.warn('Could not unregister download in cloud:', error);
  }
}

export const cloudConflictPolicy = {
  name: 'server-authoritative-merge',
  description: 'Union des favoris, max page/progression, derniere date pour historique, registre telechargements fusionne cote serveur avec GREATEST.'
};
