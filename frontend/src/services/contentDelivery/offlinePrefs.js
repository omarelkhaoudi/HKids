/**
 * Offline experience preferences (localStorage via storage helpers).
 */

import { storage } from '../../utils/storage';

export const OFFLINE_PREF_KEYS = {
  autoDownloadFavorites: 'offline_auto_download_favorites',
  predictiveDownloads: 'offline_predictive_downloads',
  wifiOnly: 'offline_wifi_only',
  protectFavorites: 'offline_protect_favorites',
  softLimit: 'offline_soft_limit',
};

const DEFAULTS = {
  [OFFLINE_PREF_KEYS.autoDownloadFavorites]: false,
  [OFFLINE_PREF_KEYS.predictiveDownloads]: true,
  [OFFLINE_PREF_KEYS.wifiOnly]: false,
  [OFFLINE_PREF_KEYS.protectFavorites]: true,
  [OFFLINE_PREF_KEYS.softLimit]: 50,
};

export function getOfflinePrefs() {
  const prefs = storage.getPreferences() || {};
  return {
    autoDownloadFavorites: Boolean(
      prefs[OFFLINE_PREF_KEYS.autoDownloadFavorites] ?? DEFAULTS[OFFLINE_PREF_KEYS.autoDownloadFavorites],
    ),
    predictiveDownloads: Boolean(
      prefs[OFFLINE_PREF_KEYS.predictiveDownloads] ?? DEFAULTS[OFFLINE_PREF_KEYS.predictiveDownloads],
    ),
    wifiOnly: Boolean(prefs[OFFLINE_PREF_KEYS.wifiOnly] ?? DEFAULTS[OFFLINE_PREF_KEYS.wifiOnly]),
    protectFavorites: Boolean(
      prefs[OFFLINE_PREF_KEYS.protectFavorites] ?? DEFAULTS[OFFLINE_PREF_KEYS.protectFavorites],
    ),
    softLimit: Math.max(
      10,
      Math.min(200, Number(prefs[OFFLINE_PREF_KEYS.softLimit] ?? DEFAULTS[OFFLINE_PREF_KEYS.softLimit]) || 50),
    ),
  };
}

export function setOfflinePref(key, value) {
  const prefKey = OFFLINE_PREF_KEYS[key] || key;
  storage.setPreference(prefKey, value);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hkids:offline-prefs', { detail: getOfflinePrefs() }));
  }
  return getOfflinePrefs();
}

/** True when downloads should wait (cellular + wifi-only preference). */
export function shouldDeferForNetwork(prefs = getOfflinePrefs()) {
  if (!prefs.wifiOnly) return false;
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return false;
  const type = String(connection.type || '').toLowerCase();
  const effective = String(connection.effectiveType || '').toLowerCase();
  if (type === 'cellular' || type === 'wimax') return true;
  if (type === 'wifi' || type === 'ethernet') return false;
  // Fall back to effectiveType hints when type is unknown
  if (effective === 'slow-2g' || effective === '2g' || effective === '3g') return true;
  return false;
}
