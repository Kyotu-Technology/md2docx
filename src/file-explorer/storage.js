const DB_NAME = "md2docx-documents";
const DB_VERSION = 1;
const STORE_NAME = "documents";

let dbInstance = null;

async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("isMain", "isMain", { unique: false });
      }
    };
  });
}

export async function getAllDocuments() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const docs = request.result.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return a.name.localeCompare(b.name);
      });
      resolve(docs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDocument(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDocument(doc) {
  const db = await openDB();
  const now = Date.now();

  const toSave = {
    ...doc,
    updatedAt: now,
    createdAt: doc.createdAt || now,
  };

  if (!toSave.id) {
    toSave.id = `doc-${crypto.randomUUID()}`;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(toSave);

    request.onsuccess = () => resolve(toSave);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDocument(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (getReq.result?.isMain) {
        resolve(false);
        return;
      }
      store.delete(id);
    };
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMainDocument() {
  const docs = await getAllDocuments();
  return docs.find((d) => d.isMain) || null;
}

export async function setMainDocument(id) {
  const db = await openDB();
  const docs = await getAllDocuments();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    let pending = docs.length;

    if (pending === 0) {
      resolve();
      return;
    }

    for (const doc of docs) {
      const updated = { ...doc, isMain: doc.id === id, updatedAt: Date.now() };
      const req = store.put(updated);
      req.onsuccess = () => {
        pending--;
        if (pending === 0) resolve();
      };
      req.onerror = () => reject(req.error);
    }
  });
}

export async function migrateFromLocalStorage() {
  const docs = await getAllDocuments();
  if (docs.length > 0) return;

  let content = "";
  try {
    content = localStorage.getItem("md2docx-content") || "";
  } catch {
    return;
  }

  await saveDocument({
    name: "main.md",
    content,
    isMain: true,
  });

  try {
    localStorage.removeItem("md2docx-content");
  } catch {}
}
