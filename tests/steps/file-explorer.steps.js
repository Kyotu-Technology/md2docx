import { expect } from "@playwright/test";
import { Given, When, Then } from "./common.steps.js";

Given("IndexedDB documents are cleared", async ({ page }) => {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
    localStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#markdown").waitFor({ state: "visible" });
});

When("I click the explorer toggle button", async ({ page }) => {
  const btn = page.locator("#explorerToggle");
  await btn.click();
});

When("I click outside the editor", async ({ page }) => {
  await page.locator("body").click({ position: { x: 10, y: 10 } });
  await page.evaluate(() => {
    document.getElementById("markdown")?.blur();
  });
});

When("I press Ctrl+B on the document", async ({ page }) => {
  await page.keyboard.press("Control+b");
});

When("I add a new document named {string}", async ({ page }, name) => {
  page.once("dialog", async (dialog) => {
    await dialog.accept(name);
  });
  await page.locator("#addDocBtn").click();
  await page.waitForTimeout(300);
});

When("I click the document {string} in the file list", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item .doc-name", { hasText: name });
  await item.click();
  await page.waitForTimeout(200);
});

When("I delete the document {string}", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item", { hasText: name });
  await item.hover();

  const deleteBtn = item.locator(".item-actions button");
  await deleteBtn.click();

  const confirmModal = page.locator("#confirmModal");
  await confirmModal.waitFor({ state: "visible", timeout: 3000 });
  await page.locator("#confirmOk").click();
  await confirmModal.waitFor({ state: "hidden", timeout: 3000 });
  await page.waitForTimeout(200);
});

When("I rename the document {string} to {string}", async ({ page }, oldName, newName) => {
  const item = page.locator("#fileList .explorer-item", { hasText: oldName });
  const nameSpan = item.locator(".doc-name");
  await nameSpan.dblclick();

  const input = item.locator("input.inline-rename");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(newName);
  await input.press("Enter");
  await page.waitForTimeout(300);
});

Then("the file explorer panel should be visible", async ({ page }) => {
  const panel = page.locator("#explorerPanel");
  const width = await panel.evaluate((el) => parseInt(el.style.width));
  expect(width).toBeGreaterThan(0);
});

Then("the file explorer panel should not be visible", async ({ page }) => {
  const panel = page.locator("#explorerPanel");
  const width = await panel.evaluate((el) => parseInt(el.style.width) || 0);
  expect(width).toBe(0);
});

Then("the file list should contain {int} document(s)", async ({ page }, count) => {
  const items = page.locator("#fileList .explorer-item");
  await expect(items).toHaveCount(count, { timeout: 3000 });
});

Then("the document {string} should be listed", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item .doc-name", { hasText: name });
  await expect(item).toBeVisible({ timeout: 3000 });
});

Then("the document {string} should not be listed", async ({ page }, name) => {
  const items = page.locator("#fileList .explorer-item .doc-name");
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).textContent();
    expect(text.trim()).not.toBe(name);
  }
});

Then("the current document name should be {string}", async ({ page }, name) => {
  const label = page.locator("#currentDocName");
  await expect(label).toHaveText(name, { timeout: 3000 });
});

Then("the document {string} should not have a delete button", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item", { hasText: name });
  const deleteBtn = item.locator(".item-actions button");
  await expect(deleteBtn).toHaveCount(0);
});

Then("the editor value should contain {string}", async ({ page }, text) => {
  const textarea = page.locator("#markdown");
  const value = await textarea.inputValue();
  expect(value).toContain(text);
});

Then("the editor should not contain {string}", async ({ page }, text) => {
  const textarea = page.locator("#markdown");
  const value = await textarea.inputValue();
  expect(value).not.toContain(text);
});

Then("the document {string} should have the main star active", async ({ page }, name) => {
  const item = page.locator("#fileList .explorer-item", { hasText: name });
  const star = item.locator(".main-star.is-main");
  await expect(star).toBeVisible({ timeout: 3000 });
});
