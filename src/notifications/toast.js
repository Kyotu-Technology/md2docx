import { escapeHtml } from "../utils.js";

let container = null;
const TOAST_DURATION = 4000;
const ANIMATION_DURATION = 200;

const TYPES = {
  success: {
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>`,
  },
  error: {
    border: "border-red-500/50",
    text: "text-red-400",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>`,
  },
  warning: {
    border: "border-amber-500/50",
    text: "text-amber-400",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>`,
  },
  info: {
    border: "border-blue-500/50",
    text: "text-blue-400",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>`,
  },
};

function ensureContainer() {
  if (container) return;

  container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none";
  document.body.appendChild(container);
}

function show(message, type = "info", duration = TOAST_DURATION) {
  ensureContainer();

  const config = TYPES[type] || TYPES.info;
  const toast = document.createElement("div");

  toast.className = `
    pointer-events-auto flex items-center gap-3 px-4 py-3
    bg-gray-900 ${config.border} border
    rounded-lg shadow-lg max-w-sm
    transform translate-x-full opacity-0
    transition-all duration-200 ease-out
  `.replace(/\s+/g, " ");

  toast.innerHTML = `
    <span class="${config.text} shrink-0">${config.icon}</span>
    <span class="text-sm text-gray-100 flex-1">${escapeHtml(message)}</span>
    <button class="text-gray-500 hover:text-gray-300 transition-colors shrink-0" aria-label="Close">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;

  const closeBtn = toast.querySelector("button");
  closeBtn.addEventListener("click", () => dismiss(toast));

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-full", "opacity-0");
    toast.classList.add("translate-x-0", "opacity-100");
  });

  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration);
  }

  return toast;
}

function dismiss(toast) {
  if (!toast || !toast.parentNode) return;

  toast.classList.remove("translate-x-0", "opacity-100");
  toast.classList.add("translate-x-full", "opacity-0");

  setTimeout(() => {
    toast.remove();
  }, ANIMATION_DURATION);
}

export const toast = {
  success: (message, duration) => show(message, "success", duration),
  error: (message, duration) => show(message, "error", duration),
  warning: (message, duration) => show(message, "warning", duration),
  info: (message, duration) => show(message, "info", duration),
  show,
  dismiss,
};
