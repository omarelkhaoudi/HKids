import { getDatabase } from '../../database/init.js';
import { invalidateParentDashboardCache } from '../parentDashboardService.js';
import {
  recordKidBookHistory,
  recordKidReadingProgress,
  setKidBookFavorite
} from '../parentDashboardService.js';

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function requireConnectedKid(pool, user) {
  if (user.role !== 'kid' || !user.kid_profile_id) {
    throw httpError(403, 'Kid account required', 'KID_ACCOUNT_REQUIRED');
  }
  const result = await pool.query(
    `SELECT id, parent_id, name, avatar, photo_url, age, date_of_birth,
            preferred_language, interests, updated_at
     FROM kids_profiles WHERE id = $1`,
    [user.kid_profile_id]
  );
  if (!result.rows[0]) throw httpError(404, 'Kid profile not found', 'KID_NOT_FOUND');
  return result.rows[0];
}

export async function computeSyncToken(kidProfileId) {
  const pool = getDatabase();
  const result = await pool.query(
    `SELECT md5(concat_ws('|',
      $1::text,
      COALESCE((SELECT MAX(favorited_at)::text FROM kid_book_favorites WHERE kid_profile_id = $1), ''),
      COALESCE((SELECT MAX(GREATEST(last_opened_at, COALESCE(last_listened_at, last_opened_at)))::text
                FROM kid_book_history WHERE kid_profile_id = $1), ''),
      COALESCE((SELECT MAX(updated_at)::text FROM kid_reading_progress WHERE kid_profile_id = $1), ''),
      COALESCE((SELECT MAX(updated_at)::text FROM kid_download_registry WHERE kid_profile_id = $1), ''),
      COALESCE((SELECT updated_at::text FROM kids_profiles WHERE id = $1), '')
    )) AS sync_token`,
    [kidProfileId]
  );
  return result.rows[0]?.sync_token || '0';
}

async function loadSnapshot(kidProfileId, kidProfile) {
  const pool = getDatabase();
  const [favorites, progress, history, downloads] = await Promise.all([
    pool.query(
      `SELECT f.book_id, f.favorited_at, b.title AS book_title, b.cover_image
       FROM kid_book_favorites f
       JOIN books b ON b.id = f.book_id
       WHERE f.kid_profile_id = $1
       ORDER BY f.favorited_at DESC
       LIMIT 20`,
      [kidProfileId]
    ),
    pool.query(
      `SELECT p.book_id, p.current_page, p.total_pages, p.progress_percent,
              p.completed, p.last_read_at, p.updated_at, b.title AS book_title, b.cover_image
       FROM kid_reading_progress p
       JOIN books b ON b.id = p.book_id
       WHERE p.kid_profile_id = $1
       ORDER BY p.last_read_at DESC
       LIMIT 50`,
      [kidProfileId]
    ),
    pool.query(
      `SELECT h.book_id, h.last_page, h.open_count, h.listened_seconds,
              h.audio_duration_seconds, h.completed, h.last_opened_at, h.last_listened_at,
              h.updated_at, b.title AS book_title, b.cover_image
       FROM kid_book_history h
       JOIN books b ON b.id = h.book_id
       WHERE h.kid_profile_id = $1
       ORDER BY GREATEST(h.last_opened_at, COALESCE(h.last_listened_at, h.last_opened_at)) DESC
       LIMIT 50`,
      [kidProfileId]
    ),
    pool.query(
      `SELECT content_type, content_id, status, downloaded_at, updated_at
       FROM kid_download_registry
       WHERE kid_profile_id = $1
       ORDER BY downloaded_at DESC
       LIMIT 60`,
      [kidProfileId]
    )
  ]);

  const readingHistory = [];
  const listeningHistory = [];
  for (const row of history.rows) {
    const base = {
      bookId: row.book_id,
      bookTitle: row.book_title,
      coverImage: row.cover_image,
      page: row.last_page,
      completed: row.completed,
      updatedAt: row.updated_at
    };
    readingHistory.push({
      ...base,
      lastRead: row.last_opened_at
    });
    if (Number(row.listened_seconds) > 0 || row.last_listened_at) {
      listeningHistory.push({
        ...base,
        listenedSeconds: row.listened_seconds,
        duration: row.audio_duration_seconds,
        listenedAt: row.last_listened_at || row.last_opened_at
      });
    }
  }

  return {
    profile: {
      id: kidProfile.id,
      name: kidProfile.name,
      avatar: kidProfile.avatar,
      photo_url: kidProfile.photo_url,
      age: kidProfile.age,
      date_of_birth: kidProfile.date_of_birth,
      preferred_language: kidProfile.preferred_language,
      interests: kidProfile.interests,
      updated_at: kidProfile.updated_at
    },
    favorites: favorites.rows.map((row) => ({
      book_id: row.book_id,
      book_title: row.book_title,
      cover_image: row.cover_image,
      favorited_at: row.favorited_at
    })),
    progress: progress.rows,
    history: {
      reading: readingHistory.slice(0, 50),
      listening: listeningHistory.slice(0, 50)
    },
    downloads: downloads.rows
  };
}

export async function pullCloudSync({ user, clientSyncToken = null }) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  const syncToken = await computeSyncToken(kid.id);

  if (clientSyncToken && clientSyncToken === syncToken) {
    return { unchanged: true, sync_token: syncToken };
  }

  const snapshot = await loadSnapshot(kid.id, kid);
  return {
    unchanged: false,
    sync_token: syncToken,
    generated_at: new Date().toISOString(),
    ...snapshot
  };
}

async function applyFavoriteChanges(user, favorites = {}) {
  let resolved = 0;
  const adds = Array.isArray(favorites.add) ? favorites.add.slice(0, 20) : [];
  const removes = Array.isArray(favorites.remove) ? favorites.remove.slice(0, 20) : [];

  for (const bookId of adds) {
    await setKidBookFavorite({
      user,
      bookId: Number(bookId),
      favorite: true,
      favoritedAt: favorites.favorited_at || null
    });
    resolved += 1;
  }
  for (const bookId of removes) {
    await setKidBookFavorite({ user, bookId: Number(bookId), favorite: false });
    resolved += 1;
  }
  return resolved;
}

async function applyProgressChanges(user, progressItems = []) {
  let resolved = 0;
  for (const item of progressItems.slice(0, 50)) {
    if (!item?.book_id) continue;
    await recordKidReadingProgress({
      user,
      kidProfileId: user.kid_profile_id,
      bookId: item.book_id,
      currentPage: item.current_page,
      totalPages: item.total_pages,
      durationSeconds: item.duration_seconds || 0,
      completed: item.completed,
      clientSessionId: item.client_session_id || null
    });
    resolved += 1;
  }
  return resolved;
}

async function applyHistoryChanges(user, history = {}) {
  let resolved = 0;
  const reading = Array.isArray(history.reading) ? history.reading.slice(0, 50) : [];
  const listening = Array.isArray(history.listening) ? history.listening.slice(0, 50) : [];

  for (const item of reading) {
    if (!item?.book_id && !item?.bookId) continue;
    await recordKidBookHistory({
      user,
      bookId: item.book_id || item.bookId,
      lastPage: item.last_page ?? item.page ?? 0,
      occurredAt: item.occurred_at || item.lastRead || null
    });
    resolved += 1;
  }
  for (const item of listening) {
    if (!item?.book_id && !item?.bookId) continue;
    await recordKidBookHistory({
      user,
      bookId: item.book_id || item.bookId,
      lastPage: item.last_page ?? item.page ?? 0,
      listenedSeconds: item.listened_seconds ?? item.listenedSeconds ?? 0,
      audioDurationSeconds: item.audio_duration_seconds ?? item.duration ?? 0,
      completed: item.completed,
      occurredAt: item.occurred_at || item.listenedAt || null
    });
    resolved += 1;
  }
  return resolved;
}

async function applyDownloadChanges(kidProfileId, downloads = []) {
  const pool = getDatabase();
  let resolved = 0;
  for (const item of downloads.slice(0, 60)) {
    const contentType = String(item.content_type || item.contentType || '').trim();
    const contentId = Number(item.content_id ?? item.contentId);
    const status = String(item.status || 'downloaded');
    if (!contentType || !Number.isInteger(contentId) || contentId <= 0) continue;

    if (status === 'removed') {
      await pool.query(
        'DELETE FROM kid_download_registry WHERE kid_profile_id = $1 AND content_type = $2 AND content_id = $3',
        [kidProfileId, contentType, contentId]
      );
    } else {
      await pool.query(
        `INSERT INTO kid_download_registry (kid_profile_id, content_type, content_id, status, downloaded_at, updated_at)
         VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), NOW())
         ON CONFLICT (kid_profile_id, content_type, content_id)
         DO UPDATE SET status = EXCLUDED.status,
                       downloaded_at = GREATEST(kid_download_registry.downloaded_at, EXCLUDED.downloaded_at),
                       updated_at = NOW()`,
        [kidProfileId, contentType, contentId, status, item.downloaded_at || null]
      );
    }
    resolved += 1;
  }
  return resolved;
}

export async function pushCloudSync({ user, clientSyncToken = null, changes = {} }) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  let conflictsResolved = 0;

  conflictsResolved += await applyFavoriteChanges(user, changes.favorites);
  conflictsResolved += await applyProgressChanges(user, changes.progress);
  conflictsResolved += await applyHistoryChanges(user, changes.history);
  conflictsResolved += await applyDownloadChanges(kid.id, changes.downloads);

  await invalidateParentDashboardCache(kid.id);

  const syncToken = await computeSyncToken(kid.id);
  const snapshot = await loadSnapshot(kid.id, kid);

  return {
    accepted: true,
    conflicts_resolved: conflictsResolved,
    client_sync_token: clientSyncToken,
    sync_token: syncToken,
    generated_at: new Date().toISOString(),
    ...snapshot
  };
}

export async function syncCloudState({ user, clientSyncToken = null, changes = null }) {
  if (changes && Object.keys(changes).length > 0) {
    return pushCloudSync({ user, clientSyncToken, changes });
  }
  return pullCloudSync({ user, clientSyncToken });
}
