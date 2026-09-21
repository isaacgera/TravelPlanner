# Travel Planner — Design

- **Category:** Home | **Tier:** Medium | **Status:** Built (v1.0.1 shipped) — §3 data model and §7 UI reflect as-built

## 1. Approach
A single-page, local-first PWA in vanilla HTML/CSS/JS (no build step), consistent with the
app family. State lives in `localStorage`; the one online dependency is weather, fetched
from Open-Meteo (keyless). Mobile-first because the real use is on a phone while packing.

## 2. Stack & platform (agreed)
- **Vanilla HTML/CSS/JS**, no bundler/Node — runs via Live Server or any static host.
- **Installable PWA**: manifest + service worker; caches the app shell + assets for offline.
- **Charts/UI**: none required for v1; plain DOM + CSS. (A tiny icon set for weather.)

### 2a. Stack decision & the Option B (Svelte) experiment
Option A (this design) is the **shipped product**: vanilla, no-build, matching the app family
so patterns carry over and there's no Windows tooling to maintain. A framework isn't needed
at this scope, and the app is local-first/offline so 2026 server-first framework wins
(Astro/Qwik islands, resumability) don't apply here.

Separately, a **Svelte 5 reimplementation** of this same spec is planned as a learning
experiment once Option A ships. It lives under `experiments/svelte-version/`, is built against
this same requirements/design (so it's an apples-to-apples comparison), and takes on a Node/npm
build step that the shipped app deliberately avoids. It never becomes the shipped app unless a
later, explicit decision says so. SolidJS was considered as the runner-up experiment.

## 3. Data model (localStorage, one namespaced store)
Rough shape (final field names at build time). The `travelplanner_` key prefix namespaces
storage so it never collides with other family apps.
```
{
  version: 1,
  trips: [
    {
      id, name, notes,
      country: { name, code },                 // one destination country per trip (v1)
      places: [                                // one or more cities within that country
        {
          id, query, name, lat, lon,           // from geocoding
          admin, country,                      // region + country label for disambiguation
          weatherCache: {                      // per-CITY cache so each shows offline
            fetchedAt,
            daily: [ { date, tempMin, tempMax, code } ]
          }
        }
      ],
      startDate, endDate,
      travellers: [ "name", ... ],             // v1: names as copies (not refs to people[])
      itinerary: [ { date, entries: [ "text", ... ] } ],
      packing:   [ { category, items: [ { id, label, qty, packed } ] } ],
      flights:   [ { id, label, flightNo, from, to, date, depTime, arrTime } ],
      stays:     [ { id, name, city, checkIn, checkOut, notes } ],
      attachments: [                           // Base64 data URLs, max ~5MB each
        { id, name, type, data }               // viewed via blob URLs; included in export/import
      ]
    }
  ],
  templates: [ { id, name, categories: [ { category, items:[{label,qty}] } ] } ],
  people: [                                    // master Travellers list (Presets tab)
    { id, name, birthday, ageText, gender }    // trip travellers are name copies, not refs
  ]
}
```
- **Country + places:** one country per trip in v1; multiple cities within it. Multi-country
  trips are a v2 deferral (country could become an array, or places gain a country ref).
- **Templates** (called "Presets" in the UI) are trip-independent (reusable across trips).
  Can be built from scratch or saved from a trip's packing list.
- **People** (called "Travellers" in the UI) are a master name list. A trip's `travellers[]`
  stores **copies** of names, not references, so editing/removing a person never rewrites
  past trips.
- **Flights + stays** model travel legs and accommodation per trip (added in Session 3).
- **Attachments** store files as Base64 data URLs (limited to ~5MB per file by localStorage
  constraints). Viewed via blob URLs (not raw data URLs, which browsers block for security).
  Included automatically in JSON export/import. IndexedDB upgrade noted for v2.
- **weatherCache is per city** (nested under each place) so every city's last forecast shows
  offline independently.
- **Packing categories:** seeded from defaults (Clothes, Toiletries, Documents, Tech,
  Health/Meds, Misc) on a new list; the user can add categories and items freely.
- **Sanitization:** `store.js` uses a whitelist sanitizer (`sanitizeTrip`, `sanitizeAttachment`,
  etc.) that rebuilds every object on load — unknown/malformed fields are dropped, so any new
  field must be added to the sanitizer or it won't persist across reloads.

## 4. Weather (Open-Meteo, keyless) — per city
- **Geocoding:** `geocoding-api.open-meteo.com` — user types a city name, picks from
  matches; we store `{name, lat, lon}` on that place (and the trip's `country`). Adding a
  place is how a city gets its coordinates.
- **Forecast:** `api.open-meteo.com` daily forecast (min/max temp + weather code) for the
  trip's date range, fetched **once per city** and cached under that place.
- **Forecast horizon:** 16 days (Open-Meteo's free daily max; code against 16). Design
  response (per city):
  - Within range → show the daily forecast, cache it under the place.
  - Beyond range → show a clear "forecast available closer to the date" state
    (optionally seasonal/typical info later; not v1).
  - Offline → show that city's cached forecast with its `fetchedAt` timestamp.
- **Multiple cities:** each place fetches/caches independently; a shared fetch helper avoids
  hammering the API (sequential or lightly throttled), and each city degrades on its own.
- **No key** = nothing secret to store or commit; keeps the PWA fully shareable.

## 5. Offline / PWA
- Service worker caches the app shell (HTML/CSS/JS/icons) so the app opens offline.
- Weather is the only network call; failures degrade gracefully to cache + message.
- Everything else is local and works offline by default.

## 6. Privacy & data safety
- Local-first: no account, no tracking, no server for app data.
- **Only outbound data:** each city's name/coordinates → Open-Meteo for a forecast. No
  traveller names, itinerary, or packing data ever leaves the device.
- Export/import JSON is the backup path; validate on import; keep format
  backward-compatible if it evolves (migrate, don't break).

## 7. UI/UX (as built, v1.0.0)
- **Shell:** mobile-first. Below 720px a **bottom tab bar** (Trips · Presets · Personalize ·
  About) + a slim top bar (brand + light/dark toggle). At ≥720px it becomes a **left sidebar**
  (brand, nav with filtering sub-navs, and a footer holding the theme toggle + Forjé credit).
- **Sidebar behaviour:** each top-level tab (Trips, Presets, Personalize) has a **sub-nav** that
  reveals on hover/focus and **filters the main screen** to the chosen section (e.g. Trips →
  Domestic/International; Presets → Travellers/Packing lists; Personalize → Appearance/Data).
  Every view also renders an equivalent on-screen **segmented switcher** so the same filtering
  works on mobile where the sub-nav is hidden. Sidebar is **collapsible** to an icon rail via an
  edge chevron; collapsing zooms the content up a notch (root font-size) for a larger view.
- **Views:**
  - **Trips** — hero band (primary→accent gradient) + trips grouped **Domestic / International**
    (India as base), each an `.entity-card` with a status badge (Planning / Upcoming / In
    progress / Completed).
  - **Trip detail** — sub-sections Plan (country, cities, travellers, flights, accommodation,
    notes, **attachments**), **Trip Days** (combined itinerary + per-city weather), Packing
    (categorised checklist, manual add, save/apply preset), and **Itinerary** (printable
    summary with adaptive **Save/Export**: PDF on desktop via html2canvas + jsPDF, JPEG on
    mobile via html2canvas).
  - **Presets** — master **Travellers** list + reusable **Packing presets** (buildable from
    scratch or saved from a trip). All shown as consistent `.entity-cards`.
  - **Personalize** — **Appearance** (11 colour palettes + Custom, with a contrast guard) and
    **Data** (Export/Import backup).
  - **About** — app info + tips.
- **Consistent cards:** trips, travellers and packing presets share one `.entity-card` style
  (2-column grid, coloured left accent bar, hover lift).
- **Theming:** light/dark via `data-theme` + `prefers-color-scheme` (smooth faded switch); a
  palette system of 11 presets + Custom applied through CSS custom properties, each with a
  distinct **secondary/accent** colour wired into hover/active states of tabs and pills.
- **Accessibility:** touch-friendly (44px+ targets on coarse pointers); `prefers-reduced-motion`
  respected; visible focus (`:focus` + `:focus-visible`); `aria-live` region for async status;
  `role=group` + `aria-pressed` on filter controls; a visually-hidden top-level `<h1>`.
  Verified via two Pre-Live audits + Lighthouse (Perf 95 / A11y 96 / Best Practices 96 / SEO 100).
- **Footer:** "Powered by Forjé" + "© 2026 Isaac A Gera. All rights reserved." — a single fixed
  shell element (sidebar bottom on desktop; fixed above the tab bar on mobile), tokenised and
  print-excluded (`.no-print`).

## 8. Deferred to v2 (design hooks kept in mind)
- Per-person packing (items reference a traveller id) — the travellers-as-names list is a
  deliberate stepping stone.
- Multiple destination **countries** per trip (country becomes an array, or places carry a
  country ref) — v1's country + `places[]` shape leaves room for this.
- Per-city date ranges (each place gets its own sub-dates within the trip).
- **Attachment storage upgrade:** move from Base64 in localStorage (~5MB cap per file) to
  File API / IndexedDB (~50MB+) for larger documents. Noted in FUTURE-ENHANCEMENTS.md.
