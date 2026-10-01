/* ============================================================
   dates.js - date formatting + trip status helpers
   Ported from the shipped app's ui.js / trips.js (plain, no reactivity).
   ============================================================ */

export function fmtDate(iso, opts = { weekday: "short", day: "numeric", month: "short" }) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, opts);
}

export function fmtRange(start, end) {
  if (!start && !end) return "Dates not set";
  if (start && end) return `${fmtDate(start)} \u2013 ${fmtDate(end)}`;
  return fmtDate(start || end);
}

/** Local YYYY-MM-DD (avoids the UTC shift toISOString() introduces in
 *  timezones ahead of UTC, e.g. IST). */
export function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive list of ISO dates between start and end (capped for safety). */
export function dateList(start, end) {
  const out = [];
  const s = start ? new Date(start + "T00:00:00") : null;
  const e = end ? new Date(end + "T00:00:00") : s;
  if (!s || isNaN(s)) return out;
  const last = e && !isNaN(e) ? e : s;
  let cur = new Date(s);
  let guard = 0;
  while (cur <= last && guard < 366) {
    out.push(toLocalISO(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
}

/** India is the base country: a trip is domestic if its country is India. */
export function isDomestic(trip) {
  const c = (trip.country?.name || "").trim().toLowerCase();
  const code = (trip.country?.code || "").trim().toLowerCase();
  if (code) return code === "in";
  if (!c) return true; // no country set yet -> treat as domestic (India base)
  return ["india", "bharat"].includes(c);
}

/** Trip status from dates vs today. */
export function tripStatus(trip) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = trip.startDate ? new Date(trip.startDate + "T00:00:00") : null;
  const end = trip.endDate ? new Date(trip.endDate + "T00:00:00") : start;
  if (!start || isNaN(start)) return { key: "planning", label: "Planning", cls: "status-planning", order: 1 };
  if (end && !isNaN(end) && end < today) return { key: "completed", label: "Completed", cls: "status-completed", order: 3 };
  if (start <= today && (!end || end >= today)) return { key: "ongoing", label: "In progress", cls: "status-ongoing", order: 0 };
  const days = Math.ceil((start - today) / 86400000);
  return {
    key: "upcoming",
    label: days <= 30 ? `In ${days} day${days === 1 ? "" : "s"}` : "Upcoming",
    cls: "status-upcoming",
    order: 1,
  };
}

/** Age in whole years from an ISO birthday, or null if unset/invalid/future. */
export function ageFromBirthday(iso) {
  if (!iso) return null;
  const b = new Date(iso + "T00:00:00");
  if (isNaN(b)) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
