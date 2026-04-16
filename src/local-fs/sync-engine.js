import { persistHandle, getPersistedHandle, clearPersistedHandle } from "./handle-store.js";
import {
  scanDirectory,
  readFileContent,
  writeFileContent,
  createFile,
  deleteFile,
  renameFile,
  readAllContents,
} from "./scanner.js";
import { startWatching, stopWatching, markAsOurWrite } from "./watcher.js";
import { toast } from "../notifications/index.js";

const MAIN_CANDIDATES = ["main.md", "index.md", "README.md"];
const STORAGE_MODE_KEY = "md2docx-storage-mode";
const MAIN_DOC_KEY = "md2docx-local-main";

let state = "idle";
let dirHandle = null;
let fileMap = new Map();
let folderName = "";
let stateListeners = [];
let onDocumentsChanged = null;
let onExternalFileChange = null;
let broadcastChannel = null;

try {
  broadcastChannel = new BroadcastChannel("md2docx-local-fs");
  broadcastChannel.onmessage = (e) => {
    if (e.data?.type === "mounted" && state === "watching") {
      toast.info("Another tab mounted a local folder");
    }
  };
} catch {}

export function getState() {
  return state;
}

export function getFolderName() {
  return folderName;
}

export function isLocalFsMode() {
  return state === "watching" || state === "scanning" || state === "mounting";
}

export function onStateChange(cb) {
  stateListeners.push(cb);
  return () => {
    stateListeners = stateListeners.filter((l) => l !== cb);
  };
}

function setState(newState) {
  state = newState;
  for (const cb of stateListeners) cb(newState);
}

function getMainDocPath() {
  const key = `${MAIN_DOC_KEY}-${folderName}`;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setMainDocPath(path) {
  const key = `${MAIN_DOC_KEY}-${folderName}`;
  try {
    localStorage.setItem(key, path);
  } catch {}
}

function pickMainDoc(paths) {
  const saved = getMainDocPath();
  if (saved && paths.includes(saved)) return saved;
  for (const candidate of MAIN_CANDIDATES) {
    if (paths.includes(candidate)) return candidate;
  }
  return paths[0] || null;
}

export const LOCAL_ID_PREFIX = "local:";

export function localIdFor(path) {
  return LOCAL_ID_PREFIX + path;
}

export function fileToDocument(path, content, mainPath) {
  return {
    id: localIdFor(path),
    name: path,
    content,
    isMain: path === mainPath,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function buildDocumentsFromMap(contents, mainPath) {
  const docs = [];
  const sortedPaths = [...contents.keys()].sort((a, b) => {
    if (a === mainPath) return -1;
    if (b === mainPath) return 1;
    return a.localeCompare(b);
  });
  for (const path of sortedPaths) {
    docs.push(fileToDocument(path, contents.get(path), mainPath));
  }
  return docs;
}

let onUnmountCallback = null;

export function setCallbacks({ onDocuments, onExternalChange, onUnmount }) {
  onDocumentsChanged = onDocuments;
  onExternalFileChange = onExternalChange;
  onUnmountCallback = onUnmount;
}

export async function mountFolder() {
  if (state !== "idle") return null;
  setState("mounting");

  try {
    dirHandle = await window.showDirectoryPicker({
      mode: "readwrite",
      id: "md2docx-workspace",
    });
  } catch (err) {
    setState("idle");
    if (err.name !== "AbortError") {
      toast.error("Failed to open folder");
    }
    return null;
  }

  return await completeMount(dirHandle);
}

export async function restoreFromPersistedHandle() {
  const handle = await getPersistedHandle();
  if (!handle) return null;

  try {
    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") return null;
  } catch {
    return null;
  }

  dirHandle = handle;
  setState("mounting");
  return await completeMount(handle);
}

async function completeMount(handle) {
  setState("scanning");
  folderName = handle.name;

  try {
    const { fileMap: scanned, warnings } = await scanDirectory(handle);
    fileMap = scanned;

    if (warnings) {
      toast.warning(`Large folder: ${fileMap.size} files found`);
    }

    if (fileMap.size === 0) {
      toast.info("No .md or .txt files found in this folder");
    }

    await persistHandle(handle);

    const contents = await readAllContents(fileMap);
    const paths = [...contents.keys()];
    const mainPath = pickMainDoc(paths);
    if (mainPath) setMainDocPath(mainPath);

    const docs = buildDocumentsFromMap(contents, mainPath);

    try {
      localStorage.setItem(STORAGE_MODE_KEY, "local-fs");
    } catch {}

    startWatching(handle, fileMap, handleExternalChanges);
    setState("watching");

    try {
      broadcastChannel?.postMessage({ type: "mounted", folder: folderName });
    } catch {}

    if (onDocumentsChanged) onDocumentsChanged(docs);
    return docs;
  } catch (err) {
    handlePermissionError(err);
    return null;
  }
}

export async function unmountFolder() {
  stopWatching();
  dirHandle = null;
  fileMap = new Map();
  folderName = "";
  setState("idle");

  try {
    localStorage.removeItem(STORAGE_MODE_KEY);
  } catch {}

  try {
    await clearPersistedHandle();
  } catch {}

  if (onUnmountCallback) onUnmountCallback();
}

export async function saveToLocalFs(name, content) {
  if (!dirHandle || state !== "watching") return;

  const entry = fileMap.get(name);
  if (!entry) return;

  markAsOurWrite(name);
  try {
    await writeFileContent(entry.handle, content);
    const file = await entry.handle.getFile();
    entry.lastModified = file.lastModified;
  } catch (err) {
    handlePermissionError(err);
  }
}

export async function createInLocalFs(name) {
  if (!dirHandle || state !== "watching") return null;

  try {
    const handle = await createFile(dirHandle, name);
    markAsOurWrite(name);
    await writeFileContent(handle, "");
    const file = await handle.getFile();
    fileMap.set(name, { handle, lastModified: file.lastModified, size: 0 });
    return fileToDocument(name, "", false);
  } catch (err) {
    handlePermissionError(err);
    return null;
  }
}

export async function deleteFromLocalFs(name) {
  if (!dirHandle || state !== "watching") return false;

  try {
    await deleteFile(dirHandle, name);
    fileMap.delete(name);
    return true;
  } catch (err) {
    handlePermissionError(err);
    return false;
  }
}

export async function renameInLocalFs(oldName, newName) {
  if (!dirHandle || state !== "watching") return false;

  try {
    const newHandle = await renameFile(dirHandle, oldName, newName);
    fileMap.delete(oldName);
    const file = await newHandle.getFile();
    fileMap.set(newName, { handle: newHandle, lastModified: file.lastModified, size: file.size });
    return true;
  } catch (err) {
    handlePermissionError(err);
    return false;
  }
}

export async function changeMainInLocalFs(name) {
  setMainDocPath(name);
}

export async function rescanFolder() {
  if (!dirHandle || (state !== "watching" && state !== "permission-lost")) return null;

  try {
    const { fileMap: scanned } = await scanDirectory(dirHandle);
    fileMap = scanned;
    const contents = await readAllContents(fileMap);
    const paths = [...contents.keys()];
    const mainPath = pickMainDoc(paths);
    const docs = buildDocumentsFromMap(contents, mainPath);
    if (onDocumentsChanged) onDocumentsChanged(docs);
    return docs;
  } catch (err) {
    handlePermissionError(err);
    return null;
  }
}

export async function regrantPermission() {
  if (!dirHandle) return false;
  try {
    const perm = await dirHandle.requestPermission({ mode: "readwrite" });
    if (perm === "granted") {
      setState("watching");
      startWatching(dirHandle, fileMap, handleExternalChanges);
      await rescanFolder();
      return true;
    }
  } catch {}
  return false;
}

async function handleExternalChanges(changes) {
  if (state !== "watching") return;

  if (changes.some((c) => c.type === "rescan")) {
    await rescanFolder();
    return;
  }

  const events = await Promise.all(changes.map(processChange));
  if (!onExternalFileChange) return;
  for (const event of events) {
    if (event) onExternalFileChange(event);
  }
}

async function processChange(change) {
  if (change.type === "modified") {
    const entry = fileMap.get(change.path);
    if (!entry) return null;
    try {
      const content = await readFileContent(entry.handle);
      const file = await entry.handle.getFile();
      entry.lastModified = file.lastModified;
      entry.size = file.size;
      return { type: "modified", path: change.path, content };
    } catch {
      return null;
    }
  }

  if (change.type === "created") {
    try {
      const parts = change.path.split("/");
      let current = dirHandle;
      for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i]);
      }
      const handle = await current.getFileHandle(parts[parts.length - 1]);
      const file = await handle.getFile();
      const content = await file.text();
      fileMap.set(change.path, { handle, lastModified: file.lastModified, size: file.size });
      return { type: "created", path: change.path, content };
    } catch {
      return null;
    }
  }

  if (change.type === "deleted") {
    fileMap.delete(change.path);
    return { type: "deleted", path: change.path };
  }

  return null;
}

function handlePermissionError(err) {
  if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
    stopWatching();
    setState("permission-lost");
    toast.error("Permission lost — click Re-grant to restore access");
  } else {
    setState("error");
    toast.error(`Filesystem error: ${err?.message || "Unknown error"}`);
  }
}

export function getStorageMode() {
  try {
    return localStorage.getItem(STORAGE_MODE_KEY);
  } catch {
    return null;
  }
}
