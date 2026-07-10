import { syncOrQueueKidMutation } from '../services/parental/kidActivitySyncService';

// Utilitaires pour le stockage local (localStorage)

function queueMutation(type, payload, conflictKey = null) {
  syncOrQueueKidMutation(type, payload, conflictKey).catch((error) => {
    console.warn('Could not synchronize kid activity:', error);
  });
}

function scopedActivityKey(baseKey) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'kid' && user?.kid_profile_id) {
      return `${baseKey}:kid:${user.kid_profile_id}`;
    }
  } catch {
    // Keep anonymous/parent storage backward compatible.
  }
  return baseKey;
}

export const storage = {
  // Favoris
  getFavorites: () => {
    try {
      const favorites = localStorage.getItem(scopedActivityKey('hkids_favorites'));
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  },

  addFavorite: (bookId) => {
    try {
      const favorites = storage.getFavorites();
      if (!favorites.includes(bookId)) {
        favorites.push(bookId);
        localStorage.setItem(scopedActivityKey('hkids_favorites'), JSON.stringify(favorites));
        queueMutation('favorite_add', {
          bookId,
          favorite: true,
          favoritedAt: new Date().toISOString()
        }, `book:${bookId}:favorite`);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },

  removeFavorite: (bookId) => {
    try {
      const favorites = storage.getFavorites();
      const filtered = favorites.filter(id => id !== bookId);
      localStorage.setItem(scopedActivityKey('hkids_favorites'), JSON.stringify(filtered));
      queueMutation('favorite_remove', { bookId, favorite: false }, `book:${bookId}:favorite`);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  isFavorite: (bookId) => {
    const favorites = storage.getFavorites();
    return favorites.includes(bookId);
  },

  // Contenus telecharges (etat prepare pour la future logique offline)
  getDownloadedContent: () => {
    try {
      const downloaded = localStorage.getItem('hkids_downloaded_content');
      return downloaded ? JSON.parse(downloaded) : [];
    } catch {
      return [];
    }
  },

  markDownloaded: (contentId) => {
    try {
      const downloaded = storage.getDownloadedContent();
      if (!downloaded.includes(contentId)) {
        downloaded.push(contentId);
        localStorage.setItem('hkids_downloaded_content', JSON.stringify(downloaded));
      }
    } catch (error) {
      console.error('Error marking downloaded content:', error);
    }
  },

  unmarkDownloaded: (contentId) => {
    try {
      const downloaded = storage.getDownloadedContent();
      const filtered = downloaded.filter(id => id !== contentId);
      localStorage.setItem('hkids_downloaded_content', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error unmarking downloaded content:', error);
    }
  },

  isDownloaded: (contentId) => {
    const downloaded = storage.getDownloadedContent();
    return downloaded.includes(contentId);
  },

  // Historique d'ecoute audio
  getListeningHistory: () => {
    try {
      const history = localStorage.getItem(scopedActivityKey('hkids_listening_history'));
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  },

  addListeningHistory: (entry) => {
    try {
      const history = storage.getListeningHistory();
      const now = new Date().toISOString();
      const safeEntry = {
        bookId: entry.bookId,
        bookTitle: entry.bookTitle,
        audioUrl: entry.audioUrl || null,
        listenedSeconds: Math.max(0, Math.floor(entry.listenedSeconds || 0)),
        currentTime: Math.max(0, Math.floor(entry.currentTime || 0)),
        duration: Math.max(0, Math.floor(entry.duration || 0)),
        completed: Boolean(entry.completed),
        offlineReady: Boolean(entry.offlineReady),
        listenedAt: now,
      };

      const filtered = history.filter((item) => item.bookId !== safeEntry.bookId);
      localStorage.setItem(scopedActivityKey('hkids_listening_history'), JSON.stringify([safeEntry, ...filtered].slice(0, 50)));
      queueMutation('listening_history', safeEntry, `book:${safeEntry.bookId}:listening`);
    } catch (error) {
      console.error('Error adding listening history:', error);
    }
  },

  // Historique de lecture
  getReadingHistory: () => {
    try {
      const history = localStorage.getItem(scopedActivityKey('hkids_history'));
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  },

  addToHistory: (bookId, bookTitle, page = 0) => {
    try {
      const history = storage.getReadingHistory();
      const existingIndex = history.findIndex(item => item.bookId === bookId);
      
      const historyItem = {
        bookId,
        bookTitle,
        page,
        lastRead: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        history[existingIndex] = historyItem;
      } else {
        history.unshift(historyItem);
      }

      // Garder seulement les 50 derniers
      const limited = history.slice(0, 50);
      localStorage.setItem(scopedActivityKey('hkids_history'), JSON.stringify(limited));
      queueMutation('reading_history', historyItem, `book:${bookId}:history`);
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  },

  getLastPage: (bookId) => {
    const history = storage.getReadingHistory();
    const item = history.find(h => h.bookId === bookId);
    return item ? item.page : 0;
  },

  // Statistiques de lecture (temps, livres terminés, sessions)
  getReadingStats: () => {
    try {
      const raw = localStorage.getItem(scopedActivityKey('hkids_reading_stats'));
      const defaults = {
        totalTimeSeconds: 0,
        totalSessions: 0,
        completedBookIds: [],
        lastSession: null,
        sessions: []
      };
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch {
      return {
        totalTimeSeconds: 0,
        totalSessions: 0,
        completedBookIds: [],
        lastSession: null,
        sessions: []
      };
    }
  },

  addReadingSession: (
    bookId,
    bookTitle,
    durationSeconds = 0,
    finished = false,
    currentPage = 0,
    totalPages = 0
  ) => {
    try {
      const stats = storage.getReadingStats();
      const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0
        ? Math.floor(durationSeconds)
        : 0;

      stats.totalTimeSeconds += safeDuration;
      stats.totalSessions += 1;
      stats.lastSession = new Date().toISOString();

      if (finished) {
        if (!stats.completedBookIds.includes(bookId)) {
          stats.completedBookIds.push(bookId);
        }
      }

      const clientSessionId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const session = {
        clientSessionId,
        bookId,
        bookTitle,
        durationSeconds: safeDuration,
        finished,
        date: stats.lastSession
      };

      stats.sessions = [session, ...(stats.sessions || [])].slice(0, 50);

      localStorage.setItem(scopedActivityKey('hkids_reading_stats'), JSON.stringify(stats));
      queueMutation('reading_progress', {
        book_id: bookId,
        current_page: Math.max(0, Number(currentPage) || 0),
        total_pages: Math.max(0, Number(totalPages) || 0),
        duration_seconds: safeDuration,
        completed: finished,
        client_session_id: clientSessionId
      }, `book:${bookId}:progress`);
    } catch (error) {
      console.error('Error adding reading session:', error);
    }
  },

  // Préférences
  getPreferences: () => {
    try {
      const prefs = localStorage.getItem('hkids_preferences');
      return prefs ? JSON.parse(prefs) : { darkMode: false };
    } catch {
      return { darkMode: false };
    }
  },

  setPreference: (key, value) => {
    try {
      const prefs = storage.getPreferences();
      prefs[key] = value;
      localStorage.setItem('hkids_preferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  }
};

