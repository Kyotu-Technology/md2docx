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

function parseHljsHtml(html) {
  const container = document.createElement("span");
  container.innerHTML = html;
  const tokens = [];

  function walk(node, parentClass) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text) {
          tokens.push({ text, tokenType: parentClass ? getTokenType(parentClass) : "default" });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "SPAN") {
        walk(child, child.className || parentClass);
      }
    }
  }

  walk(container, null);
  return tokens.length > 0 ? tokens : [{ text: "", tokenType: "default" }];
}

export function highlightCodeTokens(code, language) {
  let highlighted;
  try {
    highlighted =
      language && window.hljs.getLanguage(language)
        ? window.hljs.highlight(code, { language })
        : window.hljs.highlightAuto(code);
  } catch {
    return code.split("\n").map((line) => [{ text: line, tokenType: "default" }]);
  }
  return highlighted.value.split("\n").map(parseHljsHtml);
}

export function highlightCode(code, language, syntaxColors, fontMono, sizeMono) {
  const { TextRun } = window.docx;
  const lines = highlightCodeTokens(code, language);
  return lines.map((tokens) =>
    tokens.map(
      ({ text, tokenType }) =>
        new TextRun({
          text,
          font: fontMono,
          size: sizeMono,
          color: syntaxColors[tokenType] || syntaxColors.default,
        })
    )
  );
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
