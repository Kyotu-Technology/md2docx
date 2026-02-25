function cleanContentOutsideCodeBlocks(content) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  return lines
    .map((line) => {
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        return line;
      }
      if (inCodeBlock) return line;
      line = line
        .replace(/&nbsp;/g, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\u2014/g, "-")
        .replace(/\u2013/g, "-");
      while (/<\/?[a-zA-Z][^>]*>/.test(line)) {
        line = line.replace(/<\/?[a-zA-Z][^>]*>/g, "");
      }
      return line;
    })
    .join("\n");
}

export function parseMarkdown(content) {
  content = cleanContentOutsideCodeBlocks(content);

  const lines = content.split("\n");
  let metadata = {};
  let bodyLines = lines;

  if (lines[0] === "---") {
    const endIndex = lines.findIndex((l, i) => i > 0 && l === "---");
    if (endIndex > 0) {
      const yamlLines = lines.slice(1, endIndex);
      yamlLines.forEach((line) => {
        const match = line.match(/^([\w-]+):\s*"?([^"]*)"?$/);
        if (match) metadata[match[1]] = match[2];
      });
      bodyLines = lines.slice(endIndex + 1);
    }
  }

  if (!metadata.title) {
    const firstH1 = bodyLines.find((l) => l.match(/^# /));
    metadata.title = firstH1 ? firstH1.replace(/^# /, "") : "Document";
  }

  if (!metadata.date) {
    const now = new Date();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    metadata.date = `${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  return { metadata, body: bodyLines.join("\n") };
}

export function parseBodyToElements(body) {
  const elements = [];
  const lines = body.split("\n");
  let i = 0;
  let numListCounter = 0;
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = "";
  let codeBlockStart = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim().toLowerCase();
        codeBlockContent = [];
        codeBlockStart = i;
      } else {
        inCodeBlock = false;
        if (codeBlockLang === "mermaid") {
          elements.push({
            type: "mermaid",
            content: codeBlockContent.join("\n"),
            line: codeBlockStart,
          });
        } else {
          elements.push({
            type: "codeblock",
            content: codeBlockContent.join("\n"),
            language: codeBlockLang,
            line: codeBlockStart,
          });
        }
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      i++;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }

    const h4Match = line.match(/^#### (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h1Match = line.match(/^# (.+)$/);

    if (h4Match) {
      elements.push({ type: "h4", content: h4Match[1], line: i });
      i++;
      continue;
    }
    if (h3Match) {
      elements.push({ type: "h3", content: h3Match[1], line: i });
      i++;
      continue;
    }
    if (h2Match) {
      elements.push({ type: "h2", content: h2Match[1], line: i });
      i++;
      continue;
    }
    if (h1Match) {
      elements.push({ type: "h1", content: h1Match[1], line: i });
      i++;
      continue;
    }

    if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      elements.push({ type: "hr", line: i });
      i++;
      continue;
    }

    if (line.includes("|") && lines[i + 1]?.match(/^\|?[\s-:|]+\|?$/)) {
      const startLine = i;
      const tableRows = [];
      while (i < lines.length && lines[i].includes("|")) {
        const raw = lines[i].split("|").map((c) => c.trim());
        if (raw.length > 0 && raw[0] === "") raw.shift();
        if (raw.length > 0 && raw[raw.length - 1] === "") raw.pop();
        const row = raw;
        if (!lines[i].match(/^[\s-:|]+$/)) tableRows.push(row);
        i++;
      }
      elements.push({ type: "table", rows: tableRows, line: startLine });
      continue;
    }

    if (line.match(/^[\s]*[-*+] \[([ xX])\] /)) {
      const startLine = i;
      const items = [];
      while (i < lines.length && lines[i].match(/^[\s]*[-*+] \[([ xX])\] /)) {
        const match = lines[i].match(/^[\s]*[-*+] \[([ xX])\] (.*)$/);
        if (match) items.push({ checked: match[1].toLowerCase() === "x", text: match[2] });
        i++;
      }
      elements.push({ type: "checklist", items, line: startLine });
      continue;
    }

    if (line.match(/^[\s]*[-*+] /)) {
      const startLine = i;
      const items = [];
      while (i < lines.length && lines[i].match(/^[\s]*[-*+] /)) {
        items.push(lines[i].replace(/^[\s]*[-*+] /, ""));
        i++;
      }
      elements.push({ type: "bulletlist", items, line: startLine });
      continue;
    }

    if (line.match(/^[\s]*\d+\. /)) {
      const startLine = i;
      const items = [];
      while (i < lines.length && lines[i].match(/^[\s]*\d+\. /)) {
        items.push(lines[i].replace(/^[\s]*\d+\. /, ""));
        i++;
      }
      numListCounter++;
      elements.push({ type: "numlist", items, listId: numListCounter, line: startLine });
      continue;
    }

    const paraStart = i;
    let paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].match(/^[\s]*[-*+] /) &&
      !lines[i].match(/^[\s]*\d+\. /) &&
      !lines[i].includes("|")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push({ type: "paragraph", content: paraLines.join(" "), line: paraStart });
  }

  return elements;
}
