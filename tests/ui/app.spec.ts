import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("three interactive directions, filtering, and screenshots", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [name, file] of [
    ["01 Editorial", "editorial"],
    ["02 Studio", "studio"],
    ["03 Atlas", "atlas"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Edit Chelbesa", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/home-${file}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("textbox", { name: "Search beans" }).fill("Kanzu");
  await expect(
    page.getByRole("button", { name: "Edit Chelbesa", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit Kanzu", exact: true }),
  ).toBeVisible();
});
test("bean CRUD persists and cancel does not save", async ({ page }) => {
  await page.getByRole("button", { name: "Add a bean", exact: true }).click();
  await page.getByLabel("Coffee name", { exact: true }).fill("Test bean");
  await page.getByLabel("Roaster", { exact: true }).fill("Test roaster");
  await page.getByRole("button", { name: "Save bean", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Edit Test bean", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Test bean", exact: true })
    .click();
  await page.getByLabel("Coffee name", { exact: true }).fill("Unsaved");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Test bean", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Test bean", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Test bean", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Test bean", exact: true }),
  ).toHaveCount(0);
});
test("espresso trial, comparison, linked calendar and validation", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Experiment Lab", exact: true })
    .click();
  await page.getByRole("button", { name: /A sweeter morning/ }).click();
  await page
    .getByRole("button", { name: "Duplicate into a trial", exact: true })
    .click();
  await page.getByLabel("Beverage yield (g)", { exact: true }).fill("40");
  await page.getByLabel("Observed duration (s)", { exact: true }).fill("30");
  await expect(page.getByLabel("Sourness", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A sweeter morning · trial",
      exact: true,
    }),
  ).toBeVisible();
  await page.locator(".compare-check input").first().check();
  await page.locator(".compare-check input").last().check();
  await expect(
    page.getByRole("heading", { name: "What changed?", exact: true }),
  ).toBeVisible();
  const d = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("coffee-lover.v1")!),
  );
  expect(d.experiments).toHaveLength(3);
  expect(
    d.drinks.filter((x: any) => x.experimentId === d.experiments[0].id),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Coffee dose (g)", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Dose must be greater");
  await page.getByLabel("Coffee dose (g)", { exact: true }).fill("18");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("coffee-lover.v1")!),
  );
  expect(after.drinks).toHaveLength(4);
});
test("pour validation, quick drink and places repeated visits", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Start an experiment", exact: true })
    .click();
  await page.getByRole("button", { name: "Pour-over", exact: true }).click();
  await page.getByLabel("Experiment name", { exact: true }).fill("Filter test");
  await page.getByLabel("Grinder model", { exact: true }).fill("C40");
  await page.getByLabel("Observed duration (s)", { exact: true }).fill("180");
  await page.getByLabel("Grind setting", { exact: true }).fill("24");
  await page.getByLabel("Cumulative (g)", { exact: true }).last().fill("240");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Final cumulative water");
  await page.getByLabel("Cumulative (g)", { exact: true }).last().fill("250");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Filter test", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quick drink log", exact: true })
    .click();
  await page
    .getByLabel("What did you drink?", { exact: true })
    .fill("Café cortado");
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await page
    .getByRole("button", { name: "Places & stories", exact: true })
    .click();
  await page.getByRole("button", { name: "Add a place", exact: true }).click();
  await page.getByLabel("Place name", { exact: true }).fill("Test café");
  await page.getByLabel("Latitude (−90 to 90)", { exact: true }).fill("51.5");
  await page
    .getByLabel("Longitude (−180 to 180)", { exact: true })
    .fill("-0.12");
  await page.getByRole("button", { name: "Add visit", exact: true }).click();
  await page.getByRole("button", { name: "Save place", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Test café", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("51.5000°, -0.1200°")).toBeVisible();
});
test("import validation, reset cancellation and empty state", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Data & privacy", exact: true })
    .click();
  await page.getByLabel("Import a Coffee Lover JSON backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(page.getByRole("alert")).toContainText("Invalid version");
  await page
    .getByRole("button", { name: "Clear all records", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear all records", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Room for a new favorite.",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Room for a new favorite.",
      exact: true,
    }),
  ).toBeVisible();
});
test("mobile navigation, dialogs, no horizontal overflow and captures", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, file] of [
    ["Shelf", "shelf"],
    ["Lab", "lab"],
    ["Calendar", "calendar"],
    ["Places", "places"],
  ]) {
    await page
      .getByRole("navigation", { name: "Mobile navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/mobile-${file}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Add a place", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("navigation back, map placement cancel, and timer pause/reset", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Experiment Lab", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Places & stories", exact: true })
    .click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "The Experiment Lab." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("timer")).not.toHaveText("00:00");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.getByRole("timer").textContent();
  await page.getByRole("button", { name: "Reset timer", exact: true }).click();
  expect(paused).not.toBe("00:00");
  await expect(page.getByRole("timer")).toHaveText("00:00");
  await page
    .getByRole("button", { name: "Places & stories", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Place a pin on map", exact: true })
    .click();
  await page.locator(".map svg").click({ position: { x: 150, y: 100 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByLabel("Latitude (−90 to 90)", { exact: true }),
  ).not.toHaveValue("0");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(3);
});

test("valid import/export, corrupt storage preservation, and quota error", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Data & privacy", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export version 1 JSON backup", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(
    /^coffee-lover-.*\.json$/,
  );
  const backup = {
    version: 1,
    beans: [],
    experiments: [],
    drinks: [],
    places: [],
  };
  await page
    .getByLabel("Import a Coffee Lover JSON backup", { exact: true })
    .setInputFiles({
      name: "valid.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Room for a new favorite.",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("coffee-lover.v1", "corrupt original"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "has not been overwritten",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("coffee-lover.v1")),
  ).toBe("corrupt original");
  await page.evaluate(() => localStorage.removeItem("coffee-lover.v1"));
  await page.reload();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Quick drink log", exact: true })
    .click();
  await page
    .getByLabel("What did you drink?", { exact: true })
    .fill("Unsaved because quota");
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Could not save");
  expect(
    await page.evaluate(() => localStorage.getItem("coffee-lover.v1")),
  ).toBeNull();
});

test("accessible pages and dialog keyboard focus", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const name of ["01 Editorial", "02 Studio", "03 Atlas"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  for (const name of [
    "Experiment Lab",
    "Coffee calendar",
    "Places & stories",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Add a place", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Add a place", exact: true }),
  ).toBeFocused();
});

test("narrow and tablet homepage variants plus Lab editor captures", async ({
  page,
}) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["01 Editorial", "02 Studio", "03 Atlas"]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Experiment Lab", exact: true })
    .click();
  await page.getByRole("button", { name: /A sweeter morning/ }).click();
  await page.screenshot({
    path: "docs/screenshots/lab-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/mobile-experiment-editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
});
