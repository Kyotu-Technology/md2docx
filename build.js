import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from "fs";

if (!existsSync("./dist")) {
  mkdirSync("./dist");
}

const result = await Bun.build({
  entrypoints: ["./src/main.js"],
  outdir: "./dist",
  naming: "app.js",
  minify: true,
  target: "browser",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = process.env.APP_VERSION || `v${packageJson.version}`;

let html = readFileSync("./index.html", "utf-8");
html = html.replace('./src/main.js', './app.js');
html = html.replace('__APP_VERSION__', version);
writeFileSync("./dist/index.html", html);

cpSync("./assets", "./dist/assets", { recursive: true });

console.log(`Build complete: dist/ (${version})`);

