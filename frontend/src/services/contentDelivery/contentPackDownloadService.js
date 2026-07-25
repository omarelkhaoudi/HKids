/**
 * Content pack downloads — theme-matched books + learning metadata, offline-ready.
 * Reuses offlineContentService.downloadBook for assets; skips unchanged blobs.
 */

import { booksAPI } from '../../api/books';
import { learningAPI } from '../../api/learning';
import { offlineDb } from '../offline/offlineDb';
import {
  downloadBook,
  getDownload,
  getDownloads,
  removeDownload,
} from '../offline/offlineContentService';
import {
  cancelJob,
  createAbortController,
  getAbortSignal,
  markJobComplete,
  markJobFailed,
  pauseJob,
  upsertJob,
} from './downloadQueueService';
import { offlineAPI } from '../../api/offline';
import { bookMatchesPack } from '../../constants/premiumPacks';

function packDownloadId(packId) {
  return `pack:${packId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function themesMatch(item, pack) {
  if (!pack?.themes?.length) return false;
  const text = [
    item.title,
    item.theme,
    item.category_name,
    item.description,
    item.type,
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return pack.themes.some((theme) => text.includes(String(theme).toLowerCase()));
}

export async function resolvePackMembers(pack, { language = 'fr' } = {}) {
  const [booksRes, learningRes] = await Promise.allSettled([
    booksAPI.getPublishedBooks({ language }),
    learningAPI.getContents?.() || Promise.resolve({ data: [] }),
  ]);

  const books = booksRes.status === 'fulfilled'
    ? (booksRes.value.data || []).filter((book) => bookMatchesPack(book, pack) || themesMatch(book, pack))
    : [];

  const learning = learningRes.status === 'fulfilled'
    ? (Array.isArray(learningRes.value.data)
      ? learningRes.value.data
      : (learningRes.value.data?.items || [])).filter((item) => themesMatch(item, pack))
    : [];

  const quizzes = learning.filter((item) => String(item.type || item.content_type || '').includes('quiz'));
  const games = learning.filter((item) => {
    const type = String(item.type || item.content_type || '');
    return type.includes('game') || type.includes('memory');
  });

  return {
    books: books.slice(0, 24),
    quizzes: quizzes.slice(0, 12),
    games: games.slice(0, 12),
  };
}

async function putPackRecord(record) {
  await offlineDb.put(offlineDb.stores.downloads, record);
}

async function saveLearningOffline(item, type) {
  const id = `${type}:${item.id}`;
  const existing = await getDownload(id);
  if (existing?.status === 'downloaded') return existing;

  const timestamp = nowIso();
  const record = {
    id,
    type,
    sourceId: item.id,
    title: item.title || item.name || id,
    summary: item.description || '',
    language: item.language || 'fr',
    payload: item,
    assets: [],
    assetKeys: [],
    version: 1,
    status: 'downloaded',
    progress: 100,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  await putPackRecord(record);
  return record;
}

/**
 * Download a content pack incrementally. Pause aborts current fetch but keeps progress.
 */
export async function downloadContentPack(pack, { language = 'fr', resume = false } = {}) {
  if (!pack?.id) throw new Error('Pack id required');
  const jobId = packDownloadId(pack.id);
  const existing = await getDownload(jobId);

  if (!resume && existing?.status === 'downloaded') {
    return existing;
  }

  const controller = createAbortController(jobId);
  const startedAt = existing?.createdAt || nowIso();
  upsertJob(jobId, {
    status: 'downloading',
    progress: existing?.progress || 1,
    startedAt: Date.now(),
    pausedAt: null,
    label: pack.title || pack.id,
    error: null,
  });

  await putPackRecord({
    id: jobId,
    type: 'pack',
    sourceId: pack.id,
    title: pack.title || pack.id,
    summary: pack.description || '',
    language,
    payload: {
      pack,
      memberIds: existing?.payload?.memberIds || [],
      learningIds: existing?.payload?.learningIds || [],
    },
    assets: [],
    assetKeys: existing?.assetKeys || [],
    bytes: existing?.bytes || pack.estimated_bytes || pack.estimatedBytes || 0,
    version: 1,
    status: 'downloading',
    progress: existing?.progress || 0,
    createdAt: startedAt,
    updatedAt: nowIso(),
  });

  try {
    const members = await resolvePackMembers(pack, { language });
    const memberIds = [];
    const learningIds = [];
    const totalSteps = Math.max(1, members.books.length + members.quizzes.length + members.games.length);
    let doneSteps = 0;

    for (const book of members.books) {
      if (controller.signal.aborted) {
        const err = new Error('Download paused');
        err.name = 'AbortError';
        throw err;
      }
      const bookId = `book:${book.id}`;
      const already = await getDownload(bookId);
      if (already?.status !== 'downloaded') {
        await downloadBook(book, {
          signal: getAbortSignal(jobId),
          onProgress: (progress) => {
            const overall = Math.round(((doneSteps + progress / 100) / totalSteps) * 100);
            upsertJob(jobId, { progress: Math.min(99, overall), status: 'downloading' });
            putPackRecord({
              id: jobId,
              type: 'pack',
              sourceId: pack.id,
              title: pack.title || pack.id,
              summary: pack.description || '',
              language,
              payload: { pack, memberIds, learningIds },
              assets: [],
              assetKeys: [],
              bytes: pack.estimated_bytes || pack.estimatedBytes || 0,
              version: 1,
              status: 'downloading',
              progress: Math.min(99, overall),
              createdAt: startedAt,
              updatedAt: nowIso(),
            });
          },
        });
      }
      memberIds.push(book.id);
      doneSteps += 1;
      const overall = Math.round((doneSteps / totalSteps) * 100);
      upsertJob(jobId, { progress: Math.min(99, overall) });
    }

    for (const quiz of members.quizzes) {
      if (controller.signal.aborted) {
        const err = new Error('Download paused');
        err.name = 'AbortError';
        throw err;
      }
      await saveLearningOffline(quiz, 'quiz');
      learningIds.push(quiz.id);
      doneSteps += 1;
      upsertJob(jobId, { progress: Math.round((doneSteps / totalSteps) * 100) });
    }

    for (const game of members.games) {
      if (controller.signal.aborted) {
        const err = new Error('Download paused');
        err.name = 'AbortError';
        throw err;
      }
      await saveLearningOffline(game, 'game');
      learningIds.push(game.id);
      doneSteps += 1;
      upsertJob(jobId, { progress: Math.round((doneSteps / totalSteps) * 100) });
    }

    const completed = {
      id: jobId,
      type: 'pack',
      sourceId: pack.id,
      title: pack.title || pack.id,
      summary: pack.description || '',
      language,
      payload: { pack, memberIds, learningIds, counts: {
        books: memberIds.length,
        learning: learningIds.length,
      } },
      assets: [],
      assetKeys: [],
      bytes: pack.estimated_bytes || pack.estimatedBytes || 0,
      version: 1,
      status: 'downloaded',
      progress: 100,
      createdAt: startedAt,
      updatedAt: nowIso(),
    };
    await putPackRecord(completed);
    markJobComplete(jobId);
    return completed;
  } catch (error) {
    if (error.name === 'AbortError') {
      const current = await getDownload(jobId);
      await putPackRecord({
        ...(current || {}),
        id: jobId,
        type: 'pack',
        sourceId: pack.id,
        status: 'paused',
        updatedAt: nowIso(),
      });
      pauseJob(jobId);
      throw error;
    }
    markJobFailed(jobId, error);
    const current = await getDownload(jobId);
    await putPackRecord({
      ...(current || {}),
      id: jobId,
      type: 'pack',
      sourceId: pack.id,
      status: 'failed',
      error: error.message,
      updatedAt: nowIso(),
    });
    throw error;
  }
}

export async function pausePackDownload(packId) {
  pauseJob(packDownloadId(packId));
  const record = await getDownload(packDownloadId(packId));
  if (record) {
    await putPackRecord({ ...record, status: 'paused', updatedAt: nowIso() });
  }
}

export async function cancelPackDownload(packId) {
  cancelJob(packDownloadId(packId));
  await removeDownload(packDownloadId(packId));
}

export async function resumePackDownload(pack, options = {}) {
  return downloadContentPack(pack, { ...options, resume: true });
}

export async function redownloadPack(pack, options = {}) {
  await removeDownload(packDownloadId(pack.id));
  return downloadContentPack(pack, { ...options, resume: false });
}

export async function removePack(packId) {
  const record = await getDownload(packDownloadId(packId));
  // Keep individual books — only remove pack membership record
  await removeDownload(packDownloadId(packId));
  return record;
}

export async function listDownloadedPacks() {
  const downloads = await getDownloads({ includeRestricted: true });
  return downloads.filter((d) => d.type === 'pack');
}

export async function listAvailablePacks() {
  try {
    const response = await offlineAPI.getCurrentCatalog();
    return response.data?.packs || [];
  } catch {
    return [];
  }
}

export { packDownloadId };
