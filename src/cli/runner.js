import "./cdn-shim.js";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, basename } from "node:path";

const SUPPORTED_THEMES = new Set(["kyotu", "kyotu-mini", "kyotu-pro", "minimal", "mini"]);
const SUPPORTED_FORMATS = new Set(["docx", "pdf", "html"]);

async function buildIncludeMap(inputPath) {
  const dir = dirname(inputPath);
  const entries = await readdir(dir, { withFileTypes: true });
  const map = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    if (entry.name === basename(inputPath)) continue;
    const content = await readFile(join(dir, entry.name), "utf8");
    map.set(entry.name, content);
    map.set(entry.name.replace(/\.md$/, ""), content);
  }
  return map;
}

async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function convert({
  inputPath,
  format = "docx",
  theme = "kyotu-pro",
  resolveIncludesFlag = false,
  showTitlePage = false,
  showToc = false,
  showHeader = false,
  showFooter = false,
}) {
  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error(`Unknown format "${format}". Supported: ${[...SUPPORTED_FORMATS].join(", ")}`);
  }
  if (!SUPPORTED_THEMES.has(theme)) {
    throw new Error(`Unknown theme "${theme}". Supported: ${[...SUPPORTED_THEMES].join(", ")}`);
  }

  let source = await readFile(inputPath, "utf8");

  if (resolveIncludesFlag) {
    const { resolveIncludes } = await import("../file-explorer/resolver.js");
    const map = await buildIncludeMap(inputPath);
    source = resolveIncludes(source, map);
  }

  const { parseMarkdown, parseBodyToElements } = await import("../parser.js");
  const { metadata, body } = parseMarkdown(source);
  const elements = parseBodyToElements(body);

  const renderOptions = { showTitlePage, showToc, showHeader, showFooter };

  if (format === "docx") {
    const { generateDocxBlob } = await import("../docx-renderer.js");
    const blob = await generateDocxBlob(metadata, elements, theme, renderOptions);
    return { buffer: await blobToBuffer(blob), extension: "docx" };
  }

  if (format === "pdf") {
    const { generatePdfBlob } = await import("../pdf-renderer.js");
    const blob = await generatePdfBlob(metadata, elements, theme, renderOptions);
    return { buffer: await blobToBuffer(blob), extension: "pdf" };
  }

  const { generateHtmlBlob } = await import("../html-export.js");
  const blob = await generateHtmlBlob(elements, metadata, theme);
  return { buffer: await blobToBuffer(blob), extension: "html" };
}
