# Travel Planner

A local-first, installable PWA for planning family & friends trips: travellers,
cities, a day-by-day itinerary with per-city weather, and reusable checklists.

- **Category:** Home &middot; **Tier:** Medium &middot; **Stack:** vanilla HTML/CSS/JS (no build step)
- **Data:** local-first (localStorage), export/import JSON backup. No accounts, no tracking.
- **Weather:** [Open-Meteo](https://open-meteo.com) (keyless) geocoding + daily forecast, per city.

## Run it

No build step. Serve the folder with any static server (PWA features need HTTP, not `file://`):

```
npx serve .
```

or use VS Code's **Live Server**, then open `index.html`.

## Structure

- `index.html` &mdash; app shell
- `css/styles.css` &mdash; design tokens (light/dark) + layout
- `js/app.js` &mdash; bootstrap, routing, theme, backup
- `js/store.js` &mdash; localStorage data layer + export/import
- `js/weather.js` &mdash; Open-Meteo geocoding + forecast
- `js/ui.js` &mdash; shared DOM/modal helpers
- `js/views/` &mdash; trips, trip-detail, templates, about
- `manifest.webmanifest`, `sw.js`, `icons/` &mdash; PWA

## Licence

MIT &copy; 2026 Isaac A. Gera. Powered by Forj&eacute;.

## Changelog

### v1.0.3 - 12 Oct 2026
- Renamed the user-facing "Packing" feature to **"Checklist"** throughout the UI
  (internal `trip.packing` data unchanged — existing backups load untouched).
- Rewrote the itinerary **Save / Export** as a **vendored, text-based jsPDF** generator:
  no CDN, works offline, much smaller output (~30-80 KB) with crisp selectable text.
  Mobile/touch hands the PDF to the native share sheet; desktop downloads it.

### v1.0.2 - 5 Oct 2026
- "Cities" renamed to "Places Covered"; Edit + Reorder (↑/↓) for Places, Flights,
  Accommodation, itinerary entries, and checklist items.
- Trip Days gained "Day N: Weekday, Date" headers.
- Fixed a last-day weather UTC-shift bug (format dates from local components).
- Version moved to the sidebar footer; sticky full-height sidebar.
- Fixed data import on the installed iOS PWA (FileReader instead of Blob.text()).

### v1.0.1 - 17 Sep 2026
- Trip **attachments**: upload/view/download tickets, screenshots, documents
  (PDF/PNG/JPG/GIF/WebP/TXT, 5MB each, included in backups).
- Fixed an off-by-one date bug in Trip Days for timezones ahead of UTC (e.g. IST).

### v1.0.0 - 17 Sep 2026
- Initial release (Option A: vanilla no-build PWA).
- Trips with travellers and one destination country + one or more cities (geocoded).
- Combined "trip days" view: day-by-day itinerary with per-city weather.
- Packing lists with default categories, manual add, quantities, check-off.
- Reusable packing templates (save from a trip, apply to any trip).
- Per-city Open-Meteo forecast (16-day horizon), cached offline, graceful out-of-range.
- Local-first storage with JSON export/import (validated on import).
- Light/dark theme, mobile-first responsive layout, installable PWA.
