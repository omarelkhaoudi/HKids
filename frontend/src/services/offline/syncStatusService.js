const listeners = new Set();

export const SYNC_PHASE = {
  idle: 'idle',
  syncing: 'syncing',
  success: 'success',
  partial: 'partial',
  error: 'error',
};

let currentState = {
  phase: SYNC_PHASE.idle,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queuePending: 0,
  queueFailed: 0,
  cloudUnchanged: null,
  conflictsResolved: 0,
  lastError: null,
  updatedAt: null,
};

function emit() {
  const snapshot = { ...currentState };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.warn('Sync status listener failed:', error);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hkids:sync-status', { detail: snapshot }));
  }
}

export function getSyncStatus() {
  return { ...currentState };
}

export function subscribeSyncStatus(listener) {
  listeners.add(listener);
  listener({ ...currentState });
  return () => listeners.delete(listener);
}

export function setNetworkOnline(online) {
  currentState = { ...currentState, online: Boolean(online), updatedAt: new Date().toISOString() };
  emit();
}

export function beginSync({ queuePending = 0 } = {}) {
  currentState = {
    ...currentState,
    phase: SYNC_PHASE.syncing,
    queuePending,
    queueFailed: 0,
    lastError: null,
    updatedAt: new Date().toISOString(),
  };
  emit();
}

export function completeSync({
  queueFailed = 0,
  queuePending = 0,
  cloudUnchanged = null,
  conflictsResolved = 0,
  error = null,
} = {}) {
  const phase = error
    ? SYNC_PHASE.error
    : queueFailed > 0
      ? SYNC_PHASE.partial
      : SYNC_PHASE.success;

  currentState = {
    ...currentState,
    phase,
    queuePending,
    queueFailed,
    cloudUnchanged,
    conflictsResolved,
    lastError: error ? (error.message || String(error)) : null,
    updatedAt: new Date().toISOString(),
  };
  emit();

  if (phase === SYNC_PHASE.success || phase === SYNC_PHASE.partial) {
    window.setTimeout(() => {
      if (currentState.phase === phase) {
        currentState = { ...currentState, phase: SYNC_PHASE.idle, updatedAt: new Date().toISOString() };
        emit();
      }
    }, 4000);
  }
}
