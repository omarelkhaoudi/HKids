import { parentalAPI } from '../../api/parental';
import { queueOfflineMutation } from '../offline/offlineSyncService';

function currentKidUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === 'kid' && user?.kid_profile_id ? user : null;
  } catch {
    return null;
  }
}

export const kidActivityMutationHandlers = {
  favorite_add: (payload) => parentalAPI.setKidFavorite({
    book_id: payload.bookId,
    favorite: true,
    favorited_at: payload.favoritedAt || new Date().toISOString()
  }),
  favorite_remove: (payload) => parentalAPI.setKidFavorite({
    book_id: payload.bookId,
    favorite: false
  }),
  reading_history: (payload) => parentalAPI.recordKidHistory({
    book_id: payload.bookId,
    last_page: payload.page || 0,
    occurred_at: payload.lastRead
  }),
  listening_history: (payload) => parentalAPI.recordKidHistory({
    book_id: payload.bookId,
    listened_seconds: payload.listenedSeconds || 0,
    audio_duration_seconds: payload.duration || 0,
    completed: Boolean(payload.completed),
    occurred_at: payload.listenedAt
  }),
  screen_time: (payload) => parentalAPI.recordScreenTime(payload),
  reading_progress: (payload) => parentalAPI.recordReadingProgress(payload),
};

export async function syncOrQueueKidMutation(type, payload, conflictKey = null) {
  if (!currentKidUser()) return;
  const handler = kidActivityMutationHandlers[type];
  if (navigator.onLine && handler) {
    try {
      await handler(payload);
      return;
    } catch (error) {
      console.warn(`Online kid activity sync failed for ${type}; queued for retry.`, error);
    }
  }
  await queueOfflineMutation(type, payload, conflictKey);
}

function parseLocalArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function migrateLegacyKidActivity() {
  const user = currentKidUser();
  if (!user || !navigator.onLine) return { imported: false, reason: 'not_ready' };
  const markerKey = `hkids_supabase_activity_migrated_v1:kid:${user.kid_profile_id}`;
  if (localStorage.getItem(markerKey)) return { imported: false, reason: 'already_migrated' };

  const response = await parentalAPI.importKidActivity({
    import_key: 'legacy-local-storage-v1',
    favorites: parseLocalArray('hkids_favorites').slice(0, 20),
    history: parseLocalArray('hkids_history').slice(0, 50),
    listening_history: parseLocalArray('hkids_listening_history').slice(0, 50)
  });
  const scopedSuffix = `:kid:${user.kid_profile_id}`;
  for (const key of ['hkids_favorites', 'hkids_history', 'hkids_listening_history', 'hkids_reading_stats']) {
    const legacy = localStorage.getItem(key);
    const scopedKey = `${key}${scopedSuffix}`;
    if (legacy && !localStorage.getItem(scopedKey)) localStorage.setItem(scopedKey, legacy);
  }
  localStorage.setItem(markerKey, new Date().toISOString());
  return response.data;
}
