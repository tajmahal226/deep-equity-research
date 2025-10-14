import { expect, test } from "@playwright/test";

const PRODUCT_TAB_LABELS = [
  /Free-Form Deep Research/i,
  /Company Deep Dive/i,
  /Bulk Company Research/i,
  /Market Research/i,
  /Company Discovery/i,
  /Case Studies/i,
  /Doc Storage/i,
  /Prompt Library/i,
];

test.describe("Product display", () => {
  test("home page highlights the research product", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /TJ Deep Research/i, level: 1 })
    ).toBeVisible();

    for (const label of PRODUCT_TAB_LABELS) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: /1\. Research Topics/i, level: 3 })
    ).toBeVisible();

    await expect(
      page.getByLabel(/1\.1 Research topics/i, { exact: false })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Pre-Filled Questions/i })
    ).toBeVisible();
  });
});
