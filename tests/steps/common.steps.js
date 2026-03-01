import { createBdd } from "playwright-bdd";
import { test as base } from "playwright-bdd";
import { chromium } from "playwright-core";

export const test = base.extend({
  page: async ({}, use) => {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();
    await use(page);
    try {
      await page.evaluate(() => {
        if (window.__blobMap && window.__origRevokeObjectURL) {
          for (const url of window.__blobMap.keys()) {
            window.__origRevokeObjectURL(url);
          }
          window.__blobMap.clear();
        }
        if (window.__pendingReads) window.__pendingReads.clear();
      });
    } catch {}
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  },
});

export const { Given, When, Then } = createBdd(test);
