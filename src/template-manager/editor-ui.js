import { getTheme, saveUserTemplate } from "../themes/index.js";
import { getTemplate, generateTemplateId } from "./storage.js";
import { validateTemplate } from "./validation.js";
import {
  COLOR_PRESETS,
  FONT_PRESETS,
  getPresetList,
  MERMAID_PRESETS,
  getMermaidPresetConfig,
} from "./presets.js";
import { parseMarkdown, parseBodyToElements } from "../parser.js";
import { EXAMPLE_MD } from "../main.js";
import { renderPreview } from "../preview-renderer.js";
import { escapeHtml } from "../utils.js";

let modal = null;
let currentTemplate = null;
let currentTab = "general";
let onSaveCallback = null;
let previewDebounceTimer = null;

const TABS = [
  { id: "general", label: "General" },
  { id: "fonts", label: "Fonts" },
  { id: "colors", label: "Colors" },
  { id: "sizes", label: "Sizes" },
  { id: "spacing", label: "Spacing" },
  { id: "syntax", label: "Syntax" },
  { id: "titlepage", label: "Title Page" },
  { id: "headerfooter", label: "Header/Footer" },
  { id: "mermaid", label: "Mermaid" },
  { id: "json", label: "JSON" },
];

function createModal() {
  if (modal) return;

  modal = document.createElement("div");
  modal.id = "templateEditorModal";
  modal.className = "fixed inset-0 z-[110] flex flex-col bg-gray-900";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-800">
      <div class="flex items-center gap-3">
        <button id="teBack" class="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </button>
        <h2 id="teTitle" class="text-lg font-semibold text-white">Edit Template</h2>
      </div>
      <div class="flex items-center gap-2">
        <button id="teCancel" class="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors">
          Cancel
        </button>
        <button id="teSave" class="px-4 py-1.5 bg-gradient-to-r from-kyotu-orange-light to-kyotu-orange text-white text-sm font-medium rounded hover:shadow-lg hover:shadow-kyotu-orange/25 transition-all">
          Save Template
        </button>
      </div>
    </div>

    <div class="flex border-b border-gray-700 bg-gray-800/50 px-5 overflow-x-auto" id="teTabs">
    </div>

    <div class="flex-1 flex min-h-0">
      <div class="w-1/2 border-r border-gray-700 overflow-y-auto p-5" id="teForm">
      </div>
      <div class="w-1/2 bg-white overflow-y-auto" id="tePreview">
      </div>
    </div>
  `;

  const previewStyles = document.createElement("style");
  previewStyles.id = "tePreviewStyles";
  previewStyles.textContent = `
    #tePreview { font-family: Georgia, system-ui, serif; padding: 1.5rem; line-height: 1.6; }
    #tePreview .doc-title { font-weight: 700; }
    #tePreview .doc-subtitle { font-weight: 500; }
    #tePreview .doc-author { font-weight: 500; }
    #tePreview h1, #tePreview h2, #tePreview h3, #tePreview h4 { font-weight: 700; }
    #tePreview pre { overflow-x: auto; }
    #tePreview pre code.hljs { background: transparent !important; padding: 0; }
    #tePreview .checklist { list-style: none; padding-left: 0; }
    #tePreview a { text-decoration: none; }
  `;
  if (!document.getElementById("tePreviewStyles")) {
    document.head.appendChild(previewStyles);
  }

  document.body.appendChild(modal);

  modal.querySelector("#teBack").addEventListener("click", handleCancel);
  modal.querySelector("#teCancel").addEventListener("click", handleCancel);
  modal.querySelector("#teSave").addEventListener("click", handleSave);

  document.addEventListener("keydown", handleKeyDown);

  renderTabs();
}

function handleKeyDown(e) {
  if (!modal || modal.style.display === "none") return;

  if (e.key === "Escape") {
    handleCancel();
  } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    handleSave();
  }
}

function renderTabs() {
  const tabsContainer = modal.querySelector("#teTabs");
  tabsContainer.innerHTML = TABS.map(
    (tab) => `
    <button data-tab="${tab.id}" class="te-tab px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
      tab.id === currentTab
        ? "text-kyotu-orange border-b-2 border-kyotu-orange"
        : "text-gray-400 hover:text-white"
    }">
      ${tab.label}
    </button>
  `
  ).join("");

  tabsContainer.querySelectorAll(".te-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      renderTabs();
      renderForm();
    });
  });
}

function renderForm() {
  const form = modal.querySelector("#teForm");

  switch (currentTab) {
    case "general":
      form.innerHTML = renderGeneralTab();
      setupGeneralHandlers();
      break;
    case "fonts":
      form.innerHTML = renderFontsTab();
      setupFontsHandlers();
      break;
    case "colors":
      form.innerHTML = renderColorsTab();
      setupColorsHandlers();
      break;
    case "sizes":
      form.innerHTML = renderSizesTab();
      setupSizesHandlers();
      break;
    case "spacing":
      form.innerHTML = renderSpacingTab();
      setupSpacingHandlers();
      break;
    case "syntax":
      form.innerHTML = renderSyntaxTab();
      setupSyntaxHandlers();
      break;
    case "titlepage":
      form.innerHTML = renderTitlePageTab();
      setupTitlePageHandlers();
      break;
    case "headerfooter":
      form.innerHTML = renderHeaderFooterTab();
      setupHeaderFooterHandlers();
      break;
    case "mermaid":
      form.innerHTML = renderMermaidTab();
      setupMermaidHandlers();
      break;
    case "json":
      form.innerHTML = renderJsonTab();
      setupJsonHandlers();
      break;
  }
}

function renderGeneralTab() {
  const t = currentTemplate;
  return `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
        <input type="text" id="teName" value="${escapeHtml(t.name)}"
               class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Logo</label>
        <div class="flex items-center gap-3">
          ${
            t.logo?.dataUrl
              ? `<img src="${t.logo.dataUrl}" alt="Logo" class="h-10 bg-gray-800 rounded p-1">`
              : '<div class="h-10 w-20 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs">No logo</div>'
          }
          <label class="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 cursor-pointer transition-colors">
            <input type="file" id="teLogo" accept="image/*" class="hidden">
            ${t.logo?.dataUrl ? "Change" : "Upload"}
          </label>
          ${
            t.logo?.dataUrl
              ? '<button id="teRemoveLogo" class="px-3 py-1.5 bg-gray-800 text-red-400 text-sm rounded hover:bg-gray-700 transition-colors">Remove</button>'
              : ""
          }
        </div>
        ${t.logo?.filename ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(t.logo.filename)}</p>` : ""}
      </div>

      ${
        t.basedOn
          ? `
        <div class="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <p class="text-xs text-gray-500">Based on: <span class="text-gray-400">${escapeHtml(t.basedOn)}</span></p>
          <p class="text-xs text-gray-600 mt-1">Created: ${new Date(t.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function setupGeneralHandlers() {
  const nameInput = modal.querySelector("#teName");
  nameInput?.addEventListener("input", () => {
    currentTemplate.name = nameInput.value;
  });

  const logoInput = modal.querySelector("#teLogo");
  logoInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentTemplate.logo = {
          dataUrl: ev.target.result,
          filename: file.name,
        };
        renderForm();
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  const removeBtn = modal.querySelector("#teRemoveLogo");
  removeBtn?.addEventListener("click", () => {
    delete currentTemplate.logo;
    renderForm();
    updatePreview();
  });
}

function renderFontsTab() {
  const fonts = currentTemplate.fonts;
  return `
    <div class="space-y-6">
      ${renderFontSelect("Heading Font", "heading", fonts.heading)}
      ${renderFontSelect("Body Font", "body", fonts.body)}
      ${renderFontSelect("Monospace Font", "mono", fonts.mono)}
    </div>
  `;
}

function renderFontSelect(label, key, value) {
  const options = FONT_PRESETS[key] || FONT_PRESETS.body;
  return `
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">${label}</label>
      <select data-font="${key}" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange">
        ${options.map((f) => `<option value="${f}" ${f === value ? "selected" : ""} style="font-family: ${f}">${f}</option>`).join("")}
      </select>
      <p class="text-xs text-gray-500 mt-1.5" style="font-family: ${value}">Preview: The quick brown fox jumps over the lazy dog.</p>
    </div>
  `;
}

function setupFontsHandlers() {
  modal.querySelectorAll("[data-font]").forEach((select) => {
    select.addEventListener("change", () => {
      currentTemplate.fonts[select.dataset.font] = select.value;
      renderForm();
      updatePreview();
    });
  });
}

function renderColorsTab() {
  const colors = currentTemplate.colors;
  const presets = getPresetList();

  return `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Quick Presets</label>
        <div class="flex flex-wrap gap-2">
          ${presets
            .map(
              (p) => `
            <button data-preset="${p.id}" class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
              <div class="w-4 h-4 rounded" style="background: #${p.preview}"></div>
              <span class="text-xs text-gray-300">${p.name}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Document Colors</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderColorInput("Primary", "primary", colors.primary)}
          ${renderColorInput("Secondary", "secondary", colors.secondary)}
          ${renderColorInput("Accent", "accent", colors.accent)}
          ${renderColorInput("Muted", "muted", colors.muted)}
          ${renderColorInput("Text", "text", colors.text)}
          ${renderColorInput("Bold Text", "bold", colors.bold)}
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Table Colors</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderColorInput("Header BG", "tableHeader", colors.tableHeader)}
          ${renderColorInput("Border", "tableBorder", colors.tableBorder)}
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Code Block Colors</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderColorInput("Background", "codeBg", colors.codeBg)}
          ${renderColorInput("Border", "codeBorder", colors.codeBorder)}
        </div>
      </div>
    </div>
  `;
}

function renderColorInput(label, key, value) {
  return `
    <div class="flex items-center gap-3">
      <input type="color" data-color="${key}" value="#${value}"
             class="w-10 h-10 rounded cursor-pointer bg-transparent border-0">
      <div class="flex-1">
        <label class="block text-xs text-gray-400">${label}</label>
        <input type="text" data-color-text="${key}" value="${value}"
               class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs font-mono focus:outline-none focus:border-kyotu-orange mt-0.5"
               maxlength="6" pattern="[0-9a-fA-F]{6}">
      </div>
    </div>
  `;
}

function setupColorsHandlers() {
  modal.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = COLOR_PRESETS[btn.dataset.preset];
      if (preset) {
        currentTemplate.colors = { ...preset.colors };
        renderForm();
        updatePreview();
      }
    });
  });

  modal.querySelectorAll("[data-color]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.color;
      const value = input.value.replace("#", "");
      currentTemplate.colors[key] = value;
      const textInput = modal.querySelector(`[data-color-text="${key}"]`);
      if (textInput) textInput.value = value;
      updatePreview();
    });
  });

  modal.querySelectorAll("[data-color-text]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.colorText;
      const value = input.value.replace("#", "");
      if (/^[0-9a-fA-F]{6}$/.test(value)) {
        currentTemplate.colors[key] = value;
        const colorInput = modal.querySelector(`[data-color="${key}"]`);
        if (colorInput) colorInput.value = `#${value}`;
        updatePreview();
      }
    });
  });
}

function renderSizesTab() {
  const sizes = currentTemplate.sizes;
  return `
    <div class="space-y-6">
      <div>
        <h4 class="text-sm font-medium text-gray-400 mb-4">Title & Subtitle</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderSizeInput("Title", "title", sizes.title, 20, 100)}
          ${renderSizeInput("Subtitle", "subtitle", sizes.subtitle, 14, 50)}
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Headings (half-points)</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderSizeInput("H1", "h1", sizes.h1, 20, 80)}
          ${renderSizeInput("H2", "h2", sizes.h2, 18, 60)}
          ${renderSizeInput("H3", "h3", sizes.h3, 16, 50)}
          ${renderSizeInput("H4", "h4", sizes.h4, 14, 40)}
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Body Text</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderSizeInput("Body", "body", sizes.body, 16, 40)}
          ${renderSizeInput("Table", "table", sizes.table, 14, 36)}
          ${renderSizeInput("Small", "small", sizes.small, 12, 30)}
          ${renderSizeInput("Mono", "mono", sizes.mono, 12, 30)}
        </div>
      </div>
    </div>
  `;
}

function renderSizeInput(label, key, value, min, max) {
  const ptValue = (value / 2).toFixed(1);
  return `
    <div>
      <label class="block text-xs text-gray-400 mb-1">${label} (${ptValue}pt)</label>
      <div class="flex items-center gap-2">
        <input type="range" data-size="${key}" value="${value}" min="${min}" max="${max}"
               class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-kyotu-orange">
        <input type="number" data-size-num="${key}" value="${value}" min="${min}" max="${max}"
               class="w-14 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs text-center focus:outline-none focus:border-kyotu-orange">
      </div>
    </div>
  `;
}

function setupSizesHandlers() {
  modal.querySelectorAll("[data-size]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.size;
      const value = parseInt(input.value);
      currentTemplate.sizes[key] = value;
      const numInput = modal.querySelector(`[data-size-num="${key}"]`);
      if (numInput) numInput.value = value;
      renderForm();
      updatePreview();
    });
  });

  modal.querySelectorAll("[data-size-num]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.sizeNum;
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        currentTemplate.sizes[key] = value;
        const rangeInput = modal.querySelector(`[data-size="${key}"]`);
        if (rangeInput) rangeInput.value = value;
        renderForm();
        updatePreview();
      }
    });
  });
}

function renderSpacingTab() {
  const spacing = currentTemplate.spacing;
  return `
    <div class="space-y-6">
      <div>
        <h4 class="text-sm font-medium text-gray-400 mb-4">Page Margins (twips)</h4>
        <div class="grid grid-cols-2 gap-4">
          ${renderSpacingInput("Horizontal", "marginPage", spacing.marginPage, 720, 2880)}
          ${renderSpacingInput("Top", "marginPageTop", spacing.marginPageTop, 360, 2160)}
        </div>
        <p class="text-xs text-gray-600 mt-2">1 inch = 1440 twips, 1 cm = ~567 twips</p>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Paragraph Spacing</h4>
        ${renderSpacingInput("After Paragraph", "paraAfter", spacing.paraAfter, 0, 500)}
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-400 mb-4">Heading Spacing</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            ${renderSpacingInput("H1 Before", "h1Before", spacing.h1Before, 0, 800)}
            ${renderSpacingInput("H1 After", "h1After", spacing.h1After, 0, 400)}
          </div>
          <div class="grid grid-cols-2 gap-4">
            ${renderSpacingInput("H2 Before", "h2Before", spacing.h2Before, 0, 600)}
            ${renderSpacingInput("H2 After", "h2After", spacing.h2After, 0, 300)}
          </div>
          <div class="grid grid-cols-2 gap-4">
            ${renderSpacingInput("H3 Before", "h3Before", spacing.h3Before, 0, 500)}
            ${renderSpacingInput("H3 After", "h3After", spacing.h3After, 0, 250)}
          </div>
          <div class="grid grid-cols-2 gap-4">
            ${renderSpacingInput("H4 Before", "h4Before", spacing.h4Before, 0, 400)}
            ${renderSpacingInput("H4 After", "h4After", spacing.h4After, 0, 200)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSpacingInput(label, key, value, min, max) {
  return `
    <div>
      <label class="block text-xs text-gray-400 mb-1">${label}</label>
      <div class="flex items-center gap-2">
        <input type="range" data-spacing="${key}" value="${value}" min="${min}" max="${max}"
               class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-kyotu-orange">
        <input type="number" data-spacing-num="${key}" value="${value}" min="${min}" max="${max}"
               class="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs text-center focus:outline-none focus:border-kyotu-orange">
      </div>
    </div>
  `;
}

function setupSpacingHandlers() {
  modal.querySelectorAll("[data-spacing]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.spacing;
      const value = parseInt(input.value);
      currentTemplate.spacing[key] = value;
      const numInput = modal.querySelector(`[data-spacing-num="${key}"]`);
      if (numInput) numInput.value = value;
      updatePreview();
    });
  });

  modal.querySelectorAll("[data-spacing-num]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.spacingNum;
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        currentTemplate.spacing[key] = value;
        const rangeInput = modal.querySelector(`[data-spacing="${key}"]`);
        if (rangeInput) rangeInput.value = value;
        updatePreview();
      }
    });
  });
}

function renderSyntaxTab() {
  const syntax = currentTemplate.syntax;
  const tokens = [
    { key: "keyword", label: "Keywords (if, const, return)" },
    { key: "string", label: "Strings" },
    { key: "comment", label: "Comments" },
    { key: "number", label: "Numbers" },
    { key: "function", label: "Functions" },
    { key: "variable", label: "Variables" },
    { key: "operator", label: "Operators" },
    { key: "punctuation", label: "Punctuation" },
    { key: "className", label: "Class Names" },
    { key: "property", label: "Properties" },
    { key: "tag", label: "HTML/XML Tags" },
    { key: "attribute", label: "Attributes" },
    { key: "default", label: "Default" },
  ];

  return `
    <div class="space-y-4">
      <p class="text-xs text-gray-500 mb-4">Syntax highlighting colors for code blocks</p>
      <div class="grid grid-cols-2 gap-3">
        ${tokens.map((t) => renderSyntaxColorInput(t.label, t.key, syntax[t.key])).join("")}
      </div>
    </div>
  `;
}

function renderSyntaxColorInput(label, key, value) {
  return `
    <div class="flex items-center gap-2">
      <input type="color" data-syntax="${key}" value="#${value}"
             class="w-8 h-8 rounded cursor-pointer bg-transparent border-0">
      <div class="flex-1 min-w-0">
        <label class="block text-xs text-gray-400 truncate">${label}</label>
        <code class="text-xs font-mono" style="color: #${value}">sample</code>
      </div>
    </div>
  `;
}

function setupSyntaxHandlers() {
  modal.querySelectorAll("[data-syntax]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.syntax;
      currentTemplate.syntax[key] = input.value.replace("#", "");
      renderForm();
      updatePreview();
    });
  });
}

function renderTitlePageTab() {
  const tp = currentTemplate.titlePage;
  return `
    <div class="space-y-6">
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <div data-toggle="showLogo" class="toggle-switch ${tp.showLogo ? "active" : ""}"></div>
          <span class="text-sm text-gray-300">Show Logo on Title Page</span>
        </label>
      </div>

      ${
        tp.showLogo
          ? `
        <div class="pl-6 border-l-2 border-gray-700">
          <label class="block text-sm font-medium text-gray-400 mb-2">Logo Size</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Width</label>
              <input type="number" data-tp="logoWidth" value="${tp.logoSize?.width || 180}" min="50" max="500"
                     class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Height</label>
              <input type="number" data-tp="logoHeight" value="${tp.logoSize?.height || 76}" min="20" max="300"
                     class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
            </div>
          </div>
        </div>
      `
          : ""
      }

      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <div data-toggle="showLine" class="toggle-switch ${tp.showLine ? "active" : ""}"></div>
          <span class="text-sm text-gray-300">Show Line Under Title</span>
        </label>
      </div>

      ${
        tp.showLine && tp.lineChar !== undefined
          ? `
        <div class="pl-6 border-l-2 border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Line Character</label>
            <input type="text" data-tp="lineChar" value="${tp.lineChar || "─"}" maxlength="1"
                   class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Line Length</label>
            <input type="number" data-tp="lineLength" value="${tp.lineLength || 40}" min="10" max="100"
                   class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
          </div>
        </div>
      `
          : ""
      }

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Vertical Spacing</label>
        <div class="flex items-center gap-3">
          <input type="range" data-tp="verticalSpacing" value="${tp.verticalSpacing}" min="0" max="15"
                 class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-kyotu-orange">
          <span class="text-sm text-gray-400 w-8 text-center">${tp.verticalSpacing}</span>
        </div>
        <p class="text-xs text-gray-600 mt-1">Number of empty lines before title</p>
      </div>
    </div>
  `;
}

function setupTitlePageHandlers() {
  modal.querySelectorAll("[data-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.dataset.toggle;
      currentTemplate.titlePage[key] = !currentTemplate.titlePage[key];
      renderForm();
      updatePreview();
    });
  });

  modal.querySelectorAll("[data-tp]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.tp;
      if (key === "logoWidth") {
        currentTemplate.titlePage.logoSize = currentTemplate.titlePage.logoSize || {};
        currentTemplate.titlePage.logoSize.width = parseInt(input.value);
      } else if (key === "logoHeight") {
        currentTemplate.titlePage.logoSize = currentTemplate.titlePage.logoSize || {};
        currentTemplate.titlePage.logoSize.height = parseInt(input.value);
      } else if (key === "verticalSpacing") {
        currentTemplate.titlePage.verticalSpacing = parseInt(input.value);
        const span = input.nextElementSibling;
        if (span) span.textContent = input.value;
      } else if (key === "lineChar") {
        currentTemplate.titlePage.lineChar = input.value;
      } else if (key === "lineLength") {
        currentTemplate.titlePage.lineLength = parseInt(input.value);
      }
      updatePreview();
    });
  });
}

function renderHeaderFooterTab() {
  const header = currentTemplate.header;
  const footer = currentTemplate.footer;

  return `
    <div class="space-y-8">
      <div>
        <h4 class="text-sm font-semibold text-white mb-4">Header</h4>
        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <div data-toggle-hf="header.showLogo" class="toggle-switch ${header.showLogo ? "active" : ""}"></div>
            <span class="text-sm text-gray-300">Show Logo in Header</span>
          </label>

          ${
            header.showLogo
              ? `
            <div class="pl-6 border-l-2 border-gray-700 space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Position</label>
                <select data-hf="header.logoPosition" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
                  <option value="left" ${header.logoPosition === "left" ? "selected" : ""}>Left</option>
                  <option value="right" ${header.logoPosition === "right" ? "selected" : ""}>Right</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Width</label>
                  <input type="number" data-hf="header.logoSize.width" value="${header.logoSize?.width || 70}" min="20" max="200"
                         class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Height</label>
                  <input type="number" data-hf="header.logoSize.height" value="${header.logoSize?.height || 30}" min="10" max="100"
                         class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange">
                </div>
              </div>
            </div>
          `
              : ""
          }

          <label class="flex items-center gap-3 cursor-pointer">
            <div data-toggle-hf="header.showTitle" class="toggle-switch ${header.showTitle ? "active" : ""}"></div>
            <span class="text-sm text-gray-300">Show Document Title in Header</span>
          </label>
        </div>
      </div>

      <div class="border-t border-gray-700 pt-6">
        <h4 class="text-sm font-semibold text-white mb-4">Footer</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Left Text</label>
            <input type="text" data-hf="footer.left" value="${escapeHtml(footer.left)}"
                   class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange"
                   placeholder="e.g., Company Name">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Center Text</label>
            <input type="text" data-hf="footer.center" value="${escapeHtml(footer.center)}"
                   class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-kyotu-orange"
                   placeholder="e.g., Confidential">
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <div data-toggle-hf="footer.showPageNumber" class="toggle-switch ${footer.showPageNumber ? "active" : ""}"></div>
            <span class="text-sm text-gray-300">Show Page Number</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function setupHeaderFooterHandlers() {
  modal.querySelectorAll("[data-toggle-hf]").forEach((el) => {
    el.addEventListener("click", () => {
      const path = el.dataset.toggleHf.split(".");
      if (path[0] === "header") {
        currentTemplate.header[path[1]] = !currentTemplate.header[path[1]];
      } else if (path[0] === "footer") {
        currentTemplate.footer[path[1]] = !currentTemplate.footer[path[1]];
      }
      renderForm();
      updatePreview();
    });
  });

  modal.querySelectorAll("[data-hf]").forEach((input) => {
    input.addEventListener("input", () => {
      const path = input.dataset.hf.split(".");
      if (path[0] === "header") {
        if (path[1] === "logoSize") {
          currentTemplate.header.logoSize = currentTemplate.header.logoSize || {};
          currentTemplate.header.logoSize[path[2]] = parseInt(input.value);
        } else {
          currentTemplate.header[path[1]] = input.value;
        }
      } else if (path[0] === "footer") {
        currentTemplate.footer[path[1]] = input.value;
      }
      updatePreview();
    });
  });
}

function renderMermaidTab() {
  const m = currentTemplate.mermaid || { config: "" };
  return `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Preset</label>
        <select id="teMermaidPreset" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange">
          <option value="">-- Custom --</option>
          ${MERMAID_PRESETS.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">YAML Configuration</label>
        <textarea id="teMermaidConfig"
                  class="w-full h-80 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono resize-none focus:outline-none focus:border-kyotu-orange leading-relaxed"
                  spellcheck="false"
                  placeholder="---\nconfig:\n  theme: base\n  ...">${escapeHtml(m.config || "")}</textarea>
        <div id="teMermaidError" class="mt-1 text-xs text-red-400 hidden"></div>
        <p class="mt-2 text-xs text-gray-500">Preview is shown in the right panel with actual document content.</p>
      </div>
    </div>
  `;
}

function setupMermaidHandlers() {
  const presetSelect = modal.querySelector("#teMermaidPreset");
  const configTextarea = modal.querySelector("#teMermaidConfig");
  const errorEl = modal.querySelector("#teMermaidError");

  let debounceTimer = null;

  function validateAndUpdate() {
    const config = configTextarea.value.trim();

    if (config) {
      try {
        jsyaml.load(config.replace(/^---\n?/, "").replace(/\n?---$/, ""));
        errorEl.classList.add("hidden");
      } catch (e) {
        errorEl.textContent = `YAML Error: ${e.message}`;
        errorEl.classList.remove("hidden");
      }
    } else {
      errorEl.classList.add("hidden");
    }

    if (!currentTemplate.mermaid) {
      currentTemplate.mermaid = { config: "" };
    }
    currentTemplate.mermaid.config = config;

    updatePreview();
  }

  presetSelect?.addEventListener("change", () => {
    const presetId = presetSelect.value;
    if (presetId) {
      const config = getMermaidPresetConfig(presetId);
      configTextarea.value = config;
      validateAndUpdate();
    }
  });

  configTextarea?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(validateAndUpdate, 300);
  });
}

function renderJsonTab() {
  const templateForJson = { ...currentTemplate };
  delete templateForJson.id;
  delete templateForJson.createdAt;
  delete templateForJson.updatedAt;
  const jsonStr = JSON.stringify(templateForJson, null, 2);
  return `
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-gray-500">Edit template as JSON. Changes apply on blur or Ctrl+Enter.</p>
        <button id="teJsonFormat" class="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
          Format JSON
        </button>
      </div>
      <textarea id="teJsonEditor"
                class="flex-1 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono resize-none focus:outline-none focus:border-kyotu-orange leading-relaxed"
                spellcheck="false">${escapeHtml(jsonStr)}</textarea>
      <div id="teJsonError" class="mt-2 text-xs text-red-400 hidden"></div>
    </div>
  `;
}

function setupJsonHandlers() {
  const textarea = modal.querySelector("#teJsonEditor");
  const errorEl = modal.querySelector("#teJsonError");
  const formatBtn = modal.querySelector("#teJsonFormat");

  function applyJson() {
    try {
      const parsed = JSON.parse(textarea.value);
      parsed.id = currentTemplate.id;
      parsed.createdAt = currentTemplate.createdAt;
      parsed.updatedAt = Date.now();
      currentTemplate = parsed;
      errorEl.classList.add("hidden");
      updatePreview();
    } catch (e) {
      errorEl.textContent = `JSON Error: ${e.message}`;
      errorEl.classList.remove("hidden");
    }
  }

  textarea?.addEventListener("blur", applyJson);

  textarea?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      applyJson();
    }
  });

  formatBtn?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(parsed, null, 2);
      errorEl.classList.add("hidden");
    } catch (e) {
      errorEl.textContent = `JSON Error: ${e.message}`;
      errorEl.classList.remove("hidden");
    }
  });
}

function updatePreview() {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(async () => {
    const previewEl = modal.querySelector("#tePreview");
    if (!previewEl) return;

    const { metadata, body } = parseMarkdown(EXAMPLE_MD);
    const elements = parseBodyToElements(body);
    const tempTheme = {
      ...currentTemplate,
      id: "preview-temp",
    };

    await renderPreview(previewEl, elements, metadata, tempTheme);
  }, 150);
}

async function handleSave() {
  if (!currentTemplate.name?.trim()) {
    alert("Please enter a template name");
    return;
  }

  const validation = validateTemplate(currentTemplate);
  if (!validation.valid) {
    alert(`Validation errors:\n${validation.errors.slice(0, 5).join("\n")}`);
    return;
  }

  try {
    await saveUserTemplate(currentTemplate);
    closeTemplateEditor();
    if (onSaveCallback) {
      onSaveCallback(currentTemplate);
    }
  } catch (err) {
    alert(`Failed to save: ${err.message}`);
  }
}

function handleCancel() {
  if (confirm("Discard unsaved changes?")) {
    closeTemplateEditor();
    if (onSaveCallback) {
      onSaveCallback(null);
    }
  }
}

function createDefaultTemplate(basedOn = "kyotu") {
  const base = getTheme(basedOn);
  return {
    id: generateTemplateId(),
    name: "New Template",
    basedOn,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fonts: { ...base.fonts },
    colors: { ...base.colors },
    sizes: { ...base.sizes },
    spacing: { ...base.spacing },
    syntax: { ...base.syntax },
    titlePage: JSON.parse(JSON.stringify(base.titlePage)),
    header: JSON.parse(JSON.stringify(base.header)),
    footer: { ...base.footer },
    mermaid: base.mermaid ? { ...base.mermaid } : { config: "" },
  };
}

export async function openTemplateEditor(templateId, saveCallback) {
  createModal();
  onSaveCallback = saveCallback;
  currentTab = "general";

  if (templateId) {
    const existing = await getTemplate(templateId);
    if (existing) {
      currentTemplate = JSON.parse(JSON.stringify(existing));
      modal.querySelector("#teTitle").textContent = `Edit: ${currentTemplate.name}`;
    } else {
      currentTemplate = createDefaultTemplate();
      modal.querySelector("#teTitle").textContent = "New Template";
    }
  } else {
    currentTemplate = createDefaultTemplate();
    modal.querySelector("#teTitle").textContent = "New Template";
  }

  modal.style.display = "";
  renderTabs();
  renderForm();
  updatePreview();
}

export function closeTemplateEditor() {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = null;
  if (modal) {
    modal.style.display = "none";
  }
  currentTemplate = null;
}
