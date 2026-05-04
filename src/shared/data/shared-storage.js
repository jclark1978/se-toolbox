const DB_NAME = "toolbox_shared";
const DB_VERSION = 2;
const STORE_NAME = "datasets";

let _sharedDb = null;

function openSharedDb() {
  if (_sharedDb) return Promise.resolve(_sharedDb);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = (e) => { _sharedDb = e.target.result; resolve(_sharedDb); };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getSharedDataset(key) {
  const db = await openSharedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = (e) => resolve(e.target.result ?? null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveSharedDataset(key, payload) {
  const db = await openSharedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...payload, key });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteSharedDataset(key) {
  const db = await openSharedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function hasSharedDataset(key) {
  const dataset = await getSharedDataset(key);
  return dataset !== null;
}

export async function getAllSharedDatasetMeta() {
  const db = await openSharedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = (e) => {
      const records = (e.target.result ?? []).map(({ key, version, source, meta }) => ({
        key,
        version,
        source,
        meta
      }));
      resolve(records);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}
