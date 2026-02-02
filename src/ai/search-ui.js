import { getWorker, postTask } from "./worker-pool.js";
import { formatProgress } from "./ai-status.js";

let modal = null;
let input = null;
let resultsList = null;
let selectedIndex = -1;
let currentResults = [];
let searchTimeout = null;
let indexedChunks = [];
let isModelLoaded = false;

function buildChunks(elements) {
  const chunks = [];
  let currentHeading = "";
  let currentText = [];
  let currentLine = 0;

  for (const el of elements) {
    if (el.type.match(/^h[1-4]$/)) {
      if (currentText.length > 0) {
        chunks.push({
          heading: currentHeading,
          text: currentText.join(" "),
          line: currentLine,
        });
      }
      currentHeading = el.content;
      currentText = [];
      currentLine = el.line || 0;
    } else {
      const text = el.content || "";
      if (el.items) {
        const itemTexts = el.items.map((item) =>
          typeof item === "string" ? item : item.text || ""
        );
        currentText.push(itemTexts.join(". "));
      } else if (text) {
        currentText.push(text);
      }
    }
  }
  if (currentText.length > 0 || currentHeading) {
    chunks.push({
      heading: currentHeading,
      text: currentText.join(" "),
      line: currentLine,
    });
  }

  return chunks;
}

function createModal() {
  if (modal) return;

  modal = document.createElement("div");
  modal.id = "searchModal";
  modal.className = "fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/60" id="searchBackdrop"></div>
    <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
        <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          id="searchInput"
          type="text"
          placeholder="Search by meaning..."
          class="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
          autocomplete="off"
        >
        <kbd class="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-500 rounded font-mono">Esc</kbd>
      </div>
      <div id="searchResults" class="max-h-[50vh] overflow-y-auto">
        <div class="px-4 py-8 text-center text-gray-500 text-sm">Type to search semantically...</div>
      </div>
      <div class="px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
        <span><kbd class="px-1 py-0.5 bg-gray-800 rounded font-mono">↑↓</kbd> navigate</span>
        <span><kbd class="px-1 py-0.5 bg-gray-800 rounded font-mono">Enter</kbd> go to</span>
        <span id="searchModelStatus" class="ml-auto"></span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  input = modal.querySelector("#searchInput");
  resultsList = modal.querySelector("#searchResults");

  modal.querySelector("#searchBackdrop").addEventListener("click", closeSearch);

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(input.value), 200);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateResults(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateResults(-1);
    } else if (e.key === "Enter" && currentResults[selectedIndex]) {
      e.preventDefault();
      selectResult(currentResults[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
  });
}

function navigateResults(direction) {
  if (currentResults.length === 0) return;
  selectedIndex = Math.max(0, Math.min(currentResults.length - 1, selectedIndex + direction));
  renderResults();
}

function renderResults() {
  if (currentResults.length === 0) {
    resultsList.innerHTML =
      '<div class="px-4 py-8 text-center text-gray-500 text-sm">No results found</div>';
    return;
  }

  resultsList.innerHTML = currentResults
    .map((r, i) => {
      const active = i === selectedIndex;
      const snippet = r.text.length > 120 ? r.text.slice(0, 120) + "..." : r.text;
      const pct = Math.round(r.similarity * 100);
      return `
      <div class="px-4 py-3 cursor-pointer ${active ? "bg-gray-800" : "hover:bg-gray-800/50"} border-b border-gray-800/50 transition-colors"
           data-index="${i}">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-white">${escapeForHtml(r.heading || "Untitled Section")}</span>
          <div class="flex items-center gap-1.5">
            <div class="h-1.5 w-12 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full ${pct > 60 ? "bg-green-500" : pct > 35 ? "bg-yellow-500" : "bg-gray-500"}" style="width:${pct}%"></div>
            </div>
            <span class="text-xs text-gray-500 font-mono">${pct}%</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 line-clamp-2">${escapeForHtml(snippet)}</p>
      </div>`;
    })
    .join("");

  resultsList.querySelectorAll("[data-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.index);
      if (currentResults[idx]) selectResult(currentResults[idx]);
    });
  });
}

function escapeForHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function selectResult(result) {
  closeSearch();
  if (result.line !== undefined) {
    const textarea = document.getElementById("markdown");
    const lines = textarea.value.split("\n");
    let charPos = 0;
    for (let i = 0; i < result.line && i < lines.length; i++) {
      charPos += lines[i].length + 1;
    }
    textarea.focus();
    textarea.setSelectionRange(charPos, charPos);
    textarea.scrollTop =
      (result.line / lines.length) * textarea.scrollHeight - textarea.clientHeight / 3;
  }
}

async function performSearch(query) {
  if (!query.trim()) {
    currentResults = [];
    selectedIndex = -1;
    resultsList.innerHTML =
      '<div class="px-4 py-8 text-center text-gray-500 text-sm">Type to search semantically...</div>';
    return;
  }

  const statusEl = modal.querySelector("#searchModelStatus");

  if (!isModelLoaded) {
    statusEl.textContent = "Downloading model...";
    resultsList.innerHTML = `
      <div class="px-4 py-8 text-center">
        <div class="w-5 h-5 mx-auto mb-3 border-2 border-gray-600 border-t-kyotu-orange rounded-full animate-spin"></div>
        <p id="searchLoadingMain" class="text-sm text-gray-400">Downloading AI model...</p>
        <p id="searchLoadingDetail" class="text-xs text-gray-500 mt-1"></p>
      </div>`;
  }

  try {
    const workerUrl = new URL("./embeddings-worker.js", import.meta.url).href;
    const worker = getWorker("embeddings", workerUrl);

    if (indexedChunks.length > 0 && !isModelLoaded) {
      await postTask(worker, { type: "index", chunks: indexedChunks }, (progress) => {
        const main = modal.querySelector("#searchLoadingMain");
        const detail = modal.querySelector("#searchLoadingDetail");
        if (progress.status === "download") {
          const pct = progress.progress ? `${Math.round(progress.progress)}%` : "";
          const file = progress.file || "";
          statusEl.textContent = `Downloading ${file} ${pct}`.trim();
          if (detail) detail.textContent = `${file} ${pct}`.trim();
        } else if (progress.status === "loading") {
          statusEl.textContent = "Initializing model...";
          if (main) main.textContent = "Initializing model...";
          if (detail) detail.textContent = "";
        } else if (progress.status === "ready") {
          statusEl.textContent = "Indexing document...";
          if (main) main.textContent = "Indexing document...";
          if (detail) detail.textContent = `${indexedChunks.length} sections`;
        }
      });
      isModelLoaded = true;
      statusEl.textContent = "AI Search Ready";
    }

    resultsList.innerHTML =
      '<div class="px-4 py-8 text-center text-gray-500 text-sm">Searching...</div>';

    const { results } = await postTask(worker, { type: "search", query, topK: 8 }, (progress) => {
      statusEl.textContent = formatProgress(progress);
    });

    currentResults = results;
    selectedIndex = results.length > 0 ? 0 : -1;
    renderResults();
    if (isModelLoaded) {
      statusEl.textContent = "AI Search Ready";
    }
  } catch (err) {
    resultsList.innerHTML = `<div class="px-4 py-8 text-center text-red-400 text-sm">${escapeForHtml(err.message)}</div>`;
  }
}

export function openSearch() {
  createModal();
  modal.style.display = "";
  if (currentResults.length > 0) {
    renderResults();
  }
  setTimeout(() => input.focus(), 50);
}

export function closeSearch() {
  if (modal) modal.style.display = "none";
}

export function updateSearchIndex(elements) {
  indexedChunks = buildChunks(elements);

  if (isModelLoaded) {
    const workerUrl = new URL("./embeddings-worker.js", import.meta.url).href;
    const worker = getWorker("embeddings", workerUrl);
    postTask(worker, { type: "index", chunks: indexedChunks }).catch(() => {});
  }
}
