const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");

let activeCount = 0;

export function showAiStatus(text) {
  activeCount++;
  statusEl.classList.remove("hidden");
  statusTextEl.textContent = text;
}

export function updateAiStatus(text) {
  statusTextEl.textContent = text;
}

export function hideAiStatus() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    statusEl.classList.add("hidden");
  }
}

export function formatProgress(progress) {
  if (!progress) return "";
  if (progress.status === "download") {
    const pct = progress.progress ? `${Math.round(progress.progress)}%` : "";
    const file = progress.file || "";
    return `Downloading ${file} ${pct}`.trim();
  }
  if (progress.status === "loading") {
    return "Loading model...";
  }
  if (progress.status === "ready") {
    return "Model ready";
  }
  return progress.status || "";
}
