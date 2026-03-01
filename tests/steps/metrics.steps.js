import { expect } from "@playwright/test";
import { When, Then } from "./common.steps.js";

When("I open the metrics panel", async ({ page }) => {
  await page.locator("#readabilityBadge").click();
  await expect(page.locator("#readabilityPanel")).toHaveClass(/open/);
});

Then("the metrics badge should be visible", async ({ page }) => {
  await expect(page.locator("#readabilityBadge")).toBeVisible();
});

Then("the metrics badge should not be visible", async ({ page }) => {
  await expect(page.locator("#readabilityBadge")).toHaveCSS("display", "none");
});

Then("the metrics badge should show a character count", async ({ page }) => {
  await expect(page.locator("#readabilityBadge")).toHaveText(/\d+ chars/);
});

Then("the metrics panel should be open", async ({ page }) => {
  await expect(page.locator("#readabilityPanel")).toHaveClass(/open/);
});

Then("the metrics table should have {int} columns", async ({ page }, count) => {
  const headers = page.locator("#readabilityPanel .metrics-table thead th");
  await expect(headers).toHaveCount(count);
});

Then("the metrics row {string} should have non-zero chars", async ({ page }, label) => {
  const row = page
    .locator("#readabilityPanel .metrics-table tbody tr:not(.metrics-total)")
    .filter({ hasText: label })
    .first();
  await expect(row).toBeVisible();
  const charsCell = row.locator("td").nth(1);
  const text = await charsCell.textContent();
  expect(parseInt(text.replace(/,/g, ""), 10)).toBeGreaterThan(0);
});

Then("the metrics row {string} should have zero chars", async ({ page }, label) => {
  const row = page
    .locator("#readabilityPanel .metrics-table tbody tr:not(.metrics-total)")
    .filter({ hasText: label })
    .first();
  await expect(row).toBeVisible();
  const charsCell = row.locator("td").nth(1);
  await expect(charsCell).toHaveText("0");
});

Then("the metrics total row should be visible", async ({ page }) => {
  const totalRow = page.locator("#readabilityPanel .metrics-table tr.metrics-total");
  await expect(totalRow).toBeVisible();
  const wordCell = totalRow.locator("td").last();
  const text = await wordCell.textContent();
  expect(parseInt(text.replace(/,/g, ""), 10)).toBeGreaterThan(0);
});

Then("the metrics row {string} should be visible", async ({ page }, label) => {
  const row = page
    .locator("#readabilityPanel .metrics-table tbody tr")
    .filter({ hasText: label })
    .first();
  await expect(row).toBeVisible();
});

Then("the metrics row {string} should not be visible", async ({ page }, label) => {
  const rows = page.locator("#readabilityPanel .metrics-table tbody tr").filter({ hasText: label });
  await expect(rows).toHaveCount(0);
});

Then("the metrics panel should show a heading skip warning", async ({ page }) => {
  const warning = page.locator("#readabilityPanel .text-red-500").first();
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("Heading skip");
});
