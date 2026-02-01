import { getTheme } from "./themes/index.js";
import { renderMermaidDiagram, applyMermaidTheme } from "./mermaid.js";
import { hexToRgb } from "./utils.js";
import { COLORS } from "./constants.js";
import { loadLogoPng } from "./logo.js";
import { parseInlineSegments } from "./inline-formatting.js";

function themeSizeToPt(halfPts) {
  return halfPts / 2;
}

function twipsToPt(twips) {
  return twips / 20;
}

// Replace Unicode chars that Roboto doesn't support
function sanitizeText(text) {
  return text
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↔/g, "<->")
    .replace(/⇒/g, "=>")
    .replace(/⇐/g, "<=")
    .replace(/⇔/g, "<=>")
    .replace(/•/g, "*")
    .replace(/·/g, ".")
    .replace(/…/g, "...")
    .replace(/—/g, "--")
    .replace(/–/g, "-")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/☑/g, "[x]")
    .replace(/☐/g, "[ ]")
    .replace(/✓/g, "[x]")
    .replace(/✗/g, "[x]")
    .replace(/❌/g, "[x]")
    .replace(/✅/g, "[x]")
    .replace(/│/g, "|")
    .replace(/─/g, "-")
    .replace(/┌/g, "+")
    .replace(/┐/g, "+")
    .replace(/└/g, "+")
    .replace(/┘/g, "+")
    .replace(/├/g, "+")
    .replace(/┤/g, "+")
    .replace(/┬/g, "+")
    .replace(/┴/g, "+")
    .replace(/┼/g, "+");
}

function parseInlineFormatting(text, theme) {
  const boldColor = theme.colors.bold || COLORS.boldFallback;
  const safeText = sanitizeText(text);
  const segments = parseInlineSegments(safeText);

  const styleMap = {
    plain: {},
    bold: { bold: true, color: hexToRgb(boldColor) },
    italic: { italics: true },
    boldItalic: { bold: true, italics: true, color: hexToRgb(boldColor) },
    code: {
      fontSize: themeSizeToPt(theme.sizes.mono),
      background: hexToRgb(theme.colors.codeBg),
    },
    link: { color: hexToRgb(theme.colors.accent), decoration: "underline" },
  };

  return segments.map((seg) => {
    const base = { text: seg.text, ...styleMap[seg.type] };
    if (seg.type === "link") base.link = seg.url;
    return base;
  });
}

async function elementToPdf(element, theme) {
  const c = theme.colors;
  const s = theme.spacing;
  const primaryColor = hexToRgb(c.primary);
  const mutedColor = hexToRgb(c.muted);
  const textColor = hexToRgb(c.text);
  const codeBgColor = hexToRgb(c.codeBg);
  const codeBorderColor = hexToRgb(c.codeBorder);

  switch (element.type) {
    case "h1":
      return {
        text: sanitizeText(element.content),
        style: "h1",
        color: primaryColor,
        margin: [0, twipsToPt(s.h1Before), 0, twipsToPt(s.h1After)],
        tocItem: true,
        tocStyle: "tocH1",
      };
    case "h2":
      return {
        text: sanitizeText(element.content),
        style: "h2",
        color: primaryColor,
        margin: [0, twipsToPt(s.h2Before), 0, twipsToPt(s.h2After)],
        tocItem: true,
        tocStyle: "tocH2",
      };
    case "h3":
      return {
        text: sanitizeText(element.content),
        style: "h3",
        color: primaryColor,
        margin: [0, twipsToPt(s.h3Before), 0, twipsToPt(s.h3After)],
        tocItem: true,
        tocStyle: "tocH3",
      };
    case "h4":
      return {
        text: sanitizeText(element.content),
        style: "h4",
        color: primaryColor,
        margin: [0, twipsToPt(s.h4Before), 0, twipsToPt(s.h4After)],
        tocItem: true,
        tocStyle: "tocH4",
      };
    case "paragraph":
      return {
        text: parseInlineFormatting(element.content, theme),
        style: "body",
        margin: [0, 0, 0, twipsToPt(s.paraAfter)],
      };
    case "bulletlist":
      return {
        ul: element.items.map((item) => ({
          text: parseInlineFormatting(item, theme),
          margin: [0, 2, 0, 2],
        })),
        margin: [0, 5, 0, twipsToPt(s.paraAfter)],
      };
    case "numlist":
      return {
        ol: element.items.map((item) => ({
          text: parseInlineFormatting(item, theme),
          margin: [0, 2, 0, 2],
        })),
        margin: [0, 5, 0, twipsToPt(s.paraAfter)],
      };
    case "checklist":
      return {
        stack: element.items.map((item) => ({
          text: [
            {
              text: item.checked ? "[x] " : "[ ] ",
              color: item.checked ? `#${COLORS.checklistChecked}` : mutedColor,
            },
            ...parseInlineFormatting(item.text, theme),
          ],
          margin: [10, 2, 0, 2],
        })),
        margin: [0, 5, 0, twipsToPt(s.paraAfter)],
      };
    case "codeblock": {
      const safeCode = sanitizeText(element.content);
      const lines = safeCode.split("\n");
      const codeFontSize = themeSizeToPt(theme.sizes.mono);

      const syntaxColors = {
        keyword: hexToRgb(theme.syntax.keyword),
        string: hexToRgb(theme.syntax.string),
        comment: hexToRgb(theme.syntax.comment),
        number: hexToRgb(theme.syntax.number),
        function: hexToRgb(theme.syntax.function),
        property: hexToRgb(theme.syntax.property),
        default: textColor,
      };

      const highlightLine = (line) => {
        const segments = [];

        const patterns = [
          { regex: /(\/\/.*$|#.*$)/g, color: syntaxColors.comment },
          { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: syntaxColors.string },
          { regex: /\b(\d+\.?\d*)\b/g, color: syntaxColors.number },
          {
            regex:
              /\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|true|false|null|undefined|def|self|None|True|False|and|or|not|in|is|lambda|yield|with|as|elif|except|finally|raise|pass|break|continue|global|nonlocal)\b/g,
            color: syntaxColors.keyword,
          },
          { regex: /\b([A-Z][a-zA-Z0-9]*)\b/g, color: syntaxColors.function },
          { regex: /([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, color: syntaxColors.function },
        ];

        const matches = [];
        for (const p of patterns) {
          const regex = new RegExp(p.regex.source, "g");
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0],
              color: p.color,
            });
          }
        }

        matches.sort((a, b) => a.start - b.start);
        const filtered = [];
        let lastEnd = 0;
        for (const m of matches) {
          if (m.start >= lastEnd) {
            filtered.push(m);
            lastEnd = m.end;
          }
        }

        let cursor = 0;
        for (const m of filtered) {
          if (m.start > cursor) {
            segments.push({
              text: line.slice(cursor, m.start),
              color: syntaxColors.default,
              fontSize: codeFontSize,
            });
          }
          segments.push({ text: m.text, color: m.color, fontSize: codeFontSize });
          cursor = m.end;
        }
        if (cursor < line.length) {
          segments.push({
            text: line.slice(cursor),
            color: syntaxColors.default,
            fontSize: codeFontSize,
          });
        }

        return segments.length > 0
          ? segments
          : [{ text: line, color: syntaxColors.default, fontSize: codeFontSize }];
      };

      const textContent = [];
      lines.forEach((line, i) => {
        const highlighted = highlightLine(line);
        textContent.push(...highlighted);
        if (i < lines.length - 1) {
          textContent.push({ text: "\n", fontSize: codeFontSize });
        }
      });

      return {
        stack: [
          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: textContent,
                    fillColor: codeBgColor,
                    border: [true, true, true, true],
                    borderColor: [
                      codeBorderColor,
                      codeBorderColor,
                      codeBorderColor,
                      codeBorderColor,
                    ],
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => codeBorderColor,
              vLineColor: () => codeBorderColor,
            },
          },
        ],
        margin: [0, 5, 0, twipsToPt(s.paraAfter)],
      };
    }
    case "mermaid":
      try {
        const mermaidCode = applyMermaidTheme(element.content, theme);
        const { buffer } = await renderMermaidDiagram(mermaidCode);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return {
          image: `data:image/png;base64,${base64}`,
          width: 400,
          alignment: "center",
          margin: [0, 10, 0, 10],
        };
      } catch (err) {
        return {
          text: `[Diagram error: ${err.message}]`,
          color: `#${COLORS.error}`,
          margin: [0, 10, 0, 10],
        };
      }
    case "table": {
      const headerBg = hexToRgb(c.tableHeader);
      const borderColor = hexToRgb(c.tableBorder);

      return {
        table: {
          headerRows: 1,
          widths: Array(element.rows[0]?.length || 1).fill("*"),
          body: element.rows.map((row, rowIdx) =>
            row.map((cell, colIdx) => ({
              text: parseInlineFormatting(cell, theme),
              fillColor: rowIdx === 0 ? headerBg : null,
              bold: rowIdx === 0 || colIdx === 0,
              margin: [5, 5, 5, 5],
            }))
          ),
        },
        layout: {
          hLineColor: () => borderColor,
          vLineColor: () => borderColor,
        },
        margin: [0, 5, 0, twipsToPt(s.paraAfter)],
      };
    }
    case "hr":
      return {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: mutedColor,
          },
        ],
        margin: [0, 15, 0, 15],
      };
    default:
      return null;
  }
}

async function createTitlePageContent(metadata, theme, logoPng) {
  const content = [];
  const c = theme.colors;

  if (logoPng) {
    content.push({
      image: logoPng,
      width: 130,
      margin: [0, 0, 0, 40],
    });
  }

  for (let i = 0; i < (theme.titlePage.verticalSpacing || 5); i++) {
    content.push({ text: " ", fontSize: 20 });
  }

  if (metadata.title) {
    content.push({
      text: sanitizeText(metadata.title),
      fontSize: themeSizeToPt(theme.sizes.title),
      bold: true,
      color: hexToRgb(c.primary),
      margin: [0, 0, 0, 10],
    });

    if (theme.titlePage.showLine) {
      content.push({
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 200,
            y2: 0,
            lineWidth: 3,
            lineColor: hexToRgb(c.primary),
          },
        ],
        margin: [0, 10, 0, 20],
      });
    }
  }

  if (metadata.author) {
    content.push({
      text: sanitizeText(metadata.author),
      fontSize: themeSizeToPt(theme.sizes.subtitle),
      color: hexToRgb(c.secondary),
      margin: [0, 20, 0, 5],
    });
  }

  if (metadata.date) {
    content.push({
      text: sanitizeText(metadata.date),
      fontSize: themeSizeToPt(theme.sizes.body),
      color: hexToRgb(c.muted),
      margin: [0, 0, 0, 0],
    });
  }

  content.push({ text: "", pageBreak: "after" });

  return content;
}

function createTocContent(tocTitle, theme) {
  const c = theme.colors;
  return [
    {
      text: sanitizeText(tocTitle),
      fontSize: themeSizeToPt(theme.sizes.h1),
      bold: true,
      color: hexToRgb(c.primary),
      margin: [0, 0, 0, 20],
    },
    {
      toc: {
        title: { text: "" },
        numberStyle: { color: hexToRgb(c.muted) },
      },
    },
    { text: "", pageBreak: "after" },
  ];
}

export async function generatePdfBlob(metadata, elements, themeId = "kyotu", options = {}) {
  const theme = getTheme(themeId);
  const c = theme.colors;
  const sz = theme.sizes;

  const showTitlePage = options.showTitlePage !== false;
  const showToc = options.showToc !== false;
  const showHeader = options.showHeader !== false;
  const showFooter = options.showFooter !== false;
  const customLogo = options.customLogo || null;

  const hasLogo = customLogo || theme.titlePage.showLogo || theme.header.showLogo;
  const titleLogoPng = showTitlePage && hasLogo ? await loadLogoPng(1, customLogo) : null;
  const headerLogoPng = showHeader && hasLogo ? await loadLogoPng(0.6, customLogo) : null;

  const content = [];

  if (showTitlePage) {
    const titleContent = await createTitlePageContent(metadata, theme, titleLogoPng);
    content.push(...titleContent);
  }

  if (showToc) {
    const tocTitle = metadata["toc-title"] || "Table of Contents";
    content.push(...createTocContent(tocTitle, theme));
  }

  for (const el of elements) {
    const result = await elementToPdf(el, theme);
    if (result) content.push(result);
  }

  const smallSize = themeSizeToPt(sz.small);

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, showHeader ? 60 : 40, 40, showFooter ? 60 : 40],

    header: showHeader
      ? (currentPage, _pageCount) => {
          if (showTitlePage && currentPage === 1) return null;
          if (showToc && showTitlePage && currentPage === 2) return null;
          if (showToc && !showTitlePage && currentPage === 1) return null;

          if (headerLogoPng) {
            return {
              image: headerLogoPng,
              width: 80,
              margin: [40, 20, 0, 0],
              opacity: 0.6,
            };
          }
          return null;
        }
      : undefined,

    footer: showFooter
      ? (currentPage, _pageCount) => {
          if (showTitlePage && currentPage === 1) return null;

          const footerContent = [];
          const parts = [];
          if (theme.footer.left) parts.push(sanitizeText(theme.footer.left));
          if (theme.footer.center) parts.push(sanitizeText(theme.footer.center));

          if (parts.length > 0) {
            footerContent.push({
              text: parts.join(" - "),
              fontSize: smallSize,
              color: hexToRgb(c.muted),
              alignment: "center",
              margin: [0, 0, 0, 5],
            });
          }

          if (theme.footer.showPageNumber) {
            footerContent.push({
              text: `Page ${currentPage}`,
              fontSize: smallSize,
              color: hexToRgb(c.muted),
              alignment: "center",
            });
          }

          return {
            stack: footerContent,
            margin: [40, 10, 40, 0],
          };
        }
      : undefined,

    content,

    styles: {
      h1: { fontSize: themeSizeToPt(sz.h1), bold: true },
      h2: { fontSize: themeSizeToPt(sz.h2), bold: true },
      h3: { fontSize: themeSizeToPt(sz.h3), bold: true },
      h4: { fontSize: themeSizeToPt(sz.h4), bold: true },
      body: { fontSize: themeSizeToPt(sz.body), lineHeight: 1.4 },
      code: { fontSize: themeSizeToPt(sz.mono) },
      tocH1: { fontSize: themeSizeToPt(sz.h3), bold: true, margin: [0, 5, 0, 2] },
      tocH2: { fontSize: themeSizeToPt(sz.body), margin: [10, 2, 0, 2] },
      tocH3: { fontSize: themeSizeToPt(sz.table), margin: [20, 2, 0, 2] },
      tocH4: { fontSize: themeSizeToPt(sz.table), italics: true, margin: [30, 2, 0, 2] },
    },

    defaultStyle: {
      font: "Roboto",
      fontSize: themeSizeToPt(sz.body),
      color: hexToRgb(c.text),
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return pdfDoc.getBlob();
}
