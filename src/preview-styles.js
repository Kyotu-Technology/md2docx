import { getFontStack, getMonoFontStack, injectFontStyles } from "./fonts.js";

export async function loadThemeFonts() {
  injectFontStyles();
}

function halfPointsToPx(hp) {
  return (hp / 2) * (16 / 12);
}

function twipsToPx(twips) {
  return twips / 20;
}

export function generatePreviewStyles(theme, selectors = "#preview, #tePreview") {
  const f = theme.fonts;
  const s = theme.sizes;
  const sp = theme.spacing;
  const c = theme.colors;

  const headingFont = getFontStack(f.heading, "serif");
  const bodyFont = getFontStack(f.body, "sans-serif");
  const monoFont = getMonoFontStack(f.mono);

  const titleSize = halfPointsToPx(s.title);
  const subtitleSize = halfPointsToPx(s.subtitle);
  const h1Size = halfPointsToPx(s.h1);
  const h2Size = halfPointsToPx(s.h2);
  const h3Size = halfPointsToPx(s.h3);
  const h4Size = halfPointsToPx(s.h4);
  const bodySize = halfPointsToPx(s.body);
  const tableSize = halfPointsToPx(s.table);
  const smallSize = halfPointsToPx(s.small);
  const monoSize = halfPointsToPx(s.mono);
  const inlineCodeSize = Math.round(monoSize * 0.9);

  const paraAfter = twipsToPx(sp.paraAfter);
  const h1Before = twipsToPx(sp.h1Before);
  const h1After = twipsToPx(sp.h1After);
  const h2Before = twipsToPx(sp.h2Before);
  const h2After = twipsToPx(sp.h2After);
  const h3Before = twipsToPx(sp.h3Before);
  const h3After = twipsToPx(sp.h3After);
  const h4Before = twipsToPx(sp.h4Before);
  const h4After = twipsToPx(sp.h4After);

  return `
    :is(${selectors}) {
      font-family: ${bodyFont} !important;
      color: #${c.text} !important;
      line-height: 1.6 !important;
    }
    :is(${selectors}) .doc-title {
      font-family: ${headingFont} !important;
      font-size: ${titleSize}px !important;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }
    :is(${selectors}) .doc-subtitle {
      font-family: ${headingFont} !important;
      font-size: ${subtitleSize}px !important;
      font-weight: 500;
      margin: 0 0 0.5rem;
    }
    :is(${selectors}) .doc-author {
      font-family: ${bodyFont} !important;
      font-size: ${bodySize}px !important;
      font-weight: 500;
      margin: 0 0 0.25rem;
    }
    :is(${selectors}) .doc-date {
      font-family: ${bodyFont} !important;
      font-size: ${smallSize}px !important;
      margin: 0;
    }
    :is(${selectors}) h1 {
      font-family: ${headingFont} !important;
      font-size: ${h1Size}px !important;
      font-weight: 700;
      margin: ${h1Before}px 0 ${h1After}px !important;
    }
    :is(${selectors}) h2 {
      font-family: ${headingFont} !important;
      font-size: ${h2Size}px !important;
      font-weight: 600;
      margin: ${h2Before}px 0 ${h2After}px !important;
    }
    :is(${selectors}) h3 {
      font-family: ${headingFont} !important;
      font-size: ${h3Size}px !important;
      font-weight: 600;
      margin: ${h3Before}px 0 ${h3After}px !important;
    }
    :is(${selectors}) h4 {
      font-family: ${headingFont} !important;
      font-size: ${h4Size}px !important;
      font-weight: 600;
      margin: ${h4Before}px 0 ${h4After}px !important;
    }
    :is(${selectors}) p {
      font-family: ${bodyFont} !important;
      font-size: ${bodySize}px !important;
      margin: 0.5rem 0 ${paraAfter}px !important;
      line-height: 1.7;
    }
    :is(${selectors}) ul, :is(${selectors}) ol {
      font-family: ${bodyFont} !important;
      font-size: ${bodySize}px !important;
      margin: 0.5rem 0 ${paraAfter}px 0 !important;
      padding-left: 1.5rem !important;
    }
    :is(${selectors}) ul {
      list-style-type: disc !important;
    }
    :is(${selectors}) ol {
      list-style-type: decimal !important;
    }
    :is(${selectors}) li {
      margin: 0.25rem 0 !important;
    }
    :is(${selectors}) table {
      font-family: ${bodyFont} !important;
      font-size: ${tableSize}px !important;
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 0.75rem 0 !important;
    }
    :is(${selectors}) th, :is(${selectors}) td {
      padding: 0.625rem 0.75rem !important;
      text-align: left !important;
      border-width: 1px !important;
      border-style: solid !important;
    }
    :is(${selectors}) pre {
      font-family: ${monoFont} !important;
      font-size: ${monoSize}px !important;
      line-height: 1.5 !important;
      padding: 1rem !important;
      border-radius: 0.5rem !important;
      overflow-x: auto;
      margin: 0.75rem 0 !important;
    }
    :is(${selectors}) pre code.hljs {
      background: transparent !important;
      padding: 0;
    }
    :is(${selectors}) code {
      font-family: ${monoFont} !important;
      font-size: ${monoSize}px !important;
    }
    :is(${selectors}) p code {
      font-size: ${inlineCodeSize}px !important;
      padding: 0.125rem 0.375rem !important;
      border-radius: 0.25rem !important;
    }
    :is(${selectors}) hr {
      margin: 1.5rem 0 !important;
    }
    :is(${selectors}) .checklist {
      list-style: none !important;
      margin-left: 0 !important;
      padding-left: 0 !important;
    }
    :is(${selectors}) .checklist li {
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }
    :is(${selectors}) .mermaid-container {
      position: relative !important;
    }
    :is(${selectors}) .mermaid-actions {
      position: absolute !important;
      top: 0.5rem !important;
      right: 0.5rem !important;
      display: flex !important;
      gap: 0.25rem !important;
      opacity: 0 !important;
      transition: opacity 0.15s ease !important;
    }
    :is(${selectors}) .mermaid-container:hover .mermaid-actions {
      opacity: 1 !important;
    }
    :is(${selectors}) .mermaid-actions button {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 2rem !important;
      height: 2rem !important;
      border-radius: 0.375rem !important;
      border: 1px solid rgba(0,0,0,0.12) !important;
      background: rgba(255,255,255,0.92) !important;
      color: #374151 !important;
      cursor: pointer !important;
      backdrop-filter: blur(4px) !important;
      transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease !important;
      padding: 0 !important;
    }
    :is(${selectors}) .mermaid-actions button:hover {
      background: #fff !important;
      color: #111827 !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important;
    }
    :is(${selectors}) img.mermaid-diagram {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 1rem auto !important;
      border-radius: 0.5rem !important;
    }
    :is(${selectors}) a {
      text-decoration: none !important;
      border-bottom: 1px solid transparent !important;
    }
    :is(${selectors}) .title-page {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
    }
    :is(${selectors}) .title-page-logo {
      margin-bottom: 2rem;
    }
    :is(${selectors}) .title-page-title {
      margin: 0 0 0.5rem;
    }
    :is(${selectors}) .title-page-line {
      margin: 0.75rem 0;
      letter-spacing: 0;
    }
    :is(${selectors}).page-mode .title-page {
      page-break-after: always;
      display: block;
    }
    :is(${selectors}) .title-page-placeholder {
      border: 2px dashed #${c.muted}80;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: transparent;
    }
    :is(${selectors}) .title-page-placeholder:hover {
      border-color: #${c.primary};
      background: #${c.primary}08;
    }
    :is(${selectors}) .title-page-placeholder-icon {
      color: #${c.muted};
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: center;
      transition: color 0.2s;
    }
    :is(${selectors}) .title-page-placeholder:hover .title-page-placeholder-icon {
      color: #${c.primary};
    }
    :is(${selectors}) .title-page-placeholder-text {
      font-family: ${bodyFont};
      font-size: 14px;
      font-weight: 500;
      color: #${c.secondary};
    }
    :is(${selectors}) .title-page-placeholder-hint {
      font-family: ${bodyFont};
      font-size: 12px;
      color: #${c.muted};
      margin-top: 0.25rem;
    }
  `;
}

let styleElement = null;

export function updatePreviewStyles(theme) {
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "preview-dynamic-styles";
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = generatePreviewStyles(theme);
}

export async function applyThemeToPreview(theme) {
  await loadThemeFonts();
  updatePreviewStyles(theme);
}
