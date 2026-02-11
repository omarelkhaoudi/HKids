// Utilitaires pour le stockage local (localStorage)

export const storage = {
  // Favoris
  getFavorites: () => {
    try {
      const favorites = localStorage.getItem('hkids_favorites');
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
        localStorage.setItem('hkids_favorites', JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },

  removeFavorite: (bookId) => {
    try {
      const favorites = storage.getFavorites();
      const filtered = favorites.filter(id => id !== bookId);
      localStorage.setItem('hkids_favorites', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  isFavorite: (bookId) => {
    const favorites = storage.getFavorites();
    return favorites.includes(bookId);
  },

  // Historique de lecture
  getReadingHistory: () => {
    try {
      const history = localStorage.getItem('hkids_history');
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
      localStorage.setItem('hkids_history', JSON.stringify(limited));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  },

  getLastPage: (bookId) => {
    const history = storage.getReadingHistory();
    const item = history.find(h => h.bookId === bookId);
    return item ? item.page : 0;
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

