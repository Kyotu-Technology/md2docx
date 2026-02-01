import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const devVersion = `v${packageJson.version}-dev`;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path === "/") path = "/index.html";

    const filePath = `.${path}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      // Inject version into HTML during development
      if (filePath.endsWith(".html")) {
        let html = await file.text();
        html = html.replace("__APP_VERSION__", devVersion);
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response(file, {
        headers: { "Content-Type": getContentType(filePath) },
      });
    }

    return new Response("Not found: " + filePath, { status: 404 });
  },
});

function getContentType(path) {
  const ext = path.split(".").pop().toLowerCase();
  const types = {
    html: "text/html",
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return types[ext] || "application/octet-stream";
}

console.log(`Dev server: http://localhost:${server.port} (${devVersion})`);
