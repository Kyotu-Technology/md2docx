const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".obsidian",
  ".vscode",
  "dist",
  "build",
  "__pycache__",
  ".next",
  ".nuxt",
  "coverage",
]);

export const ALLOWED_EXTENSIONS = new Set([".md", ".txt"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 500;
const WARN_FILES = 200;

export function getExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export async function scanDirectory(dirHandle, options = {}) {
  const ignored = options.ignoredDirs || IGNORED_DIRS;
  const allowed = options.allowedExtensions || ALLOWED_EXTENSIONS;
  const maxFiles = options.maxFiles || MAX_FILES;
  const fileMap = new Map();

  async function walk(handle, prefix) {
    for await (const [name, entry] of handle.entries()) {
      if (fileMap.size >= maxFiles) return;
      if (name.startsWith(".")) continue;

      if (entry.kind === "directory") {
        if (ignored.has(name)) continue;
        await walk(entry, prefix ? `${prefix}/${name}` : name);
      } else if (entry.kind === "file") {
        if (!allowed.has(getExtension(name))) continue;
        const relativePath = prefix ? `${prefix}/${name}` : name;
        try {
          const file = await entry.getFile();
          if (file.size > MAX_FILE_SIZE) continue;
          fileMap.set(relativePath, {
            handle: entry,
            lastModified: file.lastModified,
            size: file.size,
          });
        } catch {}
      }
    }
  }

  await walk(dirHandle, "");

  return { fileMap, warnings: fileMap.size >= WARN_FILES && fileMap.size < maxFiles };
}

export async function readFileContent(fileHandle) {
  const file = await fileHandle.getFile();
  return file.text();
}

export async function writeFileContent(fileHandle, content) {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function createFile(dirHandle, path) {
  const parts = path.split("/");
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  return current.getFileHandle(parts[parts.length - 1], { create: true });
}

export async function deleteFile(dirHandle, path) {
  const parts = path.split("/");
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i]);
  }
  await current.removeEntry(parts[parts.length - 1]);
}

export async function renameFile(dirHandle, oldPath, newPath) {
  const parts = oldPath.split("/");
  let parentHandle = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    parentHandle = await parentHandle.getDirectoryHandle(parts[i]);
  }
  const oldHandle = await parentHandle.getFileHandle(parts[parts.length - 1]);
  const content = await readFileContent(oldHandle);
  const newHandle = await createFile(dirHandle, newPath);
  await writeFileContent(newHandle, content);
  await deleteFile(dirHandle, oldPath);
  return newHandle;
}

export async function readAllContents(fileMap) {
  const contents = new Map();
  const entries = [...fileMap.entries()];
  const results = await Promise.all(
    entries.map(([path, { handle }]) =>
      readFileContent(handle)
        .then((text) => ({ path, text }))
        .catch(() => ({ path, text: "" }))
    )
  );
  for (const { path, text } of results) {
    contents.set(path, text);
  }
  return contents;
}
