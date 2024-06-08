import { expect, test } from "@playwright/test";

async function gotoReducedMotion(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
}

test("loads without console errors and runs the primary workflow", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await gotoReducedMotion(page);

  await expect(page).toHaveTitle("Gradient Lab");
  await expect(
    page.getByRole("heading", { name: "Gradient Lab", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Paused");
  await expect(page.getByRole("img", { name: "Loss landscape visualization" })).toBeVisible();

  await page.getByTestId("step-once").click();
  await expect(page.getByTestId("metric-iteration")).toContainText("1");

  await page.getByRole("button", { name: "Contour" }).click();
  await expect(page.getByRole("button", { name: "Contour" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.getByLabel("Function").selectOption("bowl");
  await expect(page.getByLabel("Function")).toHaveValue("bowl");
  await expect(page.getByTestId("metric-iteration")).toContainText("0");

  const beforeX = await page.getByTestId("param-x").innerText();
  await page.getByTestId("new-path").click();
  await expect(page.getByTestId("param-x")).not.toHaveText(beforeX);

  await page.getByTestId("toggle-run").click();
  await expect(page.getByRole("status")).toHaveText("Running");

  expect(consoleErrors).toEqual([]);
});

test("supports a keyboard-only run toggle path", async ({ page, browserName }) => {
  test.skip(
    browserName === "webkit",
    "macOS WebKit does not tab to buttons unless Full Keyboard Access is enabled"
  );

  await gotoReducedMotion(page);

  let foundRunButton = false;

  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press("Tab");
    const activeLabel = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.getAttribute("aria-label") || element?.textContent || "";
    });

    if (activeLabel.includes("Run animation")) {
      foundRunButton = true;
      break;
    }
  }

  expect(foundRunButton).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Running");
});

test("places the learning guide below the playground and opens FAQ answers", async ({
  page,
}) => {
  await gotoReducedMotion(page);

  const layout = await page.evaluate(() => {
    const playground = document.querySelector(".app-shell").getBoundingClientRect();
    const guide = document
      .querySelector('[data-testid="learning-guide"]')
      .getBoundingClientRect();

    return {
      playgroundBottom: playground.bottom,
      guideTop: guide.top,
    };
  });

  expect(layout.guideTop).toBeGreaterThanOrEqual(layout.playgroundBottom - 1);

  await page.getByTestId("learning-guide").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "What is Gradient Lab?" })
  ).toBeVisible();

  await page.getByText("Is this a neural network?").click();
  await expect(page.getByText(/This lab isolates the optimization step/i)).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 500, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`does not horizontally overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await gotoReducedMotion(page);

    const overflow = await page.evaluate(() => {
      const documentWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const overflowingElements = Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: element.className,
            left: rect.left,
            right: rect.right,
          };
        })
        .filter((rect) => rect.right > documentWidth + 1 || rect.left < -1);

      return {
        documentWidth,
        scrollWidth,
        overflowingElements,
      };
    });

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.documentWidth + 1);
    expect(overflow.overflowingElements).toEqual([]);
  });
}
