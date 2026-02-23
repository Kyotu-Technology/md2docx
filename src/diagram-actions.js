import { toast } from "./notifications/index.js";

export function initDiagramActions(previewEl) {
  previewEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-diagram-action]");
    if (!btn) return;

    const container = btn.closest(".mermaid-container");
    if (!container) return;

    const img = container.querySelector("img.mermaid-diagram");
    if (!img) return;

    const pngUrl = img.src.replace("/mermaid/svg/", "/mermaid/png/");

    if (btn.dataset.diagramAction === "copy") copyDiagram(pngUrl);
    else if (btn.dataset.diagramAction === "download") downloadDiagram(pngUrl);
  });
}

async function copyDiagram(pngUrl) {
  try {
    const response = await fetch(pngUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast.success("Copied to clipboard");
  } catch (err) {
    console.error("Copy failed:", err);
    toast.error("Failed to copy diagram");
  }
}

async function downloadDiagram(pngUrl) {
  try {
    const response = await fetch(pngUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.png";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    toast.error("Failed to download diagram");
  }
}
