const INCLUDE_LINE_REGEX = /^@include\((.+)\)$/;
const MAX_DEPTH = 10;

export function resolveIncludes(content, documentsMap, _visited = new Set(), _depth = 0) {
  if (_depth >= MAX_DEPTH) return content;

  return content.replace(/^@include\((.+)\)$/gm, (match, name) => {
    const trimmed = name.trim();

    if (_visited.has(trimmed)) return match;

    const docContent = documentsMap.get(trimmed);
    if (docContent === undefined) return match;

    const nextVisited = new Set(_visited);
    nextVisited.add(trimmed);

    return resolveIncludes(docContent, documentsMap, nextVisited, _depth + 1);
  });
}

export function resolveIncludesWithMap(content, documentsMap) {
  const originalLines = content.split("\n");
  const resolvedLines = [];
  const lineMap = [];

  for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i];
    const match = line.match(INCLUDE_LINE_REGEX);

    if (match) {
      const trimmed = match[1].trim();
      const docContent = documentsMap.get(trimmed);
      if (docContent !== undefined) {
        const visited = new Set([trimmed]);
        const resolved = resolveIncludes(docContent, documentsMap, visited, 1);
        const includedLines = resolved.split("\n");
        for (const il of includedLines) {
          resolvedLines.push(il);
          lineMap.push(i);
        }
        continue;
      }
    }

    resolvedLines.push(line);
    lineMap.push(i);
  }

  return { resolved: resolvedLines.join("\n"), lineMap };
}
