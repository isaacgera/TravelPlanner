# Travel Planner — Tasks

- **Status:** Built (v1.0.3 shipped)

## Planning (done)
- [x] Agree v1 scope (family/friends framing; travellers as names; itinerary;
      packing + templates; weather; export/import)
- [x] Agree build-standards flags (vanilla no-build PWA; Medium rigour; mobile-first;
      local-first with keyless Open-Meteo weather)
- [x] Confirm v2 deferrals (per-person packing; multi-country; per-city date ranges)
- [x] Write SPEC-requirements.md and SPEC-design.md
- [x] Move Ideas.md row to In Progress (with enriched one-liner)
- [x] Rename app to "Travel Planner" (folder + docs + backlog row)
- [x] Resolve kickoff decisions: country + multiple cities; **per-city** weather;
      combined trip-days view; default categories + manual add; **MIT** licence (Isaac A Gera)

## Build — Option A (vanilla no-build PWA), the shipped app
- [x] App shell: HTML structure, CSS tokens (light/dark), responsive layout, Forjé footer
- [x] Data layer: `travelplanner_` localStorage store + load/save + export/import JSON (validation)
- [x] Trips: create/edit/delete; travellers name list; destination country
- [x] Cities: add one or more cities via Open-Meteo geocoding — type + pick, store coords per place
- [x] Combined trip-days view: day-by-day itinerary entries + that day's weather per city
- [x] Packing: default categories, manual add of categories/items, quantity, check-off
- [x] Templates (now "Presets"): save a packing list as preset; start a trip list from a preset
- [x] Weather: daily forecast per city; cache per city; graceful out-of-range + offline
- [x] Weather: explanatory banner when trip is beyond the 16-day horizon
- [x] PWA: manifest + service worker (cache app shell)
- [x] PWA: PNG icons (192 / 512 / maskable-512) — added Session 4 via canvas generator
- [x] Accessibility + responsive pass (Pre-Live Testing Agent) — run twice Session 4, all fixed
- [x] Verify: Isaac live browser smoke-test (drove Session 3 fixes)
- [x] Docs: refresh userguide.html, overview.html for new features/terminology; SPEC-design.md
- [x] MIT LICENSE (Isaac A Gera); README + changelog; version constant
- [x] Run PWA Readiness Checker (Session 4 — only blocker was icons, since resolved)
- [x] Update Ideas.md status -> Built (with version)

### Session 3 additions (done)
- [x] Rename Templates -> Presets across UI
- [x] Itinerary summary sub-tab (printable) + Flights + Accommodation (data model + editors)
- [x] Master People list (Presets tab); pick-from-People + opt-in save; trips store name copies
- [x] Sub-tab renames Overview->Plan, Summary->Itinerary
- [x] Sidebar rework (WealthOrah style); top bar removed on desktop; theme toggle in sidebar
- [x] Trips segregated Domestic/International (India base) + status badges
- [x] Backup moved from 3-dot menu to sidebar + About-page card

## Build — Option B (Svelte 5) experiment — done (Session 8, 30 Sep 2026)
- [x] Scaffold `experiments/svelte-version/` (Vite + Svelte 5) — flagged Node/Windows tooling; Node v24.21.0 installed, Zscaler proxy cert handled via `NODE_EXTRA_CA_CERTS`
- [x] Reimplement the same spec; capture DX/bundle-size learnings vs Option A
- [x] Comparison note (kept separate from the shipped app's docs) → `experiments/svelte-version/COMPARISON.md`

## Post-v1 releases

### v1.0.1 (Session 5) — done
- [x] Trip attachments (upload/view/download, image lightbox, PDF open, 5MB Base64 cap)
- [x] Trip Days date off-by-one fix (local ISO, not UTC)

### v1.0.2 (Sessions 6-8) — done
- [x] "Cities" → "Places Covered"; Edit + Reorder for Places / Flights / Accommodation
- [x] Trip Days "Day N: Weekday, Date" headers; Edit + Reorder for itinerary entries
- [x] Weather last-day UTC-shift fix (format from local components)
- [x] Packing item Edit + Reorder
- [x] Reorder UX (keyboard-accessible ↑/↓, 44px touch targets, disabled at ends)
- [x] Version badge moved to sidebar footer; sticky full-height sidebar
- [x] iOS PWA data-import fix (FileReader instead of Blob.text())

### v1.0.3 (Session 9) — done
- [x] "Packing" → "Checklist" rename across all user-facing UI (data field unchanged)
- [x] Itinerary PDF export rewritten: vendored jsPDF, text-based, offline (no CDN)
- [x] ASCII-safe glyphs (jsPDF Helvetica can't render Unicode arrows/checkboxes/em-dashes)
- [x] Adaptive delivery: native share sheet on mobile, download on desktop
- [x] Relaxed/airy layout matching the original PDF; checklist excluded from export
- [x] Version → 1.0.3; SW cache → travel-planner-v1.0.3-1; vendor added to APP_SHELL
- [x] Prototype-first in prototypes/ (tpproto_), then ported to live + pushed to GitHub Pages
- [x] Ideas.md → Built (Travel Planner v1.0.3); repo tidied + in sync
- [x] Real-device verify: installed-iPhone-PWA PDF share — confirmed working by Isaac (12 Oct 2026)
