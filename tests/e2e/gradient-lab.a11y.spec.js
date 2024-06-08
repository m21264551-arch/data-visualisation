import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function runAxe(page, viewport) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  return new AxeBuilder({ page }).analyze();
}

test("has no automated accessibility violations on desktop", async ({ page }) => {
  const results = await runAxe(page, { width: 1440, height: 900 });

  expect(results.violations).toEqual([]);
});

test("has no automated accessibility violations on mobile", async ({ page }) => {
  const results = await runAxe(page, { width: 390, height: 844 });

  expect(results.violations).toEqual([]);
});
