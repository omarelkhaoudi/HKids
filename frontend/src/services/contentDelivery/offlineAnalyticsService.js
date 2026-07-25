/**
 * Lightweight offline analytics persisted in IndexedDB metadata.
 */

import { offlineDb } from '../offline/offlineDb';

const META_KEY = 'offline:analytics';

const EMPTY = {
  downloadsStarted: 0,
  downloadsCompleted: 0,
  downloadsFailed: 0,
  downloadsSkippedDuplicate: 0,
  favoritesAutoQueued: 0,
  predictiveQueued: 0,
  cacheHits: 0,
  bytesSavedByReuse: 0,
  optimizeRuns: 0,
  itemsRemovedByOptimize: 0,
  lastEventAt: null,
  events: [],
};

async function read() {
  try {
    const row = await offlineDb.get(offlineDb.stores.metadata, META_KEY);
    return { ...EMPTY, ...(row?.value || {}) };
  } catch {
    return { ...EMPTY };
  }
}

async function write(next) {
  await offlineDb.put(offlineDb.stores.metadata, {
    key: META_KEY,
    value: next,
    updatedAt: new Date().toISOString(),
  });
  return next;
}

function pushEvent(state, type, detail = {}) {
  const events = [
    { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, at: new Date().toISOString(), ...detail },
    ...(state.events || []),
  ].slice(0, 40);
  return { ...state, events, lastEventAt: new Date().toISOString() };
}

export async function getOfflineAnalytics() {
  return read();
}

export async function recordOfflineEvent(type, detail = {}) {
  try {
    const state = await read();
    let next = pushEvent(state, type, detail);

    switch (type) {
      case 'download_started':
        next.downloadsStarted += 1;
        break;
      case 'download_completed':
        next.downloadsCompleted += 1;
        break;
      case 'download_failed':
        next.downloadsFailed += 1;
        break;
      case 'download_skipped_duplicate':
        next.downloadsSkippedDuplicate += 1;
        break;
      case 'favorites_auto_queued':
        next.favoritesAutoQueued += Number(detail.count) || 1;
        break;
      case 'predictive_queued':
        next.predictiveQueued += Number(detail.count) || 1;
        break;
      case 'cache_hit':
        next.cacheHits += 1;
        next.bytesSavedByReuse += Number(detail.bytes) || 0;
        break;
      case 'optimize_run':
        next.optimizeRuns += 1;
        next.itemsRemovedByOptimize += Number(detail.removed) || 0;
        break;
      default:
        break;
    }

    return write(next);
  } catch {
    return { ...EMPTY };
  }
}

export async function resetOfflineAnalytics() {
  return write({ ...EMPTY });
}
