import { getThemeOrTemplate } from "./themes/index.js";
import { highlightCode } from "./highlighter.js";
import { renderMermaidDiagram, applyMermaidTheme } from "./mermaid.js";
import { COLORS } from "./constants.js";
import { loadLogoPng } from "./logo.js";
import { parseInlineSegments } from "./inline-formatting.js";

const getDocx = () => window.docx;

function dataUrlToBase64(dataUrl) {
  return dataUrl ? dataUrl.split(",")[1] : null;
}

function themeAdapter(theme) {
  return {
    fontHeading: theme.fonts.heading,
    fontBody: theme.fonts.body,
    fontMono: theme.fonts.mono,
    colorPrimary: theme.colors.primary,
    colorSecondary: theme.colors.secondary,
    colorAccent: theme.colors.accent,
    colorMuted: theme.colors.muted,
    colorText: theme.colors.text,
    colorBold: theme.colors.bold || COLORS.boldFallback,
    colorTableHeader: theme.colors.tableHeader,
    colorTableBorder: theme.colors.tableBorder,
    colorCodeBg: theme.colors.codeBg,
    colorCodeBorder: theme.colors.codeBorder,
    sizeTitle: theme.sizes.title,
    sizeSubtitle: theme.sizes.subtitle,
    sizeH1: theme.sizes.h1,
    sizeH2: theme.sizes.h2,
    sizeH3: theme.sizes.h3,
    sizeH4: theme.sizes.h4,
    sizeBody: theme.sizes.body,
    sizeTable: theme.sizes.table,
    sizeSmall: theme.sizes.small,
    sizeMono: theme.sizes.mono,
    marginPage: theme.spacing.marginPage,
    marginPageTop: theme.spacing.marginPageTop,
    spacingParaAfter: theme.spacing.paraAfter,
    spacingH1Before: theme.spacing.h1Before,
    spacingH1After: theme.spacing.h1After,
    spacingH2Before: theme.spacing.h2Before,
    spacingH2After: theme.spacing.h2After,
    spacingH3Before: theme.spacing.h3Before,
    spacingH3After: theme.spacing.h3After,
    spacingH4Before: theme.spacing.h4Before,
    spacingH4After: theme.spacing.h4After,
    syntax: theme.syntax,
  };
}

export function parseInlineFormatting(text, t) {
  const { TextRun, ShadingType } = getDocx();
  const boldColor = t.colorBold || COLORS.boldFallback;
  const segments = parseInlineSegments(text);

  const styleMap = {
    plain: {},
    bold: { bold: true, color: boldColor },
    italic: { italics: true },
    boldItalic: { bold: true, italics: true, color: boldColor },
    code: {
      font: t.fontMono,
      size: t.sizeMono,
      shading: { fill: t.colorCodeBg, type: ShadingType.CLEAR },
    },
    link: { color: t.colorAccent, underline: {} },
  };

  return segments.map(
    (seg) =>
      new TextRun({
        text: seg.text,
        font: t.fontBody,
        size: t.sizeBody,
        ...styleMap[seg.type],
      })
  );
}

async function createTitlePage(metadata, theme, t, logoPng) {
  const { Paragraph, TextRun, AlignmentType, PageBreak, ImageRun, BorderStyle } = getDocx();
  const children = [];

  if (theme.titlePage.showLogo && logoPng) {
    const logoSize = theme.titlePage.logoSize || { width: 180, height: 76 };
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 800 },
        children: [
          new ImageRun({
            type: "png",
            data: Uint8Array.from(atob(logoPng), (c) => c.charCodeAt(0)),
            transformation: logoSize,
          }),
        ],
      })
    );
  }

  for (let i = 0; i < theme.titlePage.verticalSpacing; i++) {
    children.push(new Paragraph({ children: [] }));
  }

  if (metadata.title) {
    const titlePara = {
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: metadata.title,
          font: t.fontHeading,
          size: t.sizeTitle,
          color: t.colorPrimary,
          bold: true,
        }),
      ],
    };

    if (theme.titlePage.showLine) {
      titlePara.border = {
        bottom: { style: BorderStyle.SINGLE, size: 24, color: t.colorPrimary, space: 8 },
      };
    }

    children.push(new Paragraph(titlePara));
  }

  if (theme.titlePage.showLine && theme.titlePage.lineChar) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({
            text: theme.titlePage.lineChar.repeat(theme.titlePage.lineLength || 40),
            font: t.fontBody,
            size: t.sizeBody,
            color: t.colorMuted,
          }),
        ],
      })
    );
  }

  if (metadata.subtitle) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: metadata.subtitle,
            font: t.fontBody,
            size: t.sizeSubtitle,
            color: t.colorSecondary,
          }),
        ],
      })
    );
  }

  if (metadata.author) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: metadata.author,
            font: t.fontBody,
            size: t.sizeSubtitle,
            color: t.colorSecondary,
          }),
        ],
      })
    );
  }

  if (metadata.date) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: metadata.date,
            font: t.fontBody,
            size: t.sizeBody,
            color: t.colorMuted,
          }),
        ],
      })
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

function createTOC(tocTitle, t) {
  const { Paragraph, TextRun, TableOfContents, PageBreak } = getDocx();
  return [
    new Paragraph({
      spacing: { after: t.spacingH1After },
      children: [
        new TextRun({
          text: tocTitle,
          font: t.fontHeading,
          size: t.sizeH1,
          color: t.colorPrimary,
          bold: true,
        }),
      ],
    }),
    new TableOfContents("TOC", { hyperlink: true, headingStyleRange: "1-4" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createHeader(metadata, theme, t, logoPng) {
  const {
    Header,
    Paragraph,
    TextRun,
    AlignmentType,
    ImageRun,
    HorizontalPositionRelativeFrom,
    VerticalPositionRelativeFrom,
    TextWrappingType,
  } = getDocx();

  if (!theme.header.showLogo && !theme.header.showTitle) {
    return new Header({ children: [] });
  }

  if (theme.header.showLogo && logoPng) {
    const cmToEmu = 360000;
    const xOffsetCm = 0.7;
    const yOffsetCm = 0.5;

    return new Header({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: Uint8Array.from(atob(logoPng), (c) => c.charCodeAt(0)),
              transformation: {
                width: Math.round(3.65 * 37.8),
                height: Math.round(1.6 * 37.8),
              },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: Math.round(xOffsetCm * cmToEmu),
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: Math.round(yOffsetCm * cmToEmu),
                },
                wrap: { type: TextWrappingType.NONE },
                behindDocument: false,
              },
            }),
          ],
        }),
      ],
    });
  }

  if (theme.header.showTitle) {
    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: metadata.title || "",
              font: t.fontBody,
              size: t.sizeSmall,
              color: t.colorMuted,
              italics: true,
            }),
          ],
        }),
      ],
    });
  }

  return new Header({ children: [] });
}

function createFooter(theme, t) {
  const { Footer, Paragraph, TextRun, PageNumber, AlignmentType } = getDocx();

  const hasLeft = theme.footer.left && theme.footer.left.length > 0;
  const hasCenter = theme.footer.center && theme.footer.center.length > 0;
  const hasRight = theme.footer.showPageNumber;

  if (!hasLeft && !hasCenter && !hasRight) {
    return new Footer({ children: [] });
  }

  const children = [];

  const line1Parts = [];
  if (hasLeft) line1Parts.push(theme.footer.left);
  if (hasCenter) line1Parts.push(theme.footer.center);
  const line1Text = line1Parts.join(" · ");

  if (line1Text) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: line1Text,
            font: t.fontBody,
            size: t.sizeSmall,
            color: t.colorMuted,
          }),
        ],
      })
    );
  }

  if (hasRight) {
    children.push(new Paragraph({ children: [] }));
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Page ",
            font: t.fontBody,
            size: t.sizeSmall,
            color: t.colorMuted,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: t.fontBody,
            size: t.sizeSmall,
            color: t.colorMuted,
          }),
        ],
      })
    );
  }

  return new Footer({ children });
}

async function elementToDocx(element, theme, t) {
  const {
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    WidthType,
    ShadingType,
    AlignmentType,
    ImageRun,
  } = getDocx();

  switch (element.type) {
    case "h1":
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: t.spacingH1Before, after: t.spacingH1After },
        children: [
          new TextRun({
            text: element.content,
            font: t.fontHeading,
            size: t.sizeH1,
            color: t.colorPrimary,
            bold: true,
          }),
        ],
      });
    case "h2":
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: t.spacingH2Before, after: t.spacingH2After },
        children: [
          new TextRun({
            text: element.content,
            font: t.fontHeading,
            size: t.sizeH2,
            color: t.colorPrimary,
            bold: true,
          }),
        ],
      });
    case "h3":
      return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: t.spacingH3Before, after: t.spacingH3After },
        children: [
          new TextRun({
            text: element.content,
            font: t.fontHeading,
            size: t.sizeH3,
            color: t.colorPrimary,
            bold: true,
          }),
        ],
      });
    case "h4":
      return new Paragraph({
        heading: HeadingLevel.HEADING_4,
        spacing: { before: t.spacingH4Before, after: t.spacingH4After },
        children: [
          new TextRun({
            text: element.content,
            font: t.fontHeading,
            size: t.sizeH4,
            color: t.colorPrimary,
            bold: true,
          }),
        ],
      });
    case "paragraph":
      return new Paragraph({
        spacing: { after: t.spacingParaAfter, line: 276 },
        children: parseInlineFormatting(element.content, t),
      });
    case "bulletlist":
      return element.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 80 },
            children: parseInlineFormatting(item, t),
          })
      );
    case "numlist":
      return element.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: `numbers-${element.listId}`, level: 0 },
            spacing: { after: 80 },
            children: parseInlineFormatting(item, t),
          })
      );
    case "checklist":
      return element.items.map(
        (item) =>
          new Paragraph({
            spacing: { after: 80 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: (item.checked ? "☑" : "☐") + " ",
                font: t.fontBody,
                size: t.sizeBody,
                color: item.checked ? COLORS.checklistChecked : t.colorMuted,
              }),
              ...parseInlineFormatting(item.text, t),
            ],
          })
      );
    case "codeblock": {
      const lines = highlightCode(
        element.content,
        element.language,
        theme.syntax,
        t.fontMono,
        t.sizeMono
      );
      const codeChildren = [];
      lines.forEach((runs, idx) => {
        codeChildren.push(...runs);
        if (idx < lines.length - 1) codeChildren.push(new TextRun({ break: 1 }));
      });
      return new Paragraph({
        spacing: { before: 200, after: 200 },
        shading: { fill: t.colorCodeBg, type: ShadingType.CLEAR },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: t.colorCodeBorder },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: t.colorCodeBorder },
          left: { style: BorderStyle.SINGLE, size: 1, color: t.colorCodeBorder },
          right: { style: BorderStyle.SINGLE, size: 1, color: t.colorCodeBorder },
        },
        children: codeChildren,
      });
    }
    case "mermaid":
      try {
        const mermaidCode = applyMermaidTheme(element.content, theme);
        const { buffer, width, height } = await renderMermaidDiagram(mermaidCode);
        return new Paragraph({
          spacing: { before: 200, after: 200 },
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: "png",
              data: buffer,
              transformation: { width: 450, height: Math.round((450 * height) / width) },
              altText: { title: "Diagram", description: element.content, name: "mermaid" },
            }),
          ],
        });
      } catch (err) {
        return new Paragraph({
          spacing: { before: 200, after: 200 },
          shading: { fill: t.colorCodeBg, type: ShadingType.CLEAR },
          children: [
            new TextRun({
              text: "[Diagram error: " + err.message + "]",
              font: t.fontMono,
              size: t.sizeMono,
              bold: true,
              color: COLORS.error,
            }),
            new TextRun({ break: 1 }),
            new TextRun({ text: element.content, font: t.fontMono, size: t.sizeMono }),
          ],
        });
      }
    case "table": {
      const border = { style: BorderStyle.SINGLE, size: 1, color: t.colorTableBorder };
      const borders = { top: border, bottom: border, left: border, right: border };
      const colCount = element.rows[0]?.length || 1;
      const colWidth = Math.floor(9360 / colCount);
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: Array(colCount).fill(colWidth),
        rows: element.rows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map((cell, colIdx) => {
                const isHeader = rowIdx === 0;
                const isFirstCol = colIdx === 0;
                const cellRuns = parseInlineFormatting(cell, {
                  ...t,
                  sizeBody: t.sizeTable,
                  sizeMono: t.sizeTable - 2,
                });
                if (isHeader || isFirstCol)
                  cellRuns.forEach((run) => {
                    if (run.properties) run.properties.bold = true;
                  });
                return new TableCell({
                  borders,
                  width: { size: colWidth, type: WidthType.DXA },
                  shading: isHeader
                    ? { fill: t.colorTableHeader, type: ShadingType.CLEAR }
                    : undefined,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: cellRuns })],
                });
              }),
            })
        ),
      });
    }
    case "hr":
      return new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: t.colorMuted, space: 1 } },
        children: [],
      });
    default:
      return null;
  }
}

export async function createDocument(metadata, elements, themeId = "kyotu", options = {}) {
  const { Document, Header, Footer, AlignmentType, LevelFormat } = getDocx();

  const theme = await getThemeOrTemplate(themeId);
  const t = themeAdapter(theme);

  const showTitlePage = options.showTitlePage !== false;
  const showToc = options.showToc !== false;
  const showHeader = options.showHeader !== false;
  const showFooter = options.showFooter !== false;
  const customLogo = options.customLogo || null;

  const hasLogo = customLogo || theme.titlePage.showLogo || theme.header.showLogo;
  const titleLogoPng =
    showTitlePage && hasLogo ? dataUrlToBase64(await loadLogoPng(1, customLogo)) : null;
  const headerLogoPng =
    showHeader && hasLogo ? dataUrlToBase64(await loadLogoPng(0.6, customLogo)) : null;

  const bodyChildren = [];
  const numListIds = elements.filter((el) => el.type === "numlist").map((el) => el.listId);

  for (const el of elements) {
    const result = await elementToDocx(el, theme, t);
    if (Array.isArray(result)) bodyChildren.push(...result);
    else if (result) bodyChildren.push(result);
  }

  const tocTitle = metadata["toc-title"] || "Table of Contents";
  const numberingConfigs = [
    {
      reference: "bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
    ...numListIds.map((id) => ({
      reference: `numbers-${id}`,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    })),
  ];

  const sections = [];

  if (showTitlePage) {
    const titlePageChildren = await createTitlePage(metadata, theme, t, titleLogoPng);
    sections.push({
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: titlePageChildren,
    });
  }

  if (showToc) {
    sections.push({
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: {
            top: t.marginPageTop,
            right: t.marginPage,
            bottom: t.marginPage,
            left: t.marginPage,
            footer: 283,
          },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: { default: showFooter ? createFooter(theme, t) : new Footer({ children: [] }) },
      children: createTOC(tocTitle, t),
    });
  }

  sections.push({
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: {
          top: t.marginPageTop,
          right: t.marginPage,
          bottom: t.marginPage,
          left: t.marginPage,
          footer: 283,
        },
      },
    },
    headers: {
      default: showHeader
        ? createHeader(metadata, theme, t, headerLogoPng)
        : new Header({ children: [] }),
    },
    footers: { default: showFooter ? createFooter(theme, t) : new Footer({ children: [] }) },
    children: bodyChildren,
  });

  return new Document({
    styles: {
      default: { document: { run: { font: t.fontBody, size: t.sizeBody } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: t.fontHeading, size: t.sizeH1, bold: true, color: t.colorPrimary },
          paragraph: {
            spacing: { before: t.spacingH1Before, after: t.spacingH1After },
            outlineLevel: 0,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: t.fontHeading, size: t.sizeH2, bold: true, color: t.colorPrimary },
          paragraph: {
            spacing: { before: t.spacingH2Before, after: t.spacingH2After },
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: t.fontHeading, size: t.sizeH3, bold: true, color: t.colorPrimary },
          paragraph: {
            spacing: { before: t.spacingH3Before, after: t.spacingH3After },
            outlineLevel: 2,
          },
        },
        {
          id: "Heading4",
          name: "Heading 4",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: t.fontHeading, size: t.sizeH4, bold: true, color: t.colorPrimary },
          paragraph: {
            spacing: { before: t.spacingH4Before, after: t.spacingH4After },
            outlineLevel: 3,
          },
        },
        {
          id: "TOC1",
          name: "toc 1",
          basedOn: "Normal",
          run: { font: t.fontHeading, size: 24, bold: true, color: t.colorPrimary },
          paragraph: { spacing: { before: 200, after: 80 } },
        },
        {
          id: "TOC2",
          name: "toc 2",
          basedOn: "Normal",
          run: { font: t.fontBody, size: 22, color: t.colorText },
          paragraph: { spacing: { before: 60, after: 40 }, indent: { left: 360 } },
        },
        {
          id: "TOC3",
          name: "toc 3",
          basedOn: "Normal",
          run: { font: t.fontBody, size: 20, color: t.colorSecondary },
          paragraph: { spacing: { before: 40, after: 40 }, indent: { left: 720 } },
        },
        {
          id: "TOC4",
          name: "toc 4",
          basedOn: "Normal",
          run: { font: t.fontBody, size: 18, color: t.colorSecondary, italics: true },
          paragraph: { spacing: { before: 20, after: 20 }, indent: { left: 1080 } },
        },
      ],
    },
    numbering: { config: numberingConfigs },
    sections,
  });
}

export async function generateDocxBlob(metadata, elements, themeId = "kyotu", options = {}) {
  const { Packer } = getDocx();
  const doc = await createDocument(metadata, elements, themeId, options);
  return await Packer.toBlob(doc);
}
