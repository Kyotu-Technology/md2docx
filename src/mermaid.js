export function encodeMermaidForKroki(code) {
  const data = new TextEncoder().encode(code);
  const compressed = pako.deflate(data, { level: 9 });

  const CHUNK_SIZE = 0x8000;
  let binary = "";
  for (let i = 0; i < compressed.length; i += CHUNK_SIZE) {
    const chunk = compressed.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function renderMermaidDiagram(code) {
  const encoded = encodeMermaidForKroki(code);
  const url = `https://kroki.io/mermaid/png/${encoded}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kroki.io: ${response.status}`);

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  return { buffer: new Uint8Array(arrayBuffer), width: 500, height: 300 };
}

export function getMermaidPreviewUrl(code) {
  return `https://kroki.io/mermaid/svg/${encodeMermaidForKroki(code)}`;
}

/**
 * Prepend theme's mermaid config to diagram code, unless the diagram
 * already has its own frontmatter config (starts with ---).
 */
export function applyMermaidTheme(code, theme) {
  if (!theme?.mermaid?.config) return code;
  if (code.trimStart().startsWith("---")) return code;
  return theme.mermaid.config + "\n" + code;
}
