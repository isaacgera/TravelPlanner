/* ============================================================
   views/trips.js - the Trips list + create-trip flow
   ============================================================ */

import { load, update, uid } from "../store.js";
import { el, clear, stateBlock, openModal, closeModal, fmtRange, announce } from "../ui.js";
import { navigate, setTripsFilter } from "../app.js";

export function renderTripsView(container, filter = "all") {
  clear(container);
  const data = load();
  const f = ["all", "domestic", "international"].includes(filter) ? filter : "all";

  const count = data.trips.length;
  const heroSub = count
    ? `${count} ${count === 1 ? "trip" : "trips"} planned. Pick one to keep planning, or start a new adventure.`
    : "Start your first trip and plan it day by day.";
  container.appendChild(
    el("div", { class: "hero" }, [
      el("div", { class: "hero-text" }, [
        el("h2", { text: "Your trips" }),
        el("p", { text: heroSub }),
      ]),
      el("button", { class: "btn", type: "button", title: "Create a new trip", "aria-label": "Create a new trip", onclick: openNewTrip }, [
        el("span", { "aria-hidden": "true", text: "\uFF0B " }),
        "New trip",
      ]),
    ])
  );

  if (!data.trips.length) {
    container.appendChild(
      stateBlock("\u{1F9F3}", "No trips yet. Create your first trip to start planning.")
    );
    return;
  }

  // On-screen filter (also the primary control on mobile, where the sidebar
  // sub-nav isn't available).
  const segs = [
    ["all", "All"],
    ["domestic", "\u{1F3E0} Domestic"],
    ["international", "\u2708\uFE0F International"],
  ];
  const segbar = el("div", { class: "seg", role: "group", "aria-label": "Filter trips" });
  segs.forEach(([key, label]) => {
    segbar.appendChild(
      el("button", {
        class: `seg-btn ${f === key ? "is-active" : ""}`,
        type: "button", "aria-pressed": String(f === key),
        onclick: () => setTripsFilter(key),
      }, label)
    );
  });
  container.appendChild(segbar);

  // Sort: upcoming/in-progress first (soonest start), completed last.
  const sorted = [...data.trips].sort((a, b) => {
    const sa = tripStatus(a).order, sb = tripStatus(b).order;
    if (sa !== sb) return sa - sb;
    return (a.startDate || "9999").localeCompare(b.startDate || "9999");
  });

  const domestic = sorted.filter((t) => isDomestic(t));
  const international = sorted.filter((t) => !isDomestic(t));

  if (f !== "international" && domestic.length) {
    container.appendChild(tripGroup("\u{1F3E0} Domestic", "Within India", domestic));
  }
  if (f !== "domestic" && international.length) {
    container.appendChild(tripGroup("\u2708\uFE0F International", "Outside India", international));
  }

  // Empty-for-this-filter message
  const shown = (f !== "international" ? domestic.length : 0) + (f !== "domestic" ? international.length : 0);
  if (shown === 0) {
    container.appendChild(stateBlock("\u{1F5FA}\uFE0F",
      f === "domestic" ? "No domestic trips yet." : "No international trips yet."));
  }
}

/** India is the base country: a trip is domestic if its country is India. */
function isDomestic(trip) {
  const c = (trip.country?.name || "").trim().toLowerCase();
  const code = (trip.country?.code || "").trim().toLowerCase();
  if (code) return code === "in";
  if (!c) return true; // no country set yet -> treat as domestic (India base)
  return ["india", "bharat"].includes(c);
}

/** Trip status from dates vs today. */
function tripStatus(trip) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = trip.startDate ? new Date(trip.startDate + "T00:00:00") : null;
  const end = trip.endDate ? new Date(trip.endDate + "T00:00:00") : start;
  if (!start || isNaN(start)) return { key: "planning", label: "Planning", cls: "status-planning", order: 1 };
  if (end && !isNaN(end) && end < today) return { key: "completed", label: "Completed", cls: "status-completed", order: 3 };
  if (start <= today && (!end || end >= today)) return { key: "ongoing", label: "In progress", cls: "status-ongoing", order: 0 };
  const days = Math.ceil((start - today) / 86400000);
  return { key: "upcoming", label: days <= 30 ? `In ${days} day${days === 1 ? "" : "s"}` : "Upcoming", cls: "status-upcoming", order: 1 };
}

function tripGroup(title, subtitle, trips) {
  const grid = el("div", { class: "card-grid" });
  trips.forEach((t) => grid.appendChild(tripCard(t)));
  return el("section", { class: "trip-section", "aria-label": title }, [
    el("div", { class: "trip-section-head" }, [
      el("h3", { text: title }),
      el("span", { class: "meta", text: `${subtitle} \u00B7 ${trips.length}` }),
    ]),
    grid,
  ]);
}

function tripCard(trip) {
  const cities = trip.places.map((p) => p.name).filter(Boolean);
  const country = (trip.country?.name || "").trim();
  let locationText;
  if (!cities.length) {
    // No cities yet: just show the country (or a placeholder).
    locationText = country || "No destination set";
  } else {
    const cityText = cities.join(", ");
    // Show "Country \u00B7 cities", but not when the only city repeats the country.
    const onlyCityIsCountry = cities.length === 1 && cities[0].toLowerCase() === country.toLowerCase();
    locationText = country && !onlyCityIsCountry ? `${country} \u00B7 ${cityText}` : cityText;
  }

  const packedCount = countPacked(trip);
  const status = tripStatus(trip);

  return el(
    "div",
    {
      class: `card entity-card card-link ${status.key === "completed" ? "is-completed" : ""}`,
      role: "button",
      tabindex: "0",
      "aria-label": `Open trip: ${trip.name || "Untitled trip"} (${status.label})`,
      title: `Open ${trip.name || "this trip"}`,
      onclick: () => navigate("trip", { id: trip.id }),
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("trip", { id: trip.id }); } },
    },
    [
      el("div", { class: "entity-head" }, [
        el("h3", { class: "entity-title", style: "margin:0", text: trip.name || "Untitled trip" }),
        el("span", { class: `status-badge ${status.cls}`, text: status.label }),
      ]),
      el("p", { class: "meta", style: "margin-top:.35rem", text: locationText }),
      el("p", { class: "meta", style: "margin:.15rem 0 0", text: fmtRange(trip.startDate, trip.endDate) }),
      el("div", { class: "stack", style: "margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap" }, [
        trip.travellers.length ? el("span", { class: "chip", text: `\u{1F465} ${trip.travellers.length}` }) : null,
        cities.length ? el("span", { class: "chip", text: `\u{1F4CD} ${cities.length} ${cities.length === 1 ? "city" : "cities"}` }) : null,
        packedCount.total ? el("span", { class: "chip chip-primary", text: `\u{1F9F3} ${packedCount.packed}/${packedCount.total} packed` }) : null,
      ]),
    ]
  );
}

function countPacked(trip) {
  let total = 0, packed = 0;
  (trip.packing || []).forEach((c) => c.items.forEach((i) => { total++; if (i.packed) packed++; }));
  return { total, packed };
}

/* ---- New trip modal --------------------------------------- */
function openNewTrip() {
  const form = el("form", { class: "stack" }, [
    el("h3", { text: "New trip" }),
    field("Trip name", el("input", { type: "text", name: "name", required: true, placeholder: "e.g. Summer in Italy", autocomplete: "off" })),
    field("Destination country", el("input", { type: "text", name: "country", placeholder: "e.g. Italy", autocomplete: "off" })),
    el("div", { class: "field-row" }, [
      field("Start date", el("input", { type: "date", name: "start" })),
      field("End date", el("input", { type: "date", name: "end" })),
    ]),
    el("p", { class: "field-hint", text: "Tip: click a date field to open the calendar picker." }),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, "Create trip"),
    ]),
  ]);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = String(f.get("name") || "").trim();
    if (!name) return;
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    if (start && end && end < start) {
      announce("End date can't be before the start date.", true);
      return;
    }
    const trip = {
      id: uid("trip"),
      name,
      notes: "",
      country: { name: String(f.get("country") || "").trim(), code: "" },
      places: [],
      startDate: start,
      endDate: end,
      travellers: [],
      itinerary: [],
      packing: [],
      flights: [],
      stays: [],
      attachments: [],
    };
    update((d) => d.trips.push(trip));
    closeModal();
    announce("Trip created.");
    navigate("trip", { id: trip.id });
  });

  openModal(form);
}

function field(labelText, control) {
  const id = control.getAttribute("name") || uid("f");
  control.id = id;
  return el("div", { class: "field" }, [
    el("label", { for: id, text: labelText }),
    control,
  ]);
}
