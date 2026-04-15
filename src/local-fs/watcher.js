import { isFileSystemObserverSupported } from "./capability.js";
import { scanDirectory, getExtension, ALLOWED_EXTENSIONS } from "./scanner.js";

const FEEDBACK_LOOP_MS = 1000;
const FEEDBACK_CLEANUP_MS = 5000;
const POLL_FOCUSED_MS = 2000;
const POLL_BACKGROUND_MS = 5000;
const RESCAN_INTERVAL_MS = 10000;

let recentWrites = new Map();
let observer = null;
let pollTimer = null;
let rescanTimer = null;
let active = false;
let currentDirHandle = null;
let currentOnChange = null;
let pollFn = null;
let currentPollIntervalMs = 0;

export function markAsOurWrite(path) {
  recentWrites.set(path, Date.now());
  setTimeout(() => recentWrites.delete(path), FEEDBACK_CLEANUP_MS);
}

function isOwnWrite(path, lastModified) {
  const writeTime = recentWrites.get(path);
  if (!writeTime) return false;
  return (
    Math.abs(lastModified - writeTime) < FEEDBACK_LOOP_MS ||
    Date.now() - writeTime < FEEDBACK_LOOP_MS
  );
}

export function startWatching(dirHandle, fileMap, onChange) {
  stopWatching();
  active = true;
  currentDirHandle = dirHandle;
  currentOnChange = onChange;

  if (isFileSystemObserverSupported()) {
    startObserver(dirHandle, fileMap, onChange);
  } else {
    startPolling(dirHandle, fileMap, onChange);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

export function stopWatching() {
  active = false;

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (rescanTimer) {
    clearInterval(rescanTimer);
    rescanTimer = null;
  }

  document.removeEventListener("visibilitychange", handleVisibilityChange);
  currentDirHandle = null;
  currentOnChange = null;
  pollFn = null;
  currentPollIntervalMs = 0;
}

function handleVisibilityChange() {
  if (!active || !currentDirHandle || !currentOnChange) return;
  if (!pollFn || !pollTimer) return;

  const newInterval = document.visibilityState === "visible" ? POLL_FOCUSED_MS : POLL_BACKGROUND_MS;
  if (newInterval !== currentPollIntervalMs) {
    clearInterval(pollTimer);
    currentPollIntervalMs = newInterval;
    pollTimer = setInterval(pollFn, newInterval);
  }

  if (document.visibilityState === "visible") {
    currentOnChange([{ type: "rescan" }]);
  }
}

function startObserver(dirHandle, fileMap, onChange) {
  observer = new FileSystemObserver((records) => {
    if (!active) return;

    const changes = [];
    for (const record of records) {
      if (record.type === "errored" || record.type === "unknown") {
        onChange([{ type: "rescan" }]);
        return;
      }

      const path = record.relativePathComponents.join("/");
      if (!ALLOWED_EXTENSIONS.has(getExtension(path))) continue;
      if (isOwnWrite(path, Date.now())) continue;

      if (record.type === "modified") {
        changes.push({ type: "modified", path });
      } else if (record.type === "appeared") {
        if (fileMap.has(path)) {
          changes.push({ type: "modified", path });
        } else {
          changes.push({ type: "created", path });
        }
      } else if (record.type === "disappeared") {
        changes.push({ type: "deleted", path });
      } else if (record.type === "moved") {
        const oldPath = record.relativePathMovedFrom?.join("/");
        if (oldPath) {
          changes.push({ type: "deleted", path: oldPath });
        }
        changes.push({ type: "created", path });
      }
    }

    if (changes.length > 0) onChange(changes);
  });

  observer.observe(dirHandle, { recursive: true });
}

function startPolling(dirHandle, fileMap, onChange) {
  const lastScanTimestamps = new Map();
  for (const [path, entry] of fileMap) {
    lastScanTimestamps.set(path, entry.lastModified);
  }

  pollFn = async function poll() {
    if (!active) return;

    const entries = [...fileMap.entries()];
    const results = await Promise.all(
      entries.map(([path, entry]) =>
        entry.handle.getFile().then(
          (file) => ({ path, entry, file, ok: true }),
          () => ({ path, entry, ok: false })
        )
      )
    );

    const changes = [];
    for (const { path, entry, file, ok } of results) {
      if (!ok) {
        if (fileMap.has(path)) {
          changes.push({ type: "deleted", path });
          fileMap.delete(path);
          lastScanTimestamps.delete(path);
        }
        continue;
      }
      const prevModified = lastScanTimestamps.get(path);
      if (prevModified !== undefined && file.lastModified !== prevModified) {
        if (!isOwnWrite(path, file.lastModified)) {
          changes.push({ type: "modified", path });
        }
      }
      lastScanTimestamps.set(path, file.lastModified);
      entry.lastModified = file.lastModified;
      entry.size = file.size;
    }

    if (changes.length > 0) onChange(changes);
  };

  async function rescan() {
    if (!active) return;

    try {
      const { fileMap: fresh } = await scanDirectory(dirHandle);
      const changes = [];

      for (const [path] of fresh) {
        if (!fileMap.has(path)) {
          changes.push({ type: "created", path });
        }
      }

      if (changes.length > 0) {
        for (const change of changes) {
          const entry = fresh.get(change.path);
          if (entry) {
            fileMap.set(change.path, entry);
            lastScanTimestamps.set(change.path, entry.lastModified);
          }
        }
        onChange(changes);
      }
    } catch {}
  }

  currentPollIntervalMs =
    document.visibilityState === "visible" ? POLL_FOCUSED_MS : POLL_BACKGROUND_MS;
  pollTimer = setInterval(pollFn, currentPollIntervalMs);
  rescanTimer = setInterval(rescan, RESCAN_INTERVAL_MS);
}
