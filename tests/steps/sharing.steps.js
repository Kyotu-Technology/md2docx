import { expect } from "@playwright/test";
import { Given, When, Then } from "./common.steps.js";

let preparedShareUrl = null;

When("I click the share button", async ({ page }) => {
  await page.locator("#shareBtn").click();
  await page.waitForTimeout(100);
});

When("I press Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
});

When("I click the share dialog backdrop", async ({ page }) => {
  await page.locator("#shareBackdrop").click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(250);
});

When("I press Ctrl+Shift+L on the document", async ({ page }) => {
  await page.keyboard.press("Control+Shift+l");
  await page.waitForTimeout(100);
});

When("I enable password protection in share dialog", async ({ page }) => {
  await page.locator("#sharePasswordToggle").click();
  await page.waitForTimeout(100);
});

When("I enter share password {string}", async ({ page }, password) => {
  await page.locator("#sharePasswordInput").fill(password);
});

When("I click copy link in share dialog", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator("#shareCopyBtn").click();
  await page.waitForTimeout(500);
});

Then("the share dialog should be visible", async ({ page }) => {
  const modal = page.locator("#shareModal");
  await expect(modal).toBeVisible({ timeout: 3000 });
});

Then("the share dialog should not be visible", async ({ page }) => {
  const modal = page.locator("#shareModal");
  const isHidden = await modal.evaluate((el) => el.style.display === "none");
  expect(isHidden).toBe(true);
});

Then("the share dialog should show size estimate", async ({ page }) => {
  const sizeBar = page.locator("#shareSizeBar");
  await expect(sizeBar).toContainText("compressed", { timeout: 3000 });
});

Then("the share dialog should show scope options", async ({ page }) => {
  const section = page.locator("#shareScopeSection");
  await expect(section).toBeVisible();
});

Then("the share dialog should show {string} option", async ({ page }, text) => {
  const options = page.locator("#shareScopeOptions");
  await expect(options).toContainText(text);
});

Then("a success toast should appear with text {string}", async ({ page }, expectedText) => {
  const toastContainer = page.locator("#toastContainer");
  await expect(toastContainer).toContainText(expectedText, { timeout: 5000 });
});

Then("sharing roundtrip without password should preserve content", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { encodeSharePayload, decodeShareFragment } = await import("/src/sharing/codec.js");
    const files = [
      { name: "test.md", content: "# Shared Document\nHello from the other side.", isMain: true },
    ];
    const { fragment } = await encodeSharePayload(files, {});
    const decoded = await decodeShareFragment(fragment);
    return {
      filesMatch: decoded.files[0].content === files[0].content,
      nameMatch: decoded.files[0].name === files[0].name,
      hasKey: fragment.includes("."),
    };
  });
  expect(result.filesMatch).toBe(true);
  expect(result.nameMatch).toBe(true);
  expect(result.hasKey).toBe(true);
});

Then(
  "sharing roundtrip with password {string} should preserve content",
  async ({ page }, password) => {
    const result = await page.evaluate(async (pwd) => {
      const { encodeSharePayload, decodeShareFragment } = await import("/src/sharing/codec.js");
      const files = [
        {
          name: "secret.md",
          content: "# Secret Shared\nPassword-protected content.",
          isMain: true,
        },
      ];
      const { fragment } = await encodeSharePayload(files, { password: pwd });
      const decoded = await decodeShareFragment(fragment, async () => pwd);
      return {
        filesMatch: decoded.files[0].content === files[0].content,
        noKeyInUrl:
          !fragment.slice("md2docx_".length).includes(".") ||
          fragment.slice(fragment.lastIndexOf(".") + 1).length !== 43,
      };
    }, password);
    expect(result.filesMatch).toBe(true);
    expect(result.noKeyInUrl).toBe(true);
  }
);

Then("sharing decrypt with wrong password should fail", async ({ page }) => {
  const errored = await page.evaluate(async () => {
    const { encodeSharePayload, decodeShareFragment } = await import("/src/sharing/codec.js");
    const files = [{ name: "test.md", content: "secret", isMain: true }];
    const { fragment } = await encodeSharePayload(files, { password: "correct" });
    try {
      await decodeShareFragment(fragment, async () => "wrong");
      return false;
    } catch {
      return true;
    }
  });
  expect(errored).toBe(true);
});

Then("sharing with expired TTL should fail", async ({ page }) => {
  const errored = await page.evaluate(async () => {
    const { encodeSharePayload, decodeShareFragment } = await import("/src/sharing/codec.js");
    const files = [{ name: "test.md", content: "expired", isMain: true }];
    const { fragment } = await encodeSharePayload(files, { ttl: 1 });
    await new Promise((r) => setTimeout(r, 50));
    try {
      await decodeShareFragment(fragment);
      return false;
    } catch (err) {
      return err.message.includes("expired");
    }
  });
  expect(errored).toBe(true);
});

Given("the current document is saved to IndexedDB", async ({ page }) => {
  await page.evaluate(async () => {
    const ta = document.getElementById("markdown");
    const event = new Event("input", { bubbles: true });
    ta.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 500));
  });
});

Given("a share URL is prepared with content {string}", async ({ page }, content) => {
  preparedShareUrl = await page.evaluate(async (text) => {
    const { encodeSharePayload } = await import("/src/sharing/codec.js");
    const files = [{ name: "main.md", content: text, isMain: true }];
    const { fragment } = await encodeSharePayload(files, {});
    return fragment;
  }, content);
});

Given(
  "a share URL is prepared with content {string} and password {string}",
  async ({ page }, content, password) => {
    preparedShareUrl = await page.evaluate(
      async ({ text, pwd }) => {
        const { encodeSharePayload } = await import("/src/sharing/codec.js");
        const files = [{ name: "main.md", content: text, isMain: true }];
        const { fragment } = await encodeSharePayload(files, { password: pwd });
        return fragment;
      },
      { text: content, pwd: password }
    );
  }
);

When("I navigate to the app with the share URL", async ({ page }) => {
  await page.goto(`about:blank`);
  await page.goto(`/#${preparedShareUrl}`, { waitUntil: "domcontentloaded" });
  await page.locator("#markdown").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(1500);
});

Then("the import dialog should be visible", async ({ page }) => {
  const modal = page.locator("#shareImportModal");
  await expect(modal).toBeVisible({ timeout: 5000 });
});

Then("the password prompt should be visible", async ({ page }) => {
  const modal = page.locator("#sharePasswordModal");
  await expect(modal).toBeVisible({ timeout: 5000 });
});

When("I enter import password {string}", async ({ page }, password) => {
  await page.locator("#pwdInput").fill(password);
});

When("I click the decrypt button", async ({ page }) => {
  await page.locator("#pwdDecrypt").click();
  await page.waitForTimeout(500);
});

When("I click replace all in import dialog", async ({ page }) => {
  await page.locator("#importReplace").click();
  await page.waitForTimeout(500);
});

When("I click merge in import dialog", async ({ page }) => {
  await page.locator("#importMerge").click();
  await page.waitForTimeout(500);
});

When("I click cancel in import dialog", async ({ page }) => {
  await page.locator("#importCancel").click();
  await page.waitForTimeout(300);
});

