import { FONTS, getFontName } from "./fonts.js";

const fontCache = new Map();
export const registeredFonts = new Set();

function findFontKey(fontName) {
  return Object.keys(FONTS).find((k) => FONTS[k].name === fontName);
}

function ttfFileName(woff2Name) {
  return woff2Name.replace(".woff2", ".ttf");
}

async function fetchAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font fetch failed: ${url} (${response.status})`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function getBaseUrl() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
}

async function loadFont(fontName) {
  if (fontCache.has(fontName)) return fontCache.get(fontName);

  const key = findFontKey(fontName);
  if (!key) return null;

  const config = FONTS[key];
  const baseUrl = getBaseUrl();
  const vfs = {};
  const fontDef = {};

  const variants = [
    { prop: "regular", vfsProp: "normal" },
    { prop: "bold", vfsProp: "bold" },
    { prop: "italic", vfsProp: "italics" },
  ];

  for (const { prop, vfsProp } of variants) {
    const woff2File = config.files[prop];
    if (!woff2File) continue;

    const ttfFile = ttfFileName(woff2File);

    try {
      const base64 = await fetchAsBase64(`${baseUrl}/assets/fonts/${ttfFile}`);
      vfs[ttfFile] = base64;
      fontDef[vfsProp] = ttfFile;
    } catch {
      // TTF not available — skip this variant
    }
  }

  if (!fontDef.normal) return null;

  if (!fontDef.bold) fontDef.bold = fontDef.normal;
  if (!fontDef.italics) fontDef.italics = fontDef.normal;
  if (!fontDef.bolditalics) fontDef.bolditalics = fontDef.bold;

  const result = { vfs, fontDef };
  fontCache.set(fontName, result);
  return result;
}

export async function registerPdfFonts(theme) {
  const needed = new Set([
    getFontName(theme.fonts.heading),
    getFontName(theme.fonts.body),
    getFontName(theme.fonts.mono),
    "Noto Emoji",
  ]);

  needed.delete("Roboto");

  if (needed.size === 0) return;

  const newVfs = {};
  const newFonts = {};

  const loads = [...needed].map(async (fontName) => {
    const result = await loadFont(fontName);
    if (!result) return;
    Object.assign(newVfs, result.vfs);
    newFonts[fontName] = result.fontDef;
  });

  await Promise.all(loads);

  if (Object.keys(newFonts).length === 0) return;

  pdfMake.addVirtualFileSystem(newVfs);
  pdfMake.addFonts(newFonts);

  for (const name of Object.keys(newFonts)) {
    registeredFonts.add(name);
  }
}
