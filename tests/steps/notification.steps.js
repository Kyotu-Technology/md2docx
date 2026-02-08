import { expect } from "@playwright/test";
import { When, Then } from "./common.steps.js";

When("I click the generate button", async ({ page }) => {
  await page.evaluate(() => {
    document.getElementById("formatDropdown").classList.remove("hidden");
  });
  await page.locator('[data-format="docx"]').waitFor({ state: "visible" });
  await page.evaluate(() => {
    document.querySelector('[data-format="docx"]').click();
  });
  await page.locator("#toastContainer > div").first().waitFor({ state: "attached", timeout: 5000 });
});

Then("a toast notification should appear", async ({ page }) => {
  const toast = page.locator("#toastContainer > div").first();
  await expect(toast).toBeVisible({ timeout: 3000 });
});

Then("the toast should contain text {string}", async ({ page }, expectedText) => {
  const toast = page.locator("#toastContainer > div").first();
  await expect(toast).toContainText(expectedText);
});

Then("the toast should have a solid dark background", async ({ page }) => {
  const toast = page.locator("#toastContainer > div").first();
  await expect(toast).toHaveClass(/bg-gray-900/);
});

Then("the toast should be fully visible", async ({ page }) => {
  const toast = page.locator("#toastContainer > div").first();
  await expect(toast).toHaveCSS("opacity", "1");
});

When("I wait for the toast to dismiss", async ({ page }) => {
  // TOAST_DURATION=4000 + ANIMATION_DURATION=200 + buffer
  await page.waitForTimeout(4500);
});

Then("no toast notifications should be visible", async ({ page }) => {
  const toasts = page.locator("#toastContainer > div");
  await expect(toasts).toHaveCount(0, { timeout: 5000 });
});

When("I click the toast close button", async ({ page }) => {
  await page.evaluate(() => {
    const btn = document.querySelector("#toastContainer > div button");
    if (btn) btn.click();
  });
  await expect(page.locator("#toastContainer > div")).toHaveCount(0, { timeout: 3000 });
});
