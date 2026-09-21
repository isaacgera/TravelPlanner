# Travel Planner - Session Log

- **Category:** Home
- **Complexity tier:** Medium
- **Status:** Built (v1.0.1 shipped)
- **Description:** Plan family/friends trips: trip + travellers, one country with multiple
  cities, combined day-by-day itinerary + per-city weather, reusable packing checklists.
- **Scope (v1):** Trip details, travellers (names), country + cities, combined
  itinerary/weather, packing lists + reusable templates, per-city Open-Meteo weather,
  export/import. Vanilla no-build PWA.

---

## Scaffold - 30 Aug 2026
Placeholder folder + docs created from the Ideas backlog. No build work yet.
When this app is picked up: read this log first, agree build-standards flags,
move the Ideas.md row to In Progress, and start per the build-mode workflow.

---

## Session 1 — 10 Sep 2026 — build started (planning agreed, no code yet)
**Picked this up from the backlog, agreed v1 scope + build-standards flags, and wrote the
SPEC requirements/design. No app code yet — decisions captured so the build can resume cleanly.**

Framing: a planner for **family/friends trips** (not solo).

Agreed v1 scope:
- Trips (name, single destination, start/end dates, notes) + a **travellers name list**.
- Day-by-day **itinerary**.
- **Packing lists** grouped by category with quantity + check-off, and **reusable templates**.
- **Weather**: per-destination daily forecast for the trip dates via **Open-Meteo (keyless)**,
  with geocoding to turn a destination into coordinates. Cached for offline; graceful message
  when the trip is beyond the ~14-day forecast horizon.
- **Export/import JSON** backup.

Build-standards flags agreed:
- **Stack:** vanilla HTML/CSS/JS, no build step; installable, mobile-first **PWA**.
- **Rigour:** Medium (module separation, localStorage, backup, a11y basics).
- **Platform:** desktop + mobile web, installable PWA (primary use is on a phone while packing).
- **Data/privacy:** local-first. The ONLY outbound data is the destination name/coords sent
  to Open-Meteo for a forecast — no traveller/itinerary/packing data ever leaves the device.

Key decisions / rationale:
- **Open-Meteo over OpenWeatherMap** specifically because it needs **no API key** — keeps the
  app shareable/installable with no secret to manage or commit (honours the secrets-discipline
  rule). This is also the first app in the family to make an outbound call, so the offline
  caching + "forecast only leaves coords" privacy stance were made explicit.
- **Travellers = names only in v1**; per-person packing deferred to v2 (the names list is a
  deliberate stepping stone).
- **Single destination in v1**; multi-stop trips deferred to v2 (design keeps the hook: a
  destination could become an array later).

Done this session:
- Wrote SPEC-requirements.md (REQ-01..10, NFR-01..06) and SPEC-design.md (data model,
  Open-Meteo geocoding + forecast, offline/PWA, privacy, UI sketch); replaced the SPEC-tasks
  stub with a real build plan.
- Ideas.md row moved to **In Progress** with an enriched one-liner reflecting the agreed scope.

Status: **In Progress** — planning agreed, no code written yet.

Open decisions to settle at build kickoff:
- Default packing categories + any starter templates to ship.
- Itinerary + weather in one "trip days" view vs separate tabs.
- Licence choice (ask Isaac before adding a LICENSE).

Next session: start the build — app shell + data layer first, then trips/travellers, then
packing/templates, itinerary, and weather last (it's the one online piece).

---

## Session 2 — 17 Sep 2026 — resumed; renamed, scope refined, build starting
**Resumed from Session 1's planning. Read the existing SPEC trilogy first (it was already
solid), re-agreed the build-standards flags, refined a few decisions, renamed the app, and
updated the whole spec set. Build of Option A starts now.**

Decisions this session:
- **Rename:** "Travel Planner + Packing List" → **"Travel Planner"** (Option 2: folder,
  docs, and Ideas.md row all renamed). Packing lists remain a headline feature, just not in
  the name. Folder is now `Home/Travel Planner/`.
- **Destination:** refined from "single destination" to **one country per trip with one or
  more cities** inside it. Multi-*country* trips and per-city date ranges deferred to v2.
- **Weather:** **per city** — each place fetches and caches its own Open-Meteo daily
  forecast, degrades independently offline / out-of-range.
- **Packing:** ship **default categories** (Clothes, Toiletries, Documents, Tech,
  Health/Meds, Misc) with **manual add** of categories and items.
- **Layout:** itinerary + weather **combined** into one "trip days" view.
- **Licence:** **MIT**, copyright holder **Isaac A Gera** (matches the Forjé footer).

Two-track plan agreed:
- **Option A (vanilla no-build PWA)** — the shipped product, built first so Isaac can use/test
  it. This is what the SPEC + backlog track.
- **Option B (Svelte 5)** — a parallel *learning* reimplementation of the same spec, later,
  under `experiments/svelte-version/`. Chose Svelte over React/SolidJS as the best fit for
  this family (smallest jump from vanilla, least boilerplate, small runtime, signals concept
  transfers); SolidJS is the runner-up. Flagged that any framework adds a Node/npm build step
  and Windows tooling the shipped app deliberately avoids. Grounded the choice in current
  (2026) framework sources during the discussion.

Done this session:
- Updated SPEC-requirements.md, SPEC-design.md, SPEC-tasks.md (rename; country + cities;
  per-city weather; combined view; default categories + manual add; MIT/NFR-07; v2 deferrals;
  Option B experiment note; data model destination → country + places[] with per-city cache).
- Fixed this log's stale header (was "Idea"; now "In Progress") and refreshed the one-liner.

Status: **In Progress** — spec reconciled; Option A build beginning with app shell + data layer.

Next: run the Spec Reviewer over the revised trilogy, then build Option A (shell → data →
trips/cities → trip-days view → packing/templates → weather → PWA), verify, add LICENSE + docs.

### Session 2 (cont.) — Option A built (v1.0.0)

Built the full Option A app (vanilla no-build PWA):
- **Structure:** `index.html` (app shell, tab bar), `css/styles.css` (light/dark design
  tokens, mobile-first → sidebar at 720px), and ES modules: `js/app.js` (bootstrap/routing/
  theme/backup), `store.js` (namespaced `travelplanner_` localStorage + export/import with
  sanitize/migrate), `weather.js` (Open-Meteo geocoding + per-city forecast, 16-day horizon),
  `ui.js` (DOM/modal/confirm helpers + Forjé footer), and `views/{trips,trip-detail,
  templates,about}.js`.
- **Features:** trips + travellers (add/remove); country + multiple cities via geocoding
  (region/country shown to disambiguate); combined "trip days" view (itinerary entries +
  per-city weather chips per day, refresh button); packing with default categories + manual
  add + quantities + check-off; reusable templates (save from trip / apply to trip, replace
  with confirm); JSON export + import (validated, confirm-before-replace); light/dark theme
  toggle; About/help page.
- **PWA:** `manifest.webmanifest`, `sw.js` (cache-first shell `travel-planner-v1.0.0`,
  network-first for Open-Meteo with cache fallback), `icons/icon.svg`.
- **Docs/licence:** MIT `LICENSE` (Isaac A. Gera), `README.md` + changelog, rewrote
  `overview.html` + `userguide.html` in the app's teal palette with the Forjé footer.
- **Version:** `APP_VERSION = "1.0.0"`.

**Verified:** all 8 JS modules pass editor diagnostics clean; import/export wiring
cross-checked (every import resolves to a real export). Node isn't installed on this machine
(consistent with the no-build workflow), so no `node --check` was run — relied on the
language-server diagnostics + manual wiring check.

**Not yet verified / open:**
- **PNG icons missing.** The manifest references `icon-192.png`, `icon-512.png`, and
  `icon-maskable-512.png`, but only `icon.svg` exists (couldn't generate binary PNGs here).
  Installability will be limited until those are added — a good job for the PWA Readiness
  Checker + a quick asset step.
- **Browser smoke test is Isaac's step:** serve over HTTP (Live Server / `npx serve .`),
  not `file://`. Check: create a trip, add a city (live geocoding), refresh weather, tick
  packing items, save/apply a template, export then import a backup, toggle theme, install.

**Status: still In Progress** — code complete and structurally verified, but holding off on
"Built" until the PNG icons are added and Isaac runs the live browser/PWA smoke test.

Next: add PNG icons + run the PWA Readiness Checker and Pre-Live Testing Agent, then flip to
Built. After that, start the Svelte Option B experiment under `experiments/svelte-version/`.

---

## Session 3 — 17 Sep 2026 — UI rework, features, and smoke-test fixes
**Isaac ran a live browser smoke-test of Option A; this session acted on that feedback with
bug fixes, feature additions, and a substantial UI refinement pass. Still v1.0.0, In Progress.**

### Features added
- **Presets rename:** the "Templates" feature is now "Presets" everywhere (tab, headings,
  buttons, dialogs, About). Internal route/storage keys kept as `templates` to avoid churn.
- **Itinerary summary + Flights + Accommodation** (modelled on a real Hyderabad-Singapore
  itinerary PDF Isaac shared): a new **Itinerary** sub-tab renders a clean, printable
  one-page summary (title, dates, places covered, travellers, flights, accommodation,
  day-by-day). **Flights** (label, flight no., from/to, date, dep/arr times) and
  **Accommodation** (name, city, check-in/out, notes) are add/edit/remove in the Plan tab.
  Data model gained `trip.flights[]` and `trip.stays[]`, sanitized backward-compatibly.
- **Master People list** (in the Presets tab): each person has a name + optional birthday,
  age note, and gender (age derived from birthday). A trip's travellers can be **picked from
  People** or added manually with an **opt-in "save to People"**. Added top-level
  `data.people[]` + `sanitizePerson`. Trips store traveller **names as copies** (not
  references) so editing/removing a person never rewrites past trips.
- **Sub-tab renames:** Overview -> **Plan**, Summary -> **Itinerary** (labels only).

### Smoke-test bug fixes
- Theme toggle wasn't wired to a click handler — fixed.
- Backup three-dot menu was broken by a CSS specificity bug (`.data-menu{display:flex}`
  overrode the `hidden` attribute) — fixed, then the menu was removed entirely (see below).
- "Weather not loading" was actually **correct** out-of-range behaviour (trip dates were
  ~25 days out vs the 16-day forecast horizon); added an explanatory banner so it's clear.
- Fixed layout overlaps; native date inputs keep the OS locale format (can't be forced) —
  added a calendar-picker hint.

### UI refinement pass
- **Sidebar reworked in the WealthOrah style:** light `--surface` panel, soft right-edge
  shadow, rounded nav items with a `scale(1.04)` + shadow lift on hover, active =
  primary-soft background + primary text. Brand block top-left.
- **Trips list:** hero band + 2-column card grid on wide screens.
- **Segregated Trips** into **Domestic** (India base) vs **International** sections, each
  with a count; added **status badges** (In progress / Upcoming / Planning / Completed) from
  the dates, with completed cards dimmed and sorted last.
- **Backup relocated:** removed the top-right three-dot menu; Export/Import now live in the
  sidebar's "Settings & data" section, with a Backup card on the About page for mobile.
- **Top bar removed on desktop** (brand was redundant) — brand shows once in the sidebar;
  **theme toggle moved into the sidebar**. A slim top bar remains on mobile only (brand +
  theme toggle), both toggles kept in sync. Fixed a specificity bug where
  `.tabbar .nav-brand` (0,2,0) was overriding the desktop `.nav-brand{display:flex}`, which
  had briefly hidden the title entirely.
- SW cache bumped through to **`travel-planner-v1.0.0-8`**.

### Verified
All changes kept diagnostics-clean throughout (editor language server; Node isn't installed
on the machine — no-build workflow). Behavioural verification was Isaac's live browser
smoke-test, which drove this session's fixes.

### Files changed
`index.html`, `css/styles.css`, `js/app.js`, `js/store.js`, `js/views/trips.js`,
`js/views/trip-detail.js`, `js/views/templates.js`, `js/views/about.js`, `sw.js`,
`SPEC-requirements.md`.

### Outstanding (next session)
- **PNG icons missing** — manifest references `icon-192/512/maskable-512.png` but only
  `icon.svg` exists; affects PWA installability. Add these first.
- Run the **PWA Readiness Checker** (will formalise the icon gap) and the **Pre-Live Testing
  Agent** (accessibility pass — check contrast on the new sidebar/hero).
- Update **SPEC-design.md** to reflect the sidebar, People, flights/stays, and renames;
  double-check SPEC-requirements.md; refresh `userguide.html` / `overview.html` terminology
  and new features.
- Once verified + icons added, flip the **Ideas.md** row to **Built (Travel Planner v1.0.0)**.
- **Svelte Option B** parallel experiment still not started (planned under
  `experiments/svelte-version/`).

Status: **In Progress** (v1.0.0) — feature-complete for v1 pending icons + audits + doc sync.

---

## Session 4 — 17 Sep 2026 — major polish, restructure, audits & PWA finish
**A large session: navigation restructure, an expanded theming system, card consistency,
two Pre-Live accessibility re-audits (all findings fixed), the PWA finish (icons, manifest,
Lighthouse), sample data, and repo prep. v1.0.0 is feature-complete and being published to
GitHub (public repo "TravelPlanner") + GitHub Pages.**

### Navigation & structure
- **Trips** sidebar sub-nav (Domestic / International, India as base) now **filters** the main
  screen; matching on-screen segmented switcher so it also works on mobile.
- **Presets** sub-nav (Travellers / Packing lists) filters likewise; packing presets can now
  be **created independently** via a preset builder (name + categories + items), not only
  saved from a trip.
- Renamed **People → Travellers** throughout the UI (internal storage keys unchanged).
- New **Personalization** view (`js/views/personalization.js`) with **Appearance** (colour
  palette picker) and **Data** (Export/Import) sections, each filterable, moved out of About.
  On-screen Appearance/Data switcher fixes a mobile-unreachable-Data blocker.
- Sidebar: added a **Personalize** nav-item; the light/dark toggle is now a subtle icon in the
  sidebar **footer**; the brand footer is a single fixed shell element (bottom of sidebar on
  desktop, fixed above the tab bar on mobile) — no longer per-view, so it stops jumping.
- Collapsible sidebar now **zooms** the UI (root font-size scale) when collapsed; edge chevron
  with a resting opacity for touch discoverability.

### Theming
- **11 preset palettes + Custom** (was 5 + Custom), each with a **distinct** secondary/accent;
  palette grid 6-per-row (3 on narrow mobile).
- Wired the secondary/accent into **hover/active** states of tabs, sub-tabs, segmented buttons
  and pills; derived `--accent-strong` / `--accent-soft` per palette.
- Trips **hero band** uses a primary→accent gradient.
- **Custom-palette contrast guard**: a too-light primary is auto-darkened so white text stays
  legible, with a live-announced warning.
- **Smooth faded transition** on light/dark switch (respects reduced-motion).

### Consistency & accessibility
- Unified trips, travellers and packing-preset cards into one **`.entity-card`** style (shared
  2-column grid, coloured left accent bar, hover lift) — the "everything is a card" pass.
- Consistent **hover-preview** across all sidebar tabs and sub-tabs (`previewNav`).
- Ran the **Pre-Live Testing Agent** twice. The post-restructure re-audit found 2 mobile
  blockers (Data + Presets unreachable on mobile) plus should-fixes — **all fixed**: fake
  tablist/tab roles → `role=group` + `aria-pressed`; weather-chip aria-labels; removed invalid
  `role=note`; darkened `--muted` + status-badge contrast to clear AA; custom-palette contrast
  guard; chevron resting opacity + tap-to-open sub-nav; `:focus` fallback; larger mobile tab
  labels; 44px touch targets on coarse pointers; debounced `aria-live` announce; preset-builder
  focus restoration; single visually-hidden `<h1>`.

### PWA finish
- Ran the **PWA Readiness Checker**: "nearly there", only blocker was the missing PNG icons.
- Created `icons/generate-icons.html` (canvas generator); Isaac generated `icon-192/512/
  maskable-512.png` + install screenshots (`screenshot-wide.png` 1280×800, `screenshot-narrow.png`
  720×1280); the generator was then deleted.
- Fixed stale teal (`#1f7a6d` → `#0f8a7e`) across manifest `theme_color`, the meta tag, and the
  SVG. Added manifest `id` + `start_url "./"` + `screenshots`; removed the SVG icon manifest
  entry (Chrome errored on it) — SVG stays as the favicon.
- **Lighthouse: Performance 95 / Accessibility 96 / Best Practices 96 / SEO 100.** Manifest
  panel clean.

### Sample data
- Used the **Sample Data Generator**: `sample-data.json` (5 trips — Kerala / Goa / Dubai /
  Rajasthan / Japan, spanning Completed / In-progress / Upcoming and Domestic / International;
  6 travellers; 3 packing presets; flights, stays, itineraries) + `load-sample-data.html`
  loader. Both kept in the repo.

### Repo prep
- Added `.gitignore` (OS cruft; sample files intentionally kept). SW cache bumped repeatedly,
  now **`travel-planner-v1.0.0-37`**.

### Verified
All changes kept the editor diagnostics clean throughout (Node isn't installed, so no CLI
build/tests). Lighthouse is green across the board. **Physical mobile testing could not be done
locally** (managed laptop: Python present but no `py` alias; Windows firewall blocked LAN access
to the local server; ngrok / gh CLI not installable in the moment) — so **mobile + PWA-install
verification will happen via the GitHub Pages HTTPS URL after publish.**

### Files changed
`index.html`, `css/styles.css`, `js/app.js`, `js/theme.js`, `js/views/personalization.js` (new),
`js/views/templates.js`, `js/views/trips.js`, `js/views/trip-detail.js`, `js/views/about.js`,
`js/ui.js`, `manifest.webmanifest`, `sw.js`, `icons/icon.svg`, `.gitignore`,
`sample-data.json` (new), `load-sample-data.html` (new), plus the icon PNGs + screenshots Isaac added.

### Outstanding / next
- **Publish** to GitHub (public repo `TravelPlanner`) + enable **GitHub Pages** via GitHub
  Desktop; then test on a phone over the Pages HTTPS URL (PWA install + offline).
- Once the Pages URL is verified on a phone, this is effectively **shipped** → flip the
  **Ideas.md** row to **Built (Travel Planner v1.0.0)**.
- **SPEC-design.md** is stale (§7 UI/UX sketch predates the restructure) — refresh it to reflect
  the Personalization view, filtering sub-navs, palette system, entity cards, and brand footer.
- Minor: SPEC-requirements.md has slight People→Travellers label drift; userguide.html /
  overview.html not re-checked this session.

Status: **In Progress (v1.0.0 feature-complete)** — flips to **Built** once the live Pages URL
is verified on a phone.

---

## Session 5 — 17 Sep 2026 (cont.) — attachments + date fix (v1.0.1)
**Quick iteration on user feedback: added file upload/view/download for trip attachments,
and fixed a timezone date bug where Trip Days started a day early in IST.**

### Bug fix
- **Date off-by-one in Trip Days:** `dateList()` in `ui.js` was using `toISOString()` to
  format dates, which converts to UTC. In timezones ahead of UTC (India is UTC+5:30), local
  midnight on Mar 28 became Mar 27 in UTC, so the first day card showed a day early.
  **Fixed:** wrote a `toLocalISO()` helper that formats dates using local components
  (getFullYear, getMonth, getDate) instead of UTC conversion. Trip Days now aligns with
  the trip's start date.

### Feature: Attachments (Plan section)
- **Upload:** file input accepts PDF, PNG, JPG, GIF, WebP, TXT (5MB max per file).
- **Storage:** Base64-encoded data URLs, stored in `trip.attachments` array. Portable
  (export/import automatically include attachments), but limited to ~5MB per file due to
  localStorage constraints.
- **View/Download:** each attachment shows icon (📄 PDF, 🖼️ image, 📋 text) + filename + size.
  - Images open in a lightbox modal with a **View** button.
  - PDFs open in a new browser tab with a **View** button.
  - All files have a **Download** button (triggers browser download via Base64 data URL).
  - **Remove** button deletes the attachment from the trip.
- **UI placement:** new Attachments section in the Plan tab, after Notes, before Delete.
- **Backward-compatible:** old trips/backups without an `attachments` field degrade
  gracefully (treated as empty array).
- **Export/import:** no changes needed — JSON.stringify/parse automatically serializes
  Base64 data in the trip object.
- **Future upgrade:** File API / IndexedDB (~50MB+) noted in FUTURE-ENHANCEMENTS.md for v1.1+.

### Docs
- **userguide.html:** Plan section updated to describe Attachments (upload, view, download,
  storage, backup inclusion).
- **FUTURE-ENHANCEMENTS.md:** File API upgrade note already in place (5MB Base64 → IndexedDB).

### Verified
- Date fix tested: Trip Days now shows correct start date (no off-by-one).
- Attachments tested: upload, view (images/PDFs), download, delete all work.
- Export/import: verified that attachments are included (JSON serialization automatic).
- Diagnostics: clean across all modified files.

### Files changed
`ui.js` (date fix), `js/views/trip-detail.js` (attachments UI + downloadFile helper),
`js/views/trips.js` (initialize `attachments: []`), `js/app.js` (version bumped to 1.0.1),
`sw.js` (cache bumped to travel-planner-v1.0.1-39), `userguide.html` (docs), FUTURE-ENHANCEMENTS.md (already had File API note).

### Status
**Built (Travel Planner v1.0.1)** — shipped on GitHub Pages with date fix and attachments feature.
