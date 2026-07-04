import { useCallback, useEffect, useRef, useState } from 'react';
import {
  downloadBook,
  getDownloads,
  offlineContentIds,
  removeDownload,
  saveGeneratedStoryOffline
} from '../services/offline/offlineContentService';

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

  const downloadBookContent = useCallback(async (book) => {
    const id = offlineContentIds.book(book.id);
    const controller = new AbortController();
    abortControllersRef.current.set(id, controller);
    setProgressById((current) => ({ ...current, [id]: 1 }));

    try {
      const record = await downloadBook(book, {
        signal: controller.signal,
        onProgress: (progress) => setProgressById((current) => ({ ...current, [id]: progress }))
      });
      await refreshDownloads();
      return record;
    } finally {
      abortControllersRef.current.delete(id);
      setProgressById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  }, [refreshDownloads]);

  const saveStoryContent = useCallback(async (story) => {
    const record = await saveGeneratedStoryOffline(story);
    await refreshDownloads();
    return record;
  }, [refreshDownloads]);

  const deleteDownload = useCallback(async (id) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
    await removeDownload(id);
    await refreshDownloads();
  }, [refreshDownloads]);

  const cancelDownload = useCallback((id) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
  }, []);

  return {
    downloadsById,
    progressById,
    refreshDownloads,
    downloadBookContent,
    saveStoryContent,
    deleteDownload,
    cancelDownload,
    getBookStatus: (bookId) => downloadsById[offlineContentIds.book(bookId)] || null,
    getStoryStatus: (storyId) => downloadsById[offlineContentIds.generatedStory(storyId)] || null
  };
}
