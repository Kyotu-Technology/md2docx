import { expect } from "@playwright/test";
import { test } from "./common.steps.js";
import { When, Then } from "./common.steps.js";
import { DocxValidator } from "../helpers/docx-validator.js";
import { HtmlValidator } from "../helpers/html-validator.js";

const docxValidator = new DocxValidator();
const htmlValidator = new HtmlValidator();

// Shared state per scenario
let lastDownloadBuffer = null;
let lastDownloadFilename = null;

// CDN library requirements per format
const CDN_LIBS = {
  docx: "docx",
  pdf: "pdfMake",
  html: null, // no CDN dependency
};

/**
 * Install a blob download interceptor on the page.
 * In --single-process Chromium mode, Playwright download events don't fire
 * for blob URLs, so we capture blobs directly in the page context.
 */
async function installDownloadInterceptor(page) {
  await page.evaluate(() => {
    if (window.__downloadInterceptorInstalled) return;
    window.__downloadInterceptorInstalled = true;
    window.__downloadCaptures = [];
    window.__blobMap = new Map();
    window.__pendingReads = new Set();

    const origCreateObjectURL = URL.createObjectURL.bind(URL);
    const origRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    window.__origRevokeObjectURL = origRevokeObjectURL;

    URL.createObjectURL = function (blob) {
      const url = origCreateObjectURL(blob);
      window.__blobMap.set(url, blob);
      return url;
    };

    URL.revokeObjectURL = function (url) {
      if (window.__pendingReads.has(url)) return;
      window.__blobMap.delete(url);
      origRevokeObjectURL(url);
    };

    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href && this.href.startsWith("blob:")) {
        const blob = window.__blobMap.get(this.href);
        if (blob) {
          const blobUrl = this.href;
          window.__pendingReads.add(blobUrl);
          const reader = new FileReader();
          reader.onload = () => {
            window.__downloadCaptures.push({
              filename: this.download,
              data: Array.from(new Uint8Array(reader.result)),
            });
            window.__pendingReads.delete(blobUrl);
            window.__blobMap.delete(blobUrl);
            origRevokeObjectURL(blobUrl);
          };
          reader.readAsArrayBuffer(blob);
        }
        return;
      }
      return origClick.call(this);
    };
  });
}

When("I export as {string}", async ({ page }, format) => {
  // Check if the required CDN library is available
  const requiredLib = CDN_LIBS[format];
  if (requiredLib) {
    const libAvailable = await page.evaluate(
      (lib) => typeof window[lib] !== "undefined",
      requiredLib
    );
    if (!libAvailable) {
      test.skip();
      return;
    }
  }

  // Install blob interceptor before triggering export
  await installDownloadInterceptor(page);

  // Show dropdown and click format button
  await page.evaluate(() => {
    document.getElementById("formatDropdown").classList.remove("hidden");
  });
  await page.locator(`[data-format="${format}"]`).waitFor({ state: "visible" });

  await page.evaluate((fmt) => {
    document.querySelector(`[data-format="${fmt}"]`).click();
  }, format);

  // Wait for the blob capture to appear
  await page.waitForFunction(() => window.__downloadCaptures.length > 0, {
    timeout: 30_000,
  });

  // Read captured download data
  const capture = await page.evaluate(() => {
    return window.__downloadCaptures[window.__downloadCaptures.length - 1];
  });

  lastDownloadFilename = capture.filename;
  lastDownloadBuffer = Buffer.from(capture.data);
});

Then("the downloaded file should have extension {string}", async ({}, extension) => {
  expect(lastDownloadFilename).toBeTruthy();
  expect(lastDownloadFilename.endsWith(extension)).toBe(true);
});

// --- DOCX assertions ---

Then("the DOCX should have a valid internal structure", async ({}) => {
  const result = await docxValidator.verifyStructure(lastDownloadBuffer);
  expect(result.valid).toBe(true);
});

Then("the DOCX text content should contain {string}", async ({}, expectedText) => {
  const text = await docxValidator.toText(lastDownloadBuffer);
  expect(text).toContain(expectedText);
});

Then("the DOCX should contain numbered paragraphs", async ({}) => {
  const { doc } = await docxValidator.parse(lastDownloadBuffer);
  const paragraphs = docxValidator.getParagraphs(doc);
  const numbered = paragraphs.filter((p) => docxValidator.hasNumbering(p));
  expect(numbered.length).toBeGreaterThan(0);
});

Then("the DOCX HTML should contain a {string} tag", async ({}, tag) => {
  const { html } = await docxValidator.toHtml(lastDownloadBuffer);
  expect(html).toContain(`<${tag}`);
});

// --- HTML assertions ---

Then("the HTML should contain a complete document structure", async ({}) => {
  const html = lastDownloadBuffer.toString("utf-8");
  expect(html).toContain("<!DOCTYPE html>");
  expect(html).toContain("<html");
  expect(html).toContain("<head");
  expect(html).toContain("<body");
});

Then("the HTML should contain a {string} tag with text {string}", async ({}, tag, text) => {
  const $ = htmlValidator.parseBuffer(lastDownloadBuffer);
  const el = $(tag).filter((_, el) => $(el).text().includes(text));
  expect(el.length).toBeGreaterThan(0);
});

Then("the HTML should contain a {string} tag", async ({}, tag) => {
  const $ = htmlValidator.parseBuffer(lastDownloadBuffer);
  expect($(tag).length).toBeGreaterThan(0);
});

Then("the HTML should contain an {string} tag", async ({}, tag) => {
  const $ = htmlValidator.parseBuffer(lastDownloadBuffer);
  expect($(tag).length).toBeGreaterThan(0);
});

Then("the HTML should contain {int} {string} elements", async ({}, count, selector) => {
  const $ = htmlValidator.parseBuffer(lastDownloadBuffer);
  expect($(selector).length).toBe(count);
});

Then("the DOCX should contain an image with correct aspect ratio", async ({}) => {
  const { doc, zip } = await docxValidator.parse(lastDownloadBuffer);
  const extents = docxValidator.getImageExtents(doc);
  expect(extents.length).toBeGreaterThan(0);

  const { cx, cy } = extents[0];
  const docxRatio = cy / cx;

  const mediaFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith("word/media/") && !zip.files[f].dir
  );
  expect(mediaFiles.length).toBeGreaterThan(0);

  const pngBuffer = await zip.file(mediaFiles[0]).async("nodebuffer");
  expect(pngBuffer.length).toBeGreaterThanOrEqual(24);
  const pngWidth = pngBuffer.readUInt32BE(16);
  const pngHeight = pngBuffer.readUInt32BE(20);
  const pngRatio = pngHeight / pngWidth;

  expect(Math.abs(docxRatio - pngRatio)).toBeLessThan(0.02);
});
