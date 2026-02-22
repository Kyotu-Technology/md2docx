import { escapeHtml } from "../utils.js";

let dropdown = null;
let selectedIndex = -1;
let currentItems = [];
let isVisible = false;
let mirror = null;

const TRIGGER = /@include\(([^)]*$)/;

export function initIncludeAutocomplete(textarea, getDocuments) {
  textarea.addEventListener("input", () => {
    checkForTrigger(textarea, getDocuments);
  });

  textarea.addEventListener("keydown", (e) => {
    if (!isVisible) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      selectedIndex = Math.min(selectedIndex + 1, currentItems.length - 1);
      renderItems();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderItems();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      if (currentItems[selectedIndex]) {
        applyCompletion(textarea, currentItems[selectedIndex]);
      }
      hideDropdown();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      hideDropdown();
    }
  });

  textarea.addEventListener("blur", () => {
    setTimeout(() => hideDropdown(), 150);
  });

  textarea.addEventListener("scroll", () => {
    if (isVisible) hideDropdown();
  });
}

function checkForTrigger(textarea, getDocuments) {
  const value = textarea.value;
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastNewline = textBeforeCursor.lastIndexOf("\n");
  const lineText = textBeforeCursor.substring(lastNewline + 1);

  const match = lineText.match(TRIGGER);
  if (!match) {
    hideDropdown();
    return;
  }

  const partialName = match[1];
  const docs = getDocuments();
  const nonMainDocs = docs.filter((d) => !d.isMain);

  currentItems = nonMainDocs
    .map((d) => d.name)
    .filter((name) => name.toLowerCase().includes(partialName.toLowerCase()));

  if (currentItems.length === 0) {
    hideDropdown();
    return;
  }

  selectedIndex = 0;
  showDropdown(textarea);
}

const MIRROR_PROPS = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
  "lineHeight", "textTransform", "wordSpacing", "textIndent",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "boxSizing", "whiteSpace", "wordWrap", "overflowWrap", "tabSize",
];

function getCursorCoords(textarea) {
  if (!mirror) {
    mirror = document.createElement("div");
    mirror.style.position = "fixed";
    mirror.style.visibility = "hidden";
    mirror.style.overflow = "hidden";
    mirror.style.pointerEvents = "none";
    document.body.appendChild(mirror);
  }

  const style = window.getComputedStyle(textarea);
  const rect = textarea.getBoundingClientRect();

  for (const prop of MIRROR_PROPS) {
    mirror.style[prop] = style[prop];
  }
  mirror.style.top = rect.top + "px";
  mirror.style.left = rect.left + "px";
  mirror.style.width = rect.width + "px";
  mirror.style.height = rect.height + "px";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  const value = textarea.value;
  const cursorPos = textarea.selectionStart;
  const textBefore = value.substring(0, cursorPos);

  const span = document.createElement("span");
  span.textContent = "\u200b";

  mirror.textContent = "";
  mirror.appendChild(document.createTextNode(textBefore));
  mirror.appendChild(span);
  mirror.appendChild(document.createTextNode(value.substring(cursorPos) || "."));

  mirror.scrollTop = textarea.scrollTop;

  const spanRect = span.getBoundingClientRect();
  const lh = parseFloat(style.lineHeight);
  const lineHeight = isNaN(lh) ? parseFloat(style.fontSize) * 1.5 : lh;

  const x = spanRect.left;
  const y = spanRect.top + lineHeight;

  const dropdownWidth = 200;
  return {
    x: Math.max(rect.left, Math.min(x, rect.right - dropdownWidth)),
    y: Math.max(rect.top, Math.min(y, rect.bottom - 10)),
  };
}

function createDropdown() {
  if (dropdown) return;
  dropdown = document.createElement("div");
  dropdown.className = "include-autocomplete";
  document.body.appendChild(dropdown);
}

function showDropdown(textarea) {
  createDropdown();
  const coords = getCursorCoords(textarea);

  dropdown.style.left = `${coords.x}px`;
  dropdown.style.top = `${coords.y + 4}px`;
  dropdown.style.display = "block";
  isVisible = true;

  renderItems();
}

function renderItems() {
  if (!dropdown) return;

  dropdown.innerHTML = currentItems
    .map((name, i) => {
      const cls = i === selectedIndex ? " selected" : "";
      return `<div class="include-autocomplete-item${cls}" data-index="${i}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.5;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span>${escapeHtml(name)}</span>
      </div>`;
    })
    .join("");

  dropdown.querySelectorAll("[data-index]").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const idx = parseInt(el.dataset.index);
      if (currentItems[idx]) {
        const textarea = document.getElementById("markdown");
        applyCompletion(textarea, currentItems[idx]);
      }
      hideDropdown();
    });
  });
}

function hideDropdown() {
  if (dropdown) dropdown.style.display = "none";
  isVisible = false;
  selectedIndex = -1;
  currentItems = [];
}

function applyCompletion(textarea, filename) {
  const value = textarea.value;
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastNewline = textBeforeCursor.lastIndexOf("\n");
  const lineText = textBeforeCursor.substring(lastNewline + 1);

  const match = lineText.match(TRIGGER);
  if (!match) return;

  const partialStart = cursorPos - match[1].length;
  const completion = filename + ")";
  const before = value.substring(0, partialStart);
  const after = value.substring(cursorPos);

  textarea.value = before + completion + after;
  const newCursorPos = partialStart + completion.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
