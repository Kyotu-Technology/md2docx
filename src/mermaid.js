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

function readPngDimensions(data) {
  if (data.length < 24) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (width === 0 || height === 0) return null;
  return { width, height };
}

export async function renderMermaidDiagram(code) {
  const encoded = encodeMermaidForKroki(code);
  const url = `https://kroki.io/mermaid/png/${encoded}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kroki.io: ${response.status}`);

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const dims = readPngDimensions(buffer) || { width: 500, height: 300 };

  return { buffer, width: dims.width, height: dims.height };
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
