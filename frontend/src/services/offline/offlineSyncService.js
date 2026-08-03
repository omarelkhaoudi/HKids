import { offlineDb } from './offlineDb';

const SYNC_STATUS = {
  pending: 'pending',
  synced: 'synced',
  failed: 'failed'
};

const MAX_SYNC_ATTEMPTS = 8;
const BASE_RETRY_DELAY_MS = 2_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const LAST_WRITE_WINS_TYPES = new Set([
  'favorite_add',
  'favorite_remove',
  'reading_history',
  'listening_history',
  'screen_time'
]);

function nowIso() {
  return new Date().toISOString();
}

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function networkOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function createId(type) {
  return `${type}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function currentOwner() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user ? {
      ownerUserId: user.id ?? null,
      ownerKidProfileId: user.kid_profile_id ?? null
    } : { ownerUserId: null, ownerKidProfileId: null };
  } catch {
    return { ownerUserId: null, ownerKidProfileId: null };
  }
}

export async function queueOfflineMutation(type, payload, conflictKey = null) {
  const timestamp = nowIso();
  const entry = {
    id: createId(type),
    type,
    payload,
    conflictKey,
    ...currentOwner(),
    status: SYNC_STATUS.pending,
    attempts: 0,
    retryable: true,
    terminal: false,
    nextRetryAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await offlineDb.put(offlineDb.stores.syncQueue, entry);
  return entry;
}

export function isRetryableSyncError(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  if (!status) return true;
  return RETRYABLE_STATUS_CODES.has(status);
}

export function calculateMutationRetryDelayMs(attempts, {
  baseMs = BASE_RETRY_DELAY_MS,
  maxMs = MAX_RETRY_DELAY_MS,
  jitterRatio = 0.15,
} = {}) {
  const attempt = Math.max(1, Number(attempts) || 1);
  const raw = Math.min(maxMs, baseMs * (2 ** Math.min(8, attempt - 1)));
  const jitter = raw * Math.max(0, jitterRatio) * Math.random();
  return Math.round(Math.min(maxMs, raw + jitter));
}

export async function getPendingMutations({ includeDeferred = false } = {}) {
  const all = await offlineDb.getAll(offlineDb.stores.syncQueue);
  const owner = currentOwner();
  const now = Date.now();
  return all
    .filter((item) => (
      (item.status === SYNC_STATUS.pending || item.status === SYNC_STATUS.failed)
      && item.ownerUserId != null
      && String(item.ownerUserId) === String(owner.ownerUserId)
      && String(item.ownerKidProfileId ?? '') === String(owner.ownerKidProfileId ?? '')
      && item.terminal !== true
      && (includeDeferred || !item.nextRetryAt || toTimestamp(item.nextRetryAt) <= now)
    ))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export async function markMutationSynced(id) {
  await offlineDb.delete(offlineDb.stores.syncQueue, id);
}

export async function markMutationFailed(id, error) {
  const entry = await offlineDb.get(offlineDb.stores.syncQueue, id);
  if (!entry) return;
  const attempts = (entry.attempts || 0) + 1;
  const retryable = isRetryableSyncError(error);
  const terminal = !retryable || attempts >= MAX_SYNC_ATTEMPTS;
  const delayMs = terminal ? 0 : calculateMutationRetryDelayMs(attempts);
  const retryAt = delayMs ? new Date(Date.now() + delayMs).toISOString() : null;
  await offlineDb.put(offlineDb.stores.syncQueue, {
    ...entry,
    status: SYNC_STATUS.failed,
    attempts,
    retryable,
    terminal,
    nextRetryAt: retryAt,
    lastAttemptAt: nowIso(),
    lastError: error?.message || String(error),
    updatedAt: nowIso()
  });
}

let activeSynchronization = null;

async function runSynchronization(handlers = {}) {
  if (!networkOnline()) return { synced: 0, failed: 0, pending: 0, deferred: 0 };

  const pending = await getPendingMutations();
  const latestByConflict = new Map();
  for (const mutation of pending) {
    if (mutation.conflictKey && LAST_WRITE_WINS_TYPES.has(mutation.type)) {
      latestByConflict.set(mutation.conflictKey, mutation.id);
    }
  }
  const superseded = pending.filter((mutation) => (
    mutation.conflictKey
    && LAST_WRITE_WINS_TYPES.has(mutation.type)
    && latestByConflict.get(mutation.conflictKey) !== mutation.id
  ));
  await Promise.all(superseded.map((mutation) => markMutationSynced(mutation.id)));
  const pendingToSync = pending.filter((mutation) => !superseded.includes(mutation));
  let synced = 0;
  let failed = 0;

  for (const mutation of pendingToSync) {
    const handler = handlers[mutation.type];
    if (!handler) {
      failed += 1;
      await markMutationFailed(mutation.id, new Error(`No sync handler for ${mutation.type}`));
      continue;
    }

    try {
      await handler(mutation.payload, mutation);
      await markMutationSynced(mutation.id);
      synced += 1;
    } catch (error) {
      await markMutationFailed(mutation.id, error);
      failed += 1;
    }
  }

  const deferred = (await getPendingMutations({ includeDeferred: true }))
    .filter((mutation) => mutation.nextRetryAt && toTimestamp(mutation.nextRetryAt) > Date.now())
    .length;

  return { synced, failed, pending: pendingToSync.length, deferred, superseded: superseded.length };
}

export async function synchronizePendingMutations(handlers = {}) {
  if (activeSynchronization) return activeSynchronization;
  activeSynchronization = runSynchronization(handlers).finally(() => {
    activeSynchronization = null;
  });
  return activeSynchronization;
}

export const offlineConflictPolicy = {
  name: 'last-write-wins',
  description: 'Les changements locaux sont horodates. Au retour reseau, la derniere action utilisateur est envoyee en premier pour chaque conflit simple.'
};
