import pdfParse from "pdf-parse";

export class PdfValidator {
  /**
   * Parse PDF buffer and extract text + metadata.
   */
  async parse(buffer) {
    // pdf-parse v2 accepts Buffer or Uint8Array
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
    };
  }

  /**
   * Extract just the text content from a PDF.
   */
  async getText(buffer) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  /**
   * Get page count.
   */
  async getPageCount(buffer) {
    const data = await pdfParse(buffer);
    return data.numpages;
  }

  /**
   * Verify that specific text content exists in the PDF.
   */
  async containsText(buffer, expectedText) {
    const text = await this.getText(buffer);
    return text.includes(expectedText);
  }
}
