import { parentalAPI } from '../../api/parental';
import { offlineDb } from '../offline/offlineDb';
import { getPendingMutations } from '../offline/offlineSyncService';

const SYNC_METADATA_KEY = (kidId) => `cloud-sync-state:kid:${kidId}`;
const PROFILE_CACHE_KEY = (kidId) => `kid-profile-cache:kid:${kidId}`;

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

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
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

  const localFavorites = parseJson(localStorage.getItem(favoritesKey), []);
  const localHistory = parseJson(localStorage.getItem(historyKey), []);
  const localListening = parseJson(localStorage.getItem(listeningKey), []);
  const localStats = parseJson(localStorage.getItem(statsKey), { sessions: [], completedBookIds: [] });
  const localDownloads = parseJson(localStorage.getItem(downloadsKey), []);

  const mergedFavorites = mergeFavorites(localFavorites, snapshot.favorites || []);
  const mergedReading = mergeHistoryByBook(localHistory, snapshot.history?.reading || [], { listened: false });
  const mergedListening = mergeHistoryByBook(localListening, snapshot.history?.listening || [], { listened: true });
  const progressMap = mergeProgress(localStats, snapshot.progress || []);

  localStorage.setItem(favoritesKey, JSON.stringify(mergedFavorites));
  localStorage.setItem(historyKey, JSON.stringify(mergedReading));
  localStorage.setItem(listeningKey, JSON.stringify(mergedListening));

  const completedBookIds = [...new Set([
    ...(localStats.completedBookIds || []),
    ...(snapshot.progress || []).filter((item) => item.completed).map((item) => item.book_id)
  ])];

  localStorage.setItem(statsKey, JSON.stringify({
    ...localStats,
    completedBookIds,
    sessions: (localStats.sessions || []).map((session) => {
      const remote = progressMap.get(session.bookId);
      if (!remote) return session;
      return {
        ...session,
        finished: Boolean(session.finished || remote.completed)
      };
    })
  }));

  const remoteDownloadIds = (snapshot.downloads || [])
    .filter((item) => item.status !== 'removed')
    .flatMap((item) => {
      const canonical = `${item.content_type}:${item.content_id}`;
      if (item.content_type === 'book') return [canonical, item.content_id];
      return [canonical];
    });
  localStorage.setItem(downloadsKey, JSON.stringify([...new Set([...localDownloads, ...remoteDownloadIds])]));

  if (snapshot.profile) {
    offlineDb.put(offlineDb.stores.metadata, {
      key: PROFILE_CACHE_KEY(kidId),
      value: snapshot.profile,
      updatedAt: new Date().toISOString()
    }).catch(() => {});
  }

  return { hydrated: true };
}

function collectLocalChanges(kidId) {
  const favorites = parseJson(localStorage.getItem(scopedKey('hkids_favorites', kidId)), []);
  const history = parseJson(localStorage.getItem(scopedKey('hkids_history', kidId)), []);
  const listening = parseJson(localStorage.getItem(scopedKey('hkids_listening_history', kidId)), []);
  const stats = parseJson(localStorage.getItem(scopedKey('hkids_reading_stats', kidId)), { sessions: [] });
  const downloads = parseJson(localStorage.getItem(scopedKey('hkids_downloaded_content', kidId)), []);

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
      add: favorites.slice(0, 20)
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
    downloads: downloads.slice(0, 60).map((entry) => {
      const raw = String(entry);
      if (raw.includes(':')) {
        const [contentType, contentId] = raw.split(':');
        return {
          content_type: contentType,
          content_id: Number(contentId),
          status: 'downloaded',
          downloaded_at: new Date().toISOString()
        };
      }
      return {
        content_type: 'book',
        content_id: Number(raw),
        status: 'downloaded',
        downloaded_at: new Date().toISOString()
      };
    }).filter((item) => item.content_type && Number.isInteger(item.content_id) && item.content_id > 0)
  };
}

async function getStoredSyncToken(kidId) {
  const record = await offlineDb.get(offlineDb.stores.metadata, SYNC_METADATA_KEY(kidId));
  return record?.value?.sync_token || null;
}

async function storeSyncState(kidId, payload) {
  await offlineDb.put(offlineDb.stores.metadata, {
    key: SYNC_METADATA_KEY(kidId),
    value: {
      sync_token: payload.sync_token,
      generated_at: payload.generated_at || new Date().toISOString(),
      unchanged: Boolean(payload.unchanged)
    },
    updatedAt: new Date().toISOString()
  });
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

    const response = shouldPush
      ? await parentalAPI.pushCloudSync({
        sync_token: syncToken,
        changes: collectLocalChanges(kidId)
      })
      : await parentalAPI.pullCloudSync(syncToken);

    const snapshot = response.data;
    await storeSyncState(kidId, snapshot);
    if (!snapshot.unchanged) {
      hydrateLocalFromCloud(snapshot, kidId);
    }

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

export async function registerDownloadInCloud(contentType, contentId) {
  const user = currentKidUser();
  if (!user || !navigator.onLine) return;
  try {
    await parentalAPI.pushCloudSync({
      changes: {
        downloads: [{
          content_type: contentType,
          content_id: contentId,
          status: 'downloaded',
          downloaded_at: new Date().toISOString()
        }]
      }
    });
  } catch (error) {
    console.warn('Could not register download in cloud:', error);
  }
}

export const cloudConflictPolicy = {
  name: 'server-authoritative-merge',
  description: 'Union des favoris, max page/progression, derniere date pour historique, registre telechargements fusionne cote serveur avec GREATEST.'
};
