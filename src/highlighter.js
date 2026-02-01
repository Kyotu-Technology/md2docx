import { escapeHtml } from "./utils.js";

const TOKEN_MAP = {
  keyword: "keyword",
  built_in: "keyword",
  type: "keyword",
  literal: "keyword",
  string: "string",
  regexp: "string",
  comment: "comment",
  doctag: "comment",
  number: "number",
  function: "function",
  "title.function": "function",
  variable: "variable",
  params: "variable",
  operator: "operator",
  punctuation: "punctuation",
  class: "className",
  "title.class": "className",
  property: "property",
  attr: "property",
  tag: "tag",
  name: "tag",
  attribute: "attribute",
};

function getTokenType(classes) {
  if (!classes) return "default";
  const parts = classes
    .split(" ")
    .map((c) => c.replace("hljs-", ""))
    .filter((c) => c && c !== "hljs");
  for (const part of parts) if (TOKEN_MAP[part]) return TOKEN_MAP[part];
  return "default";
}

export function highlightCode(code, language, syntaxColors, fontMono, sizeMono) {
  const { TextRun } = window.docx;
  const syntax = syntaxColors;

  let highlighted;
  try {
    highlighted =
      language && window.hljs.getLanguage(language)
        ? window.hljs.highlight(code, { language })
        : window.hljs.highlightAuto(code);
  } catch {
    return code
      .split("\n")
      .map((line) => [
        new TextRun({ text: line, font: fontMono, size: sizeMono, color: syntax.default }),
      ]);
  }

  return highlighted.value.split("\n").map((lineHtml) => {
    const runs = [];
    const regex = /<span class="([^"]+)">([^<]*)<\/span>|([^<]+)/g;
    let match;

    while ((match = regex.exec(lineHtml)) !== null) {
      const text = (match[2] || match[3] || "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
      if (text) {
        const tokenType = match[1] ? getTokenType(match[1]) : "default";
        runs.push(
          new TextRun({
            text,
            font: fontMono,
            size: sizeMono,
            color: syntax[tokenType] || syntax.default,
          })
        );
      }
    }
    return runs.length > 0 ? runs : [new TextRun({ text: "", font: fontMono, size: sizeMono })];
  });
}

export function highlightCodeHtml(code, language) {
  try {
    return language && window.hljs.getLanguage(language)
      ? window.hljs.highlight(code, { language, ignoreIllegals: true }).value
      : window.hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}
