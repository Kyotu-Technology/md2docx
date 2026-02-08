import * as cheerio from "cheerio";

export class HtmlValidator {
  /**
   * Parse HTML string into a cheerio instance for querying.
   */
  parse(html) {
    return cheerio.load(html);
  }

  /**
   * Parse HTML from a buffer.
   */
  parseBuffer(buffer) {
    const html = buffer.toString("utf-8");
    return this.parse(html);
  }

  /**
   * Get all headings from the HTML grouped by level.
   */
  getHeadings($) {
    const headings = {};
    for (let i = 1; i <= 6; i++) {
      const tag = `h${i}`;
      const found = $(tag)
        .map((_, el) => $(el).text().trim())
        .get();
      if (found.length > 0) headings[tag] = found;
    }
    return headings;
  }

  /**
   * Get bullet list items.
   */
  getBulletListItems($) {
    return $("ul:not(.checklist) > li")
      .map((_, el) => $(el).text().trim())
      .get();
  }

  /**
   * Get numbered list items.
   */
  getNumberedListItems($) {
    return $("ol > li")
      .map((_, el) => $(el).text().trim())
      .get();
  }

  /**
   * Get table data as array of arrays.
   */
  getTableData($) {
    return $("table")
      .map((_, table) => {
        const rows = $(table)
          .find("tr")
          .map((_, tr) => {
            return [
              $(tr)
                .find("th, td")
                .map((_, cell) => $(cell).text().trim())
                .get(),
            ];
          })
          .get();
        return [rows];
      })
      .get();
  }

  /**
   * Check if a specific CSS class is present on any element.
   */
  hasClass($, className) {
    return $(`.${className}`).length > 0;
  }
}
