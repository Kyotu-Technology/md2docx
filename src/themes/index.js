import { kyotu } from "./kyotu.js";
import { minimal } from "./minimal.js";
import {
  getAllTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
} from "../template-manager/storage.js";

export const themes = {
  kyotu,
  minimal,
};

export const defaultTheme = "kyotu";

const THEME_DEFAULTS = {
  colors: {
    bold: "1f2937",
  },
  titlePage: {
    logoSize: { width: 180, height: 76 },
  },
  header: {
    logoSize: { width: 70, height: 30 },
    logoPosition: "left",
  },
};

function deepMergeDefaults(target, defaults) {
  const result = { ...target };
  for (const key of Object.keys(defaults)) {
    if (result[key] === undefined) {
      result[key] = defaults[key];
    } else if (
      typeof defaults[key] === "object" &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMergeDefaults(result[key], defaults[key]);
    }
  }
  return result;
}

export function getTheme(id) {
  const theme = themes[id] || themes[defaultTheme];
  return deepMergeDefaults(theme, THEME_DEFAULTS);
}

export function getThemeList() {
  return Object.values(themes).map((t) => ({ id: t.id, name: t.name }));
}

export async function getUserTemplates() {
  try {
    return await getAllTemplates();
  } catch {
    return [];
  }
}

export async function saveUserTemplate(template) {
  return saveTemplate(template);
}

export async function deleteUserTemplate(id) {
  return deleteTemplate(id);
}

export async function getFullThemeList() {
  const builtinList = Object.values(themes).map((t) => ({
    id: t.id,
    name: t.name,
    isBuiltin: true,
  }));

  try {
    const userTemplates = await getAllTemplates();
    const userList = userTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      isBuiltin: false,
      basedOn: t.basedOn,
      updatedAt: t.updatedAt,
    }));
    return [...builtinList, ...userList];
  } catch {
    return builtinList;
  }
}

export async function getThemeOrTemplate(id) {
  if (themes[id]) {
    return deepMergeDefaults(themes[id], THEME_DEFAULTS);
  }

  if (id && id.startsWith("user-")) {
    try {
      const template = await getTemplate(id);
      if (template) {
        return deepMergeDefaults(template, THEME_DEFAULTS);
      }
      console.warn(`Template "${id}" not found in IndexedDB, falling back to default theme`);
    } catch (err) {
      console.warn(
        `Failed to load template "${id}": ${err.message}, falling back to default theme`
      );
    }
  }

  return deepMergeDefaults(themes[defaultTheme], THEME_DEFAULTS);
}
