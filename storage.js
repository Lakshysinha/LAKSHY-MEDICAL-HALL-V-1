(function (root) {
  const DB_NAME = 'lakshy-medical-hall-db';
  const DB_VERSION = 1;
  const STATE_STORE = 'state';
  const BACKUP_KEY = 'complete-state';

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getState() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const request = tx.objectStore(STATE_STORE).get(BACKUP_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function setState(state) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      tx.objectStore(STATE_STORE).put(state, BACKUP_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function clearState() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      tx.objectStore(STATE_STORE).delete(BACKUP_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function migrateLocalStorage() {
    const oldState = localStorage.getItem('lmhCompleteState');
    if (!oldState) return null;
    localStorage.removeItem('lmhCompleteState');
    return JSON.parse(oldState);
  }

  root.LMHStorage = { getState, setState, clearState, migrateLocalStorage, DB_NAME };
})(window);
