const INCLUDE_REGEX = /^@include\((.+)\)$/gm;
const MAX_DEPTH = 10;

export function resolveIncludes(content, documentsMap, _visited = new Set(), _depth = 0) {
  if (_depth >= MAX_DEPTH) return content;

  return content.replace(INCLUDE_REGEX, (match, name) => {
    const trimmed = name.trim();

    if (_visited.has(trimmed)) return match;

    const docContent = documentsMap.get(trimmed);
    if (docContent === undefined) return match;

    const nextVisited = new Set(_visited);
    nextVisited.add(trimmed);

    return resolveIncludes(docContent, documentsMap, nextVisited, _depth + 1);
  });
}
