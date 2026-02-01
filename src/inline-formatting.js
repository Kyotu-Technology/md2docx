/**
 * Shared inline markdown formatting patterns and parser.
 * Used by DOCX and PDF renderers for consistent formatting.
 */

export const INLINE_PATTERNS = [
  { regex: /\*\*\*(.+?)\*\*\*/g, type: "boldItalic" },
  { regex: /\*\*(.+?)\*\*/g, type: "bold" },
  { regex: /\*(.+?)\*/g, type: "italic" },
  { regex: /_(.+?)_/g, type: "italic" },
  { regex: /`(.+?)`/g, type: "code" },
  { regex: /\[(.+?)\]\((.+?)\)/g, type: "link" },
];

/**
 * Parse inline markdown formatting and return an array of format-agnostic segments.
 * Each segment: { text, type, url? }
 * type is one of: "plain", "bold", "italic", "boldItalic", "code", "link"
 *
 * Uses match-collect-sort-filter algorithm to handle overlapping patterns correctly.
 */
export function parseInlineSegments(text) {
  const allMatches = [];
  for (const p of INLINE_PATTERNS) {
    const regex = new RegExp(p.regex.source, "g");
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        url: match[2],
        type: p.type,
      });
    }
  }

  allMatches.sort((a, b) => a.start - b.start);
  const filtered = [];
  let lastEnd = 0;
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  const segments = [];
  let cursor = 0;
  for (const m of filtered) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start), type: "plain" });
    }
    segments.push({ text: m.content, type: m.type, url: m.url });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: "plain" });
  }

  return segments.length > 0 ? segments : [{ text, type: "plain" }];
}
