import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDownloads,
  offlineContentIds,
  removeDownload,
  saveGeneratedStoryOffline
} from '../services/offline/offlineContentService';
import {
  DOWNLOAD_PRIORITY,
  cancelBookJob,
  enqueueBookDownload,
} from '../services/contentDelivery/smartDownloadService';
import { subscribeDownloadQueue, pauseJob } from '../services/contentDelivery/downloadQueueService';

function mapById(downloads) {
  return downloads.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export function useOfflineContent() {
  const abortControllersRef = useRef(new Map());
  const [downloadsById, setDownloadsById] = useState({});
  const [progressById, setProgressById] = useState({});

  const refreshDownloads = useCallback(async () => {
    const downloads = await getDownloads();
    setDownloadsById(mapById(downloads));
    return downloads;
  }, []);

  useEffect(() => {
    refreshDownloads().catch((error) => console.warn('Offline downloads unavailable:', error));
    return () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
    };
  }, [refreshDownloads]);

  useEffect(() => subscribeDownloadQueue((snapshot) => {
    const nextProgress = {};
    Object.entries(snapshot.jobs || {}).forEach(([id, job]) => {
      if (job.kind === 'book' && (job.status === 'downloading' || job.status === 'queued' || job.status === 'paused')) {
        nextProgress[id] = job.progress || 0;
      }
    });
    setProgressById((current) => ({ ...current, ...nextProgress }));
  }), []);

  const downloadBookContent = useCallback(async (book) => {
    const result = await enqueueBookDownload(book, {
      priority: DOWNLOAD_PRIORITY.MANUAL,
      label: book.title,
      reason: 'manual',
    });
    await refreshDownloads();
    return result;
  }, [refreshDownloads]);

  const saveStoryContent = useCallback(async (story) => {
    const record = await saveGeneratedStoryOffline(story);
    await refreshDownloads();
    return record;
  }, [refreshDownloads]);

  const deleteDownload = useCallback(async (id) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
    cancelBookJob(id);
    await removeDownload(id);
    await refreshDownloads();
  }, [refreshDownloads]);

  const cancelDownload = useCallback((id) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
    cancelBookJob(id);
  }, []);

  const pauseDownload = useCallback((id) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
    pauseJob(id);
  }, []);

  return {
    downloadsById,
    progressById,
    refreshDownloads,
    downloadBookContent,
    saveStoryContent,
    deleteDownload,
    cancelDownload,
    pauseDownload,
    getBookStatus: (bookId) => downloadsById[offlineContentIds.book(bookId)] || null,
    getStoryStatus: (storyId) => downloadsById[offlineContentIds.generatedStory(storyId)] || null
  };
}
