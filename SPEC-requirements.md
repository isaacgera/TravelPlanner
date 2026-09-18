# Travel Planner — Requirements

- **Category:** Home
- **Complexity tier:** Medium
- **Status:** Built — v1.0.0 shipped (GitHub Pages, verified on mobile). Reflects as-built.
- **App name:** Travel Planner (packing lists remain a headline feature; the app was
  renamed from "Travel Planner + Packing List" for a tidier name).
- **Terminology note:** the master people list is labelled **"Travellers"** in the UI; the
  reusable packing checklists are labelled **"Presets"**. (Internal code/storage keys still
  use `people` / `templates`, but all user-facing text says Travellers / Presets.)

## 1. Product Overview
A local-first, installable PWA for planning **family/friends trips**: capture trip
details and who's coming, plan a day-by-day itinerary, build reusable packing checklists,
and see the weather for each city on the trip. Everything is stored on the device;
the only thing that ever leaves it is the city name/coordinates sent to a keyless
weather API to fetch a forecast.

## 2. Scope (v1) — agreed
- **Trips:** name, one **destination country**, one or more **cities/places** within that
  country, start/end dates, free-text notes.
- **Travellers:** names on the trip (family/friends), added from a reusable master
  **Travellers** list or typed manually. No per-person packing in v1.
- **Itinerary:** day-by-day entries (a day → activities/notes) across the trip's date range,
  shown in a **combined "trip days" view** alongside that day's weather.
- **Flights & accommodation:** optional flight legs and stays recorded against the trip.
- **Packing lists:** items grouped by category, with check-off and quantity. Ship sensible
  **default categories** (Clothes, Toiletries, Documents, Tech, Health/Meds, Misc) with the
  ability to **manually add categories and items**.
- **Reusable presets:** save a packing list as a named **preset** (e.g. "Beach weekend",
  "Business trip"), build one from scratch, and start a new trip's list from a preset.
- **Weather:** **per-city** **daily** forecast for the trip dates via Open-Meteo
  (keyless), with a city → coordinates geocoding lookup. Each city's forecast is cached
  for offline; a graceful fallback when the trip is outside forecast range.
- **Itinerary summary:** a clean, printable one-page trip summary.
- **Appearance:** light/dark theme plus a choice of colour themes (11 presets + a Custom
  option), persisted per device.
- **Backup:** export/import the whole dataset as JSON.

## 3. User Stories

### Trips & travellers
- REQ-01: As a planner, I want to create a trip (name, destination country, one or more
  cities within it, start/end dates, notes) so I can organise everything for that trip in
  one place.
- REQ-02: As a planner, I want to add and remove travellers on the trip, either by picking
  from the reusable master **Travellers** list or by typing a name manually (with an opt-in
  to also save that name to Travellers), so I don't retype the same family/friends each trip.
- REQ-02b: As a planner, I want a master **Travellers** list (in the Presets tab) where each
  person has a name and optional birthday, age note, and gender, so I can manage travellers
  once and reuse them. Trips store the traveller's name as a copy, so editing/removing a
  traveller later doesn't rewrite past trips.
- REQ-03: As a planner, I want to edit and delete trips.

### Itinerary
- REQ-04: As a planner, I want day-by-day entries across the trip dates, shown in a combined
  view alongside that day's weather, so I can note what we're doing and plan/pack for the
  conditions in one place.

### Packing
- REQ-05: As a planner, I want a packing list grouped into categories, with per-item
  quantity and a check-off state, so I can track what's packed. I want sensible default
  categories and the ability to add my own categories and items.
- REQ-06: As a planner, I want to save a packing list as a reusable **preset** and spin up a
  new trip's list from a preset, so I don't rebuild common lists each time. Starting a
  list **from a preset replaces** the default-seeded categories with the preset's contents
  (the preset is the sole source when chosen); starting a **blank** list seeds the default
  categories. The user can then add/edit either way. I can also **build a preset from
  scratch** (name + categories + items) in the Presets tab, independent of any trip.

### Weather
- REQ-07: As a planner, I want to add and remove one or more cities on a trip by typing a
  city name and picking from matching places (geocoding, with region/country shown to
  disambiguate duplicates like Paris, FR vs Paris, TX), so the app knows each city's
  coordinates for weather.
- REQ-08: As a planner, I want the daily forecast for my trip dates shown **per city**
  (a forecast for each place I've added), so I can pack and plan for each leg appropriately.
- REQ-09: As a planner, when a city's forecast is beyond the horizon (16 days out) or I'm
  offline, I want a clear, graceful message (or that city's last cached forecast) rather
  than a broken/empty widget.

### Flights & accommodation
- REQ-11: As a planner, I want to record flight legs (label, flight number, from, to, date,
  departure/arrival times) and add/edit/remove them, so my travel is captured with the trip.
- REQ-12: As a planner, I want to record accommodation (name, city, check-in/check-out,
  notes) and add/edit/remove it, so my stays are captured with the trip.

### Summary
- REQ-13: As a planner, I want a clean, printable one-page trip summary (title, dates,
  places covered, travellers, flights, accommodation, and the day-by-day itinerary), so I
  can share or save my plan as a PDF (modelled on a real Hyderabad-Singapore itinerary).

### Appearance (Personalization)
- REQ-14: As a user, I want to switch between **light and dark** themes and choose a
  **colour theme** (11 presets + a Custom option), persisted on my device, so the app looks
  the way I like. The Custom option guards contrast so text stays legible.

### Data & backup
- REQ-10: As a planner, I want all data stored locally (no account), and to export/import a
  JSON backup (from **Personalize → Data**), so I own my data and can move it between devices.

## 4. Non-Functional Requirements
- NFR-01: **Stack** — vanilla HTML/CSS/JS, no build step (Live Server / static host);
  installable, mobile-first **PWA** (realistically used on a phone while packing).
- NFR-02: **Rigour** — Medium: clean module separation, localStorage persistence,
  export/import backup, accessibility basics, responsive layout.
- NFR-03: **Weather API** — Open-Meteo, **no API key** (keeps the app shareable/installable
  with no secrets to manage); use its free geocoding + daily forecast endpoints. Forecasts
  are fetched and cached **per city**.
- NFR-04: **Offline** — core app (trips, travellers, itinerary, packing, presets) works
  fully offline; the last fetched forecast **per city** is cached and shown offline; refresh
  when back online.
- NFR-05: **Privacy** — local-first; the ONLY outbound data is each city's
  name/coordinates sent to Open-Meteo to get a forecast. No personal data leaves the device;
  no tracking, no accounts.
- NFR-06: **Data safety** — validate on import; keep export/import backward-compatible if
  the format changes later (migrate, don't break).
- NFR-07: **Licence** — MIT, copyright holder **Isaac A Gera** (matches the "Powered by
  Forjé" footer credit).

## 5. Out of scope (v1) — deferred to v2+
- **Per-person packing** (packing items assigned to individual travellers).
- **Multiple destination countries per trip** (multi-country trips). v1 supports one country
  with multiple cities inside it; a trip spanning several countries is deferred.
- **Per-city date ranges** (each city gets its own sub-dates). v1 weather is per city across
  the whole trip's date range.
- Budget tracking, bookings/reservations, weather-based auto packing suggestions,
  multi-device sync.

## 6. Kickoff decisions — resolved
- **Licence:** MIT, copyright holder Isaac A Gera. *(resolved)*
- **Default packing categories:** Clothes, Toiletries, Documents, Tech, Health/Meds, Misc,
  with manual add of categories and items. *(resolved)*
- **Itinerary + weather:** combined into one "trip days" view. *(resolved)*
- **Weather granularity:** per city. *(resolved)*

## 7. Related work & future enhancements
- **Option B (Svelte) experiment:** a parallel reimplementation of this same spec in
  Svelte 5 is planned as a learning exercise. It lives under `experiments/svelte-version/`
  and does not change v1 scope. Option A (this doc) is the shipped product.
- **Post-v1 ideas** are captured in `FUTURE-ENHANCEMENTS.md` — notably **family sharing of
  trips** (link/read-only vs backend-sync, with the local-first trade-off flagged), plus
  per-person packing, multi-country trips, and per-city date ranges.

---
*Naming convention: REQ-XX functional, NFR-XX non-functional.*
