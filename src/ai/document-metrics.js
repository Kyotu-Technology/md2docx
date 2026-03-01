import { parseInlineSegments } from "../inline-formatting.js";

const RE_HEADING = /^h([1-4])$/;
const RE_HAS_INLINE_MARKERS = /[*_`\[]/;

function zeroCounts() {
  return { chars: 0, charsNoSpaces: 0, words: 0 };
}

function stripInlineMarkdown(text) {
  if (!RE_HAS_INLINE_MARKERS.test(text)) return text;
  const segments = parseInlineSegments(text);
  let result = "";
  for (const s of segments) result += s.text;
  return result;
}

function countText(cleanText) {
  const len = cleanText.length;
  let charsNoSpaces = 0;
  let words = 0;
  let inWord = false;
  for (let i = 0; i < len; i++) {
    const ch = cleanText.charCodeAt(i);
    const isSpace = ch === 32 || ch === 9 || ch === 10 || ch === 13;
    if (!isSpace) {
      charsNoSpaces++;
      if (!inWord) {
        words++;
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }
  return { chars: len, charsNoSpaces, words };
}

function addCounts(target, source) {
  target.chars += source.chars;
  target.charsNoSpaces += source.charsNoSpaces;
  target.words += source.words;
}

function countAndAdd(target, text, strip = true) {
  addCounts(target, countText(strip ? stripInlineMarkdown(text) : text));
}

function validateHeadingHierarchy(elements) {
  const issues = [];
  let lastLevel = 0;
  for (const el of elements) {
    const match = el.type.match(RE_HEADING);
    if (!match) continue;
    const level = parseInt(match[1]);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        content: el.content,
        expected: `h${lastLevel + 1}`,
        got: el.type,
        line: el.line,
      });
    }
    lastLevel = level;
  }
  return issues;
}

export function analyzeDocumentMetrics(elements, metadata) {
  const categories = {
    titlePage: zeroCounts(),
    headings: zeroCounts(),
    body: zeroCounts(),
    lists: zeroCounts(),
    tables: zeroCounts(),
    code: zeroCounts(),
  };
  let diagrams = 0;

  for (const el of elements) {
    if (RE_HEADING.test(el.type)) {
      countAndAdd(categories.headings, el.content);
    } else if (el.type === "paragraph") {
      countAndAdd(categories.body, el.content);
    } else if (el.type === "bulletlist" || el.type === "numlist") {
      for (const item of el.items) countAndAdd(categories.lists, item);
    } else if (el.type === "checklist") {
      for (const item of el.items) countAndAdd(categories.lists, item.text || "");
    } else if (el.type === "table") {
      for (const row of el.rows) {
        for (const cell of row) countAndAdd(categories.tables, cell);
      }
    } else if (el.type === "codeblock") {
      countAndAdd(categories.code, el.content, false);
    } else if (el.type === "mermaid") {
      diagrams++;
    }
  }

  if (metadata?._hasExplicitFrontmatter) {
    const fields = [metadata.title, metadata.subtitle, metadata.author, metadata.date].filter(
      Boolean
    );
    categories.titlePage = countText(fields.join(" "));
  }

  const totals = zeroCounts();
  for (const cat of Object.values(categories)) {
    addCounts(totals, cat);
  }

  return {
    categories,
    totals,
    diagrams,
    headingIssues: validateHeadingHierarchy(elements),
  };
}
