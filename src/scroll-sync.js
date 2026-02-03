let syncEnabled = false;
let editor = null;
let previewEl = null;
let cursorDebounce = null;
let jumpBtnTimeout = null;
let jumpBtnHideTimeout = null;

export function initScrollSync(editorTextarea, previewContainer) {
  editor = editorTextarea;
  previewEl = previewContainer;

  try {
    syncEnabled = localStorage.getItem("md2docx-scroll-sync") === "true";
  } catch {}

  editor.addEventListener("click", handleCursorChange);
  editor.addEventListener("keyup", handleCursorChange);
}

export function isSyncEnabled() {
  return syncEnabled;
}

export function toggleSync() {
  syncEnabled = !syncEnabled;
  try {
    localStorage.setItem("md2docx-scroll-sync", String(syncEnabled));
  } catch {}

  if (syncEnabled) {
    hideJumpButton();
    const cursorLine = getCursorLine();
    const targetEl = findElementForLine(cursorLine);
    if (targetEl) {
      scrollElementToCenter(targetEl, true);
    }
  }

  return syncEnabled;
}

function getCursorLine() {
  const text = editor.value.substring(0, editor.selectionStart);
  return text.split("\n").length - 1;
}

function findElementForLine(targetLine) {
  const elements = previewEl.querySelectorAll("[data-line]");
  let closest = null;
  let closestDiff = Infinity;

  for (const el of elements) {
    const line = parseInt(el.dataset.line);
    if (isNaN(line)) continue;

    if (line === targetLine) return el;

    const diff = Math.abs(line - targetLine);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = el;
    }
  }

  return closest;
}

function scrollElementToCenter(el, smooth = false) {
  const rect = el.getBoundingClientRect();
  const containerRect = previewEl.getBoundingClientRect();
  const targetScroll =
    rect.top -
    containerRect.top +
    previewEl.scrollTop -
    previewEl.clientHeight / 2 +
    rect.height / 2;

  if (smooth) {
    previewEl.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
  } else {
    previewEl.scrollTop = Math.max(0, targetScroll);
  }
}

function handleCursorChange() {
  if (!syncEnabled) {
    showJumpButton();
    return;
  }

  clearTimeout(cursorDebounce);
  cursorDebounce = setTimeout(() => {
    const cursorLine = getCursorLine();
    const targetEl = findElementForLine(cursorLine);
    if (targetEl) {
      scrollElementToCenter(targetEl, false);
    }
  }, 50);
}

function showJumpButton() {
  clearTimeout(jumpBtnTimeout);
  clearTimeout(jumpBtnHideTimeout);

  jumpBtnTimeout = setTimeout(() => {
    const btn = document.getElementById("jumpToBtn");
    if (!btn) return;

    btn.classList.remove("opacity-0", "pointer-events-none");
    btn.classList.add("opacity-100", "pointer-events-auto");

    jumpBtnHideTimeout = setTimeout(() => {
      hideJumpButton();
    }, 3000);
  }, 300);
}

function hideJumpButton() {
  const btn = document.getElementById("jumpToBtn");
  if (!btn) return;

  clearTimeout(jumpBtnTimeout);
  clearTimeout(jumpBtnHideTimeout);

  btn.classList.remove("opacity-100", "pointer-events-auto");
  btn.classList.add("opacity-0", "pointer-events-none");
}

export function jumpToPreview() {
  const cursorLine = getCursorLine();
  const targetEl = findElementForLine(cursorLine);

  if (targetEl) {
    scrollElementToCenter(targetEl, true);

    targetEl.classList.add("scroll-highlight");
    setTimeout(() => {
      targetEl.classList.remove("scroll-highlight");
    }, 1000);
  }

  hideJumpButton();
}
