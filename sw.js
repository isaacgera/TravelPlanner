/* ============================================================
   sw.js - service worker for Travel Planner
   - Cache-first for the app shell (offline support)
   - Network-first, cache fallback for Open-Meteo weather
   - Bump CACHE_NAME on release so clients pick up new assets
   ============================================================ */

const CACHE_NAME = "travel-planner-v1.0.0-37";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/store.js",
  "./js/weather.js",
  "./js/ui.js",
  "./js/theme.js",
  "./js/views/trips.js",
  "./js/views/trip-detail.js",
  "./js/views/templates.js",
  "./js/views/personalization.js",
  "./js/views/about.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Weather / geocoding: network-first, fall back to cached response if offline.
  if (url.hostname.endsWith("open-meteo.com")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App shell + same-origin assets: cache-first, then network.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
