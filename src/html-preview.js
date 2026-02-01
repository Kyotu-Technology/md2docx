import { getMermaidPreviewUrl, applyMermaidTheme } from "./mermaid.js";
import { highlightCodeHtml } from "./highlighter.js";
import { getTheme } from "./themes/index.js";
import { escapeHtml } from "./utils.js";
import { COLORS } from "./constants.js";

export function generateHTMLPreview(elements, metadata, themeId = "kyotu") {
  const theme = getTheme(themeId);
  const c = theme.colors;

  let html = "";
  if (metadata.title) {
    html += `<div style="margin-bottom:2rem;padding-bottom:1rem;border-bottom:3px solid #${c.primary};"><h1 style="font-size:1.75rem;margin:0;font-weight:700;color:#${c.primary};">${escapeHtml(metadata.title)}</h1>`;
    if (metadata.author)
      html += `<p style="color:#${c.secondary};margin:0.5rem 0 0;font-weight:500;">${escapeHtml(metadata.author)}</p>`;
    if (metadata.date)
      html += `<p style="color:#${c.muted};margin:0.25rem 0 0;font-size:0.9rem;">${escapeHtml(metadata.date)}</p>`;
    html += `</div>`;
  }
  for (const el of elements) html += elementToHTML(el, theme);
  return html;
}

function formatInlineHTML(text, theme) {
  const c = theme.colors;
  const boldColor = c.bold || COLORS.boldFallback;
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, `<strong style="color:#${boldColor};"><em>$1</em></strong>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#${boldColor};">$1</strong>`)
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      `<code style="background:#${c.codeBg};color:#${c.text};padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.85em;border:1px solid #${c.codeBorder};">$1</code>`
    )
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      `<a href="$2" style="color:#${c.accent};text-decoration:none;border-bottom:1px solid transparent;">$1</a>`
    );
}

function elementToHTML(el, theme) {
  const c = theme.colors;
  switch (el.type) {
    case "h1":
      return `<h1 style="color:#${c.primary};">${escapeHtml(el.content)}</h1>`;
    case "h2":
      return `<h2 style="color:#${c.primary};">${escapeHtml(el.content)}</h2>`;
    case "h3":
      return `<h3 style="color:#${c.primary};">${escapeHtml(el.content)}</h3>`;
    case "h4":
      return `<h4 style="color:#${c.primary};">${escapeHtml(el.content)}</h4>`;
    case "paragraph":
      return `<p>${formatInlineHTML(escapeHtml(el.content), theme)}</p>`;
    case "bulletlist":
      return `<ul>${el.items.map((i) => `<li>${formatInlineHTML(escapeHtml(i), theme)}</li>`).join("")}</ul>`;
    case "numlist":
      return `<ol>${el.items.map((i) => `<li>${formatInlineHTML(escapeHtml(i), theme)}</li>`).join("")}</ol>`;
    case "checklist":
      return `<ul class="checklist">${el.items.map((i) => `<li><span style="color:${i.checked ? "#" + COLORS.checklistChecked : "#" + c.muted}">${i.checked ? "☑" : "☐"}</span> ${formatInlineHTML(escapeHtml(i.text), theme)}</li>`).join("")}</ul>`;
    case "codeblock":
      return `<pre style="background:#${c.codeBg};border:1px solid #${c.codeBorder};"><code class="hljs">${highlightCodeHtml(el.content, el.language)}</code></pre>`;
    case "mermaid": {
      const mermaidCode = applyMermaidTheme(el.content, theme);
      return `<img class="mermaid-diagram" src="${getMermaidPreviewUrl(mermaidCode)}" alt="Mermaid" onerror="this.outerHTML='<pre style=\\'color:#${COLORS.error};background:#fef2f2;padding:1rem;border-radius:0.5rem;\\'>Diagram render error</pre>'">`;
    }
    case "table": {
      let t = `<table style="border-color:#${c.tableBorder};">`;
      el.rows.forEach((row, i) => {
        t += "<tr>";
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
      return `<hr style="border:none;height:2px;background:#${c.muted};">`;
    default:
      return "";
  }
}
