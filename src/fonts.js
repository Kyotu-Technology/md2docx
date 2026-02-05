export const FONTS = {
  carlito: {
    name: "Carlito",
    category: "sans-serif",
    files: {
      regular: "carlito-v4-latin_latin-ext-regular.woff2",
      bold: "carlito-v4-latin_latin-ext-700.woff2",
    },
  },
  caladea: {
    name: "Caladea",
    category: "serif",
    files: {
      regular: "caladea-v8-latin_latin-ext-regular.woff2",
      italic: "caladea-v8-latin_latin-ext-italic.woff2",
      bold: "caladea-v8-latin_latin-ext-700.woff2",
    },
  },
  gelasio: {
    name: "Gelasio",
    category: "serif",
    files: {
      regular: "gelasio-v14-latin_latin-ext-regular.woff2",
      italic: "gelasio-v14-latin_latin-ext-italic.woff2",
      bold: "gelasio-v14-latin_latin-ext-700.woff2",
    },
  },
  arimo: {
    name: "Arimo",
    category: "sans-serif",
    files: {
      regular: "arimo-v35-latin_latin-ext-regular.woff2",
      italic: "arimo-v35-latin_latin-ext-italic.woff2",
      bold: "arimo-v35-latin_latin-ext-700.woff2",
    },
  },
  tinos: {
    name: "Tinos",
    category: "serif",
    files: {
      regular: "tinos-v25-latin_latin-ext-regular.woff2",
      italic: "tinos-v25-latin_latin-ext-italic.woff2",
      bold: "tinos-v25-latin_latin-ext-700.woff2",
    },
  },
  "open-sans": {
    name: "Open Sans",
    category: "sans-serif",
    files: {
      regular: "open-sans-v44-latin_latin-ext-regular.woff2",
      italic: "open-sans-v44-latin_latin-ext-italic.woff2",
      bold: "open-sans-v44-latin_latin-ext-700.woff2",
    },
  },
  "fira-sans": {
    name: "Fira Sans",
    category: "sans-serif",
    files: {
      regular: "fira-sans-v18-latin_latin-ext-regular.woff2",
      italic: "fira-sans-v18-latin_latin-ext-italic.woff2",
      bold: "fira-sans-v18-latin_latin-ext-700.woff2",
    },
  },
  "libre-baskerville": {
    name: "Libre Baskerville",
    category: "serif",
    files: {
      regular: "libre-baskerville-v24-latin_latin-ext-regular.woff2",
      italic: "libre-baskerville-v24-latin_latin-ext-italic.woff2",
      bold: "libre-baskerville-v24-latin_latin-ext-700.woff2",
    },
  },
  "eb-garamond": {
    name: "EB Garamond",
    category: "serif",
    files: {
      regular: "eb-garamond-v32-latin_latin-ext-regular.woff2",
      italic: "eb-garamond-v32-latin_latin-ext-italic.woff2",
      bold: "eb-garamond-v32-latin_latin-ext-700.woff2",
    },
  },
  questrial: {
    name: "Questrial",
    category: "sans-serif",
    files: {
      regular: "questrial-v19-latin_latin-ext-regular.woff2",
    },
  },
  "source-code-pro": {
    name: "Source Code Pro",
    category: "monospace",
    files: {
      regular: "source-code-pro-v31-latin_latin-ext-regular.woff2",
      500: "source-code-pro-v31-latin_latin-ext-500.woff2",
      600: "source-code-pro-v31-latin_latin-ext-600.woff2",
      bold: "source-code-pro-v31-latin_latin-ext-700.woff2",
    },
  },
  "fira-code": {
    name: "Fira Code",
    category: "monospace",
    files: {
      regular: "fira-code-v27-latin_latin-ext-regular.woff2",
      500: "fira-code-v27-latin_latin-ext-500.woff2",
      bold: "fira-code-v27-latin_latin-ext-700.woff2",
    },
  },
  "jetbrains-mono": {
    name: "JetBrains Mono",
    category: "monospace",
    files: {
      regular: "jetbrains-mono-v24-latin_latin-ext-regular.woff2",
      500: "jetbrains-mono-v24-latin_latin-ext-500.woff2",
      bold: "jetbrains-mono-v24-latin_latin-ext-700.woff2",
    },
  },
  "courier-prime": {
    name: "Courier Prime",
    category: "monospace",
    files: {
      regular: "courier-prime-v11-latin_latin-ext-regular.woff2",
      italic: "courier-prime-v11-latin_latin-ext-italic.woff2",
      bold: "courier-prime-v11-latin_latin-ext-700.woff2",
    },
  },
};

export const FONT_ALIASES = {
  Calibri: "Carlito",
  "Calibri Light": "Carlito",
  Cambria: "Caladea",
  Georgia: "Gelasio",
  Arial: "Arimo",
  "Times New Roman": "Tinos",
  Verdana: "Open Sans",
  Tahoma: "Open Sans",
  "Trebuchet MS": "Fira Sans",
  "Palatino Linotype": "Libre Baskerville",
  "Book Antiqua": "Libre Baskerville",
  Garamond: "EB Garamond",
  "Century Gothic": "Questrial",
  Consolas: "Source Code Pro",
  "Lucida Console": "Source Code Pro",
  Monaco: "Source Code Pro",
  Menlo: "Source Code Pro",
  "Courier New": "Courier Prime",
  "Cascadia Code": "Fira Code",
};

export function getFontName(requestedFont) {
  return FONT_ALIASES[requestedFont] || requestedFont;
}

export function getFontConfig(fontName) {
  const actualName = getFontName(fontName);
  const key = Object.keys(FONTS).find((k) => FONTS[k].name === actualName);
  return key ? FONTS[key] : null;
}

export function generateFontFaceCSS(baseUrl = "") {
  const fontFaces = [];

  for (const [, font] of Object.entries(FONTS)) {
    const { name, files } = font;

    if (files.regular) {
      fontFaces.push(`
@font-face {
  font-family: '${name}';
  src: url('${baseUrl}/assets/fonts/${files.regular}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}`);
    }

    if (files.italic) {
      fontFaces.push(`
@font-face {
  font-family: '${name}';
  src: url('${baseUrl}/assets/fonts/${files.italic}') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}`);
    }

    if (files[500]) {
      fontFaces.push(`
@font-face {
  font-family: '${name}';
  src: url('${baseUrl}/assets/fonts/${files[500]}') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}`);
    }

    if (files[600]) {
      fontFaces.push(`
@font-face {
  font-family: '${name}';
  src: url('${baseUrl}/assets/fonts/${files[600]}') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}`);
    }

    if (files.bold) {
      fontFaces.push(`
@font-face {
  font-family: '${name}';
  src: url('${baseUrl}/assets/fonts/${files.bold}') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}`);
    }
  }

  return fontFaces.join("\n");
}

export function getFontStack(fontName, fallbackCategory = "sans-serif") {
  const actualName = getFontName(fontName);
  const config = getFontConfig(fontName);
  const category = config?.category || fallbackCategory;

  if (actualName !== fontName) {
    return `"${actualName}", "${fontName}", ${category}`;
  }
  return `"${actualName}", ${category}`;
}

export function getMonoFontStack(fontName) {
  return getFontStack(fontName, "monospace");
}

let fontStyleElement = null;

export function injectFontStyles() {
  if (fontStyleElement) return;

  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
  fontStyleElement = document.createElement("style");
  fontStyleElement.id = "self-hosted-fonts";
  fontStyleElement.textContent = generateFontFaceCSS(baseUrl);
  document.head.appendChild(fontStyleElement);
}
