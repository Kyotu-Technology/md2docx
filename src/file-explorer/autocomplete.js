import { escapeHtml } from "../utils.js";

let dropdown = null;
let selectedIndex = -1;
let currentItems = [];
let isVisible = false;
let cachedCharWidth = 0;

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

function getCharWidth(textarea) {
  if (cachedCharWidth > 0) return cachedCharWidth;
  const style = window.getComputedStyle(textarea);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${style.fontSize} ${style.fontFamily}`;
  cachedCharWidth = ctx.measureText("m").width;
  return cachedCharWidth;
}

function getCursorCoords(textarea) {
  const value = textarea.value;
  const cursorPos = textarea.selectionStart;
  const textBefore = value.substring(0, cursorPos);

  const style = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;

  const lines = textBefore.split("\n");
  const lineNumber = lines.length - 1;
  const lastLine = lines[lines.length - 1];

  const rect = textarea.getBoundingClientRect();
  const charWidth = getCharWidth(textarea);

  const y = rect.top + paddingTop + (lineNumber + 1) * lineHeight - textarea.scrollTop;
  const x = rect.left + paddingLeft + lastLine.length * charWidth;

  return {
    x: Math.min(x, rect.right - 200),
    y: Math.min(y, rect.bottom - 10),
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
