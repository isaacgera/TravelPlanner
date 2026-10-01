/* ============================================================
   store.svelte.js - local-first reactive data layer (Svelte 5 runes)
   ------------------------------------------------------------
   Option B experiment note:
   The shipped vanilla app (../../../js/store.js) keeps a module-level `cache`
   object and re-renders views manually after every mutation. Here we hold the
   same dataset in a `$state` rune, so any component that reads it re-renders
   automatically — no manual re-render calls. That's the core DX difference
   this experiment is meant to surface.

   Storage is namespaced `tpsvelte_` (NOT `travelplanner_`) so this sandbox can
   never read or overwrite the shipped app's real data.
   ============================================================ */

const STORAGE_KEY = "tpsvelte_data";
export const SCHEMA_VERSION = 1;

/** Default packing categories seeded into a new (blank) packing list. */
export const DEFAULT_CATEGORIES = [
  "Clothes",
  "Toiletries",
  "Documents",
  "Tech",
  "Health/Meds",
  "Misc",
];

/** Small unique id helper (good enough for local, single-user data). */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyData() {
  return { version: SCHEMA_VERSION, trips: [], templates: [], people: [] };
}

/* ---- Reactive state -------------------------------------- */

/**
 * The whole dataset lives in one deep `$state`. Reads inside components/derived
 * values are tracked automatically; writes to nested fields trigger updates.
 */
const data = $state(loadInitial());

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return migrate(sanitize(JSON.parse(raw)));
  } catch (err) {
    console.error("Travel Planner (Svelte): failed to read stored data, starting fresh.", err);
    return emptyData();
  }
}

/**
 * Public accessor. Components import `store` and read `store.trips`, etc.
 * Mutating these arrays/objects directly is reactive; call `persist()` after
 * a change to write through to localStorage.
 */
export const store = data;

/** Write the current state through to localStorage. */
export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(data)));
    return true;
  } catch (err) {
    console.error("Travel Planner (Svelte): failed to save data.", err);
    if (err.name === "QuotaExceededError" || (err.code && err.code === 22)) {
      console.warn("localStorage quota exceeded — large attachments are the most likely cause.");
    }
    return false;
  }
}

/**
 * Convenience: mutate then persist in one call.
 *   update((d) => { d.trips.push(newTrip); });
 */
export function update(mutator) {
  mutator(data);
  persist();
}

/**
 * $state proxies aren't directly JSON-serialisable in a clean way across all
 * shapes; `$state.snapshot` returns a plain deep copy for stringify/export.
 */
function snapshot(value) {
  return $state.snapshot(value);
}

/* ---- Replace whole dataset (used by import) --------------- */

export function replaceAll(clean) {
  data.version = clean.version ?? SCHEMA_VERSION;
  data.trips = clean.trips ?? [];
  data.templates = clean.templates ?? [];
  data.people = clean.people ?? [];
  persist();
}

/* ---- Migration + validation ------------------------------- */

/** Forward-compatible upgrade path. v1 is the baseline. */
function migrate(d) {
  if (!d || typeof d !== "object") return emptyData();
  if (!d.version || d.version < 1) d.version = SCHEMA_VERSION;
  // future: if (d.version === 1) { ...upgrade to 2...; d.version = 2; }
  return d;
}

/** Defensive shaping so a malformed import can't crash the app. */
function sanitize(input) {
  const out = emptyData();
  if (!input || typeof input !== "object") return out;
  if (Array.isArray(input.trips)) out.trips = input.trips.filter(isObject).map(sanitizeTrip);
  if (Array.isArray(input.templates)) out.templates = input.templates.filter(isObject).map(sanitizeTemplate);
  if (Array.isArray(input.people)) out.people = input.people.filter(isObject).map(sanitizePerson);
  if (Number.isInteger(input.version)) out.version = input.version;
  return out;
}

function sanitizePerson(p) {
  return {
    id: str(p.id) || uid("person"),
    name: str(p.name),
    birthday: str(p.birthday),
    ageText: str(p.ageText),
    gender: str(p.gender),
  };
}

function sanitizeTrip(t) {
  return {
    id: str(t.id) || uid("trip"),
    name: str(t.name),
    notes: str(t.notes),
    country: isObject(t.country)
      ? { name: str(t.country.name), code: str(t.country.code) }
      : { name: "", code: "" },
    places: Array.isArray(t.places) ? t.places.filter(isObject).map(sanitizePlace) : [],
    startDate: str(t.startDate),
    endDate: str(t.endDate),
    travellers: Array.isArray(t.travellers) ? t.travellers.map(str).filter(Boolean) : [],
    itinerary: Array.isArray(t.itinerary) ? t.itinerary.filter(isObject).map(sanitizeDay) : [],
    packing: Array.isArray(t.packing) ? t.packing.filter(isObject).map(sanitizeCat) : [],
    flights: Array.isArray(t.flights) ? t.flights.filter(isObject).map(sanitizeFlight) : [],
    stays: Array.isArray(t.stays) ? t.stays.filter(isObject).map(sanitizeStay) : [],
    attachments: Array.isArray(t.attachments) ? t.attachments.filter(isObject).map(sanitizeAttachment) : [],
  };
}

function sanitizeAttachment(a) {
  return {
    id: str(a.id) || uid("attachment"),
    name: str(a.name),
    type: str(a.type),
    data: str(a.data), // Base64 data URL — kept as-is
  };
}

function sanitizeFlight(f) {
  return {
    id: str(f.id) || uid("flt"),
    label: str(f.label),
    flightNo: str(f.flightNo),
    from: str(f.from),
    to: str(f.to),
    date: str(f.date),
    depTime: str(f.depTime),
    arrTime: str(f.arrTime),
  };
}

function sanitizeStay(s) {
  return {
    id: str(s.id) || uid("stay"),
    name: str(s.name),
    city: str(s.city),
    checkIn: str(s.checkIn),
    checkOut: str(s.checkOut),
    notes: str(s.notes),
  };
}

function sanitizePlace(p) {
  return {
    id: str(p.id) || uid("place"),
    query: str(p.query),
    name: str(p.name),
    lat: num(p.lat),
    lon: num(p.lon),
    admin: str(p.admin),
    country: str(p.country),
    weatherCache: isObject(p.weatherCache)
      ? {
          fetchedAt: str(p.weatherCache.fetchedAt),
          daily: Array.isArray(p.weatherCache.daily)
            ? p.weatherCache.daily.filter(isObject).map((d) => ({
                date: str(d.date),
                tempMin: num(d.tempMin),
                tempMax: num(d.tempMax),
                code: Number.isFinite(+d.code) ? +d.code : null,
              }))
            : [],
        }
      : null,
  };
}

function sanitizeDay(d) {
  return {
    date: str(d.date),
    entries: Array.isArray(d.entries) ? d.entries.map(str).filter(Boolean) : [],
  };
}

function sanitizeCat(c) {
  return {
    category: str(c.category),
    items: Array.isArray(c.items)
      ? c.items.filter(isObject).map((i) => ({
          id: str(i.id) || uid("item"),
          label: str(i.label),
          qty: Number.isFinite(+i.qty) && +i.qty > 0 ? Math.floor(+i.qty) : 1,
          packed: !!i.packed,
        }))
      : [],
  };
}

function sanitizeTemplate(t) {
  return {
    id: str(t.id) || uid("tpl"),
    name: str(t.name),
    categories: Array.isArray(t.categories)
      ? t.categories.filter(isObject).map((c) => ({
          category: str(c.category),
          items: Array.isArray(c.items)
            ? c.items.filter(isObject).map((i) => ({
                label: str(i.label),
                qty: Number.isFinite(+i.qty) && +i.qty > 0 ? Math.floor(+i.qty) : 1,
              }))
            : [],
        }))
      : [],
  };
}

function isObject(v) { return v && typeof v === "object" && !Array.isArray(v); }
function str(v) { return typeof v === "string" ? v.trim() : ""; }
function num(v) { return Number.isFinite(+v) ? +v : null; }

/* ---- Export / import -------------------------------------- */

export function exportData() {
  const blob = new Blob([JSON.stringify(snapshot(data), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `travel-planner-svelte-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * parseImport() - validate a backup file. Returns { ok, data?, error?, summary? }.
 * Does NOT replace state on its own so the caller can confirm the destructive
 * replace with the user first (then call replaceAll()).
 */
export function parseImport(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isObject(parsed) || (!Array.isArray(parsed.trips) && !Array.isArray(parsed.templates))) {
    return { ok: false, error: "That doesn't look like a Travel Planner backup." };
  }
  const clean = migrate(sanitize(parsed));
  return {
    ok: true,
    data: clean,
    summary: { trips: clean.trips.length, templates: clean.templates.length },
  };
}
