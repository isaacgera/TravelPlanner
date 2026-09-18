# Travel Planner

A local-first, installable PWA for planning family & friends trips: travellers,
cities, a day-by-day itinerary with per-city weather, and reusable packing checklists.

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

### v1.0.0 - 17 Sep 2026
- Initial release (Option A: vanilla no-build PWA).
- Trips with travellers and one destination country + one or more cities (geocoded).
- Combined "trip days" view: day-by-day itinerary with per-city weather.
- Packing lists with default categories, manual add, quantities, check-off.
- Reusable packing templates (save from a trip, apply to any trip).
- Per-city Open-Meteo forecast (16-day horizon), cached offline, graceful out-of-range.
- Local-first storage with JSON export/import (validated on import).
- Light/dark theme, mobile-first responsive layout, installable PWA.
