import { kyotu } from "./kyotu.js";
import { minimal } from "./minimal.js";

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
