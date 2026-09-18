/* ============================================================
   weather.js - Open-Meteo (keyless) geocoding + daily forecast
   - Only outbound data: a city name (geocoding) or lat/lon (forecast).
   - No API key, no tracking. Forecasts are cached per-city by the store.
   ============================================================ */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Open-Meteo free daily forecast reaches ~16 days out. */
export const FORECAST_HORIZON_DAYS = 16;

/**
 * geocode(query, countryCode?) - resolve a city name to candidate places.
 * countryCode (ISO-3166 alpha-2) narrows results to the trip's country.
 * Returns an array of { name, admin, country, countryCode, lat, lon }.
 */
export async function geocode(query, countryCode = "") {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    name: q,
    count: "8",
    language: "en",
    format: "json",
  });
  if (countryCode) params.set("countryCode", countryCode);

  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  return results.map((r) => ({
    name: r.name,
    admin: r.admin1 || "",
    country: r.country || "",
    countryCode: r.country_code || "",
    lat: r.latitude,
    lon: r.longitude,
  }));
}

/**
 * fetchForecast(lat, lon, startDate, endDate)
 * Returns { status, daily?, message? }.
 *   status: "ok" | "out-of-range" | "error"
 * Clamps the requested range to the 16-day horizon; if the whole trip is
 * beyond the horizon it returns "out-of-range" rather than an empty widget.
 */
export async function fetchForecast(lat, lon, startDate, endDate) {
  if (lat == null || lon == null) {
    return { status: "error", message: "This city has no coordinates yet." };
  }

  const today = startOfDay(new Date());
  const horizon = addDays(today, FORECAST_HORIZON_DAYS);
  const start = startOfDay(parseDate(startDate)) || today;
  const end = startOfDay(parseDate(endDate)) || start;

  if (start > horizon) {
    return {
      status: "out-of-range",
      message: `Forecast is available closer to the date (within ${FORECAST_HORIZON_DAYS} days).`,
    };
  }

  // Clamp the request window to [today, horizon].
  const reqStart = start < today ? today : start;
  const reqEnd = end > horizon ? horizon : end;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    start_date: isoDate(reqStart),
    end_date: isoDate(reqEnd),
  });

  let res;
  try {
    res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  } catch {
    return { status: "error", message: "Couldn't reach the weather service." };
  }
  if (!res.ok) return { status: "error", message: `Weather request failed (${res.status}).` };

  const data = await res.json();
  const d = data.daily;
  if (!d || !Array.isArray(d.time)) {
    return { status: "error", message: "Weather data was unavailable." };
  }
  const daily = d.time.map((date, i) => ({
    date,
    tempMax: round(d.temperature_2m_max?.[i]),
    tempMin: round(d.temperature_2m_min?.[i]),
    code: d.weather_code?.[i] ?? null,
  }));
  return { status: "ok", daily };
}

/* ---- WMO weather code -> label + icon ---------------------- */

const WMO = {
  0: ["Clear", "\u2600\uFE0F"],
  1: ["Mainly clear", "\u{1F324}\uFE0F"],
  2: ["Partly cloudy", "\u26C5"],
  3: ["Overcast", "\u2601\uFE0F"],
  45: ["Fog", "\u{1F32B}\uFE0F"], 48: ["Rime fog", "\u{1F32B}\uFE0F"],
  51: ["Light drizzle", "\u{1F327}\uFE0F"], 53: ["Drizzle", "\u{1F327}\uFE0F"], 55: ["Heavy drizzle", "\u{1F327}\uFE0F"],
  56: ["Freezing drizzle", "\u{1F327}\uFE0F"], 57: ["Freezing drizzle", "\u{1F327}\uFE0F"],
  61: ["Light rain", "\u{1F326}\uFE0F"], 63: ["Rain", "\u{1F327}\uFE0F"], 65: ["Heavy rain", "\u{1F327}\uFE0F"],
  66: ["Freezing rain", "\u{1F327}\uFE0F"], 67: ["Freezing rain", "\u{1F327}\uFE0F"],
  71: ["Light snow", "\u{1F328}\uFE0F"], 73: ["Snow", "\u{1F328}\uFE0F"], 75: ["Heavy snow", "\u2744\uFE0F"],
  77: ["Snow grains", "\u{1F328}\uFE0F"],
  80: ["Rain showers", "\u{1F326}\uFE0F"], 81: ["Rain showers", "\u{1F327}\uFE0F"], 82: ["Violent showers", "\u26C8\uFE0F"],
  85: ["Snow showers", "\u{1F328}\uFE0F"], 86: ["Snow showers", "\u2744\uFE0F"],
  95: ["Thunderstorm", "\u26C8\uFE0F"], 96: ["Thunderstorm + hail", "\u26C8\uFE0F"], 99: ["Thunderstorm + hail", "\u26C8\uFE0F"],
};

export function describeCode(code) {
  const entry = WMO[code];
  return entry ? { label: entry[0], icon: entry[1] } : { label: "-", icon: "\u2753" };
}

/* ---- date helpers ----------------------------------------- */
function parseDate(s) { if (!s) return null; const d = new Date(s + "T00:00:00"); return isNaN(d) ? null : d; }
function startOfDay(d) { if (!d) return null; const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isoDate(d) { return d.toISOString().slice(0, 10); }
function round(n) { return Number.isFinite(+n) ? Math.round(+n) : null; }
