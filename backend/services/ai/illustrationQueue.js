/**
 * In-memory async illustration queue with concurrency, retry, and cache.
 * Processes story illustration jobs in the background without blocking the API.
 */

import { generateStoryIllustrations } from './storyIllustrationService.js';

const MAX_CONCURRENCY = 2;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

const queue = [];
const activeJobs = new Map();
const completedCache = new Map();
let running = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function processNext() {
  while (running < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    running += 1;
    activeJobs.set(job.storyId, { status: 'processing', startedAt: Date.now(), attempt: job.attempt });

    executeJob(job)
      .then((result) => {
        completedCache.set(job.storyId, { status: result.status, completedAt: Date.now() });
        activeJobs.delete(job.storyId);
      })
      .catch((err) => {
        console.error(`[illustrationQueue] job failed for story ${job.storyId}:`, err.message);

        if (job.attempt < MAX_RETRIES) {
          queue.push({ ...job, attempt: job.attempt + 1, retryAfter: Date.now() + RETRY_DELAY_MS });
          activeJobs.set(job.storyId, { status: 'retry_pending', attempt: job.attempt + 1 });
        } else {
          completedCache.set(job.storyId, { status: 'failed', error: err.message, completedAt: Date.now() });
          activeJobs.delete(job.storyId);
        }
      })
      .finally(() => {
        running -= 1;
        processNext();
      });
  }
}

async function executeJob(job) {
  if (job.retryAfter && Date.now() < job.retryAfter) {
    await sleep(job.retryAfter - Date.now());
  }
  return generateStoryIllustrations(job.storyId, { provider: job.provider, force: job.force });
}

export function enqueueIllustrationJob(storyId, { provider, force = false } = {}) {
  if (!force && completedCache.has(storyId)) {
    const cached = completedCache.get(storyId);
    if (cached.status === 'completed' || cached.status === 'partial') {
      return { queued: false, reason: 'already_completed', status: cached.status };
    }
  }

  if (activeJobs.has(storyId)) {
    return { queued: false, reason: 'already_processing' };
  }

  if (queue.some((j) => j.storyId === storyId)) {
    return { queued: false, reason: 'already_queued' };
  }

  queue.push({ storyId, provider, force, attempt: 0 });
  processNext();

  return { queued: true, position: queue.length };
}

export function getIllustrationJobStatus(storyId) {
  if (activeJobs.has(storyId)) {
    return { status: 'processing', ...activeJobs.get(storyId) };
  }

  const pending = queue.find((j) => j.storyId === storyId);
  if (pending) {
    return { status: 'queued', position: queue.indexOf(pending) + 1, attempt: pending.attempt };
  }

  if (completedCache.has(storyId)) {
    return { status: 'done', ...completedCache.get(storyId) };
  }

  return { status: 'unknown' };
}

export function clearIllustrationCache(storyId) {
  if (storyId) {
    completedCache.delete(storyId);
  } else {
    completedCache.clear();
  }
}

export function getQueueStats() {
  return {
    queued: queue.length,
    active: running,
    completed: completedCache.size,
  };
}
