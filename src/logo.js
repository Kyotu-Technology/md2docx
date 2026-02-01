import { CANVAS } from "./constants.js";

let cachedFull = null;
let cachedOpacity = null;

/**
 * Load a logo as a PNG data URL.
 * Handles custom logos (data URL input) and default SVG conversion.
 * @param {number} opacity - 0 to 1
 * @param {string|null} customLogoDataUrl - custom logo data URL, or null for default
 * @returns {Promise<string|null>} full data URL (e.g., "data:image/png;base64,...")
 */
export async function loadLogoPng(opacity = 1, customLogoDataUrl = null) {
  if (customLogoDataUrl) {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS.logoWidth;
    canvas.height = CANVAS.logoHeight;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = customLogoDataUrl;
    });

    const scale = Math.min(CANVAS.logoWidth / img.width, CANVAS.logoHeight / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    ctx.globalAlpha = opacity;
    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/png");
  }

  const cacheKey = opacity < 1 ? "opacity" : "full";
  if (cacheKey === "opacity" && cachedOpacity) return cachedOpacity;
  if (cacheKey === "full" && cachedFull) return cachedFull;

  try {
    const response = await fetch("./assets/logo-black.svg");
    const svgText = await response.text();

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS.logoWidth;
    canvas.height = CANVAS.logoHeight;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    ctx.globalAlpha = opacity;
    ctx.drawImage(img, 0, 0, CANVAS.logoWidth, CANVAS.logoHeight);
    URL.revokeObjectURL(url);

    const dataUrl = canvas.toDataURL("image/png");

    if (cacheKey === "opacity") cachedOpacity = dataUrl;
    else cachedFull = dataUrl;

    return dataUrl;
  } catch {
    return null;
  }
}
