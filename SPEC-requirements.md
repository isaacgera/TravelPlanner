# Travel Planner — Requirements

- **Category:** Home
- **Complexity tier:** Medium
- **Status:** In Progress (planning agreed; Option A build starting)
- **App name:** Travel Planner (packing lists remain a headline feature; the app was
  renamed from "Travel Planner + Packing List" for a tidier name).

## 1. Product Overview
A local-first, installable PWA for planning **family/friends trips**: capture trip
details and who's coming, plan a day-by-day itinerary, build reusable packing checklists,
and see the weather for each city on the trip. Everything is stored on the device;
the only thing that ever leaves it is the city name/coordinates sent to a keyless
weather API to fetch a forecast.

## 2. Scope (v1) — agreed
- **Trips:** name, one **destination country**, one or more **cities/places** within that
  country, start/end dates, free-text notes.
- **Travellers:** a simple list of names on the trip (family/friends). No per-person data
  in v1.
- **Itinerary:** day-by-day entries (a day → activities/notes) across the trip's date range,
  shown in a **combined "trip days" view** alongside that day's weather.
- **Packing lists:** items grouped by category, with check-off and quantity. Ship sensible
  **default categories** (Clothes, Toiletries, Documents, Tech, Health/Meds, Misc) with the
  ability to **manually add categories and items**.
- **Reusable templates:** save a packing list as a named template (e.g. "Beach weekend",
  "Business trip") and start a new trip's list from it.
- **Weather:** **per-city** **daily** forecast for the trip dates via Open-Meteo
  (keyless), with a city → coordinates geocoding lookup. Each city's forecast is cached
  for offline; a graceful fallback when the trip is outside forecast range.
- **Backup:** export/import the whole dataset as JSON.

## 3. User Stories

### Trips & travellers
- REQ-01: As a planner, I want to create a trip (name, destination country, one or more
  cities within it, start/end dates, notes) so I can organise everything for that trip in
  one place.
- REQ-02: As a planner, I want to add and remove travellers on the trip, either by picking
  from a reusable master "People" list or by typing a name manually (with an opt-in to also
  save that name to People), so I don't retype the same family/friends each trip.
- REQ-02b: As a planner, I want a master **People** list (in the Presets tab) where each
  person has a name and optional birthday, age note, and gender, so I can manage travellers
  once and reuse them. Trips store the traveller's name as a copy, so editing/removing a
  person later doesn't rewrite past trips.
- REQ-03: As a planner, I want to edit and delete trips.

### Itinerary
- REQ-04: As a planner, I want day-by-day entries across the trip dates, shown in a combined
  view alongside that day's weather, so I can note what we're doing and plan/pack for the
  conditions in one place.

### Packing
- REQ-05: As a planner, I want a packing list grouped into categories, with per-item
  quantity and a check-off state, so I can track what's packed. I want sensible default
  categories and the ability to add my own categories and items.
- REQ-06: As a planner, I want to save a packing list as a reusable template and spin up a
  new trip's list from a template, so I don't rebuild common lists each time. Starting a
  list **from a template replaces** the default-seeded categories with the template's
  contents (the template is the sole source when chosen); starting a **blank** list seeds
  the default categories. The user can then add/edit either way.

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

### Data & backup
- REQ-10: As a planner, I want all data stored locally (no account), and to export/import a
  JSON backup, so I own my data and can move it between devices.

## 4. Non-Functional Requirements
- NFR-01: **Stack** — vanilla HTML/CSS/JS, no build step (Live Server / static host);
  installable, mobile-first **PWA** (realistically used on a phone while packing).
- NFR-02: **Rigour** — Medium: clean module separation, localStorage persistence,
  export/import backup, accessibility basics, responsive layout.
- NFR-03: **Weather API** — Open-Meteo, **no API key** (keeps the app shareable/installable
  with no secrets to manage); use its free geocoding + daily forecast endpoints. Forecasts
  are fetched and cached **per city**.
- NFR-04: **Offline** — core app (trips, travellers, itinerary, packing, templates) works
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

## 7. Related work
- **Option B (Svelte) experiment:** a parallel reimplementation of this same spec in
  Svelte 5 is planned as a learning exercise once Option A ships. It lives under
  `experiments/svelte-version/` and does not change v1 scope. Option A (this doc) is the
  shipped product.

---
*Naming convention: REQ-XX functional, NFR-XX non-functional.*
