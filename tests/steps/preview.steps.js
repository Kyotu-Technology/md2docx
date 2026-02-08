import { expect } from "@playwright/test";
import { When, Then } from "./common.steps.js";

When("the preview renders", async ({ page }) => {
  await expect(page.locator("#preview")).not.toBeEmpty({ timeout: 5000 });
});

When("the preview fully renders", async ({ page }) => {
  await expect(page.locator("#preview")).not.toBeEmpty({ timeout: 5000 });
});

// --- Element presence ---

Then("the preview should contain a {string} element", async ({ page }, tag) => {
  const el = page.locator(`#preview ${tag}`).first();
  await expect(el).toBeVisible();
});

Then("the preview should contain an {string} element", async ({ page }, tag) => {
  const el = page.locator(`#preview ${tag}`).first();
  await expect(el).toBeVisible();
});

// --- Element with text ---

Then(
  "the preview should contain an {string} with text {string}",
  async ({ page }, tag, expectedText) => {
    const el = page.locator(`#preview ${tag}`).filter({ hasText: expectedText }).first();
    await expect(el).toBeVisible();
  }
);

Then("the preview should contain text {string}", async ({ page }, expectedText) => {
  const preview = page.locator("#preview");
  await expect(preview).toContainText(expectedText);
});

// --- Child count ---

Then(
  "the {string} should have {int} {string} children",
  async ({ page }, parentTag, count, childTag) => {
    const children = page.locator(`#preview ${parentTag}:not(.checklist) ${childTag}`);
    await expect(children).toHaveCount(count);
  }
);

// --- List style ---

Then("the {string} list-style-type should be {string}", async ({ page }, tag, expectedStyle) => {
  const listEl = page.locator(`#preview ${tag}:not(.checklist)`).first();
  const listStyle = await listEl.evaluate((el) => {
    return window.getComputedStyle(el).listStyleType;
  });
  expect(listStyle).toBe(expectedStyle);
});

// --- Checklist ---

Then("the preview should contain a checklist with {int} items", async ({ page }, count) => {
  const items = page.locator("#preview .checklist > li");
  await expect(items).toHaveCount(count);
});

Then("the first checklist item should show a checked checkbox", async ({ page }) => {
  const firstItem = page.locator("#preview .checklist > li").first();
  const text = await firstItem.textContent();
  expect(text).toContain("\u2611"); // ☑
});

Then("the second checklist item should show an unchecked checkbox", async ({ page }) => {
  const secondItem = page.locator("#preview .checklist > li").nth(1);
  const text = await secondItem.textContent();
  expect(text).toContain("\u2610"); // ☐
});

// --- Element content ---

Then("the {string} element should contain text {string}", async ({ page }, tag, expectedText) => {
  const el = page.locator(`#preview ${tag}`).filter({ hasText: expectedText }).first();
  await expect(el).toBeVisible();
});

Then(
  "the {string} element should contain a {string} element",
  async ({ page }, parentTag, childTag) => {
    const child = page.locator(`#preview ${parentTag} ${childTag}`).first();
    await expect(child).toBeVisible();
  }
);

// --- Table ---

Then("the first row should contain {string} cells", async ({ page }, cellTag) => {
  const cells = page.locator(`#preview table tr:first-child ${cellTag}`);
  const count = await cells.count();
  expect(count).toBeGreaterThan(0);
});
