import { decodeShareFragment, isShareFragment, formatSize } from "./codec.js";
import { toast } from "../notifications/index.js";
import { escapeHtml } from "../utils.js";

function askPasswordDialog() {
  return new Promise((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.id = "sharePasswordModal";
    overlay.className = "fixed inset-0 z-[300] flex items-center justify-center";
    overlay.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="pwdBackdrop"></div>
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform scale-95 opacity-0 transition-all duration-200">
        <div class="px-6 pt-6 pb-4">
          <h3 class="text-lg font-semibold text-white mb-2">Password Required</h3>
          <p class="text-sm text-gray-400 mb-4">This shared document is password-protected. Enter the password to decrypt.</p>
          <div class="relative">
            <input id="pwdInput" type="password" placeholder="Enter password" autocomplete="off"
              class="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange" />
            <button id="pwdEye" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1" type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
          <p id="pwdError" class="text-xs text-red-400 mt-2 hidden"></p>
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button id="pwdCancel" class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button id="pwdDecrypt" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Decrypt
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const panel = overlay.querySelector(".relative");
    requestAnimationFrame(() => {
      panel.classList.remove("scale-95", "opacity-0");
      panel.classList.add("scale-100", "opacity-100");
    });

    const input = overlay.querySelector("#pwdInput");
    setTimeout(() => input.focus(), 50);

    let closed = false;

    const close = (result) => {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", handleKeydown, true);
      panel.classList.remove("scale-100", "opacity-100");
      panel.classList.add("scale-95", "opacity-0");
      setTimeout(() => overlay.remove(), 200);
      if (result !== null) {
        resolve(result);
      } else {
        reject(new Error("Password entry cancelled"));
      }
    };

    const submit = () => {
      const pwd = input.value;
      if (!pwd) {
        input.classList.add("border-red-500");
        input.focus();
        return;
      }
      close(pwd);
    };

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        submit();
      }
    };

    document.addEventListener("keydown", handleKeydown, true);

    overlay.querySelector("#pwdBackdrop").addEventListener("click", () => close(null));
    overlay.querySelector("#pwdCancel").addEventListener("click", () => close(null));
    overlay.querySelector("#pwdDecrypt").addEventListener("click", submit);
    overlay.querySelector("#pwdEye").addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
    });
    input.addEventListener("input", () => {
      input.classList.remove("border-red-500");
    });
  });
}

function showImportDialog(files, created) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.id = "shareImportModal";
    overlay.className = "fixed inset-0 z-[300] flex items-center justify-center";

    const encoder = new TextEncoder();
    const fileSizes = files.map((f) => encoder.encode(f.content || "").length);
    const totalSize = fileSizes.reduce((sum, s) => sum + s, 0);
    const createdDate = new Date(created).toLocaleString();
    const fileList = files
      .map((f, i) => {
        const size = formatSize(fileSizes[i]);
        const badge = f.isMain
          ? '<span class="ml-1.5 px-1.5 py-0.5 text-[10px] bg-kyotu-orange/20 text-kyotu-orange rounded">main</span>'
          : "";
        return `<div class="flex items-center justify-between py-1.5">
        <div class="flex items-center">
          <svg class="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-sm text-white">${escapeHtml(f.name)}</span>${badge}
        </div>
        <span class="text-xs text-gray-500">${size}</span>
      </div>`;
      })
      .join("");

    overlay.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="importBackdrop"></div>
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform scale-95 opacity-0 transition-all duration-200">
        <div class="px-6 pt-6 pb-4">
          <h3 class="text-lg font-semibold text-white mb-1">Import Shared Documents</h3>
          <p class="text-xs text-gray-500 mb-4">Shared on ${escapeHtml(createdDate)} · ${files.length} file${files.length > 1 ? "s" : ""} · ${formatSize(totalSize)}</p>
          <div class="max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg border border-gray-700/50 px-4 py-2">
            ${fileList}
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button id="importCancel" class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button id="importMerge" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Merge
          </button>
          <button id="importReplace" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
            Replace All
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const panel = overlay.querySelector(".relative");
    requestAnimationFrame(() => {
      panel.classList.remove("scale-95", "opacity-0");
      panel.classList.add("scale-100", "opacity-100");
    });

    let closed = false;

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close(null);
      }
    };

    const close = (result) => {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", handleKeydown, true);
      panel.classList.remove("scale-100", "opacity-100");
      panel.classList.add("scale-95", "opacity-0");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    document.addEventListener("keydown", handleKeydown, true);

    overlay.querySelector("#importBackdrop").addEventListener("click", () => close(null));
    overlay.querySelector("#importCancel").addEventListener("click", () => close(null));
    overlay.querySelector("#importMerge").addEventListener("click", () => close("merge"));
    overlay.querySelector("#importReplace").addEventListener("click", () => close("replace"));
  });
}

export async function handleShareFragment(hash, importCallback) {
  if (!isShareFragment(hash)) return;

  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;

  let decoded;
  try {
    decoded = await decodeShareFragment(fragment, askPasswordDialog);
  } catch (err) {
    if (err.message === "Password entry cancelled") return;
    toast.error(err.message);
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }

  history.replaceState(null, "", window.location.pathname + window.location.search);

  const mode = await showImportDialog(decoded.files, decoded.created);
  if (!mode) return;

  await importCallback(decoded.files, mode);
}
