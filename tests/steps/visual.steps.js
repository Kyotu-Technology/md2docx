import { expect } from "@playwright/test";
import { Then } from "./common.steps.js";

Then(
  "the preview pane should match the visual baseline {string}",
  async ({ page }, baselineName) => {
    const preview = page.locator("#preview");
    await expect(preview).toHaveScreenshot(`${baselineName}.png`, {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  }
);
