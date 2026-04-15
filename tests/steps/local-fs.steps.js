import { expect } from "@playwright/test";
import { Given, When, Then } from "./common.steps.js";
import {
  installFsMocks,
  fireObserverRecords,
  readMockFile,
  hasMockFile,
} from "../helpers/local-fs-mocks.js";

let observerSupported = true;

Given("FileSystemObserver is not supported", async () => {
  observerSupported = false;
});

Given("the local filesystem mock is set up with files:", async ({ page }, docString) => {
  const files = JSON.parse(docString);
  await installFsMocks(page, { files, observerSupported });
  observerSupported = true;
});

Given("the user has mounted the local folder", async ({ page }) => {
  await page.locator("#mountFolderBtn").click();
  await page.locator(".local-fs-dot--connected").waitFor({ state: "visible", timeout: 5000 });
});

When("I click the mount folder button", async ({ page }) => {
  await page.locator("#mountFolderBtn").click();
  await page.waitForTimeout(200);
});

When("I locally edit the editor without saving by appending:", async ({ page }, text) => {
  await page.evaluate((appended) => {
    const ta = document.getElementById("markdown");
    ta.value = ta.value + appended;
  }, text);
});

const FEEDBACK_WINDOW_MS = 1100;

When("an external modification of {string} with content:", async ({ page }, path, docString) => {
  await page.waitForTimeout(FEEDBACK_WINDOW_MS);
  await page.evaluate(
    ([p, c]) => {
      window.__md2docxTestFs.writeFile(p, c);
    },
    [path, docString]
  );
  await fireObserverRecords(page, [{ type: "modified", relativePathComponents: path.split("/") }]);
  await page.waitForTimeout(500);
});

When("an external deletion of {string} is triggered", async ({ page }, path) => {
  await page.waitForTimeout(FEEDBACK_WINDOW_MS);
  await page.evaluate((p) => {
    window.__md2docxTestFs.deleteFile(p);
  }, path);
  await fireObserverRecords(page, [
    { type: "disappeared", relativePathComponents: path.split("/") },
  ]);
  await page.waitForTimeout(500);
});

When("an external creation of {string} with content:", async ({ page }, path, docString) => {
  await page.waitForTimeout(FEEDBACK_WINDOW_MS);
  await page.evaluate(
    ([p, c]) => {
      window.__md2docxTestFs.writeFile(p, c);
    },
    [path, docString]
  );
  await fireObserverRecords(page, [{ type: "appeared", relativePathComponents: path.split("/") }]);
  await page.waitForTimeout(500);
});

When("I click the toast action {string}", async ({ page }, label) => {
  const btn = page.locator(`#toastContainer button:has-text("${label}")`).first();
  await btn.click();
  await page.waitForTimeout(300);
});

When("I click the folder {string} in the explorer", async ({ page }, name) => {
  const folder = page.locator(".explorer-folder", { hasText: name }).first();
  await folder.click();
  await page.waitForTimeout(200);
});

When("I switch to the file {string} in the explorer", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item .doc-name", { hasText: name }).first();
  await item.click();
  await page.waitForTimeout(300);
});

Then("the mount folder button is visible", async ({ page }) => {
  const btn = page.locator("#mountFolderBtn");
  await expect(btn).toBeVisible({ timeout: 3000 });
});

Then("the local-fs status shows connected", async ({ page }) => {
  await expect(page.locator(".local-fs-dot--connected")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#localFsStatus")).toContainText("Local:", { timeout: 3000 });
});

Then("the local-fs status is hidden", async ({ page }) => {
  const status = page.locator("#localFsStatus");
  await expect(status).toBeHidden({ timeout: 3000 });
});

Then("the file explorer shows folder {string} with {int} files", async ({ page }, name, count) => {
  const folder = page.locator(".explorer-folder", { hasText: name });
  await expect(folder).toBeVisible({ timeout: 3000 });
  const countEl = folder.locator(".folder-count");
  await expect(countEl).toHaveText(String(count), { timeout: 3000 });
});

Then("the folder {string} is collapsed", async ({ page }, name) => {
  const folder = page.locator(".explorer-folder", { hasText: name });
  await expect(folder).toHaveClass(/collapsed/, { timeout: 3000 });
});

Then("the folder {string} is expanded", async ({ page }, name) => {
  const folder = page.locator(".explorer-folder", { hasText: name });
  await expect(folder).not.toHaveClass(/collapsed/, { timeout: 3000 });
});

Then("the file explorer shows the local file {string}", async ({ page }, path) => {
  const item = page.locator(`#fileList .explorer-item[data-id="local:${path}"]`);
  await expect(item).toBeVisible({ timeout: 3000 });
});

Then("the file explorer does not show the local file {string}", async ({ page }, path) => {
  const item = page.locator(`#fileList .explorer-item[data-id="local:${path}"]`);
  await expect(item).toHaveCount(0, { timeout: 3000 });
});

Then("a toast with action buttons {string} and {string} is visible", async ({ page }, a, b) => {
  await expect(page.locator(`#toastContainer button:has-text("${a}")`).first()).toBeVisible({
    timeout: 3000,
  });
  await expect(page.locator(`#toastContainer button:has-text("${b}")`).first()).toBeVisible({
    timeout: 3000,
  });
});

Then("no toast with action button {string} is visible", async ({ page }, label) => {
  const btn = page.locator(`#toastContainer button:has-text("${label}")`);
  await expect(btn).toHaveCount(0, { timeout: 2000 });
});

Then("the editor content is:", async ({ page }, docString) => {
  const textarea = page.locator("#markdown");
  await expect(textarea).toHaveValue(docString, { timeout: 3000 });
});

Then("the file on disk at {string} has content:", async ({ page }, path, docString) => {
  const actual = await readMockFile(page, path);
  expect(actual).toBe(docString);
});

Then("the file on disk at {string} exists", async ({ page }, path) => {
  const exists = await hasMockFile(page, path);
  expect(exists).toBe(true);
});

Then("the file on disk at {string} does not exist", async ({ page }, path) => {
  const exists = await hasMockFile(page, path);
  expect(exists).toBe(false);
});
