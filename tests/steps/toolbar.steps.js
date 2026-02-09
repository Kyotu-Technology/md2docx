import { expect } from "@playwright/test";
import { When, Then } from "./common.steps.js";

When("I select text {string} in the editor", async ({ page }, text) => {
  const textarea = page.locator("#markdown");
  await textarea.click();

  const indices = await textarea.evaluate((ta, searchText) => {
    const idx = ta.value.indexOf(searchText);
    if (idx === -1) return null;
    return { start: idx, end: idx + searchText.length };
  }, text);

  expect(indices).not.toBeNull();

  await textarea.evaluate((ta, { start, end }) => {
    ta.focus();
    ta.setSelectionRange(start, end);
  }, indices);

  await textarea.dispatchEvent("mouseup");
});

When("I click inside the editor without selecting", async ({ page }) => {
  const textarea = page.locator("#markdown");
  await textarea.evaluate((ta) => {
    ta.focus();
    ta.setSelectionRange(0, 0);
  });
  await textarea.dispatchEvent("mouseup");
});

When("I click the {string} toolbar button", async ({ page }, format) => {
  const btn = page.locator(`#formattingToolbar button[data-format="${format}"]`);
  await expect(btn).toBeVisible({ timeout: 3000 });
  await btn.click({ force: true });
});

When("I press Ctrl+B", async ({ page }) => {
  await page.locator("#markdown").press("Control+b");
});

When("I press Ctrl+I", async ({ page }) => {
  await page.locator("#markdown").press("Control+i");
});

When("I press Ctrl+E", async ({ page }) => {
  await page.locator("#markdown").press("Control+e");
});

Then("the formatting toolbar should be visible", async ({ page }) => {
  const toolbar = page.locator("#formattingToolbar");
  await expect(toolbar).toBeVisible({ timeout: 3000 });
  await expect(toolbar).toHaveClass(/visible/);
});

Then("the formatting toolbar should not be visible", async ({ page }) => {
  const toolbar = page.locator("#formattingToolbar");
  const hasVisible = await toolbar
    .evaluate((el) => el?.classList.contains("visible"))
    .catch(() => false);
  expect(hasVisible).toBe(false);
});

Then("the editor should contain {string}", async ({ page }, expected) => {
  const textarea = page.locator("#markdown");
  const value = await textarea.inputValue();
  expect(value.trim()).toBe(expected);
});

Then("the {string} toolbar button should be active", async ({ page }, format) => {
  const btn = page.locator(`#formattingToolbar button[data-format="${format}"]`);
  await expect(btn).toHaveClass(/active/, { timeout: 2000 });
});

Then("the {string} toolbar button should not be active", async ({ page }, format) => {
  const btn = page.locator(`#formattingToolbar button[data-format="${format}"]`);
  const hasActive = await btn.evaluate((el) => el.classList.contains("active"));
  expect(hasActive).toBe(false);
});
