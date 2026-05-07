import { getThemeOrTemplate } from "./themes/index.js";
import { renderMermaidDiagram, applyMermaidTheme } from "./mermaid.js";
import { hexToRgb } from "./utils.js";
import { COLORS } from "./constants.js";
import { loadLogoPng } from "./logo.js";
import { parseInlineSegments } from "./inline-formatting.js";
import { highlightCodeTokens } from "./highlighter.js";
import { getFontName } from "./fonts.js";
import { registerPdfFonts, registeredFonts } from "./pdf-fonts.js";

const A4_WIDTH = 595.28;
const SYMBOL_FONT = "Noto Emoji";
const SYMBOL_RE = /[\u2190-\u21FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]/u;
const SYMBOL_SPLIT_RE = /([\u2190-\u21FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]+)/gu;

function hp(halfPts) {
  return halfPts / 2;
}

function tw(twips) {
  return twips / 20;
}

function sanitizeText(text) {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FAFF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/[\u{E0020}-\u{E007F}]/gu, "")
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
    .replace(/┼/g, "+")
    .replace(/\s{2,}/g, " ");
}

function resolveFont(name) {
  const resolved = getFontName(name);
  return registeredFonts.has(resolved) ? resolved : "Roboto";
}

function withSymbolFont(text, baseFont) {
  if (!SYMBOL_RE.test(text)) return text;
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(SYMBOL_SPLIT_RE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), font: baseFont });
    parts.push({ text: match[0], font: SYMBOL_FONT });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), font: baseFont });
  return parts;
}

function pdfThemeAdapter(theme) {
  const fontHeading = resolveFont(theme.fonts.heading);
  const fontBody = resolveFont(theme.fonts.body);
  const fontMono = resolveFont(theme.fonts.mono);

  const syntax = {};
  for (const key of Object.keys(theme.syntax)) {
    syntax[key] = hexToRgb(theme.syntax[key]);
  }

  return {
    fontHeading,
    fontBody,
    fontMono,
    colorPrimary: hexToRgb(theme.colors.primary),
    colorSecondary: hexToRgb(theme.colors.secondary),
    colorAccent: hexToRgb(theme.colors.accent),
    colorMuted: hexToRgb(theme.colors.muted),
    colorText: hexToRgb(theme.colors.text),
    colorBold: hexToRgb(theme.colors.bold || COLORS.boldFallback),
    colorTableHeader: hexToRgb(theme.colors.tableHeader),
    colorTableBorder: hexToRgb(theme.colors.tableBorder),
    colorCodeBg: hexToRgb(theme.colors.codeBg),
    colorCodeBorder: hexToRgb(theme.colors.codeBorder),
    colorH1Text: hexToRgb(theme.colors.h1Text || theme.colors.primary),
    colorH1Bar: theme.colors.h1Bar ? hexToRgb(theme.colors.h1Bar) : null,
    colorH1Bg: theme.colors.h1Bg ? hexToRgb(theme.colors.h1Bg) : null,
    colorH2Text: hexToRgb(theme.colors.h2Text || theme.colors.primary),
    colorH2Bar: theme.colors.h2Bar ? hexToRgb(theme.colors.h2Bar) : null,
    colorH2Bg: theme.colors.h2Bg ? hexToRgb(theme.colors.h2Bg) : null,
    colorH3Text: hexToRgb(theme.colors.h3Text || theme.colors.primary),
    colorH4Text: hexToRgb(theme.colors.h4Text || theme.colors.primary),
    colorBlockquoteBar: theme.colors.blockquoteBar ? hexToRgb(theme.colors.blockquoteBar) : null,
    colorBlockquoteBg: theme.colors.blockquoteBg ? hexToRgb(theme.colors.blockquoteBg) : null,
    colorBlockquoteText: hexToRgb(theme.colors.blockquoteText || theme.colors.text),
    bodyAlignment: theme.body?.alignment,
    h1Caps: theme.headings?.h1Caps,
    h2Caps: theme.headings?.h2Caps,
    sizeTitle: hp(theme.sizes.title),
    sizeSubtitle: hp(theme.sizes.subtitle),
    sizeH1: hp(theme.sizes.h1),
    sizeH2: hp(theme.sizes.h2),
    sizeH3: hp(theme.sizes.h3),
    sizeH4: hp(theme.sizes.h4),
    sizeBody: hp(theme.sizes.body),
    sizeTable: hp(theme.sizes.table),
    sizeSmall: hp(theme.sizes.small),
    sizeMono: hp(theme.sizes.mono),
    marginPage: tw(theme.spacing.marginPage),
    marginPageTop: tw(theme.spacing.marginPageTop),
    spacingParaAfter: tw(theme.spacing.paraAfter),
    spacingH1Before: tw(theme.spacing.h1Before),
    spacingH1After: tw(theme.spacing.h1After),
    spacingH2Before: tw(theme.spacing.h2Before),
    spacingH2After: tw(theme.spacing.h2After),
    spacingH3Before: tw(theme.spacing.h3Before),
    spacingH3After: tw(theme.spacing.h3After),
    spacingH4Before: tw(theme.spacing.h4Before),
    spacingH4After: tw(theme.spacing.h4After),
    syntax,
    titlePage: theme.titlePage,
    header: theme.header,
    footer: theme.footer,
  };
}

function parseInlineFormatting(text, t) {
  const safeText = sanitizeText(text);
  const segments = parseInlineSegments(safeText);

  const styleMap = {
    plain: { font: t.fontBody, fontSize: t.sizeBody, color: t.colorText },
    bold: { font: t.fontBody, fontSize: t.sizeBody, bold: true, color: t.colorBold },
    italic: { font: t.fontBody, fontSize: t.sizeBody, italics: true, color: t.colorText },
    boldItalic: {
      font: t.fontBody,
      fontSize: t.sizeBody,
      bold: true,
      italics: true,
      color: t.colorBold,
    },
    code: {
      font: t.fontMono,
      fontSize: t.sizeMono,
      background: t.colorCodeBg,
    },
    link: {
      font: t.fontBody,
      fontSize: t.sizeBody,
      color: t.colorAccent,
      decoration: "underline",
    },
  };

  return segments.flatMap((seg) => {
    const style = { ...styleMap[seg.type] };
    if (seg.type === "link") style.link = seg.url;
    const parts = withSymbolFont(seg.text, style.font);
    if (typeof parts === "string") return [{ text: parts, ...style }];
    return parts.map((p) => ({ ...style, ...p }));
  });
}

async function elementToPdf(element, t, theme) {
  switch (element.type) {
    case "h1": {
      const headingText = t.h1Caps ? element.content.toUpperCase() : element.content;
      const text = withSymbolFont(sanitizeText(headingText), t.fontHeading);
      if (t.colorH1Bar || t.colorH1Bg) {
        return {
          table: {
            widths: [3, "*"],
            body: [
              [
                {
                  text: "",
                  fillColor: t.colorH1Bar || t.colorH1Bg,
                  border: [false, false, false, false],
                },
                {
                  text,
                  fontSize: t.sizeH1,
                  bold: true,
                  color: t.colorH1Text,
                  fillColor: t.colorH1Bg,
                  margin: [4, 4, 4, 4],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, t.spacingH1Before, 0, t.spacingH1After],
          tocItem: true,
          tocStyle: "tocH1",
        };
      }
      return {
        text,
        fontSize: t.sizeH1,
        bold: true,
        color: t.colorH1Text,
        margin: [0, t.spacingH1Before, 0, t.spacingH1After],
        tocItem: true,
        tocStyle: "tocH1",
      };
    }
    case "h2": {
      const headingText = t.h2Caps ? element.content.toUpperCase() : element.content;
      const text = withSymbolFont(sanitizeText(headingText), t.fontHeading);
      if (t.colorH2Bar || t.colorH2Bg) {
        return {
          table: {
            widths: [2, "*"],
            body: [
              [
                {
                  text: "",
                  fillColor: t.colorH2Bar || t.colorH2Bg,
                  border: [false, false, false, false],
                },
                {
                  text,
                  fontSize: t.sizeH2,
                  bold: true,
                  color: t.colorH2Text,
                  fillColor: t.colorH2Bg,
                  margin: [4, 3, 4, 3],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, t.spacingH2Before, 0, t.spacingH2After],
          tocItem: true,
          tocStyle: "tocH2",
        };
      }
      return {
        text,
        fontSize: t.sizeH2,
        bold: true,
        color: t.colorH2Text,
        margin: [0, t.spacingH2Before, 0, t.spacingH2After],
        tocItem: true,
        tocStyle: "tocH2",
      };
    }
    case "h3":
      return {
        text: withSymbolFont(sanitizeText(element.content), t.fontHeading),
        fontSize: t.sizeH3,
        bold: true,
        color: t.colorH3Text,
        margin: [0, t.spacingH3Before, 0, t.spacingH3After],
        tocItem: true,
        tocStyle: "tocH3",
      };
    case "h4":
      return {
        text: withSymbolFont(sanitizeText(element.content), t.fontHeading),
        fontSize: t.sizeH4,
        bold: true,
        color: t.colorH4Text,
        margin: [0, t.spacingH4Before, 0, t.spacingH4After],
        tocItem: true,
        tocStyle: "tocH4",
      };
    case "paragraph":
      return {
        text: parseInlineFormatting(element.content, t),
        alignment: t.bodyAlignment === "justify" ? "justify" : undefined,
        margin: [0, 0, 0, t.spacingParaAfter],
      };
    case "blockquote": {
      const inline = parseInlineFormatting(element.content, t);
      if (t.colorBlockquoteBar || t.colorBlockquoteBg) {
        return {
          table: {
            widths: [3, "*"],
            body: [
              [
                {
                  text: "",
                  fillColor: t.colorBlockquoteBar || t.colorBlockquoteBg,
                  border: [false, false, false, false],
                },
                {
                  text: inline,
                  fillColor: t.colorBlockquoteBg,
                  alignment: t.bodyAlignment === "justify" ? "justify" : undefined,
                  margin: [5, 5, 5, 5],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 4, 0, t.spacingParaAfter],
        };
      }
      return {
        text: inline,
        alignment: t.bodyAlignment === "justify" ? "justify" : undefined,
        margin: [12, 4, 0, t.spacingParaAfter],
      };
    }
    case "bulletlist":
      return {
        ul: element.items.map((item) => ({
          text: parseInlineFormatting(typeof item === "string" ? item : item.text, t),
          font: t.fontBody,
          fontSize: t.sizeBody,
          margin: [0, 2, 0, 2],
        })),
        margin: [0, 5, 0, t.spacingParaAfter],
      };
    case "numlist": {
      const result = [];
      let i = 0;
      while (i < element.items.length) {
        const item = element.items[i];
        if (item.level !== 0) {
          i++;
          continue;
        }
        const subs = [];
        while (i + 1 < element.items.length && element.items[i + 1].level === 1) {
          i++;
          subs.push({
            text: parseInlineFormatting(element.items[i].text, t),
            font: t.fontBody,
            fontSize: t.sizeBody,
            margin: [0, 2, 0, 2],
          });
        }
        const main = {
          text: parseInlineFormatting(item.text, t),
          font: t.fontBody,
          fontSize: t.sizeBody,
          margin: [0, 2, 0, 2],
        };
        if (subs.length) {
          result.push({
            stack: [main, { ol: subs, type: "lower-alpha", margin: [10, 0, 0, 0] }],
          });
        } else {
          result.push(main);
        }
        i++;
      }
      return {
        ol: result,
        start: element.start,
        margin: [0, 5, 0, t.spacingParaAfter],
      };
    }
    case "checklist":
      return {
        stack: element.items.map((item) => ({
          text: [
            {
              text: item.checked ? "[x] " : "[ ] ",
              font: t.fontBody,
              color: item.checked ? `#${COLORS.checklistChecked}` : t.colorMuted,
            },
            ...parseInlineFormatting(item.text, t),
          ],
          margin: [10, 2, 0, 2],
        })),
        margin: [0, 5, 0, t.spacingParaAfter],
      };
    case "codeblock": {
      const lines = highlightCodeTokens(element.content, element.language);
      const textContent = [];
      lines.forEach((tokens, i) => {
        for (const { text, tokenType } of tokens) {
          textContent.push({
            text,
            font: t.fontMono,
            fontSize: t.sizeMono,
            color: t.syntax[tokenType] || t.syntax.default || t.colorText,
            preserveLeadingSpaces: true,
          });
        }
        if (i < lines.length - 1) {
          textContent.push({ text: "\n", font: t.fontMono, fontSize: t.sizeMono });
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
                    fillColor: t.colorCodeBg,
                    border: [true, true, true, true],
                    borderColor: [
                      t.colorCodeBorder,
                      t.colorCodeBorder,
                      t.colorCodeBorder,
                      t.colorCodeBorder,
                    ],
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => t.colorCodeBorder,
              vLineColor: () => t.colorCodeBorder,
            },
          },
        ],
        margin: [0, 5, 0, t.spacingParaAfter],
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
    case "table":
      return {
        table: {
          headerRows: 1,
          widths: Array(element.rows[0]?.length || 1).fill("*"),
          body: element.rows.map((row, rowIdx) =>
            row.map((cell, colIdx) => ({
              text: parseInlineFormatting(cell, {
                ...t,
                sizeBody: t.sizeTable,
                sizeMono: t.sizeTable - 2,
              }),
              font: t.fontBody,
              fontSize: t.sizeTable,
              fillColor: rowIdx === 0 ? t.colorTableHeader : null,
              bold: rowIdx === 0 || colIdx === 0,
              margin: [4, 3, 4, 3],
            }))
          ),
        },
        layout: {
          hLineColor: () => t.colorTableBorder,
          vLineColor: () => t.colorTableBorder,
        },
        margin: [0, 5, 0, t.spacingParaAfter],
      };
    case "hr": {
      const hrWidth = A4_WIDTH - 2 * t.marginPage;
      return {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: hrWidth,
            y2: 0,
            lineWidth: 1,
            lineColor: t.colorMuted,
          },
        ],
        margin: [0, 15, 0, 15],
      };
    }
    default:
      return null;
  }
}

function createTitlePageContent(metadata, t, logoPng) {
  const content = [];

  if (logoPng) {
    const logoWidth = t.titlePage.logoSize?.width
      ? Math.round(t.titlePage.logoSize.width * 0.6)
      : 130;
    content.push({
      image: logoPng,
      width: logoWidth,
      margin: [0, 0, 0, 40],
    });
  }

  for (let i = 0; i < (t.titlePage.verticalSpacing || 5); i++) {
    content.push({ text: " ", fontSize: 20 });
  }

  if (metadata.title) {
    content.push({
      text: withSymbolFont(sanitizeText(metadata.title), t.fontHeading),
      fontSize: t.sizeTitle,
      bold: true,
      color: t.colorPrimary,
      margin: [0, 0, 0, 10],
    });

    if (t.titlePage.showLine) {
      if (t.titlePage.lineChar && t.titlePage.lineLength) {
        content.push({
          text: sanitizeText(t.titlePage.lineChar.repeat(t.titlePage.lineLength)),
          font: t.fontBody,
          fontSize: t.sizeBody,
          color: t.colorPrimary,
          margin: [0, 10, 0, 20],
        });
      } else {
        content.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 200,
              y2: 0,
              lineWidth: 3,
              lineColor: t.colorPrimary,
            },
          ],
          margin: [0, 10, 0, 20],
        });
      }
    }
  }

  if (metadata.subtitle) {
    content.push({
      text: withSymbolFont(sanitizeText(metadata.subtitle), t.fontBody),
      fontSize: t.sizeSubtitle,
      color: t.colorSecondary,
      margin: [0, 15, 0, 5],
    });
  }

  if (metadata.author) {
    content.push({
      text: withSymbolFont(sanitizeText(metadata.author), t.fontBody),
      fontSize: t.sizeSubtitle,
      color: t.colorSecondary,
      margin: [0, 20, 0, 5],
    });
  }

  if (metadata.date) {
    content.push({
      text: withSymbolFont(sanitizeText(metadata.date), t.fontBody),
      fontSize: t.sizeBody,
      color: t.colorMuted,
      margin: [0, 0, 0, 0],
    });
  }

  content.push({ text: "", pageBreak: "after" });
  return content;
}

function createTocContent(tocTitle, t) {
  return [
    {
      text: withSymbolFont(sanitizeText(tocTitle), t.fontHeading),
      fontSize: t.sizeH1,
      bold: true,
      color: t.colorPrimary,
      margin: [0, 0, 0, 20],
    },
    {
      toc: {
        title: { text: "" },
        numberStyle: { color: t.colorMuted },
      },
    },
    { text: "", pageBreak: "after" },
  ];
}

function buildHeaderFn(t, showTitlePage, showToc, headerLogoPng, metadata) {
  return (currentPage) => {
    if (showTitlePage && currentPage === 1) return null;
    if (showToc && showTitlePage && currentPage === 2) return null;
    if (showToc && !showTitlePage && currentPage === 1) return null;

    const logoPos = t.header.logoPosition || "left";
    const logoWidth = t.header.logoSize?.width ? Math.round(t.header.logoSize.width * 1.1) : 80;
    const showTitle = t.header.showTitle && metadata.title;

    if (!headerLogoPng && !showTitle) return null;

    const logoCol = headerLogoPng
      ? { image: headerLogoPng, width: logoWidth, opacity: 0.6 }
      : { text: "" };

    const titleCol = showTitle
      ? {
          text: withSymbolFont(sanitizeText(metadata.title), t.fontBody),
          fontSize: t.sizeSmall,
          italics: true,
          color: t.colorMuted,
          alignment: logoPos === "left" ? "right" : "left",
        }
      : { text: "" };

    const columns =
      logoPos === "right"
        ? [{ ...titleCol, width: "*" }, logoCol]
        : [logoCol, { ...titleCol, width: "*" }];

    return {
      columns,
      margin: [t.marginPage, 20, t.marginPage, 0],
    };
  };
}

function buildFooterFn(t, showTitlePage) {
  return (currentPage) => {
    if (showTitlePage && currentPage === 1) return null;

    const footerContent = [];
    const parts = [];
    if (t.footer.left) parts.push(sanitizeText(t.footer.left));
    if (t.footer.center) parts.push(sanitizeText(t.footer.center));

    if (parts.length > 0) {
      footerContent.push({
        text: withSymbolFont(parts.join(" \u00B7 "), t.fontBody),
        fontSize: t.sizeSmall,
        color: t.colorMuted,
        alignment: "center",
        margin: [0, 0, 0, 5],
      });
    }

    if (t.footer.showPageNumber) {
      footerContent.push({
        text: `Page ${currentPage}`,
        font: t.fontBody,
        fontSize: t.sizeSmall,
        color: t.colorMuted,
        alignment: "center",
      });
    }

    return {
      stack: footerContent,
      margin: [t.marginPage, 10, t.marginPage, 0],
    };
  };
}

export async function generatePdfBlob(metadata, elements, themeId = "kyotu", options = {}) {
  const theme = await getThemeOrTemplate(themeId);

  await registerPdfFonts(theme);

  const t = pdfThemeAdapter(theme);

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
    content.push(...createTitlePageContent(metadata, t, titleLogoPng));
  }

  if (showToc) {
    const tocTitle = metadata["toc-title"] || "Table of Contents";
    content.push(...createTocContent(tocTitle, t));
  }

  for (const el of elements) {
    const result = await elementToPdf(el, t, theme);
    if (result) content.push(result);
  }

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [
      t.marginPage,
      showHeader ? 60 : t.marginPageTop,
      t.marginPage,
      showFooter ? 60 : t.marginPage,
    ],

    header: showHeader
      ? buildHeaderFn(t, showTitlePage, showToc, headerLogoPng, metadata)
      : undefined,

    footer: showFooter ? buildFooterFn(t, showTitlePage) : undefined,

    content,

    styles: {
      tocH1: {
        font: t.fontHeading,
        fontSize: t.sizeH3,
        bold: true,
        margin: [0, 5, 0, 2],
      },
      tocH2: { font: t.fontBody, fontSize: t.sizeBody, margin: [10, 2, 0, 2] },
      tocH3: { font: t.fontBody, fontSize: t.sizeTable, margin: [20, 2, 0, 2] },
      tocH4: {
        font: t.fontBody,
        fontSize: t.sizeTable,
        italics: true,
        margin: [30, 2, 0, 2],
      },
    },

    defaultStyle: {
      font: t.fontBody,
      fontSize: t.sizeBody,
      color: t.colorText,
      lineHeight: 1.4,
    },
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return pdfDoc.getBlob();
}
