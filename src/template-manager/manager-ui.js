import {
  getThemeList,
  getUserTemplates,
  deleteUserTemplate,
  getFullThemeList,
} from "../themes/index.js";
import { openTemplateEditor } from "./editor-ui.js";
import {
  validateImportFormat,
  validateTemplate,
  createExportData,
  createExportAllData,
} from "./validation.js";
import { saveTemplate, generateTemplateId } from "./storage.js";
import { getTheme } from "../themes/index.js";
import { extractStylesFromDocx } from "./docx-extractor.js";
import { escapeHtml } from "../utils.js";

let modal = null;
let onThemeChange = null;

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function createModal() {
  if (modal) return;

  modal = document.createElement("div");
  modal.id = "templateManagerModal";
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/60" id="tmBackdrop"></div>
    <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-700">
        <h2 class="text-lg font-semibold text-white">Template Manager</h2>
        <button id="tmClose" class="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
        <button id="tmNewTemplate" class="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-kyotu-orange-light to-kyotu-orange text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-kyotu-orange/25 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Template
        </button>
        <label class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Import JSON
          <input type="file" id="tmImportInput" accept=".json" class="hidden">
        </label>
        <label class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          From DOCX
          <input type="file" id="tmImportDocx" accept=".docx" class="hidden">
        </label>
      </div>

      <div id="tmContent" class="flex-1 overflow-y-auto px-5 py-4">
      </div>

      <div class="flex items-center justify-between px-5 py-3 border-t border-gray-700 bg-gray-800/50">
        <button id="tmExportAll" class="text-xs text-gray-400 hover:text-white transition-colors">
          Export All Templates
        </button>
        <button id="tmCloseBottom" class="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#tmBackdrop").addEventListener("click", closeTemplateManager);
  modal.querySelector("#tmClose").addEventListener("click", closeTemplateManager);
  modal.querySelector("#tmCloseBottom").addEventListener("click", closeTemplateManager);
  modal.querySelector("#tmNewTemplate").addEventListener("click", handleNewTemplate);
  modal.querySelector("#tmImportInput").addEventListener("change", handleImport);
  modal.querySelector("#tmImportDocx").addEventListener("change", handleImportDocx);
  modal.querySelector("#tmExportAll").addEventListener("click", handleExportAll);

  document.addEventListener("keydown", handleKeyDown);
}

function handleKeyDown(e) {
  if (e.key === "Escape" && modal && modal.style.display !== "none") {
    closeTemplateManager();
  }
}

async function renderTemplateList() {
  const content = modal.querySelector("#tmContent");
  const builtinThemes = getThemeList();
  const userTemplates = await getUserTemplates();

  let html = `
    <div class="mb-6">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Built-in Templates</h3>
      <div class="space-y-2">
  `;

  for (const theme of builtinThemes) {
    const themeData = getTheme(theme.id);
    const primaryColor = themeData.colors.primary;
    html += `
      <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #${primaryColor}20; border: 1px solid #${primaryColor}">
            <div class="w-3 h-3 rounded" style="background: #${primaryColor}"></div>
          </div>
          <div>
            <div class="text-sm font-medium text-white">${escapeHtml(theme.name)}</div>
            <div class="text-xs text-gray-500">Built-in template</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button data-action="use" data-id="${theme.id}" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
            Use
          </button>
          <button data-action="duplicate" data-id="${theme.id}" data-builtin="true" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
            Duplicate
          </button>
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  if (userTemplates.length > 0) {
    html += `
      <div>
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Templates</h3>
        <div class="space-y-2">
    `;

    for (const template of userTemplates) {
      const primaryColor = template.colors?.primary || "6b7280";
      const basedOnName = template.basedOn
        ? builtinThemes.find((t) => t.id === template.basedOn)?.name || template.basedOn
        : "";
      html += `
        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #${primaryColor}20; border: 1px solid #${primaryColor}">
              <div class="w-3 h-3 rounded" style="background: #${primaryColor}"></div>
            </div>
            <div>
              <div class="text-sm font-medium text-white">${escapeHtml(template.name)}</div>
              <div class="text-xs text-gray-500">
                ${basedOnName ? `Based on: ${escapeHtml(basedOnName)}` : "Custom template"}
                <span class="text-gray-600 mx-1">·</span>
                ${formatTimeAgo(template.updatedAt)}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button data-action="use" data-id="${template.id}" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Use
            </button>
            <button data-action="edit" data-id="${template.id}" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Edit
            </button>
            <button data-action="duplicate" data-id="${template.id}" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Duplicate
            </button>
            <button data-action="export" data-id="${template.id}" class="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Export
            </button>
            <button data-action="delete" data-id="${template.id}" data-name="${escapeHtml(template.name)}" class="px-2.5 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-900 transition-colors">
              Delete
            </button>
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <p class="text-gray-500 text-sm">No custom templates yet</p>
        <p class="text-gray-600 text-xs mt-1">Create one or duplicate a built-in template</p>
      </div>
    `;
  }

  content.innerHTML = html;

  content.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", handleTemplateAction);
  });
}

async function handleTemplateAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    case "use":
      selectTemplate(id);
      break;
    case "edit":
      await editTemplate(id);
      break;
    case "duplicate":
      await duplicateTemplate(id, btn.dataset.builtin === "true");
      break;
    case "export":
      await exportTemplate(id);
      break;
    case "delete":
      await deleteTemplateWithConfirm(id, btn.dataset.name);
      break;
  }
}

function selectTemplate(id) {
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.value = id;
    themeSelect.dispatchEvent(new Event("change"));
  }
  if (onThemeChange) {
    onThemeChange(id);
  }
  closeTemplateManager();
}

async function editTemplate(id) {
  closeTemplateManager();
  await openTemplateEditor(id, async () => {
    await refreshThemeSelect();
    openTemplateManager(onThemeChange);
  });
}

async function duplicateTemplate(id, isBuiltin) {
  const baseTheme = isBuiltin ? getTheme(id) : (await getUserTemplates()).find((t) => t.id === id);
  if (!baseTheme) return;

  const newTemplate = {
    ...JSON.parse(JSON.stringify(baseTheme)),
    id: generateTemplateId(),
    name: `Copy of ${baseTheme.name}`,
    basedOn: isBuiltin ? id : baseTheme.basedOn || id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveTemplate(newTemplate);
  await renderTemplateList();
  await refreshThemeSelect();
}

async function exportTemplate(id) {
  const templates = await getUserTemplates();
  const template = templates.find((t) => t.id === id);
  if (!template) return;

  const data = createExportData(template);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${template.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function deleteTemplateWithConfirm(id, name) {
  if (!confirm(`Delete template "${name}"? This action cannot be undone.`)) return;

  await deleteUserTemplate(id);
  await renderTemplateList();
  await refreshThemeSelect();

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect && themeSelect.value === id) {
    themeSelect.value = "kyotu";
    themeSelect.dispatchEvent(new Event("change"));
  }
}

async function handleNewTemplate() {
  closeTemplateManager();
  await openTemplateEditor(null, async () => {
    await refreshThemeSelect();
    openTemplateManager(onThemeChange);
  });
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const formatResult = validateImportFormat(data);
    if (!formatResult.valid) {
      alert(`Import failed: ${formatResult.errors.join(", ")}`);
      return;
    }

    let imported = 0;
    for (const template of formatResult.templates) {
      const validation = validateTemplate(template);
      if (validation.valid) {
        const newTemplate = {
          ...template,
          id: generateTemplateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveTemplate(newTemplate);
        imported++;
      }
    }

    if (imported > 0) {
      await renderTemplateList();
      await refreshThemeSelect();
      alert(`Successfully imported ${imported} template(s)`);
    } else {
      alert("No valid templates found in the file");
    }
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }

  e.target.value = "";
}

async function handleImportDocx(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const content = modal.querySelector("#tmContent");
    content.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg class="w-8 h-8 mx-auto mb-3 text-kyotu-orange animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-400">Extracting styles from ${escapeHtml(file.name)}...</p>
        </div>
      </div>
    `;

    const result = await extractStylesFromDocx(file);

    if (result.extracted.length === 0) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-900/30 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-gray-400">Could not extract any styles from this document.</p>
          <button id="tmBackToList" class="mt-4 px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors">
            Back to Templates
          </button>
        </div>
      `;
      content.querySelector("#tmBackToList")?.addEventListener("click", renderTemplateList);
      return;
    }

    const baseTheme = getTheme("kyotu");
    const fileName = file.name.replace(/\.docx$/i, "");

    let html = `
      <div class="space-y-6">
        <div class="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-400 mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="font-medium">Extracted: ${escapeHtml(result.extracted.join(", "))}</span>
          </div>
          <p class="text-sm text-gray-400">Review the extracted values below and create a new template.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
          <input type="text" id="tmDocxTemplateName" value="${escapeHtml(fileName)}"
                 class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-kyotu-orange">
        </div>
    `;

    if (Object.keys(result.fonts).length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Fonts</h4>
          <div class="grid grid-cols-3 gap-3">
            ${Object.entries(result.fonts)
              .map(
                ([key, value]) => `
              <div class="bg-gray-800/50 rounded-lg p-3">
                <div class="text-xs text-gray-500 mb-1">${escapeHtml(key)}</div>
                <div class="text-sm text-white font-medium">${escapeHtml(value)}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (Object.keys(result.colors).length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Colors</h4>
          <div class="grid grid-cols-4 gap-3">
            ${Object.entries(result.colors)
              .map(
                ([key, value]) => `
              <div class="bg-gray-800/50 rounded-lg p-3 flex items-center gap-2">
                <div class="w-6 h-6 rounded border border-gray-600" style="background: #${escapeHtml(value)}"></div>
                <div>
                  <div class="text-xs text-gray-500">${escapeHtml(key)}</div>
                  <div class="text-xs text-white font-mono">#${escapeHtml(value)}</div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (Object.keys(result.sizes).length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Font Sizes (half-points)</h4>
          <div class="grid grid-cols-4 gap-3">
            ${Object.entries(result.sizes)
              .map(
                ([key, value]) => `
              <div class="bg-gray-800/50 rounded-lg p-3">
                <div class="text-xs text-gray-500">${escapeHtml(key)}</div>
                <div class="text-sm text-white">${value} (${value / 2}pt)</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (Object.keys(result.spacing).length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Spacing (twips)</h4>
          <div class="grid grid-cols-4 gap-3">
            ${Object.entries(result.spacing)
              .map(
                ([key, value]) => `
              <div class="bg-gray-800/50 rounded-lg p-3">
                <div class="text-xs text-gray-500">${escapeHtml(key)}</div>
                <div class="text-sm text-white">${value}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    html += `
        <div class="flex items-center gap-3 pt-4 border-t border-gray-700">
          <button id="tmDocxCreate" class="flex-1 px-4 py-2 bg-gradient-to-r from-kyotu-orange-light to-kyotu-orange text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-kyotu-orange/25 transition-all">
            Create Template
          </button>
          <button id="tmDocxCancel" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    content.innerHTML = html;

    content.querySelector("#tmDocxCancel")?.addEventListener("click", renderTemplateList);
    content.querySelector("#tmDocxCreate")?.addEventListener("click", async () => {
      const nameInput = content.querySelector("#tmDocxTemplateName");
      const name = nameInput?.value?.trim() || fileName;

      const newTemplate = {
        ...JSON.parse(JSON.stringify(baseTheme)),
        id: generateTemplateId(),
        name: name,
        basedOn: "kyotu",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fonts: { ...baseTheme.fonts, ...result.fonts },
        colors: { ...baseTheme.colors, ...result.colors },
        sizes: { ...baseTheme.sizes, ...result.sizes },
        spacing: { ...baseTheme.spacing, ...result.spacing },
      };

      await saveTemplate(newTemplate);
      await renderTemplateList();
      await refreshThemeSelect();
    });
  } catch (err) {
    alert(`Failed to extract styles: ${err.message}`);
    await renderTemplateList();
  }

  e.target.value = "";
}

async function handleExportAll() {
  const templates = await getUserTemplates();
  if (templates.length === 0) {
    alert("No templates to export");
    return;
  }

  const data = createExportAllData(templates);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `md2docx-templates-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function refreshThemeSelect() {
  const themeSelect = document.getElementById("themeSelect");
  if (!themeSelect) return;

  const currentValue = themeSelect.value;
  const allThemes = await getFullThemeList();

  themeSelect.innerHTML = "";

  const builtinGroup = document.createElement("optgroup");
  builtinGroup.label = "Built-in";

  const userGroup = document.createElement("optgroup");
  userGroup.label = "Your Templates";

  let hasUserTemplates = false;

  for (const theme of allThemes) {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;

    if (theme.isBuiltin) {
      builtinGroup.appendChild(option);
    } else {
      userGroup.appendChild(option);
      hasUserTemplates = true;
    }
  }

  themeSelect.appendChild(builtinGroup);
  if (hasUserTemplates) {
    themeSelect.appendChild(userGroup);
  }

  if (allThemes.some((t) => t.id === currentValue)) {
    themeSelect.value = currentValue;
  }
}

export async function openTemplateManager(themeChangeCallback) {
  createModal();
  onThemeChange = themeChangeCallback;
  modal.style.display = "";
  await renderTemplateList();
}

export function closeTemplateManager() {
  if (modal) {
    modal.style.display = "none";
  }
}
