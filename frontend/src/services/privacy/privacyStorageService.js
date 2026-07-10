import { offlineDb } from '../offline/offlineDb';

const AUTH_KEYS = new Set(['token', 'user']);
const APP_KEY_PREFIXES = ['hkids_', 'hkids:', 'le-lit-qui-lit', 'llql-'];

function isHkidsKey(key, includeAuthentication) {
  if (includeAuthentication && AUTH_KEYS.has(key)) return true;
  return APP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function removeMatchingStorage(storageArea, includeAuthentication, preservedKeys = new Set()) {
  const keys = [];
  for (let index = 0; index < storageArea.length; index += 1) {
    const key = storageArea.key(index);
    if (
      key
      && !preservedKeys.has(key)
      && isHkidsKey(key, includeAuthentication)
    ) keys.push(key);
  }
  keys.forEach((key) => storageArea.removeItem(key));
  return keys.length;
}

async function clearApplicationCaches() {
  if (!('caches' in window)) return 0;
  const names = await caches.keys();
  const applicationCaches = names.filter((name) => (
    name.toLowerCase().includes('hkids')
    || name.toLowerCase().includes('le-lit-qui-lit')
    || name.toLowerCase().startsWith('llql-')
  ));
  await Promise.all(applicationCaches.map((name) => caches.delete(name)));
  return applicationCaches.length;
}

export async function clearKidLocalPrivacyData(kidId) {
  const kidSuffix = `:kid:${kidId}`;
  const keysToRemove = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.endsWith(kidSuffix)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  const metadataKeys = [
    `cloud-sync-state${kidSuffix}`,
    `kid-profile-cache${kidSuffix}`
  ];
  await Promise.all(
    metadataKeys.map((key) => offlineDb.delete(offlineDb.stores.metadata, key).catch(() => {}))
  );

  const queue = await offlineDb.getAll(offlineDb.stores.syncQueue);
  await Promise.all(
    queue
      .filter((item) => String(item.ownerKidProfileId ?? '') === String(kidId))
      .map((item) => offlineDb.delete(offlineDb.stores.syncQueue, item.id))
  );

  return { local_storage_keys: keysToRemove.length };
}

export async function clearLocalPrivacyData({
  includeAuthentication = false,
  preservePreferences = false
} = {}) {
  const preservedKeys = preservePreferences
    ? new Set(['hkids_preferences', 'hkids_home_data_cache_v2'])
    : new Set();
  const localStorageKeys = removeMatchingStorage(localStorage, includeAuthentication, preservedKeys);
  const sessionStorageKeys = removeMatchingStorage(sessionStorage, includeAuthentication, preservedKeys);
  const [indexedDbResult, cacheCount] = await Promise.all([
    offlineDb.deleteDatabase().then(() => true),
    clearApplicationCaches()
  ]);

  return {
    local_storage_keys: localStorageKeys,
    session_storage_keys: sessionStorageKeys,
    indexed_db_deleted: indexedDbResult,
    caches_deleted: cacheCount
  };
}

export function downloadPrivacyBlob(response) {
  const disposition = response.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `hkids-rgpd-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
}
