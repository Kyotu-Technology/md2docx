import { generateHTMLPreview } from "./html-preview.js";
import { applyThemeToPreview } from "./preview-styles.js";

export async function renderPreview(container, elements, metadata, theme, options = {}) {
  await applyThemeToPreview(theme);
  container.innerHTML = generateHTMLPreview(elements, metadata, theme, options);
}

export { generateHTMLPreview, applyThemeToPreview };
