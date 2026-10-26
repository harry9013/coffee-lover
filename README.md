# Coffee Lover

A private, browser-local coffee shelf and brewing notebook. Built in the selected cloud repository; no public deployment, remote push, authentication service or paid API.

## Run

Node 22+ recommended (verified with Node 24). From this folder:

```sh
npm ci --cache /tmp/coffee-npm-cache
npm run dev
```

Vite serves port 5173. This starts a development server only; it does not publish the app. Production output: `npm run build`, then `npm run preview` (port 4173). The implementation makes no external data, geocoding, font or image requests. Research links are ordinary links opened only by the user.

## Try it

- Switch **01 Editorial / 02 Studio / 03 Atlas** on the shelf. Each uses the same collection and functional controls.
- Add/edit a bean, search, mark a bag finished or archived, then **Brew this coffee**.
- In the Lab, choose espresso or pour-over. Enter your measured duration, equipment and setting. Unknown sensory observations remain unknown. Save to create exactly one linked calendar drink.
- Duplicate a baseline into a trial, change one variable and save. Check **Compare** on two records to see differences and timing/equipment caveats.
- Quick drink log records a café memory without forcing a detailed experiment.
- Places supports approximate map click placement, exact coordinate editing, repeated visit dates and an accessible list.
- **Data & privacy** exports/imports versioned JSON, restores samples or starts empty. Import/reset requires confirmation. Export first if the current records matter.

## Choose a homepage

**Recommended: Editorial.** Ivory, moss, generous serif typography and original CSS coffee illustrations make the shelf a daily ritual. The Lab keeps precise measurement controls in this shared visual language.

**Studio:** graphite measurement panel, monospaced values and compact horizontal inventory rows. Intended for a user who starts from repeatable experiments.

**Atlas:** terracotta/midnight travel journal, schematic map, staggered arched bean cards. Intended for a collection organized through places and memories.

These are real interactive variants, not separate screenshot mocks. The switcher does not modify records. The chosen variant is session UI state; it defaults to Editorial on reload.

## Architecture

- `src/domain.ts`: reusable TypeScript entities, pure ratio/stage/date calculations, deterministic coach, changed-variable comparison and complete import validation. No React or storage dependency.
- `src/persistence.ts`: `Repository` interface and `LocalRepository` adapter. Version 1 JSON is the portable boundary for future clients/backends.
- `src/sample.ts`: deterministic illustrative bags, brews and visits; no personal records.
- `src/forms.tsx`: labeled editor forms, numeric validation, cumulative pour plan and editable profile table.
- `src/components.tsx`: native dialog, reusable labeled fields, clock-based timer, original CSS bag artwork and self-contained schematic SVG map.
- `src/App.tsx`: navigation, module views and transactional aggregate updates. Hash navigation supports back/forward. Experiment and linked drink save together as one localStorage snapshot.
- `src/styles.css`: three homepage visual systems, shared modules, responsive navigation, focus styles and reduced motion.
- `tests/domain.test.ts`: unit tests; `tests/ui/app.spec.ts`: Chromium functional, responsive and accessibility checks.

A future native client can reuse domain types/functions and implement `Repository` against native storage or an authenticated API. Web components are deliberately not presented as native screens. Split page components and extract application commands as the domain grows; the current view orchestration stays in one module for prototype review.

## Data integrity and privacy

LocalStorage key: `coffee-lover.v1`. This is **single-browser storage, not cloud sync or authentication**. No database/server is configured. Closing a tab preserves saved records; clearing site data removes them. Export backups before migration. Unsaved dialog changes are discarded on cancel, Escape, backdrop click or reload.

Imports validate version, shape, finite numeric bounds, dates, ID uniqueness, linked entities, stage monotonicity, profile times and one consistent drink per experiment. Invalid or unreadable storage is not automatically overwritten; explicit import/reset is required. A failed save leaves prior saved data intact and the form open. A bean with history cannot be deleted: archive it instead. Experiment deletion removes its linked drink and detaches descendant lineage; place deletion removes links from quick drinks. No cross-tab concurrent-edit reconciliation yet.

The map is an original, approximate schematic using an equirectangular coordinate mapping. It is not geographically detailed navigation. Manual numeric entry is the precise source of truth. No external geocoding or paid maps.

## Brewing assumptions

Read [research and guidance specification](docs/COFFEE_RESEARCH.md). Espresso ratios use grams, never optional ml. Pour inputs are **cumulative**; bloom is included once. Planned pressure/recipe values are separate from actual duration and labeled by provenance. Profile lines only connect entered points; they are not machine telemetry. Strength, body and flavor are separate observations. The coach offers hypotheses, one-variable trials, uncertainty and sources; no inferred extraction percentage or universal 30-second target.

Timer elapsed time derives from timestamps and recovers after tab suspension. It does not promise background alarms, uninterrupted screen updates or accuracy through system-clock changes. It resets when leaving the Lab; it does not automatically write timing into an experiment.

## Checks

```sh
npm run typecheck
npm run build
npm test
npm run test:ui
```

UI tests use installed `/usr/bin/chromium` in this cloud environment. Set `CHROMIUM_PATH` for another system browser. If a downloaded Playwright browser is desired, install it and configure `launchOptions.executablePath` accordingly. Tests launch the Vite server automatically.

Screenshots are in [docs/screenshots](docs/screenshots): three desktop homepages and mobile Shelf/Lab/Calendar/Places. The UI suite regenerates them. See [verification record](docs/VERIFICATION.md) for final results and limitations.

## Next steps

1. Choose the homepage direction and review actual daily brewing flows.
2. Add immutable recipe revisions, structured equipment/water/bypass fields, bag opening date and actual stage timestamps.
3. Introduce a schema migration registry and native/server persistence adapters with explicit conflict handling.
4. Design authentication, encrypted transport, account deletion and private multi-device sync before storing real data remotely.
5. Validate on physical iOS/Android devices and with assistive technology; package native clients only after those decisions.

Native mobile apps, production identity/sync, calibrated geographic maps, machine integration, offline service-worker installation and public hosting are not built.
