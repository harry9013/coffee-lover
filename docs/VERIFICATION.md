# Verification record

Cloud checkout: `/workspace/coffee-lover`. Branch: `work`. Initial repository was empty, with no AGENTS.md or pre-existing app files. All implementation and validation happened in this cloud environment; no laptop access, public deployment, remote push, account creation or paid service.

## Passed

- `npm run typecheck` — TypeScript project validation.
- `npm run build` — production Vite bundle, approximately 299 kB JavaScript / 92 kB gzip, plus 31 kB CSS / 8 kB gzip.
- `npm test` — **30 unit tests** covering mass ratios, cumulative pours, timing, local/leap dates, guidance precedence and uncertainty, nullable observations, import schema/references, missing values and persistence failure.
- `TZ=Pacific/Kiritimati npm test` — same 30 tests in UTC+14, guarding against accidental UTC calendar grouping.
- `npm run test:ui` — **13 Chromium scenarios**: three shared-data homepage designs; bean CRUD/persistence/cancel; trial duplication and changed-variable comparison; one-to-one calendar linking; pour validation; quick drinks; place coordinates/repeated visits; import/export; invalid/corrupt storage; quota failure; reset confirmation/empty state; browser back; timer pause/reset; map placement cancellation; focus return; responsive overflow checks.
- Automated axe WCAG 2 A/AA and 2.1 AA checks: three homepages, Lab, Calendar, Places and the place dialog; zero detected violations in checked states. This is not a complete accessibility certification.
- Responsive layout checked at 320, 390, 768 and 1440 CSS pixels. Screenshots cover all three desktop homepages, desktop Lab, mobile modules and a mobile experiment editor.
- `npm audit --omit=dev` — zero reported production dependency vulnerabilities at validation time.
- Source formatting and `git diff --check`.

## Independent review

A separate reviewer reproduced six defects and one coaching-rule concern. All were corrected and covered by regression checks; see `docs/REVIEW.md`. The final browser suite explicitly checks UTC+8 rollover, inert imported markup, same-method preservation and tablet settings access.

## Recovered failures

- Default npm cache directory was unavailable. Installation succeeded using `/tmp/coffee-npm-cache`.
- Playwright browser download returned HTTP 403 “Domain forbidden.” No approval was denied and no action has an uncertain outcome. Used the already installed `/usr/bin/chromium`; all browser checks ran there.
- Initial TypeScript config and missing Node types were corrected.
- Initial browser checks exposed exact label naming/description issues; fields now use explicit labels and described-by hints.
- Accessibility checks exposed secondary-text contrast and modal focus restoration defects. Both were corrected and rerun successfully.

## Failed / blocked final checks

No failing application checks or pending approval. Direct `file://` preview verification was blocked by cloud Chromium administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). No file navigation retry or policy bypass was attempted. The self-contained HTML is instead checked with a loopback-only static server; no external hosting.

## Unrun / limits

- Physical iOS/Android, Safari/WebKit, Firefox and actual screen-reader user testing.
- Background/mobile sleep on physical devices; timer is documented as timestamp-recovering, without guaranteed alarms or continuity through clock changes.
- Multi-tab concurrent writes, cloud synchronization, authentication, native packaging and machine connections (not implemented).
- Large-scale performance and production security review. This is a private prototype using local browser storage.
- Geospatial accuracy beyond the explicitly approximate SVG map. Numeric coordinates remain editable and visible.

## Review artifacts

- `docs/screenshots/home-editorial.png` — recommended warm shelf.
- `docs/screenshots/home-studio.png` — compact instrument-led inventory.
- `docs/screenshots/home-atlas.png` — travel journal with shared bean shelf.
- `docs/screenshots/lab-desktop.png` — espresso values, planned pressure profile and guidance.
- `docs/screenshots/mobile-{shelf,lab,calendar,places}.png` — 390 px layouts.
- `docs/screenshots/mobile-experiment-editor.png` — numeric form at 390 px.

Full-page mobile screenshots show the fixed bottom navigation at the viewport boundary; the live page scrolls behind it with reserved bottom padding.

## Delivery

Source-only ZIP and a self-contained functional offline preview are packaged by `scripts/package_deliverables.py`. Internal browser screenshots are excluded from all Library deliverables. `scripts/verify-offline.mjs` checks the standalone HTML with no external requests. Library upload results are reported separately after confirmed saving.
