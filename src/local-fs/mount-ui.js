import { isFileSystemAccessSupported, isFileSystemObserverSupported } from "./capability.js";
import {
  mountFolder,
  unmountFolder,
  getState,
  getFolderName,
  onStateChange,
  regrantPermission,
  isLocalFsMode,
} from "./sync-engine.js";
import { escapeHtml } from "../utils.js";

let statusEl = null;
let mountBtn = null;
let explorerHeader = null;
let headerLabel = null;
let shortcutHint = null;

export function initMountUI() {
  if (!isFileSystemAccessSupported()) return;

  mountBtn = document.getElementById("mountFolderBtn");
  statusEl = document.getElementById("localFsStatus");
  explorerHeader = document.getElementById("explorerHeader");
  headerLabel = document.getElementById("explorerHeaderLabel");
  shortcutHint = document.getElementById("mountShortcutHint");

  if (mountBtn) {
    mountBtn.classList.remove("hidden");
    mountBtn.addEventListener("click", handleMountClick);
  }

  if (shortcutHint) {
    shortcutHint.classList.remove("hidden");
    shortcutHint.classList.add("flex");
  }

  onStateChange(updateUI);
  updateUI(getState());
}

async function handleMountClick() {
  if (isLocalFsMode()) {
    await unmountFolder();
    restoreExplorerHeader();
  } else {
    await mountFolder();
  }
}

export async function handleMountShortcut() {
  if (!isFileSystemAccessSupported()) return;
  await handleMountClick();
}

function updateUI(state) {
  updateStatusIndicator(state);
  updateMountButton(state);
  updateExplorerHeader(state);
}

function updateStatusIndicator(state) {
  if (!statusEl) return;

  if (state === "idle") {
    statusEl.classList.add("hidden");
    statusEl.innerHTML = "";
    return;
  }

  statusEl.classList.remove("hidden");
  const name = escapeHtml(getFolderName());

  if (state === "watching") {
    const method = isFileSystemObserverSupported() ? "watching" : "polling (2s)";
    statusEl.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span class="local-fs-dot local-fs-dot--connected"></span>
        <span class="text-emerald-400">Local: ${name}</span>
        <span class="text-gray-600 text-[10px]">${method}</span>
      </span>
    `;
  } else if (state === "scanning" || state === "mounting") {
    statusEl.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span class="local-fs-dot local-fs-dot--syncing"></span>
        <span class="text-kyotu-orange">Mounting${name ? ": " + name : ""}...</span>
      </span>
    `;
  } else if (state === "permission-lost") {
    statusEl.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span class="local-fs-dot local-fs-dot--error"></span>
        <span class="text-red-400">Permission lost</span>
        <button id="regrantBtn" class="text-[10px] px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded hover:bg-red-900 transition-colors">
          Re-grant
        </button>
      </span>
    `;
    const btn = statusEl.querySelector("#regrantBtn");
    btn?.addEventListener("click", async () => {
      const ok = await regrantPermission();
      if (!ok) {
        await unmountFolder();
        restoreExplorerHeader();
      }
    });
  } else if (state === "error") {
    statusEl.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span class="local-fs-dot local-fs-dot--error"></span>
        <span class="text-red-400">Error</span>
      </span>
    `;
  }
}

function updateMountButton(state) {
  if (!mountBtn) return;

  if (state === "idle") {
    mountBtn.title = "Mount local folder (Ctrl+Shift+O)";
    mountBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    `;
  } else {
    mountBtn.title = "Unmount folder (Ctrl+Shift+O)";
    mountBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    `;
  }
}

function updateExplorerHeader(state) {
  if (!explorerHeader || !headerLabel) return;

  if (state === "watching" || state === "scanning") {
    const name = escapeHtml(getFolderName());
    explorerHeader.classList.add("explorer-local-header");
    headerLabel.innerHTML = `
      <span class="flex items-center gap-1">
        <svg class="w-3 h-3 text-kyotu-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="truncate max-w-[120px] text-white" title="${name}">${name}</span>
      </span>
    `;
  } else {
    restoreExplorerHeader();
  }
}

function restoreExplorerHeader() {
  if (!explorerHeader || !headerLabel) return;
  explorerHeader.classList.remove("explorer-local-header");
  headerLabel.textContent = "Files";
}
