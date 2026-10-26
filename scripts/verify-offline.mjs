import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const path = process.argv[2];
if (!path) throw new Error("Provide the generated offline HTML path.");
// This cloud browser prohibits file://. Serve only the single bundled file on loopback.
const html = await readFile(path);
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const requests = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(origin)) requests.push(r.url());
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
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
  console.log(
    "Standalone preview passed via loopback: three variants, four modules, persistent drink save/reload, no external requests, no runtime errors. Direct file:// opening is blocked by cloud browser policy and remains untested.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
