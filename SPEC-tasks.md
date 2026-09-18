# Travel Planner — Tasks

- **Status:** In Progress (Option A build starting)

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
- [ ] PWA: PNG icons (192 / 512 / maskable-512) — only icon.svg exists so far; installability gap
- [ ] Accessibility + responsive pass (Pre-Live Testing Agent) — incl. contrast on sidebar/hero
- [x] Verify: Isaac live browser smoke-test (drove Session 3 fixes)
- [ ] Docs: refresh userguide.html, overview.html for new features/terminology; SPEC-design.md
- [x] MIT LICENSE (Isaac A Gera); README + changelog; version constant (1.0.0)
- [ ] Run PWA Readiness Checker
- [ ] Update Ideas.md status -> Built (with version) — after icons + audits

### Session 3 additions (done)
- [x] Rename Templates -> Presets across UI
- [x] Itinerary summary sub-tab (printable) + Flights + Accommodation (data model + editors)
- [x] Master People list (Presets tab); pick-from-People + opt-in save; trips store name copies
- [x] Sub-tab renames Overview->Plan, Summary->Itinerary
- [x] Sidebar rework (WealthOrah style); top bar removed on desktop; theme toggle in sidebar
- [x] Trips segregated Domestic/International (India base) + status badges
- [x] Backup moved from 3-dot menu to sidebar + About-page card

## Build — Option B (Svelte 5) experiment, later
- [ ] Scaffold `experiments/svelte-version/` (Vite + Svelte 5) — flag Node/Windows tooling
- [ ] Reimplement the same spec; capture DX/bundle-size learnings vs Option A
- [ ] Comparison note (kept separate from the shipped app's docs)
