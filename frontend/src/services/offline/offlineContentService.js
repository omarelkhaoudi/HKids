import { getFileUrl } from '../../utils/fileUrl';
import { getImageUrl } from '../../utils/imageUrl';
import { offlineDb } from './offlineDb';

const DOWNLOAD_VERSION = 1;
const MAX_DOWNLOADS = 60;

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

async function fetchAsBlob(url, { signal, onProgress } = {}) {
  const response = await fetch(url, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || !total) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

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

  return new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
}

function serializeBook(book) {
  const coverUrl = ensureAbsoluteUrl(getImageUrl(book.cover_image));
  const audioUrl = ensureAbsoluteUrl(getFileUrl(book.audio_url));
  const fileUrl = ensureAbsoluteUrl(getFileUrl(book.file_url || book.pdf_url));

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
      fileUrl && { key: 'file', url: fileUrl }
    ].filter(Boolean)
  };
}

function serializeGeneratedStory(story) {
  return {
    id: downloadId('generated-story', story.id),
    type: 'generated-story',
    sourceId: story.id,
    title: story.title,
    summary: story.summary || '',
    language: story.language || 'fr',
    payload: story,
    assets: []
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

async function pruneOldDownloads() {
  const all = await offlineDb.getAll(offlineDb.stores.downloads);
  const completed = all
    .filter((item) => item.status === 'downloaded')
    .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));

  if (completed.length <= MAX_DOWNLOADS) return;
  const excess = completed.slice(0, completed.length - MAX_DOWNLOADS);
  await Promise.all(excess.map((item) => removeDownload(item.id)));
}

export async function getDownloads() {
  return offlineDb.getAll(offlineDb.stores.downloads);
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
  const draft = serializeBook(book);
  const startedAt = nowIso();

  await putDownload({
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloading',
    progress: 0,
    assetKeys: [],
    createdAt: startedAt,
    updatedAt: startedAt
  });

  const assetKeys = [];
  try {
    for (const asset of draft.assets) {
      const blob = await fetchAsBlob(asset.url, {
        signal,
        onProgress: (progress) => {
          const weighted = Math.min(99, Math.round((assetKeys.length / Math.max(1, draft.assets.length)) * 100 + progress / Math.max(1, draft.assets.length)));
          putDownload({ ...draft, version: DOWNLOAD_VERSION, status: 'downloading', progress: weighted, assetKeys, createdAt: startedAt, updatedAt: nowIso() });
          onProgress?.(weighted);
        }
      });
      const blobId = `${draft.id}:${asset.key}`;
      await putBlob(blobId, blob, { url: asset.url, type: asset.key, contentId: draft.id });
      assetKeys.push(blobId);
    }

    const completed = {
      ...draft,
      version: DOWNLOAD_VERSION,
      status: 'downloaded',
      progress: 100,
      assetKeys,
      createdAt: startedAt,
      updatedAt: nowIso()
    };
    await putDownload(completed);
    await notifyServiceWorker(draft.assets.map((asset) => asset.url));
    await pruneOldDownloads();
    return completed;
  } catch (error) {
    if (error.name === 'AbortError') {
      await removeDownload(draft.id);
      throw error;
    }
    await putDownload({
      ...draft,
      version: DOWNLOAD_VERSION,
      status: 'failed',
      progress: 0,
      assetKeys,
      error: error.message,
      createdAt: startedAt,
      updatedAt: nowIso()
    });
    throw error;
  }
}

export async function saveGeneratedStoryOffline(story) {
  const draft = serializeGeneratedStory(story);
  const timestamp = nowIso();
  const record = {
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloaded',
    progress: 100,
    assetKeys: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await putDownload(record);
  await pruneOldDownloads();
  return record;
}

export async function saveVoiceMessageOffline(message, audioBlob = null) {
  const draft = serializeVoiceMessage(message);
  const timestamp = nowIso();
  const assetKeys = [];

  if (audioBlob) {
    const blobId = `${draft.id}:audio`;
    await putBlob(blobId, audioBlob, { type: 'audio', contentId: draft.id });
    assetKeys.push(blobId);
  }

  const record = {
    ...draft,
    version: DOWNLOAD_VERSION,
    status: 'downloaded',
    progress: 100,
    assetKeys,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await putDownload(record);
  await pruneOldDownloads();
  return record;
}

export async function removeDownload(id) {
  const record = await getDownload(id);
  if (record?.assetKeys?.length) {
    await Promise.all(record.assetKeys.map((assetKey) => offlineDb.delete(offlineDb.stores.blobs, assetKey)));
  }
  await offlineDb.delete(offlineDb.stores.downloads, id);
}

export async function getOfflineBlobUrl(blobId) {
  const entry = await offlineDb.get(offlineDb.stores.blobs, blobId);
  if (!entry?.blob) return null;
  return URL.createObjectURL(entry.blob);
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
