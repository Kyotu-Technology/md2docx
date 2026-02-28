import { getMermaidPreviewUrl, applyMermaidTheme } from "./mermaid.js";
import { highlightCodeHtml } from "./highlighter.js";
import { getTheme } from "./themes/index.js";
import { escapeHtml } from "./utils.js";
import { COLORS } from "./constants.js";
import { parseInlineSegments } from "./inline-formatting.js";

const hpToPx = (hp) => (hp / 2) * (16 / 12);

function generateTitlePage(metadata, theme, options = {}) {
  const c = theme.colors;
  const s = theme.sizes;
  const f = theme.fonts;

  const tp = {
    verticalSpacing: 5,
    showLogo: false,
    logoSize: { width: 180, height: 76 },
    showLine: false,
    lineChar: "─",
    lineLength: 40,
    ...theme.titlePage,
  };

  let html = '<div class="title-page">';

  if (tp.showLogo && options.logoDataUrl) {
    const logoSize = tp.logoSize || { width: 180, height: 76 };
    html += `<div class="title-page-logo" style="margin-bottom: 2rem;">
      <img src="${options.logoDataUrl}" alt="Logo"
           style="width: ${logoSize.width}px; height: ${logoSize.height}px; object-fit: contain;">
    </div>`;
  }

  if (metadata.title) {
    const hasBorderLine = tp.showLine && !tp.lineChar;
    html += `<div class="title-page-title" style="
      font-family: '${f.heading}', serif;
      font-size: ${hpToPx(s.title)}px;
      font-weight: 700;
      color: #${c.primary};
      margin: 0 0 0.5rem;
      ${hasBorderLine ? `border-bottom: 3px solid #${c.primary}; padding-bottom: 0.5rem;` : ""}
    ">${escapeHtml(metadata.title)}</div>`;
  }

  if (tp.showLine && tp.lineChar) {
    html += `<div class="title-page-line" style="
      font-family: '${f.body}', sans-serif;
      font-size: ${hpToPx(s.body)}px;
      color: #${c.muted};
      margin: 0.75rem 0;
      letter-spacing: 0;
    ">${tp.lineChar.repeat(tp.lineLength || 40)}</div>`;
  }

  if (metadata.subtitle) {
    html += `<div class="title-page-subtitle" style="
      font-family: '${f.body}', sans-serif;
      font-size: ${hpToPx(s.subtitle)}px;
      color: #${c.secondary};
      margin: 0.5rem 0;
    ">${escapeHtml(metadata.subtitle)}</div>`;
  }

  if (metadata.author) {
    html += `<div class="title-page-author" style="
      font-family: '${f.body}', sans-serif;
      font-size: ${hpToPx(s.subtitle)}px;
      color: #${c.secondary};
      margin-top: 1rem;
    ">${escapeHtml(metadata.author)}</div>`;
  }

  if (metadata.date) {
    html += `<div class="title-page-date" style="
      font-family: '${f.body}', sans-serif;
      font-size: ${hpToPx(s.body)}px;
      color: #${c.muted};
    ">${escapeHtml(metadata.date)}</div>`;
  }

  html += "</div>";
  return html;
}

function generateTitlePagePlaceholder() {
  return `<div class="title-page-placeholder" data-action="insert-frontmatter">
    <div class="title-page-placeholder-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14m-7-7h14"/>
      </svg>
    </div>
    <div class="title-page-placeholder-text">Click to add title page</div>
    <div class="title-page-placeholder-hint">title &middot; subtitle &middot; author &middot; date</div>
  </div>`;
}

export function generateHTMLPreview(elements, metadata, themeIdOrObject = "kyotu", options = {}) {
  const theme = typeof themeIdOrObject === "string" ? getTheme(themeIdOrObject) : themeIdOrObject;

  let html = "";
  const showTitlePage = options.showTitlePage !== false;

  if (showTitlePage) {
    const isUserPreview = !!options.interactive || !!options.pagedMode;
    const explicit = metadata._explicitFields;
    const hasExplicitContent =
      explicit && (explicit.title || explicit.subtitle || explicit.author || explicit.date);

    if (hasExplicitContent) {
      html += generateTitlePage(isUserPreview ? explicit : metadata, theme, options);
      if (options.pagedMode) {
        html += '<div class="title-page-break"></div>';
      }
    } else if (!isUserPreview && (metadata.title || metadata.date)) {
      html += generateTitlePage(metadata, theme, options);
    } else if (options.interactive) {
      html += generateTitlePagePlaceholder();
    }
  }

  const interactive = !!options.interactive;
  for (const el of elements) html += elementToHTML(el, theme, interactive);
  return html;
}

function formatInlineHTML(text, theme) {
  const c = theme.colors;
  const boldColor = c.bold || COLORS.boldFallback;
  return parseInlineSegments(text)
    .map((seg) => {
      switch (seg.type) {
        case "bold":
          return `<strong style="color:#${boldColor};">${seg.text}</strong>`;
        case "italic":
          return `<em>${seg.text}</em>`;
        case "boldItalic":
          return `<strong style="color:#${boldColor};"><em>${seg.text}</em></strong>`;
        case "code":
          return `<code style="background:#${c.codeBg};color:#${c.text};padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.85em;border:1px solid #${c.codeBorder};">${seg.text}</code>`;
        case "link":
          return `<a href="${seg.url}" style="color:#${c.accent};text-decoration:none;border-bottom:1px solid transparent;">${seg.text}</a>`;
        default:
          return seg.text;
      }
    })
    .join("");
}

function elementToHTML(el, theme, interactive = false) {
  const c = theme.colors;
  const lineAttr = el.line !== undefined ? ` data-line="${el.line}"` : "";

  switch (el.type) {
    case "h1":
      return `<h1${lineAttr} style="color:#${c.primary};">${escapeHtml(el.content)}</h1>`;
    case "h2":
      return `<h2${lineAttr} style="color:#${c.primary};">${escapeHtml(el.content)}</h2>`;
    case "h3":
      return `<h3${lineAttr} style="color:#${c.primary};">${escapeHtml(el.content)}</h3>`;
    case "h4":
      return `<h4${lineAttr} style="color:#${c.primary};">${escapeHtml(el.content)}</h4>`;
    case "paragraph":
      return `<p${lineAttr}>${formatInlineHTML(escapeHtml(el.content), theme)}</p>`;
    case "bulletlist": {
      let html = "<ul>";
      el.items.forEach((item, idx) => {
        const itemLine = el.line !== undefined ? el.line + idx : undefined;
        const itemAttr = itemLine !== undefined ? ` data-line="${itemLine}"` : "";
        html += `<li${itemAttr}>${formatInlineHTML(escapeHtml(item), theme)}</li>`;
      });
      return html + "</ul>";
    }
    case "numlist": {
      let html = "<ol>";
      el.items.forEach((item, idx) => {
        const itemLine = el.line !== undefined ? el.line + idx : undefined;
        const itemAttr = itemLine !== undefined ? ` data-line="${itemLine}"` : "";
        html += `<li${itemAttr}>${formatInlineHTML(escapeHtml(item), theme)}</li>`;
      });
      return html + "</ol>";
    }
    case "checklist": {
      let html = '<ul class="checklist">';
      el.items.forEach((item, idx) => {
        const itemLine = el.line !== undefined ? el.line + idx : undefined;
        const itemAttr = itemLine !== undefined ? ` data-line="${itemLine}"` : "";
        html += `<li${itemAttr}><span style="color:${item.checked ? "#" + COLORS.checklistChecked : "#" + c.muted}">${item.checked ? "☑" : "☐"}</span> ${formatInlineHTML(escapeHtml(item.text), theme)}</li>`;
      });
      return html + "</ul>";
    }
    case "codeblock":
      return `<pre${lineAttr} style="background:#${c.codeBg};border:1px solid #${c.codeBorder};"><code class="hljs">${highlightCodeHtml(el.content, el.language)}</code></pre>`;
    case "mermaid": {
      const mermaidCode = applyMermaidTheme(el.content, theme);
      const imgSrc = getMermaidPreviewUrl(mermaidCode);
      const actions = interactive
        ? `<div class="mermaid-actions"><button data-diagram-action="copy" title="Copy to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button><button data-diagram-action="download" title="Download PNG"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button></div>`
        : "";
      return `<div${lineAttr} class="mermaid-container"><img class="mermaid-diagram" src="${imgSrc}" alt="Mermaid" onerror="this.parentElement.innerHTML='<pre style=\\'color:#${COLORS.error};background:#fef2f2;padding:1rem;border-radius:0.5rem;\\'>Diagram render error</pre>'">${actions}</div>`;
    }
    case "table": {
      let t = `<table style="border-color:#${c.tableBorder};">`;
      el.rows.forEach((row, i) => {
        const rowLine = el.line !== undefined ? (i === 0 ? el.line : el.line + i + 1) : undefined;
        const rowAttr = rowLine !== undefined ? ` data-line="${rowLine}"` : "";
        t += `<tr${rowAttr}>`;
        row.forEach((cell, j) => {
          const tag = i === 0 ? "th" : "td";
          const bg = i === 0 ? `background:#${c.tableHeader};` : "";
          const bold = j === 0 && i > 0 ? "font-weight:500;" : "";
          t += `<${tag} style="border-color:#${c.tableBorder};${bg}${bold}">${formatInlineHTML(escapeHtml(cell), theme)}</${tag}>`;
        });
        t += "</tr>";
      });
      return t + "</table>";
    }
    case "hr":
      return `<hr${lineAttr} style="border:none;height:2px;background:#${c.muted};">`;
    default:
      return "";
  }
}
