import { offlineDb } from './offlineDb';

const SYNC_STATUS = {
  pending: 'pending',
  synced: 'synced',
  failed: 'failed'
};

function nowIso() {
  return new Date().toISOString();
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
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await offlineDb.put(offlineDb.stores.syncQueue, entry);
  return entry;
}

export async function getPendingMutations() {
  const all = await offlineDb.getAll(offlineDb.stores.syncQueue);
  const owner = currentOwner();
  return all
    .filter((item) => (
      (item.status === SYNC_STATUS.pending || item.status === SYNC_STATUS.failed)
      && item.ownerUserId != null
      && String(item.ownerUserId) === String(owner.ownerUserId)
      && String(item.ownerKidProfileId ?? '') === String(owner.ownerKidProfileId ?? '')
    ))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export async function markMutationSynced(id) {
  const entry = await offlineDb.get(offlineDb.stores.syncQueue, id);
  if (!entry) return;
  await offlineDb.put(offlineDb.stores.syncQueue, {
    ...entry,
    status: SYNC_STATUS.synced,
    updatedAt: nowIso()
  });
}

export async function markMutationFailed(id, error) {
  const entry = await offlineDb.get(offlineDb.stores.syncQueue, id);
  if (!entry) return;
  await offlineDb.put(offlineDb.stores.syncQueue, {
    ...entry,
    status: SYNC_STATUS.failed,
    attempts: (entry.attempts || 0) + 1,
    lastError: error?.message || String(error),
    updatedAt: nowIso()
  });
}

let activeSynchronization = null;

async function runSynchronization(handlers = {}) {
  if (!navigator.onLine) return { synced: 0, failed: 0, pending: 0 };

  const pending = await getPendingMutations();
  const lastWriteWinsTypes = new Set([
    'favorite_add',
    'favorite_remove',
    'reading_history',
    'listening_history',
    'screen_time'
  ]);
  const latestByConflict = new Map();
  for (const mutation of pending) {
    if (mutation.conflictKey && lastWriteWinsTypes.has(mutation.type)) {
      latestByConflict.set(mutation.conflictKey, mutation.id);
    }
  }
  const superseded = pending.filter((mutation) => (
    mutation.conflictKey
    && lastWriteWinsTypes.has(mutation.type)
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

  return { synced, failed, pending: pendingToSync.length, superseded: superseded.length };
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
