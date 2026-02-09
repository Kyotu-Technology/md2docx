let toolbar = null;
let activeTextarea = null;

const FORMATS = [
  {
    key: "bold",
    prefix: "**",
    suffix: "**",
    label: "B",
    title: "Bold (Ctrl+B)",
    style: "font-weight: 800;",
  },
  {
    key: "italic",
    prefix: "*",
    suffix: "*",
    label: "I",
    title: "Italic (Ctrl+I)",
    style: "font-style: italic;",
  },
  {
    key: "code",
    prefix: "`",
    suffix: "`",
    label: "</>",
    title: "Code (Ctrl+E)",
    style: "font-family: var(--font-mono, monospace); font-size: 12px;",
  },
  { key: "separator" },
  { key: "link", label: "\uD83D\uDD17", title: "Link (Ctrl+K)" },
];

function createToolbar() {
  const el = document.createElement("div");
  el.className = "formatting-toolbar";
  el.id = "formattingToolbar";

  for (const fmt of FORMATS) {
    if (fmt.key === "separator") {
      const sep = document.createElement("div");
      sep.className = "formatting-toolbar-sep";
      el.appendChild(sep);
      continue;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.format = fmt.key;
    btn.title = fmt.title;
    btn.textContent = fmt.label;
    if (fmt.style) btn.style.cssText = fmt.style;

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (!activeTextarea) return;
      if (fmt.key === "link") {
        applyLink(activeTextarea);
      } else {
        applyFormat(activeTextarea, fmt.prefix, fmt.suffix);
      }
      updateActiveStates();
    });

    el.appendChild(btn);
  }

  document.body.appendChild(el);
  return el;
}

function getSelectionCoords(textarea) {
  const value = textarea.value;
  const textBefore = value.substring(0, textarea.selectionStart);
  const lineNumber = textBefore.split("\n").length - 1;

  const style = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  const paddingTop = parseFloat(style.paddingTop) || 0;

  const rect = textarea.getBoundingClientRect();
  const y = rect.top + paddingTop + lineNumber * lineHeight - textarea.scrollTop;
  const x = rect.left + rect.width / 2;

  return { x, y };
}

function showToolbar(textarea) {
  if (!toolbar) toolbar = createToolbar();

  const coords = getSelectionCoords(textarea);
  const toolbarWidth = 220;
  const toolbarHeight = 40;

  const left = Math.max(
    8,
    Math.min(coords.x - toolbarWidth / 2, window.innerWidth - toolbarWidth - 8)
  );
  const top = Math.max(8, coords.y - toolbarHeight - 8);

  toolbar.style.left = `${left}px`;
  toolbar.style.top = `${top}px`;
  toolbar.classList.add("visible");

  updateActiveStates();
}

function hideToolbar() {
  if (toolbar) toolbar.classList.remove("visible");
}

function getSelection(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value.substring(start, end);
  return { start, end, text };
}

function countConsecutive(str, char, from, dir) {
  let n = 0;
  let i = from;
  while (i >= 0 && i < str.length && str[i] === char) {
    n++;
    i += dir;
  }
  return n;
}

function isStarFormatActive(stars, prefixLen) {
  if (prefixLen === 2) return stars >= 2;
  return stars % 2 === 1;
}

function hasFormat(text, prefix, suffix) {
  if (
    !text.startsWith(prefix) ||
    !text.endsWith(suffix) ||
    text.length < prefix.length + suffix.length
  )
    return false;

  if (prefix[0] === "*") {
    const before = countConsecutive(text, "*", 0, 1);
    const after = countConsecutive(text, "*", text.length - 1, -1);
    return isStarFormatActive(Math.min(before, after), prefix.length);
  }

  const inner = text.slice(prefix.length, -suffix.length);
  return !inner.startsWith(prefix[0]) && !inner.endsWith(suffix[suffix.length - 1]);
}

function hasSurroundingFormat(textarea, prefix, suffix) {
  const { start, end } = getSelection(textarea);
  const value = textarea.value;
  if (
    start < prefix.length ||
    end + suffix.length > value.length ||
    value.substring(start - prefix.length, start) !== prefix ||
    value.substring(end, end + suffix.length) !== suffix
  )
    return false;

  if (prefix[0] === "*") {
    const before = countConsecutive(value, "*", start - 1, -1);
    const after = countConsecutive(value, "*", end, 1);
    return isStarFormatActive(Math.min(before, after), prefix.length);
  }

  const charBefore = start > prefix.length ? value[start - prefix.length - 1] : "";
  const charAfter = end + suffix.length < value.length ? value[end + suffix.length] : "";
  return charBefore !== prefix[0] && charAfter !== suffix[suffix.length - 1];
}

function applyFormat(textarea, prefix, suffix) {
  const { start, end, text } = getSelection(textarea);
  if (start === end) return;

  const value = textarea.value;

  if (hasFormat(text, prefix, suffix)) {
    const unwrapped = text.slice(prefix.length, -suffix.length);
    textarea.value = value.substring(0, start) + unwrapped + value.substring(end);
    textarea.setSelectionRange(start, start + unwrapped.length);
  } else if (hasSurroundingFormat(textarea, prefix, suffix)) {
    const before = value.substring(0, start - prefix.length);
    const after = value.substring(end + suffix.length);
    textarea.value = before + text + after;
    textarea.setSelectionRange(start - prefix.length, start - prefix.length + text.length);
  } else {
    const wrapped = prefix + text + suffix;
    textarea.value = value.substring(0, start) + wrapped + value.substring(end);
    textarea.setSelectionRange(start + prefix.length, end + prefix.length);
  }

  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function applyLink(textarea) {
  const { start, end, text } = getSelection(textarea);
  if (start === end) return;

  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  const linkMd = `[${text}](url)`;

  textarea.value = before + linkMd + after;

  const urlStart = start + text.length + 3;
  const urlEnd = urlStart + 3;
  textarea.setSelectionRange(urlStart, urlEnd);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function updateActiveStates() {
  if (!toolbar || !activeTextarea) return;

  const { text } = getSelection(activeTextarea);
  for (const btn of toolbar.querySelectorAll("button[data-format]")) {
    const fmt = FORMATS.find((f) => f.key === btn.dataset.format);
    if (!fmt || !fmt.prefix) {
      btn.classList.remove("active");
      continue;
    }
    const isActive =
      hasFormat(text, fmt.prefix, fmt.suffix) ||
      hasSurroundingFormat(activeTextarea, fmt.prefix, fmt.suffix);
    btn.classList.toggle("active", isActive);
  }
}

function handleKeyboardShortcut(e) {
  if (!activeTextarea) return;

  const ctrl = e.ctrlKey || e.metaKey;
  let handled = false;

  if (ctrl && e.key === "b") {
    applyFormat(activeTextarea, "**", "**");
    handled = true;
  } else if (ctrl && e.key === "i") {
    applyFormat(activeTextarea, "*", "*");
    handled = true;
  } else if (ctrl && e.key === "e") {
    applyFormat(activeTextarea, "`", "`");
    handled = true;
  }

  if (handled) {
    e.preventDefault();
    updateActiveStates();
  }
}

export function initFormattingToolbar(textarea) {
  activeTextarea = textarea;

  const checkSelection = () => {
    const { start, end } = getSelection(textarea);
    if (start !== end) {
      showToolbar(textarea);
    } else {
      hideToolbar();
    }
  };

  textarea.addEventListener("mouseup", checkSelection);
  textarea.addEventListener("keyup", (e) => {
    if (e.shiftKey || e.key === "Shift") checkSelection();
  });

  textarea.addEventListener("keydown", handleKeyboardShortcut);

  document.addEventListener("mousedown", (e) => {
    if (toolbar && !toolbar.contains(e.target) && e.target !== textarea) {
      hideToolbar();
    }
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toolbar?.classList.contains("visible")) {
      hideToolbar();
    }
  });
}

export function hasTextSelection(textarea) {
  return textarea.selectionStart !== textarea.selectionEnd;
}
