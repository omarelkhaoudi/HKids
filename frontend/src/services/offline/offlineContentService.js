import { getFileUrl } from '../../utils/fileUrl';
import { resolveBookCoverUrl } from '../../utils/bookCover';
import { storage } from '../../utils/storage';
import {
  assertParentalAccess,
  filterOfflineContent
} from '../parental/parentalAccessService';
import { registerDownloadInCloud, unregisterDownloadInCloud } from '../cloud/cloudSyncService';
import { offlineDb } from './offlineDb';

const DOWNLOAD_VERSION = 1;
const MAX_DOWNLOADS = 60;
const DOWNLOAD_TIMEOUT_MS = 45_000;
const MAX_ASSET_DOWNLOAD_ATTEMPTS = 3;
const RETRYABLE_DOWNLOAD_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function nowIso() {
  return new Date().toISOString();
}

function downloadId(type, id) {
  return `${type}:${id}`;
}

function ensureAbsoluteUrl(url) {
  if (!url) return null;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return null;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer?.unref === 'function') timer.unref();
  });
}

function sanitizeDownloadError(error) {
  if (!error) return 'Download failed';
  if (error.name === 'AbortError') return 'Download paused';
  if (error.code === 'DOWNLOAD_TIMEOUT') return 'Download timed out';
  if (error.status) return `Download failed with status ${error.status}`;
  return error.message || 'Download failed';
}

function isRetryableDownloadError(error) {
  if (!error || error.name === 'AbortError') return false;
  if (error.code === 'DOWNLOAD_TIMEOUT') return true;
  if (!error.status) return true;
  return RETRYABLE_DOWNLOAD_STATUSES.has(Number(error.status));
}

function downloadRetryDelayMs(attempt) {
  return Math.min(8_000, 600 * Math.max(1, attempt) ** 2);
}

async function fetchWithTimeout(url, { signal, timeoutMs = DOWNLOAD_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abort = () => controller.abort();

  if (signal?.aborted) {
    clearTimeout(timeoutId);
    const error = new Error('Download aborted');
    error.name = 'AbortError';
    throw error;
  }

  signal?.addEventListener('abort', abort, { once: true });

  try {
    return await fetch(url, { signal: controller.signal, credentials: 'same-origin' });
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error('Download timed out');
      timeoutError.code = 'DOWNLOAD_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
}

export async function hashBlobSha256(blob) {
  if (!blob?.arrayBuffer || !globalThis.crypto?.subtle) return null;
  const buffer = await blob.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function validateBlobMetadata(blob, metadata = {}) {
  if (!blob) return { ok: false, reason: 'missing_blob' };
  if (Number(blob.size || 0) <= 0) return { ok: false, reason: 'empty_blob' };
  const expectedBytes = Number(metadata.expectedBytes ?? metadata.byteLength ?? 0);
  if (expectedBytes > 0 && Number(blob.size || 0) !== expectedBytes) {
    return { ok: false, reason: 'size_mismatch' };
  }
  return { ok: true, reason: null };
}

export async function buildAssetManifestEntry({ blobId, asset, blob, responseMetadata = {}, contentId }) {
  return {
    blobId,
    key: asset.key,
    url: asset.url,
    contentId,
    byteLength: Number(blob?.size || 0),
    expectedBytes: Number(responseMetadata.expectedBytes || blob?.size || 0),
    contentType: responseMetadata.contentType || blob?.type || 'application/octet-stream',
    sha256: await hashBlobSha256(blob),
    etag: responseMetadata.etag || null,
    lastModified: responseMetadata.lastModified || null,
    savedAt: nowIso()
  };
}

async function fetchAsBlobOnce(url, { signal, onProgress } = {}) {
  const response = await fetchWithTimeout(url, { signal });
  if (!response.ok) {
    const error = new Error(`Download failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const total = Number(response.headers.get('content-length')) || 0;
  let blob;
  if (!response.body || !total) {
    blob = await response.blob();
    onProgress?.(100);
  } else {
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(Math.round((received / total) * 100));
    }

    blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
  }

  const validation = validateBlobMetadata(blob, { expectedBytes: total });
  if (!validation.ok) {
    const error = new Error(`Downloaded asset failed integrity check: ${validation.reason}`);
    error.code = 'DOWNLOAD_INTEGRITY';
    error.reason = validation.reason;
    throw error;
  }

  return {
    blob,
    responseMetadata: {
      expectedBytes: total || blob.size || 0,
      contentType: response.headers.get('content-type') || blob.type || 'application/octet-stream',
      etag: response.headers.get('etag') || null,
      lastModified: response.headers.get('last-modified') || null
    }
  };
}

async function fetchAsBlob(url, { signal, onProgress } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ASSET_DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await fetchAsBlobOnce(url, { signal, onProgress });
    } catch (error) {
      lastError = error;
      if (!isRetryableDownloadError(error) || attempt >= MAX_ASSET_DOWNLOAD_ATTEMPTS) {
        throw error;
      }
      await wait(downloadRetryDelayMs(attempt));
    }
  }

  throw lastError || new Error('Download failed');
}

function serializeBook(book) {
  const coverUrl = ensureAbsoluteUrl(resolveBookCoverUrl(book));
  const audioUrl = ensureAbsoluteUrl(getFileUrl(book.audio_url));
  const fileUrl = ensureAbsoluteUrl(getFileUrl(book.file_path || book.pdf_url));
  const pageAssets = (book.pages || [])
    .map((page, index) => {
      const pageUrl = ensureAbsoluteUrl(getFileUrl(page.image_path));
      if (!pageUrl) return null;
      const pageNumber = page.page_number ?? index + 1;
      return { key: `page-${pageNumber}`, url: pageUrl };
    })
    .filter(Boolean);

  return {
    id: downloadId('book', book.id),
    type: 'book',
    sourceId: book.id,
    title: book.title,
    summary: book.description || book.summary || '',
    language: book.language || 'fr',
    payload: book,
    assets: [
      coverUrl && { key: 'cover', url: coverUrl },
      audioUrl && { key: 'audio', url: audioUrl },
      fileUrl && { key: 'file', url: fileUrl },
      ...pageAssets,
    ].filter(Boolean)
  };
}

function serializeGeneratedStory(story) {
  const narrationTracks = (story.narration_tracks || [])
    .filter(t => t.available && t.url)
    .map(t => ({ key: `narration-${t.locale}`, url: ensureAbsoluteUrl(t.url) }))
    .filter(a => a.url);

  const coverUrl = story.cover_image_url ? ensureAbsoluteUrl(story.cover_image_url) : null;

  return {
    id: downloadId('generated-story', story.id),
    type: 'generated-story',
    sourceId: story.id,
    title: story.title,
    summary: story.summary || '',
    language: story.language || 'fr',
    payload: story,
    assets: [
      coverUrl && { key: 'cover', url: coverUrl },
      ...narrationTracks,
    ].filter(Boolean)
  };
}

function serializeVoiceMessage(message) {
  return {
    id: downloadId('voice-message', message.id),
    type: 'voice-message',
    sourceId: message.id,
    title: message.title,
    summary: message.message_text || '',
    language: message.language || 'fr',
    payload: message,
    assets: []
  };
}

async function putDownload(record) {
  await offlineDb.put(offlineDb.stores.downloads, record);
}

async function putBlob(id, blob, metadata) {
  await offlineDb.put(offlineDb.stores.blobs, {
    id,
    blob,
    metadata,
    savedAt: nowIso()
  });
}

function findManifestEntry(record, blobId) {
  return (record?.assetManifest || []).find((entry) => entry.blobId === blobId || entry.id === blobId) || null;
}

function recordMatchesDraftAssets(record, draft) {
  const assetKeys = Array.isArray(record?.assetKeys) ? record.assetKeys : [];
  return draft.assets.every((asset) => {
    const blobId = `${draft.id}:${asset.key}`;
    if (!assetKeys.includes(blobId)) return false;
    const manifest = findManifestEntry(record, blobId);
    return !manifest?.url || manifest.url === asset.url;
  });
}

async function validateBlobEntry(blobId, manifestEntry = null) {
  const entry = await offlineDb.get(offlineDb.stores.blobs, blobId);
  const metadata = {
    ...(entry?.metadata || {}),
    ...(manifestEntry || {})
  };
  const basic = validateBlobMetadata(entry?.blob, metadata);
  if (!basic.ok) return { ...basic, blobId, bytes: 0 };

  const expectedHash = metadata.sha256 || null;
  if (expectedHash) {
    const actualHash = await hashBlobSha256(entry.blob);
    if (actualHash && actualHash !== expectedHash) {
      return { ok: false, reason: 'checksum_mismatch', blobId, bytes: entry.blob.size || 0 };
    }
  }

  return { ok: true, reason: null, blobId, bytes: entry.blob.size || 0 };
}

export async function validateDownloadIntegrity(record) {
  if (!record) {
    return { ok: false, reason: 'missing_download', missingAssetKeys: [], corruptedAssetKeys: [], byteCount: 0 };
  }

  const assetKeys = Array.isArray(record.assetKeys) ? record.assetKeys : [];
  const expectedCount = Array.isArray(record.assets) ? record.assets.length : assetKeys.length;
  const missingAssetKeys = [];
  const corruptedAssetKeys = [];
  let byteCount = 0;

  if (record.status === 'downloaded' && assetKeys.length < expectedCount) {
    missingAssetKeys.push(...(record.assets || [])
      .map((asset) => `${record.id}:${asset.key}`)
      .filter((blobId) => !assetKeys.includes(blobId)));
  }

  for (const blobId of assetKeys) {
    const result = await validateBlobEntry(blobId, findManifestEntry(record, blobId));
    if (result.ok) {
      byteCount += result.bytes || 0;
    } else if (result.reason === 'missing_blob') {
      missingAssetKeys.push(blobId);
    } else {
      corruptedAssetKeys.push(blobId);
    }
  }

  const ok = missingAssetKeys.length === 0 && corruptedAssetKeys.length === 0;
  return {
    ok,
    reason: ok ? null : 'asset_integrity_failed',
    missingAssetKeys,
    corruptedAssetKeys,
    assetCount: assetKeys.length,
    expectedAssetCount: expectedCount,
    byteCount,
    verifiedAt: nowIso()
  };
}

async function collectReusableAssets(existing, draft) {
  const assetKeys = [];
  const assetManifest = [];
  if (!existing?.assetKeys?.length) return { assetKeys, assetManifest };

  for (const asset of draft.assets) {
    const blobId = `${draft.id}:${asset.key}`;
    if (!existing.assetKeys.includes(blobId)) continue;
    const manifestEntry = findManifestEntry(existing, blobId);
    if (manifestEntry?.url && manifestEntry.url !== asset.url) continue;
    const validation = await validateBlobEntry(blobId, manifestEntry);
    if (!validation.ok) continue;
    assetKeys.push(blobId);
    assetManifest.push(manifestEntry || {
      blobId,
      key: asset.key,
      url: asset.url,
      contentId: draft.id,
      byteLength: validation.bytes || 0,
      expectedBytes: validation.bytes || 0,
      contentType: 'application/octet-stream',
      sha256: null,
      savedAt: existing.updatedAt || nowIso()
    });
  }

  return { assetKeys, assetManifest };
}

function downloadProgress(assetKeys, assets) {
  return Math.round((assetKeys.length / Math.max(1, assets.length)) * 100);
}

async function pruneOldDownloads() {
  const all = await getDownloads({ includeRestricted: true });
  const completed = all
    .filter((item) => item.status === 'downloaded')
    .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));

  if (completed.length <= MAX_DOWNLOADS) return;
  const excess = completed.slice(0, completed.length - MAX_DOWNLOADS);
  await Promise.all(excess.map((item) => removeDownload(item.id)));
}

export async function getDownloads({ includeRestricted = false } = {}) {
  const records = await offlineDb.getAll(offlineDb.stores.downloads);
  return includeRestricted ? records : filterOfflineContent(records);
}

export async function getDownload(id) {
  return offlineDb.get(offlineDb.stores.downloads, id);
}

export async function getBookDownload(bookId) {
  return getDownload(downloadId('book', bookId));
}

export async function getGeneratedStoryDownload(storyId) {
  return getDownload(downloadId('generated-story', storyId));
}

export async function getVoiceMessageDownload(messageId) {
  return getDownload(downloadId('voice-message', messageId));
}

export async function downloadBook(book, { signal, onProgress } = {}) {
  await assertParentalAccess(book);
  const draft = serializeBook(book);
  const existing = await getDownload(draft.id);
  const startedAt = existing?.createdAt || nowIso();

  // Incremental reuse: skip fully downloaded unchanged books only after integrity validation.
  if (
    existing?.status === 'downloaded'
    && Array.isArray(existing.assetKeys)
    && existing.assetKeys.length >= draft.assets.length
    && recordMatchesDraftAssets(existing, draft)
  ) {
    const integrity = await validateDownloadIntegrity(existing);
    if (!integrity.ok) {
      await putDownload({
        ...existing,
        status: 'failed',
        progress: Math.min(existing.progress || 0, 99),
        lastIntegrityError: integrity.reason,
        integrity,
        updatedAt: nowIso()
      });
    } else {
      onProgress?.(100);
      return { ...existing, integrity };
    }
  }

  const reusable = await collectReusableAssets(existing, draft);
  const assetKeys = [...reusable.assetKeys];
  const assetManifest = [...reusable.assetManifest];

  if (!draft.assets.length) {
    const completed = {
      ...draft,
      version: DOWNLOAD_VERSION,
      status: 'downloaded',
      progress: 100,
      assetKeys,
      assetManifest,
      downloadedBytes: 0,
      integrity: {
        ok: true,
        assetCount: 0,
        expectedAssetCount: 0,
        verifiedAt: nowIso()
      },
      createdAt: startedAt,
      updatedAt: nowIso()
    };
    await putDownload(completed);
    onProgress?.(100);
    return completed;
  }

  await putDownload({
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloading',
    progress: assetKeys.length ? downloadProgress(assetKeys, draft.assets) : 0,
    assetKeys,
    assetManifest,
    createdAt: startedAt,
    updatedAt: nowIso()
  });

  try {
    for (const asset of draft.assets) {
      const blobId = `${draft.id}:${asset.key}`;
      if (assetKeys.includes(blobId)) {
        const weighted = Math.min(99, Math.round((assetKeys.length / Math.max(1, draft.assets.length)) * 100));
        onProgress?.(weighted);
        continue;
      }
      const { blob, responseMetadata } = await fetchAsBlob(asset.url, {
        signal,
        onProgress: (progress) => {
          const weighted = Math.min(99, Math.round((assetKeys.length / Math.max(1, draft.assets.length)) * 100 + progress / Math.max(1, draft.assets.length)));
          putDownload({
            ...draft,
            version: DOWNLOAD_VERSION,
            status: 'downloading',
            progress: weighted,
            assetKeys: [...assetKeys],
            assetManifest: [...assetManifest],
            createdAt: startedAt,
            updatedAt: nowIso()
          }).catch(() => {});
          onProgress?.(weighted);
        }
      });
      const manifestEntry = await buildAssetManifestEntry({
        blobId,
        asset,
        blob,
        responseMetadata,
        contentId: draft.id
      });
      await putBlob(blobId, blob, {
        url: asset.url,
        type: asset.key,
        contentId: draft.id,
        ...manifestEntry
      });
      assetKeys.push(blobId);
      assetManifest.push(manifestEntry);
    }

    const integrity = await validateDownloadIntegrity({
      ...draft,
      status: 'downloaded',
      assetKeys,
      assetManifest
    });
    if (!integrity.ok) {
      const error = new Error('Offline asset integrity validation failed');
      error.code = 'DOWNLOAD_INTEGRITY';
      throw error;
    }

    const completed = {
      ...draft,
      version: DOWNLOAD_VERSION,
      status: 'downloaded',
      progress: 100,
      assetKeys,
      assetManifest,
      downloadedBytes: integrity.byteCount || assetManifest.reduce((sum, item) => sum + Number(item.byteLength || 0), 0),
      integrity,
      createdAt: startedAt,
      updatedAt: nowIso()
    };
    await putDownload(completed);
    await notifyServiceWorker(draft.assets.map((asset) => asset.url));
    await pruneOldDownloads();
    storage.markDownloaded(draft.id);
    registerDownloadInCloud(draft.type, draft.sourceId).catch(() => {});
    return completed;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Keep partial progress for resume (safe — do not corrupt completed assets)
      await putDownload({
        ...draft,
        version: DOWNLOAD_VERSION,
        status: 'paused',
        progress: downloadProgress(assetKeys, draft.assets),
        assetKeys,
        assetManifest,
        createdAt: startedAt,
        updatedAt: nowIso()
      });
      throw error;
    }
    await putDownload({
      ...draft,
      version: DOWNLOAD_VERSION,
      status: 'failed',
      progress: downloadProgress(assetKeys, draft.assets),
      assetKeys,
      assetManifest,
      error: sanitizeDownloadError(error),
      createdAt: startedAt,
      updatedAt: nowIso()
    });
    throw error;
  }
}

export async function saveGeneratedStoryOffline(story) {
  await assertParentalAccess(story);
  const draft = serializeGeneratedStory(story);
  const timestamp = nowIso();
  const record = {
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloaded',
    progress: 100,
    assetKeys: [],
    assetManifest: [],
    downloadedBytes: 0,
    integrity: {
      ok: true,
      assetCount: 0,
      expectedAssetCount: 0,
      verifiedAt: timestamp
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await putDownload(record);
  await pruneOldDownloads();
  storage.markDownloaded(draft.id);
  registerDownloadInCloud('generated-story', draft.sourceId).catch(() => {});
  return record;
}

export async function saveVoiceMessageOffline(message, audioBlob = null) {
  const draft = serializeVoiceMessage(message);
  const timestamp = nowIso();
  const assetKeys = [];
  const assetManifest = [];

  if (audioBlob) {
    const blobId = `${draft.id}:audio`;
    const validation = validateBlobMetadata(audioBlob);
    if (!validation.ok) {
      const error = new Error(`Voice message audio failed integrity check: ${validation.reason}`);
      error.code = 'DOWNLOAD_INTEGRITY';
      throw error;
    }
    const asset = { key: 'audio', url: message.audio_url || message.audio_path || null };
    const manifestEntry = await buildAssetManifestEntry({
      blobId,
      asset,
      blob: audioBlob,
      responseMetadata: { expectedBytes: audioBlob.size || 0, contentType: audioBlob.type || 'audio/mpeg' },
      contentId: draft.id
    });
    await putBlob(blobId, audioBlob, { type: 'audio', contentId: draft.id, ...manifestEntry });
    assetKeys.push(blobId);
    assetManifest.push(manifestEntry);
  }

  const record = {
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloaded',
    progress: 100,
    assetKeys,
    assetManifest,
    downloadedBytes: assetManifest.reduce((sum, item) => sum + Number(item.byteLength || 0), 0),
    integrity: {
      ok: true,
      assetCount: assetKeys.length,
      expectedAssetCount: assetKeys.length,
      verifiedAt: timestamp
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await putDownload(record);
  await pruneOldDownloads();
  storage.markDownloaded(draft.id);
  registerDownloadInCloud('voice-message', draft.sourceId).catch(() => {});
  return record;
}

export async function removeDownload(id) {
  const record = await offlineDb.get(offlineDb.stores.downloads, id);
  if (record?.assetKeys?.length) {
    await Promise.all(record.assetKeys.map((assetKey) => offlineDb.delete(offlineDb.stores.blobs, assetKey)));
  }
  await offlineDb.delete(offlineDb.stores.downloads, id);

  if (record?.type && record?.sourceId) {
    storage.unmarkDownloaded(record.id);
    unregisterDownloadInCloud(record.type, record.sourceId).catch(() => {});
  }
}

export async function getOfflineBlobUrl(blobId) {
  const entry = await offlineDb.get(offlineDb.stores.blobs, blobId);
  if (!entry?.blob) return null;
  return URL.createObjectURL(entry.blob);
}

export async function revokeOfflineBlobUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Hydrate a downloaded book payload with local blob URLs for offline reading.
 */
export async function resolveOfflineBook(bookId) {
  const download = await getBookDownload(bookId);
  if (!download || download.status !== 'downloaded') return null;
  const integrity = await validateDownloadIntegrity(download);
  if (!integrity.ok) {
    await putDownload({
      ...download,
      status: 'failed',
      progress: Math.min(download.progress || 0, 99),
      integrity,
      error: 'Offline assets need to be downloaded again.',
      updatedAt: nowIso()
    });
    return null;
  }

  const book = {
    ...download.payload,
    pages: Array.isArray(download.payload?.pages)
      ? download.payload.pages.map((page) => ({ ...page }))
      : [],
  };
  const blobUrls = [];

  for (const assetKey of download.assetKeys || []) {
    const blobUrl = await getOfflineBlobUrl(assetKey);
    if (!blobUrl) continue;
    blobUrls.push(blobUrl);
    const assetType = assetKey.split(':').pop();

    if (assetType === 'cover') {
      book.cover_image = blobUrl;
    } else if (assetType === 'audio') {
      book.audio_url = blobUrl;
    } else if (assetType === 'file') {
      book.file_path = blobUrl;
    } else if (assetType?.startsWith('page-')) {
      const pageNumber = Number(assetType.replace('page-', ''));
      book.pages = book.pages.map((page, index) => {
        const matches = Number(page.page_number ?? index + 1) === pageNumber;
        return matches ? { ...page, image_path: blobUrl } : page;
      });
    }
  }

  book._offlineBlobUrls = blobUrls;
  book._offlineReady = true;
  return book;
}

export async function auditOfflineDownloads({ repair = false, removeOrphans = false } = {}) {
  const [downloads, blobs] = await Promise.all([
    getDownloads({ includeRestricted: true }),
    offlineDb.getAll(offlineDb.stores.blobs)
  ]);
  const referencedBlobIds = new Set(
    downloads.flatMap((download) => Array.isArray(download.assetKeys) ? download.assetKeys : [])
  );
  const orphanBlobIds = blobs
    .map((entry) => entry?.id)
    .filter((id) => id && !referencedBlobIds.has(id));
  const corrupted = [];
  let healthy = 0;
  let downloadedBytes = 0;

  for (const download of downloads) {
    if (download.status !== 'downloaded') continue;
    const integrity = await validateDownloadIntegrity(download);
    downloadedBytes += integrity.byteCount || 0;
    if (integrity.ok) {
      healthy += 1;
    } else {
      corrupted.push({ id: download.id, integrity });
      if (repair) {
        await putDownload({
          ...download,
          status: 'failed',
          progress: Math.min(download.progress || 0, 99),
          error: 'Offline assets need to be downloaded again.',
          integrity,
          updatedAt: nowIso()
        });
      }
    }
  }

  if (removeOrphans) {
    await Promise.all(orphanBlobIds.map((blobId) => offlineDb.delete(offlineDb.stores.blobs, blobId)));
  }

  const result = {
    ok: corrupted.length === 0,
    checkedDownloads: downloads.filter((download) => download.status === 'downloaded').length,
    healthyDownloads: healthy,
    corruptedDownloads: corrupted,
    orphanBlobIds,
    downloadedBytes,
    repaired: repair ? corrupted.length : 0,
    removedOrphans: removeOrphans ? orphanBlobIds.length : 0,
    checkedAt: nowIso()
  };

  await offlineDb.put(offlineDb.stores.metadata, {
    key: 'offline:integrity:last-audit',
    value: result,
    updatedAt: result.checkedAt
  }).catch(() => {});

  return result;
}

export async function notifyServiceWorker(urls) {
  if (!navigator.serviceWorker?.controller || !urls?.length) return;
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    urls
  });
}

export const offlineContentIds = {
  book: (id) => downloadId('book', id),
  generatedStory: (id) => downloadId('generated-story', id),
  voiceMessage: (id) => downloadId('voice-message', id)
};
