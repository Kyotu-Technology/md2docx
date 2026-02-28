import { encodeSharePayload, estimateShareSize, formatSize } from "./codec.js";
import { shortenUrl, isPrivateHost } from "./url-shortener.js";
import { toast } from "../notifications/index.js";
import { escapeHtml } from "../utils.js";

let modal = null;
let currentDocs = [];
let currentDocId = null;

const TTL_OPTIONS = [
  { label: "No expiry", value: 0 },
  { label: "1 hour", value: 3_600_000 },
  { label: "24 hours", value: 86_400_000 },
  { label: "7 days", value: 604_800_000 },
  { label: "30 days", value: 2_592_000_000 },
];

function getBaseUrl() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
}

function getSizeStatus(urlLength) {
  if (urlLength > 2_000_000) return { level: "error", color: "text-red-400", icon: "text-red-400" };
  if (urlLength > 60_000) return { level: "warn", color: "text-amber-400", icon: "text-amber-400" };
  if (urlLength > 8_000) return { level: "info", color: "text-blue-400", icon: "text-blue-400" };
  return { level: "ok", color: "text-emerald-400", icon: "text-emerald-400" };
}

function getSelectedFiles() {
  if (!modal) return [];
  const scope = modal.querySelector('input[name="shareScope"]:checked')?.value;
  if (scope === "active") {
    const doc = currentDocs.find((d) => d.id === currentDocId);
    return doc ? [doc] : [];
  }
  return currentDocs;
}

function updateSizeEstimate() {
  if (!modal) return;
  const files = getSelectedFiles();
  const sizeBar = modal.querySelector("#shareSizeBar");
  const copyBtn = modal.querySelector("#shareCopyBtn");
  const shortenBtn = modal.querySelector("#shareShortenBtn");

  if (files.length === 0) {
    sizeBar.innerHTML = `<span class="text-gray-500">No files selected</span>`;
    copyBtn.disabled = true;
    if (shortenBtn) shortenBtn.disabled = true;
    return;
  }

  const est = estimateShareSize(files);
  const status = getSizeStatus(est.estimatedUrlLength);

  let warning = "";
  if (status.level === "error") {
    warning = `<div class="text-red-400 text-xs mt-1">Content too large to share via link. Remove some files or reduce content.</div>`;
  } else if (status.level === "warn") {
    warning = `<div class="text-amber-400 text-xs mt-1">Long URL — may not work in Firefox/Safari. Works in Chrome.</div>`;
  } else if (status.level === "info") {
    warning = `<div class="text-blue-400 text-xs mt-1">Avoid pasting in chats that truncate long URLs.</div>`;
  }

  sizeBar.innerHTML = `
    <div class="flex items-center gap-2">
      <svg class="w-3.5 h-3.5 ${status.icon} shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      <span class="text-gray-400 text-xs">AES-256-GCM encrypted</span>
    </div>
    <div class="${status.color} text-xs mt-1">
      ${formatSize(est.originalSize)} → compressed: ${formatSize(est.compressedSize)} → link: ~${est.estimatedUrlLength.toLocaleString()} chars
      ${status.level === "ok" ? '<span class="text-emerald-400">✓</span>' : ""}
    </div>
    ${warning}
  `;

  const isBlocked = status.level === "error";
  copyBtn.disabled = isBlocked;
  if (shortenBtn) {
    const isLocal = isPrivateHost(window.location.href);
    const tooLong = est.estimatedUrlLength > 5_000;
    shortenBtn.disabled = isBlocked || tooLong || isLocal;
    shortenBtn.title = isLocal
      ? "Shortening requires a public URL"
      : tooLong
        ? "URL too long for shortener (max ~5 KB)"
        : "";
  }
}

function createModal() {
  if (modal) return;

  modal = document.createElement("div");
  modal.id = "shareModal";
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4";
  modal.style.display = "none";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "shareModalTitle");

  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/60" id="shareBackdrop"></div>
    <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-700">
        <h2 id="shareModalTitle" class="text-lg font-semibold text-white">Share</h2>
        <button id="shareCloseBtn" class="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="px-5 py-4 space-y-5">
        <div id="shareScopeSection">
          <div class="text-sm font-medium text-gray-300 mb-2">What to share</div>
          <div class="space-y-2" id="shareScopeOptions"></div>
        </div>

        <div>
          <div class="text-sm font-medium text-gray-300 mb-2">Link expiry</div>
          <select id="shareTtlSelect" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange appearance-none cursor-pointer">
            ${TTL_OPTIONS.map((o) => `<option value="${o.value}">${escapeHtml(o.label)}</option>`).join("")}
          </select>
        </div>

        <div>
          <button id="sharePasswordToggle" class="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Add password
          </button>
          <div id="sharePasswordSection" class="mt-2 hidden">
            <div class="relative">
              <input id="sharePasswordInput" type="password" placeholder="Enter password" autocomplete="off"
                class="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange" />
              <button id="sharePasswordEye" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1.5">Without password, anyone with the link can access the content.</p>
          </div>
        </div>

        <div id="shareSizeBar" class="py-3 px-4 bg-gray-800/50 rounded-lg border border-gray-700/50"></div>
      </div>

      <div class="px-5 py-4 border-t border-gray-700 bg-gray-800/30">
        <div class="flex items-center gap-3">
          <button id="shareCopyBtn" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-kyotu-orange-light to-kyotu-orange text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-kyotu-orange/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none">
            <svg class="w-4 h-4 share-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
            </svg>
            <span class="share-btn-text">Copy Link</span>
          </button>
          <button id="shareShortenBtn" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-4 h-4 share-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <span class="share-btn-text">Shorten</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3 text-center">Data is encrypted and embedded in the link. Nothing is sent to any server (unless you shorten).</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#shareBackdrop").addEventListener("click", closeShareDialog);
  modal.querySelector("#shareCloseBtn").addEventListener("click", closeShareDialog);

  modal.querySelector("#sharePasswordToggle").addEventListener("click", () => {
    const section = modal.querySelector("#sharePasswordSection");
    const isHidden = section.classList.contains("hidden");
    section.classList.toggle("hidden");
    if (isHidden) {
      modal.querySelector("#sharePasswordInput").focus();
    } else {
      modal.querySelector("#sharePasswordInput").value = "";
    }
  });

  modal.querySelector("#sharePasswordEye").addEventListener("click", () => {
    const input = modal.querySelector("#sharePasswordInput");
    input.type = input.type === "password" ? "text" : "password";
  });

  modal.querySelector("#shareScopeOptions").addEventListener("change", updateSizeEstimate);

  modal.querySelector("#shareCopyBtn").addEventListener("click", handleCopy);
  modal.querySelector("#shareShortenBtn").addEventListener("click", handleShorten);

  const handleKeydown = (e) => {
    if (modal.style.display === "none") return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeShareDialog();
    }
  };
  document.addEventListener("keydown", handleKeydown);
}

function setButtonLoading(btn, loading) {
  const icon = btn.querySelector(".share-btn-icon");
  const text = btn.querySelector(".share-btn-text");
  btn.disabled = loading;
  if (loading) {
    if (icon) icon.style.display = "none";
    if (text) text.dataset.original = text.textContent;
    if (text) text.textContent = "...";
  } else {
    if (icon) icon.style.display = "";
    if (text) text.textContent = text.dataset.original || text.textContent;
  }
}

async function buildShareUrl() {
  const files = getSelectedFiles();
  const password = modal.querySelector("#sharePasswordInput")?.value || "";
  const ttl = parseInt(modal.querySelector("#shareTtlSelect").value);

  const options = { ttl };
  if (password) options.password = password;

  const { fragment } = await encodeSharePayload(files, options);
  return getBaseUrl() + "#" + fragment;
}

async function handleCopy() {
  const btn = modal.querySelector("#shareCopyBtn");
  setButtonLoading(btn, true);
  try {
    const url = await buildShareUrl();

    if (url.length > 2_000_000) {
      toast.error("URL is too large to share. Remove some files or reduce content.");
      return;
    }

    await copyToClipboard(url);
    toast.success("Share link copied!");
    closeShareDialog();
  } catch (err) {
    toast.error(`Failed to create share link: ${err.message}`);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleShorten() {
  const btn = modal.querySelector("#shareShortenBtn");
  setButtonLoading(btn, true);
  try {
    const url = await buildShareUrl();

    let finalUrl;
    try {
      finalUrl = await shortenUrl(url);
    } catch (err) {
      finalUrl = url;
      if (err.message.includes("public")) {
        toast.info("URL shortening works only with public URLs. Full link copied.");
      } else {
        toast.warning("URL shortener unavailable. Full link copied.");
      }
    }

    await copyToClipboard(finalUrl);
    if (finalUrl !== url) {
      toast.success(`Shortened link copied: ${finalUrl}`);
    }
    closeShareDialog();
  } catch (err) {
    toast.error(`Failed to create share link: ${err.message}`);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function updateScopeOptions() {
  const container = modal.querySelector("#shareScopeOptions");
  const section = modal.querySelector("#shareScopeSection");

  if (currentDocs.length <= 1) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  const activeDoc = currentDocs.find((d) => d.id === currentDocId);
  const activeName = activeDoc ? escapeHtml(activeDoc.name) : "current file";
  const activeSize = activeDoc
    ? formatSize(new TextEncoder().encode(activeDoc.content || "").length)
    : "";
  const totalSize = formatSize(
    currentDocs.reduce((sum, d) => sum + new TextEncoder().encode(d.content || "").length, 0)
  );

  container.innerHTML = `
    <label class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
      <input type="radio" name="shareScope" value="active" class="accent-kyotu-orange" />
      <div>
        <span class="text-sm text-white">${activeName}</span>
        <span class="text-xs text-gray-500 ml-1">(${activeSize})</span>
      </div>
    </label>
    <label class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
      <input type="radio" name="shareScope" value="all" checked class="accent-kyotu-orange" />
      <div>
        <span class="text-sm text-white">All files</span>
        <span class="text-xs text-gray-500 ml-1">(${currentDocs.length} files, ${totalSize})</span>
      </div>
    </label>
  `;
}

export function openShareDialog(allDocuments, activeDocId) {
  createModal();
  currentDocs = allDocuments;
  currentDocId = activeDocId;

  updateScopeOptions();

  modal.querySelector("#shareTtlSelect").value = "0";
  modal.querySelector("#sharePasswordInput").value = "";
  modal.querySelector("#sharePasswordSection").classList.add("hidden");

  updateSizeEstimate();

  modal.style.display = "";
}

export function closeShareDialog() {
  if (modal) modal.style.display = "none";
}
