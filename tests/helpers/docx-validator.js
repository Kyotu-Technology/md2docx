import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["w:p", "w:r", "w:t", "w:tbl", "w:tr", "w:tc"].includes(name),
});

export class DocxValidator {
  /**
   * Parse DOCX buffer into structured data for assertions.
   */
  async parse(buffer) {
    const zip = await JSZip.loadAsync(buffer);

    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) throw new Error("Missing word/document.xml in DOCX");

    const stylesXml = await zip.file("word/styles.xml")?.async("string");
    const numberingXml = await zip.file("word/numbering.xml")?.async("string");

    const doc = parser.parse(docXml);
    const styles = stylesXml ? parser.parse(stylesXml) : null;
    const numbering = numberingXml ? parser.parse(numberingXml) : null;

    return { zip, doc, styles, numbering, xml: docXml };
  }

  /**
   * Convert DOCX to HTML via mammoth for content-level assertions.
   */
  async toHtml(buffer) {
    const result = await mammoth.convertToHtml({ buffer });
    return { html: result.value, warnings: result.messages };
  }

  /**
   * Extract plain text from DOCX via mammoth.
   */
  async toText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Get all paragraphs from parsed DOCX document.
   */
  getParagraphs(doc) {
    const body = doc["w:document"]?.["w:body"];
    if (!body) return [];
    return body["w:p"] || [];
  }

  /**
   * Get paragraph style ID (e.g., "Heading1", "ListParagraph").
   */
  getParagraphStyle(paragraph) {
    return paragraph["w:pPr"]?.["w:pStyle"]?.["@_w:val"] || null;
  }

  /**
   * Get text content of a paragraph.
   */
  getParagraphText(paragraph) {
    const runs = paragraph["w:r"] || [];
    return runs
      .map((r) => {
        const texts = r["w:t"] || [];
        return texts.map((t) => (typeof t === "string" ? t : t["#text"] || "")).join("");
      })
      .join("");
  }

  /**
   * Check if paragraph has numbering (bullet or numbered list).
   */
  hasNumbering(paragraph) {
    return !!paragraph["w:pPr"]?.["w:numPr"];
  }

  /**
   * Get numbering level and ID.
   */
  getNumberingInfo(paragraph) {
    const numPr = paragraph["w:pPr"]?.["w:numPr"];
    if (!numPr) return null;
    return {
      numId: numPr["w:numId"]?.["@_w:val"],
      level: numPr["w:ilvl"]?.["@_w:val"] || "0",
    };
  }

  /**
   * Verify that required DOCX files exist in the archive.
   */
  async verifyStructure(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const requiredFiles = [
      "[Content_Types].xml",
      "word/document.xml",
      "word/styles.xml",
      "_rels/.rels",
    ];
    const missing = [];
    for (const f of requiredFiles) {
      if (!zip.file(f)) missing.push(f);
    }
    return { valid: missing.length === 0, missing };
  }

  /**
   * Count headings by level in the document.
   */
  countHeadings(doc) {
    const paragraphs = this.getParagraphs(doc);
    const counts = {};
    for (const p of paragraphs) {
      const style = this.getParagraphStyle(p);
      if (style && /^Heading\d$/.test(style)) {
        counts[style] = (counts[style] || 0) + 1;
      }
    }
    return counts;
  }

  /**
   * Find all paragraphs with a given style.
   */
  findByStyle(doc, styleName) {
    return this.getParagraphs(doc).filter((p) => this.getParagraphStyle(p) === styleName);
  }

  getImageExtents(doc) {
    const paragraphs = this.getParagraphs(doc);
    const extents = [];
    for (const p of paragraphs) {
      const runs = p["w:r"] || [];
      for (const r of runs) {
        const drawing = r["w:drawing"];
        if (!drawing) continue;
        const inline = drawing["wp:inline"];
        if (!inline) continue;
        const extent = inline["wp:extent"];
        if (!extent) continue;
        extents.push({
          cx: parseInt(extent["@_cx"], 10),
          cy: parseInt(extent["@_cy"], 10),
        });
      }
    }
    return extents;
  }
}
