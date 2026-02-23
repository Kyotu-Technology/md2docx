import { escapeHtml } from "../utils.js";

let explorerPanel = null;
let fileListEl = null;
let callbacks = {};
let _isOpen = false;

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
    explorerPanel.style.width = "200px";
    explorerPanel.style.minWidth = "200px";
    explorerPanel.style.pointerEvents = "";
  }
}

export function refreshFileList(documents, activeId) {
  if (!fileListEl) return;

  fileListEl.innerHTML = "";

  for (const doc of documents) {
    const item = document.createElement("div");
    item.className = `explorer-item${doc.id === activeId ? " active" : ""}`;
    item.dataset.id = doc.id;

    const star = document.createElement("span");
    star.className = `main-star${doc.isMain ? " is-main" : ""}`;
    star.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${doc.isMain ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    star.title = doc.isMain ? "Main document" : "Set as main";
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!doc.isMain) callbacks.onSetMain?.(doc.id);
    });

    const nameSpan = document.createElement("span");
    nameSpan.className = "doc-name";
    nameSpan.textContent = doc.name;
    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startRename(item, doc);
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";

    if (!doc.isMain) {
      const deleteBtn = document.createElement("button");
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onDelete?.(doc.id);
      });
      actions.appendChild(deleteBtn);
    }

    item.appendChild(star);
    item.appendChild(nameSpan);
    item.appendChild(actions);

    if (!doc.isMain) {
      const hint = document.createElement("span");
      hint.className = "include-hint";
      hint.textContent = `@include(${doc.name})`;
      item.appendChild(hint);
    }

    item.addEventListener("click", () => {
      callbacks.onSelect?.(doc.id);
    });

    fileListEl.appendChild(item);
  }
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
    explorerPanel.style.width = "200px";
    explorerPanel.style.minWidth = "200px";
    explorerPanel.style.pointerEvents = "";
  } else {
    explorerPanel.style.width = "0";
    explorerPanel.style.minWidth = "0";
    explorerPanel.style.pointerEvents = "none";
  }

  try {
    localStorage.setItem("md2docx-explorer-open", _isOpen);
  } catch {}

  const toggleBtn = document.getElementById("explorerToggle");
  if (toggleBtn) {
    toggleBtn.style.opacity = _isOpen ? "1" : "";
    toggleBtn.style.color = _isOpen ? "#f97c00" : "";
  }

  return _isOpen;
}

export function isExplorerOpen() {
  return _isOpen;
}
