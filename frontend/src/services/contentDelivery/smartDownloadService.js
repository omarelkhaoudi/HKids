/**
 * Priority download orchestrator with global de-dupe.
 * Never starts a second download for the same job id while queued/active/complete.
 */

import {
  cancelJob,
  createAbortController,
  getJob,
  getQueueSnapshot,
  markJobComplete,
  markJobFailed,
  upsertJob,
} from './downloadQueueService';
import { downloadBook, getDownload, offlineContentIds } from '../offline/offlineContentService';
import { getOfflinePrefs, shouldDeferForNetwork } from './offlinePrefs';
import { recordOfflineEvent } from './offlineAnalyticsService';

export const DOWNLOAD_PRIORITY = {
  FAVORITE: 100,
  MANUAL: 80,
  PACK: 50,
  PREDICTIVE: 20,
};

const MAX_CONCURRENT = 1;
let draining = false;

/** Pending book payloads awaiting drain, keyed by jobId */
const pending = new Map();

export function bookJobId(bookId) {
  return offlineContentIds.book(bookId);
}

function isActiveStatus(status) {
  return status === 'queued' || status === 'downloading' || status === 'paused';
}

function isDoneStatus(status) {
  return status === 'downloaded';
}

/**
 * Enqueue a book download. Returns { accepted, reason, jobId }.
 * Duplicate in-flight or already-downloaded books are skipped.
 */
export async function enqueueBookDownload(book, {
  priority = DOWNLOAD_PRIORITY.MANUAL,
  label,
  reason = 'manual',
  force = false,
} = {}) {
  if (!book?.id && book?.id !== 0) {
    return { accepted: false, reason: 'invalid', jobId: null };
  }

  const jobId = bookJobId(book.id);
  const prefs = getOfflinePrefs();

  if (shouldDeferForNetwork(prefs)) {
    return { accepted: false, reason: 'wifi_only', jobId };
  }

  if (!force) {
    try {
      const existing = await getDownload(jobId);
      if (existing?.status === 'downloaded') {
        await recordOfflineEvent('download_skipped_duplicate', { jobId, source: reason });
        await recordOfflineEvent('cache_hit', { jobId });
        upsertJob(jobId, {
          status: 'downloaded',
          progress: 100,
          priority,
          label: label || book.title || jobId,
          reason,
          kind: 'book',
          sourceId: book.id,
        });
        return { accepted: false, reason: 'already_downloaded', jobId };
      }
    } catch {
      /* IndexedDB may be unavailable in tests / private mode */
    }
  }

  const current = getJob(jobId);
  if (current && isActiveStatus(current.status) && !force) {
    // Promote priority if a higher-priority request arrives for the same job
    if ((current.priority || 0) < priority) {
      upsertJob(jobId, { priority });
      const queued = pending.get(jobId);
      if (queued) queued.priority = priority;
    }
    await recordOfflineEvent('download_skipped_duplicate', { jobId, source: reason });
    return { accepted: false, reason: 'already_queued', jobId };
  }

  if (current && isDoneStatus(current.status) && !force) {
    await recordOfflineEvent('download_skipped_duplicate', { jobId, source: reason });
    return { accepted: false, reason: 'already_downloaded', jobId };
  }

  upsertJob(jobId, {
    status: 'queued',
    progress: current?.progress || 0,
    priority,
    label: label || book.title || String(book.id),
    reason,
    kind: 'book',
    sourceId: book.id,
    error: null,
  });

  pending.set(jobId, { book, priority, label: label || book.title, reason });
  await recordOfflineEvent('download_started', { jobId, source: reason, priority });
  drainQueue().catch(() => {});
  return { accepted: true, reason: 'queued', jobId };
}

export function getOrderedJobs() {
  const { jobs } = getQueueSnapshot();
  return Object.entries(jobs)
    .map(([id, job]) => ({ id, ...job }))
    .sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.startedAt || 0) - (b.startedAt || 0);
    });
}

async function runBookJob(jobId, entry) {
  const controller = createAbortController(jobId);
  upsertJob(jobId, {
    status: 'downloading',
    startedAt: Date.now(),
    pausedAt: null,
    priority: entry.priority,
    label: entry.label,
    reason: entry.reason,
    kind: 'book',
    sourceId: entry.book.id,
  });

  try {
    const result = await downloadBook(entry.book, {
      signal: controller.signal,
      onProgress: (progress) => {
        upsertJob(jobId, { progress, status: 'downloading' });
      },
    });
    markJobComplete(jobId);
    await recordOfflineEvent('download_completed', { jobId, source: entry.reason });
    return result;
  } catch (error) {
    if (error?.name === 'AbortError') {
      // Keep payload so resume can continue without re-fetch
      pending.set(jobId, entry);
      upsertJob(jobId, { status: 'paused', pausedAt: Date.now() });
      throw error;
    }
    markJobFailed(jobId, error);
    await recordOfflineEvent('download_failed', { jobId, source: entry.reason });
    throw error;
  }
}

export async function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    while (true) {
      const snapshot = getQueueSnapshot();
      const active = Object.values(snapshot.jobs).filter((j) => j.status === 'downloading').length;
      if (active >= MAX_CONCURRENT) break;

      const nextId = [...pending.entries()]
        .filter(([id]) => {
          const job = getJob(id);
          return job && (job.status === 'queued' || job.status === 'paused');
        })
        .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0))[0]?.[0];

      if (!nextId) break;

      const entry = pending.get(nextId);
      pending.delete(nextId);
      if (!entry) break;

      try {
        await runBookJob(nextId, entry);
      } catch {
        /* recorded above */
      }
    }
  } finally {
    draining = false;
  }
}

export async function resumeBookJob(jobId) {
  const job = getJob(jobId);
  if (!job || !['paused', 'failed', 'cancelled', 'queued'].includes(job.status)) {
    return null;
  }

  let entry = pending.get(jobId);
  if (!entry?.book && job.sourceId != null) {
    try {
      const { booksAPI } = await import('../../api/books');
      const response = await booksAPI.getBook(job.sourceId);
      const book = response.data?.book || response.data;
      if (book) {
        entry = {
          book,
          priority: job.priority || DOWNLOAD_PRIORITY.MANUAL,
          label: job.label || book.title,
          reason: job.reason || 'manual',
        };
        pending.set(jobId, entry);
      }
    } catch {
      return null;
    }
  }

  if (!entry) return null;
  upsertJob(jobId, { status: 'queued', error: null, pausedAt: null });
  await drainQueue();
  return getJob(jobId);
}

export function cancelBookJob(jobId) {
  pending.delete(jobId);
  return cancelJob(jobId);
}
