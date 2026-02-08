import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "tests/features/**/*.feature",
  steps: "tests/steps/**/*.steps.js",
});

const isCI = !!process.env.CI;

export default defineConfig({
  testDir,
  snapshotPathTemplate: "./tests/snapshots/{arg}{ext}",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "bun run dev",
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 10_000,
  },
  reporter: [["html", { open: "never" }], ["list"]],
  retries: isCI ? 2 : 0,
});
