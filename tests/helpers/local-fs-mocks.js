export async function installFsMocks(page, { files = {}, observerSupported = true } = {}) {
  await page.addInitScript(
    ({ initialFiles, observerSupported }) => {
      const store = new Map();
      const now = Date.now();
      for (const [path, content] of Object.entries(initialFiles)) {
        store.set(path, {
          content,
          lastModified: now,
          size: new Blob([content]).size,
        });
      }

      const testFs = {
        store,
        observerCallback: null,
        permissionState: "granted",
        writeFile(path, content) {
          store.set(path, {
            content,
            lastModified: Date.now(),
            size: new Blob([content]).size,
          });
        },
        readFile(path) {
          return store.get(path)?.content;
        },
        deleteFile(path) {
          store.delete(path);
        },
        hasFile(path) {
          return store.has(path);
        },
        fireObserver(records) {
          if (this.observerCallback) this.observerCallback(records);
        },
        setPermission(state) {
          this.permissionState = state;
        },
      };

      function makeFileHandle(fullPath) {
        return {
          kind: "file",
          get name() {
            return fullPath.split("/").pop();
          },
          async getFile() {
            const entry = store.get(fullPath);
            const content = entry?.content ?? "";
            const size = entry?.size ?? 0;
            const lastModified = entry?.lastModified ?? Date.now();
            return {
              name: fullPath.split("/").pop(),
              size,
              lastModified,
              type: "text/markdown",
              text: async () => content,
            };
          },
          async createWritable() {
            let buffer = "";
            return {
              async write(chunk) {
                if (typeof chunk === "string") {
                  buffer += chunk;
                } else if (chunk && typeof chunk === "object") {
                  if (chunk.type === "write" && chunk.data != null) {
                    buffer += typeof chunk.data === "string" ? chunk.data : String(chunk.data);
                  } else {
                    buffer += String(chunk);
                  }
                }
              },
              async close() {
                testFs.writeFile(fullPath, buffer);
              },
              async abort() {},
            };
          },
        };
      }

      function makeDirHandle(relPath = "") {
        const prefix = relPath ? relPath + "/" : "";
        return {
          kind: "directory",
          get name() {
            return relPath.split("/").pop() || "test-folder";
          },
          async *entries() {
            const seenDirs = new Set();
            for (const path of store.keys()) {
              if (!path.startsWith(prefix)) continue;
              const rest = path.slice(prefix.length);
              const slashIdx = rest.indexOf("/");
              if (slashIdx === -1) {
                yield [rest, makeFileHandle(path)];
              } else {
                const dirName = rest.slice(0, slashIdx);
                if (seenDirs.has(dirName)) continue;
                seenDirs.add(dirName);
                yield [dirName, makeDirHandle(prefix + dirName)];
              }
            }
          },
          async getFileHandle(name, opts = {}) {
            const fullPath = prefix + name;
            if (!store.has(fullPath)) {
              if (opts.create) {
                testFs.writeFile(fullPath, "");
              } else {
                const err = new Error(`File not found: ${fullPath}`);
                err.name = "NotFoundError";
                throw err;
              }
            }
            return makeFileHandle(fullPath);
          },
          async getDirectoryHandle(name, opts = {}) {
            const fullPath = prefix + name;
            const exists = [...store.keys()].some((p) => p.startsWith(fullPath + "/"));
            if (!exists && !opts.create) {
              const err = new Error(`Directory not found: ${fullPath}`);
              err.name = "NotFoundError";
              throw err;
            }
            return makeDirHandle(fullPath);
          },
          async removeEntry(name) {
            const fullPath = prefix + name;
            if (store.has(fullPath)) {
              store.delete(fullPath);
              return;
            }
            const subPrefix = fullPath + "/";
            const subPaths = [...store.keys()].filter((p) => p.startsWith(subPrefix));
            for (const p of subPaths) store.delete(p);
          },
          async requestPermission() {
            return testFs.permissionState;
          },
          async queryPermission() {
            return testFs.permissionState;
          },
        };
      }

      const handleMemory = new Map();
      const origIdbOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = function (name, version) {
        if (name !== "md2docx-local-fs") return origIdbOpen(name, version);
        const req = { result: null, onsuccess: null, onerror: null, onupgradeneeded: null };
        queueMicrotask(() => {
          const store = {
            put(value, key) {
              handleMemory.set(key, value);
              const r = { onsuccess: null, onerror: null };
              queueMicrotask(() => r.onsuccess?.());
              return r;
            },
            get(key) {
              const r = { result: handleMemory.get(key) ?? null, onsuccess: null, onerror: null };
              queueMicrotask(() => r.onsuccess?.());
              return r;
            },
            delete(key) {
              handleMemory.delete(key);
              const r = { onsuccess: null, onerror: null };
              queueMicrotask(() => r.onsuccess?.());
              return r;
            },
          };
          const db = {
            objectStoreNames: { contains: () => true },
            createObjectStore: () => store,
            transaction(_storeName, _mode) {
              const tx = { oncomplete: null, onerror: null, objectStore: () => store };
              queueMicrotask(() => tx.oncomplete?.());
              return tx;
            },
          };
          req.result = db;
          req.onsuccess?.();
        });
        return req;
      };

      window.__md2docxTestFs = testFs;
      window.showDirectoryPicker = async () => makeDirHandle("");

      if (observerSupported) {
        window.FileSystemObserver = class {
          constructor(cb) {
            testFs.observerCallback = cb;
          }
          observe() {}
          disconnect() {
            if (testFs.observerCallback === this._cb) testFs.observerCallback = null;
          }
        };
      } else {
        delete window.FileSystemObserver;
      }
    },
    { initialFiles: files, observerSupported }
  );
}

export async function fireObserverRecords(page, records) {
  await page.evaluate((recs) => {
    window.__md2docxTestFs?.fireObserver(recs);
  }, records);
}

export async function writeMockFile(page, path, content) {
  await page.evaluate(
    ([p, c]) => {
      window.__md2docxTestFs?.writeFile(p, c);
    },
    [path, content]
  );
}

export async function deleteMockFile(page, path) {
  await page.evaluate((p) => {
    window.__md2docxTestFs?.deleteFile(p);
  }, path);
}

export async function readMockFile(page, path) {
  return await page.evaluate((p) => window.__md2docxTestFs?.readFile(p), path);
}

export async function hasMockFile(page, path) {
  return await page.evaluate((p) => !!window.__md2docxTestFs?.hasFile(p), path);
}
