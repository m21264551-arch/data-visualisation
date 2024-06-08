import { expect, test } from "@playwright/test";

async function openStablePage(page, viewport) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
}

test("desktop default view matches baseline", async ({ page }) => {
  await openStablePage(page, { width: 1440, height: 900 });

  await expect(page).toHaveScreenshot("desktop-default.png");
});

test("tablet layout matches baseline", async ({ page }) => {
  await openStablePage(page, { width: 768, height: 1024 });

  await expect(page).toHaveScreenshot("tablet-default.png");
});

test("mobile layout matches baseline", async ({ page }) => {
  await openStablePage(page, { width: 390, height: 844 });

  await expect(page).toHaveScreenshot("mobile-default.png");
});

test("contour view matches baseline", async ({ page }) => {
  await openStablePage(page, { width: 1440, height: 900 });

  await page.getByRole("button", { name: "Contour" }).click();

  await expect(page).toHaveScreenshot("desktop-contour.png");
});

test("extreme learning rate state matches baseline", async ({ page }) => {
  await openStablePage(page, { width: 1440, height: 900 });

  await page.getByLabel("Learning rate (α)").evaluate((element) => {
    element.value = "0";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByTestId("step-once").click();

  await expect(page).toHaveScreenshot("desktop-extreme-learning-rate.png");
});
