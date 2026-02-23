import { escapeHtml } from "../utils.js";

let activeModal = null;

export function confirm({
  title = "Confirm",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "default",
} = {}) {
  return new Promise((resolve) => {
    if (activeModal) {
      activeModal.remove();
    }

    const isDanger = confirmStyle === "danger";

    const modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.className = "fixed inset-0 z-[300] flex items-center justify-center";
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="confirmBackdrop"></div>
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform scale-95 opacity-0 transition-all duration-200">
        <div class="px-6 pt-6 pb-4">
          <h3 class="text-lg font-semibold text-white mb-2">${escapeHtml(title)}</h3>
          ${message ? `<p class="text-sm text-gray-400">${escapeHtml(message)}</p>` : ""}
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button id="confirmCancel" class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            ${escapeHtml(cancelText)}
          </button>
          <button id="confirmOk" class="px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isDanger
              ? "text-white bg-red-600 hover:bg-red-500"
              : "text-white bg-blue-600 hover:bg-blue-500"
          }">
            ${escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    activeModal = modal;
    document.body.appendChild(modal);

    const content = modal.querySelector(".relative");
    requestAnimationFrame(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    });

    let closed = false;

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close(true);
      }
    };

    const close = (result) => {
      if (closed) return;
      closed = true;

      document.removeEventListener("keydown", handleKeydown, true);

      content.classList.remove("scale-100", "opacity-100");
      content.classList.add("scale-95", "opacity-0");

      setTimeout(() => {
        modal.remove();
        if (activeModal === modal) {
          activeModal = null;
        }
        resolve(result);
      }, 200);
    };

    document.addEventListener("keydown", handleKeydown, true);

    modal.querySelector("#confirmBackdrop").addEventListener("click", () => close(false));
    modal.querySelector("#confirmCancel").addEventListener("click", () => close(false));
    modal.querySelector("#confirmOk").addEventListener("click", () => close(true));

    modal.querySelector("#confirmOk").focus();
  });
}

export function conflictDialog({
  title = "File conflict",
  message = "",
  replaceText = "Replace",
  keepBothText = "Keep Both",
  skipText = "Skip",
} = {}) {
  return new Promise((resolve) => {
    if (activeModal) {
      activeModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "conflictModal";
    modal.className = "fixed inset-0 z-[300] flex items-center justify-center";
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="conflictBackdrop"></div>
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform scale-95 opacity-0 transition-all duration-200">
        <div class="px-6 pt-6 pb-4">
          <h3 class="text-lg font-semibold text-white mb-2">${escapeHtml(title)}</h3>
          ${message ? `<p class="text-sm text-gray-400">${escapeHtml(message)}</p>` : ""}
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button id="conflictSkip" class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            ${escapeHtml(skipText)}
          </button>
          <button id="conflictKeepBoth" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            ${escapeHtml(keepBothText)}
          </button>
          <button id="conflictReplace" class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style="background: #f97c00;" onmouseover="this.style.background='#ff9e29'" onmouseout="this.style.background='#f97c00'">
            ${escapeHtml(replaceText)}
          </button>
        </div>
      </div>
    `;

    activeModal = modal;
    document.body.appendChild(modal);

    const content = modal.querySelector(".relative");
    requestAnimationFrame(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    });

    let closed = false;

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close("skip");
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close("replace");
      }
    };

    const close = (result) => {
      if (closed) return;
      closed = true;

      document.removeEventListener("keydown", handleKeydown, true);

      content.classList.remove("scale-100", "opacity-100");
      content.classList.add("scale-95", "opacity-0");

      setTimeout(() => {
        modal.remove();
        if (activeModal === modal) {
          activeModal = null;
        }
        resolve(result);
      }, 200);
    };

    document.addEventListener("keydown", handleKeydown, true);

    modal.querySelector("#conflictBackdrop").addEventListener("click", () => close("skip"));
    modal.querySelector("#conflictSkip").addEventListener("click", () => close("skip"));
    modal.querySelector("#conflictKeepBoth").addEventListener("click", () => close("keep-both"));
    modal.querySelector("#conflictReplace").addEventListener("click", () => close("replace"));

    modal.querySelector("#conflictReplace").focus();
  });
}
