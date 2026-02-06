import { expect } from "@playwright/test";
import { Given, When } from "./common.steps.js";
import path from "path";
import fs from "fs";

async function setEditorContent(page, content) {
  await page.evaluate((text) => {
    const ta = document.getElementById("markdown");
    ta.value = text;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, content);
  if (content) {
    await expect(page.locator("#preview")).not.toBeEmpty({ timeout: 5000 });
  }
}

Given("the application is loaded", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#markdown").waitFor({ state: "visible" });
});

Given("the editor contains:", async ({ page }, docString) => {
  await setEditorContent(page, docString);
});

Given("the editor contains the file {string}", async ({ page }, filename) => {
  const filePath = path.resolve("tests/test-data", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  await setEditorContent(page, content);
});

Given("the editor is empty", async ({ page }) => {
  await setEditorContent(page, "");
});
