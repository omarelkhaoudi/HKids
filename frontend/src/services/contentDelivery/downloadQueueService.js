/**
 * Download queue with pause / resume / cancel, progress %, and ETA.
 * Reuses completed asset blobs (incremental) — never re-downloads unchanged files.
 */

const EVENT_NAME = 'hkids:download-queue';

/** @type {Map<string, { status: string, progress: number, bytesDone: number, bytesTotal: number, startedAt: number, pausedAt: number|null, etaSeconds: number|null, error: string|null, label: string }>} */
const jobs = new Map();

/** Controllers keyed by job id — abort pauses/cancels current fetch without deleting completed assets when paused. */
const controllers = new Map();

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: getQueueSnapshot() }));
}

export function subscribeDownloadQueue(listener) {
  const handler = (event) => listener(event.detail || getQueueSnapshot());
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function getQueueSnapshot() {
  return {
    jobs: Object.fromEntries(jobs.entries()),
    activeCount: [...jobs.values()].filter((j) => j.status === 'downloading').length,
    pausedCount: [...jobs.values()].filter((j) => j.status === 'paused').length,
  };
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

function estimateEta(startedAt, progress) {
  if (!startedAt || !progress || progress <= 0 || progress >= 100) return null;
  const elapsed = (Date.now() - startedAt) / 1000;
  const remaining = elapsed * ((100 - progress) / progress);
  return Math.max(1, Math.round(remaining));
}

export function upsertJob(jobId, patch) {
  const current = jobs.get(jobId) || {
    status: 'idle',
    progress: 0,
    bytesDone: 0,
    bytesTotal: 0,
    startedAt: Date.now(),
    pausedAt: null,
    etaSeconds: null,
    error: null,
    label: jobId,
  };
  const next = { ...current, ...patch };
  if (next.status === 'downloading') {
    next.etaSeconds = estimateEta(next.startedAt, next.progress);
  }
  jobs.set(jobId, next);
  emit();
  return next;
}

export function createAbortController(jobId) {
  controllers.get(jobId)?.abort();
  const controller = new AbortController();
  controllers.set(jobId, controller);
  return controller;
}

export function getAbortSignal(jobId) {
  return controllers.get(jobId)?.signal;
}

export function pauseJob(jobId) {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'downloading') return job || null;
  controllers.get(jobId)?.abort();
  controllers.delete(jobId);
  return upsertJob(jobId, { status: 'paused', pausedAt: Date.now() });
}

export function cancelJob(jobId) {
  controllers.get(jobId)?.abort();
  controllers.delete(jobId);
  const next = upsertJob(jobId, { status: 'cancelled', progress: 0, etaSeconds: null, error: null });
  return next;
}

export function clearJob(jobId) {
  controllers.get(jobId)?.abort();
  controllers.delete(jobId);
  jobs.delete(jobId);
  emit();
}

export function markJobFailed(jobId, error) {
  return upsertJob(jobId, {
    status: 'failed',
    error: error?.message || String(error || 'Download failed'),
    etaSeconds: null,
  });
}

export function markJobComplete(jobId) {
  controllers.delete(jobId);
  return upsertJob(jobId, {
    status: 'downloaded',
    progress: 100,
    etaSeconds: 0,
    error: null,
    pausedAt: null,
  });
}

export function formatEta(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins}m`;
}

export function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
