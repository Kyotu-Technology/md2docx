/**
 * Escape HTML special characters for safe insertion into HTML.
 */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Normalize a hex color to #-prefixed format.
 * Accepts "ff9900" or "#ff9900", always returns "#ff9900".
 */
export function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  return /^[a-f\d]{6}$/i.test(cleaned) ? `#${cleaned}` : "#000000";
}
