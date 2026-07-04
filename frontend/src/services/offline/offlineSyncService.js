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

export async function queueOfflineMutation(type, payload, conflictKey = null) {
  const timestamp = nowIso();
  const entry = {
    id: createId(type),
    type,
    payload,
    conflictKey,
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
  return all
    .filter((item) => item.status === SYNC_STATUS.pending || item.status === SYNC_STATUS.failed)
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

export async function synchronizePendingMutations(handlers = {}) {
  if (!navigator.onLine) return { synced: 0, failed: 0, pending: 0 };

  const pending = await getPendingMutations();
  let synced = 0;
  let failed = 0;

  for (const mutation of pending) {
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

  return { synced, failed, pending: pending.length };
}

export const offlineConflictPolicy = {
  name: 'last-write-wins',
  description: 'Les changements locaux sont horodates. Au retour reseau, la derniere action utilisateur est envoyee en premier pour chaque conflit simple.'
};
