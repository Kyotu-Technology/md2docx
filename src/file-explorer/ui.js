import { escapeHtml } from "../utils.js";
import { isLocalFsMode } from "../local-fs/index.js";

let explorerPanel = null;
let fileListEl = null;
let callbacks = {};
let _isOpen = false;
const collapsedFolders = new Set();

export function initFileExplorer(container, cbs) {
  explorerPanel = container;
  fileListEl = container.querySelector("#fileList");
  callbacks = cbs;

  container.querySelector("#addDocBtn").addEventListener("click", () => {
    startInlineAdd();
  });

  container.querySelector("#explorerClose")?.addEventListener("click", () => {
    toggleExplorer(false);
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    container.classList.add("explorer-dragover");
  });

  container.addEventListener("dragenter", (e) => {
    e.preventDefault();
    container.classList.add("explorer-dragover");
  });

  container.addEventListener("dragleave", (e) => {
    if (!container.contains(e.relatedTarget)) {
      container.classList.remove("explorer-dragover");
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    container.classList.remove("explorer-dragover");
    if (e.dataTransfer.files.length > 0) {
      callbacks.onDrop?.(e.dataTransfer.files);
    }
  });

  try {
    _isOpen = localStorage.getItem("md2docx-explorer-open") === "true";
  } catch {}

  if (_isOpen) {
    explorerPanel.style.width = "220px";
    explorerPanel.style.minWidth = "220px";
  }
}

export function refreshFileList(documents, activeId) {
  if (!fileListEl) return;
  fileListEl.innerHTML = "";

  if (isLocalFsMode()) {
    renderFolderView(documents, activeId);
  } else {
    renderFlatView(documents, activeId);
  }
}

function renderFlatView(documents, activeId) {
  collapsedFolders.clear();
  for (const doc of documents) {
    const item = createFileItem(doc, activeId, { showStar: true, showHint: !doc.isMain });
    fileListEl.appendChild(item);
  }
}

function renderFolderView(documents, activeId) {
  const rootDocs = [];
  const folders = new Map();

  for (const doc of documents) {
    const slashIdx = doc.name.indexOf("/");
    if (slashIdx === -1) {
      rootDocs.push(doc);
    } else {
      const folder = doc.name.substring(0, slashIdx);
      if (!folders.has(folder)) folders.set(folder, []);
      folders.get(folder).push(doc);
    }
  }

  for (const doc of rootDocs) {
    const item = createFileItem(doc, activeId, { showStar: false, showHint: false });
    fileListEl.appendChild(item);
  }

  const sortedFolders = [...folders.keys()].sort((a, b) => a.localeCompare(b));
  for (const folder of sortedFolders) {
    const docs = folders.get(folder);
    const isCollapsed = collapsedFolders.has(folder);

    const header = document.createElement("div");
    header.className = `explorer-folder${isCollapsed ? " collapsed" : ""}`;
    header.innerHTML = `
      <svg class="folder-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      <span style="flex:1">${escapeHtml(folder)}</span>
      <span class="folder-count">${docs.length}</span>
    `;

    const filesContainer = document.createElement("div");
    filesContainer.className = `explorer-folder-files${isCollapsed ? " collapsed" : ""}`;
    for (const doc of docs) {
      const displayName = doc.name.substring(folder.length + 1);
      const item = createFileItem(doc, activeId, {
        showStar: false,
        showHint: false,
        displayName,
        indent: true,
      });
      filesContainer.appendChild(item);
    }

    header.addEventListener("click", () => {
      if (collapsedFolders.has(folder)) {
        collapsedFolders.delete(folder);
      } else {
        collapsedFolders.add(folder);
      }
      header.classList.toggle("collapsed");
      filesContainer.classList.toggle("collapsed");
    });

    fileListEl.appendChild(header);
    fileListEl.appendChild(filesContainer);
  }
}

function createFileItem(doc, activeId, opts = {}) {
  const { showStar = true, showHint = false, displayName, indent = false } = opts;
  const item = document.createElement("div");
  item.className = `explorer-item${doc.id === activeId ? " active" : ""}`;
  item.dataset.id = doc.id;
  if (indent) item.style.paddingLeft = "24px";

  if (showStar) {
    const star = document.createElement("span");
    star.className = `main-star${doc.isMain ? " is-main" : ""}`;
    star.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${doc.isMain ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    star.title = doc.isMain ? "Main document" : "Set as main";
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!doc.isMain) callbacks.onSetMain?.(doc.id);
    });
    item.appendChild(star);
  }

  const nameSpan = document.createElement("span");
  nameSpan.className = "doc-name";
  nameSpan.textContent = displayName || doc.name;
  nameSpan.title = doc.name;
  nameSpan.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    startRename(item, doc);
  });
  item.appendChild(nameSpan);

  const actions = document.createElement("div");
  actions.className = "item-actions";
  if (!doc.isMain) {
    const deleteBtn = document.createElement("button");
    deleteBtn.title = "Delete";
    deleteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startDeleteConfirm(item, doc);
    });
    actions.appendChild(deleteBtn);
  }
  item.appendChild(actions);

  if (showHint && !doc.isMain) {
    const hint = document.createElement("span");
    hint.className = "include-hint";
    hint.textContent = `@include(${doc.name})`;
    item.appendChild(hint);
  }

  item.addEventListener("click", () => {
    callbacks.onSelect?.(doc.id);
  });

  return item;
}

function startDeleteConfirm(itemEl, doc) {
  if (itemEl.querySelector(".delete-confirm")) return;

  const nameSpan = itemEl.querySelector(".doc-name");
  const starEl = itemEl.querySelector(".main-star");
  const actionsEl = itemEl.querySelector(".item-actions");
  const hintEl = itemEl.querySelector(".include-hint");

  if (nameSpan) nameSpan.style.display = "none";
  if (starEl) starEl.style.display = "none";
  if (actionsEl) actionsEl.style.display = "none";
  if (hintEl) hintEl.style.display = "none";
  itemEl.classList.add("confirm-delete");

  const confirmEl = document.createElement("div");
  confirmEl.className = "delete-confirm";
  confirmEl.innerHTML = `
    <span>Delete?</span>
    <button class="confirm-yes" title="Confirm delete">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    </button>
    <button class="confirm-no" title="Cancel">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  `;
  itemEl.appendChild(confirmEl);

  const timeout = setTimeout(() => restore(), 4000);

  function restore() {
    clearTimeout(timeout);
    if (!itemEl.isConnected) return;
    confirmEl.remove();
    itemEl.classList.remove("confirm-delete");
    if (nameSpan) nameSpan.style.display = "";
    if (starEl) starEl.style.display = "";
    if (actionsEl) actionsEl.style.display = "";
    if (hintEl) hintEl.style.display = "";
  }

  confirmEl.querySelector(".confirm-yes").addEventListener("click", (e) => {
    e.stopPropagation();
    clearTimeout(timeout);
    callbacks.onDelete?.(doc.id);
  });

  confirmEl.querySelector(".confirm-no").addEventListener("click", (e) => {
    e.stopPropagation();
    restore();
  });
}

function startRename(itemEl, doc) {
  const nameSpan = itemEl.querySelector(".doc-name");
  const actionsEl = itemEl.querySelector(".item-actions");
  const hintEl = itemEl.querySelector(".include-hint");

  nameSpan.style.display = "none";
  if (actionsEl) actionsEl.style.display = "none";
  if (hintEl) hintEl.style.display = "none";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-rename";
  input.value = doc.name;
  itemEl.insertBefore(input, actionsEl);
  input.focus();
  input.select();

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    const newName = input.value.trim();
    input.remove();
    nameSpan.style.display = "";
    if (actionsEl) actionsEl.style.display = "";
    if (hintEl) hintEl.style.display = "";

    if (newName && newName !== doc.name) {
      callbacks.onRename?.(doc.id, newName);
    }
  }

  input.addEventListener("blur", finish);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = doc.name;
      input.blur();
    }
  });
}

function startInlineAdd() {
  if (!fileListEl || fileListEl.querySelector(".inline-rename")) return;

  const item = document.createElement("div");
  item.className = "explorer-item";

  const icon = document.createElement("span");
  icon.style.cssText = "flex-shrink:0;opacity:0.4;color:#9ca3af;";
  icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-rename";
  const defaultName = "new-doc.md";
  input.value = defaultName;

  item.appendChild(icon);
  item.appendChild(input);
  fileListEl.prepend(item);

  input.focus();
  const dotIdx = defaultName.lastIndexOf(".");
  input.setSelectionRange(0, dotIdx > 0 ? dotIdx : defaultName.length);

  let done = false;
  function finish(accept) {
    if (done) return;
    done = true;
    const name = input.value.trim();
    item.remove();
    if (accept && name) {
      callbacks.onAdd?.(name);
    }
  }

  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  });
}

export function toggleExplorer(forceState) {
  _isOpen = forceState !== undefined ? forceState : !_isOpen;

  if (_isOpen) {
    explorerPanel.style.width = "220px";
    explorerPanel.style.minWidth = "220px";
  } else {
    explorerPanel.style.width = "0";
    explorerPanel.style.minWidth = "0";
  }

  try {
    localStorage.setItem("md2docx-explorer-open", _isOpen);
  } catch {}

  return _isOpen;
}

export function isExplorerOpen() {
  return _isOpen;
}
