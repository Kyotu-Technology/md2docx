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
  await page.locator("#addDocBtn").click();
  const input = page.locator("#fileList input.inline-rename");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(name);
  await input.press("Enter");
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

When("I type {string} in the editor", async ({ page }, text) => {
  const textarea = page.locator("#markdown");
  await textarea.click();
  await textarea.press("End");
  await page.keyboard.type(text, { delay: 30 });
  await page.waitForTimeout(200);
});

When("I press {string} in the editor", async ({ page }, key) => {
  await page.keyboard.press(key);
  await page.waitForTimeout(200);
});

Then("the include autocomplete dropdown should be visible", async ({ page }) => {
  const dropdown = page.locator(".include-autocomplete");
  await expect(dropdown).toBeVisible({ timeout: 3000 });
});

Then("the autocomplete should list {string}", async ({ page }, name) => {
  const item = page.locator(".include-autocomplete-item", { hasText: name });
  await expect(item).toBeVisible({ timeout: 3000 });
});

Then("the autocomplete should not list {string}", async ({ page }, name) => {
  const items = page.locator(".include-autocomplete-item");
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).textContent();
    expect(text.trim()).not.toContain(name);
  }
});

Then("the include autocomplete dropdown should not be visible", async ({ page }) => {
  const dropdown = page.locator(".include-autocomplete");
  const isHidden = await dropdown.evaluate((el) => !el || el.style.display === "none" || el.style.display === "");
  expect(isHidden).toBe(true);
});

When("I fill the editor with {int} lines of text", async ({ page }, lines) => {
  const textarea = page.locator("#markdown");
  const content = Array.from({ length: lines }, (_, i) => `Line ${i + 1}: Lorem ipsum dolor sit amet`).join("\n") + "\n";
  await textarea.fill(content);
  await textarea.dispatchEvent("input");
  await page.waitForTimeout(200);
  // Move cursor to the end so textarea is scrolled to bottom
  await textarea.click();
  await page.keyboard.press("Control+End");
  await page.waitForTimeout(100);
});

Then("the autocomplete dropdown should be within the viewport", async ({ page }) => {
  const result = await page.evaluate(() => {
    const dd = document.querySelector(".include-autocomplete");
    if (!dd) return { ok: false, reason: "dropdown not found" };
    const rect = dd.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      ok: rect.top >= 0 && rect.bottom <= vh && rect.left >= 0 && rect.right <= vw,
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      viewport: { width: vw, height: vh },
    };
  });
  expect(result.ok, `Dropdown rect ${JSON.stringify(result.rect)} outside viewport ${JSON.stringify(result.viewport)}`).toBe(true);
});
