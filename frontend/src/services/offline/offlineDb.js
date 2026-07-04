const DB_NAME = 'le-lit-qui-lit-offline';
const DB_VERSION = 1;

const STORES = {
  downloads: 'downloads',
  blobs: 'blobs',
  syncQueue: 'syncQueue',
  metadata: 'metadata'
};

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.downloads)) {
        const store = db.createObjectStore(STORES.downloads, { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('status', 'status');
        store.createIndex('updatedAt', 'updatedAt');
      }

      if (!db.objectStoreNames.contains(STORES.blobs)) {
        db.createObjectStore(STORES.blobs, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const store = db.createObjectStore(STORES.syncQueue, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = callback(store);

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineDb = {
  stores: STORES,

  get(storeName, key) {
    return withStore(storeName, 'readonly', (store) => requestToPromise(store.get(key)));
  },

  getAll(storeName) {
    return withStore(storeName, 'readonly', (store) => requestToPromise(store.getAll()));
  },

  put(storeName, value) {
    return withStore(storeName, 'readwrite', (store) => store.put(value));
  },

  delete(storeName, key) {
    return withStore(storeName, 'readwrite', (store) => store.delete(key));
  },

  clear(storeName) {
    return withStore(storeName, 'readwrite', (store) => store.clear());
  }
};
