import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const path = process.argv[2];
if (!path) throw new Error("Provide the generated offline HTML path.");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const requests = [];
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) requests.push(r.url());
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(path).href);
for (const name of ["01 Editorial", "02 Studio", "03 Atlas"]) {
  await page.getByRole("button", { name, exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name, exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Edit Chelbesa", exact: true })
      .isVisible(),
    true,
  );
}
await page
  .getByRole("button", { name: "Quick drink log", exact: true })
  .click();
await page
  .getByLabel("What did you drink?", { exact: true })
  .fill("Offline preview test");
await page.getByRole("button", { name: "Save drink", exact: true }).click();
await page.reload();
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("coffee-lover.v1")),
);
assert(saved.drinks.some((d) => d.name === "Offline preview test"));
for (const name of ["Experiment Lab", "Coffee calendar", "Places & stories"])
  await page.getByRole("button", { name, exact: true }).click();
assert.deepEqual(errors, []);
assert.deepEqual(requests, []);
await browser.close();
console.log(
  "Offline preview passed: three variants, four modules, persistent drink CRUD, no external requests, no runtime errors.",
);
