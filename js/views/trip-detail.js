/* ============================================================
   views/trip-detail.js
   Trip detail = Overview + combined Trip Days (itinerary+weather)
   + Packing (with templates). Sub-tabs within the trip.
   ============================================================ */

import { load, update, uid, DEFAULT_CATEGORIES } from "../store.js";
import { geocode, fetchForecast, describeCode, FORECAST_HORIZON_DAYS } from "../weather.js";
import {
  el, clear, stateBlock, openModal, closeModal, confirmDialog,
  announce, fmtDate, fmtRange, dateList,
} from "../ui.js";
import { navigate } from "../app.js";
import { openSaveTemplate, openApplyTemplate } from "./templates.js";

let activeSection = "overview";

export function renderTripDetail(container, tripId) {
  clear(container);
  const data = load();
  const trip = data.trips.find((t) => t.id === tripId);

  if (!trip) {
    container.appendChild(stateBlock("\u2753", "That trip couldn't be found.", true));
    container.appendChild(el("button", { class: "btn", type: "button", onclick: () => navigate("trips") }, "Back to trips"));
    return;
  }

  container.appendChild(
    el("button", { class: "back-link", type: "button", onclick: () => navigate("trips") }, [
      el("span", { "aria-hidden": "true", text: "\u2190 " }), "All trips",
    ])
  );

  container.appendChild(
    el("div", { class: "view-head" }, [
      el("h2", { text: trip.name || "Untitled trip" }),
      el("button", { class: "btn btn-sm", type: "button", onclick: () => openEditTrip(trip.id) }, "Edit"),
    ])
  );
  container.appendChild(el("p", { class: "meta", text: `${trip.country?.name ? trip.country.name + " \u00B7 " : ""}${fmtRange(trip.startDate, trip.endDate)}` }));

  // sub-tabs
  const sections = [
    ["overview", "Plan"],
    ["days", "Trip days"],
    ["packing", "Packing"],
    ["summary", "Itinerary"],
  ];
  const subnav = el("div", { class: "subnav", role: "group", "aria-label": "Trip sections", style: "display:flex;gap:.5rem;margin:1rem 0;flex-wrap:wrap" });
  sections.forEach(([key, label]) => {
    subnav.appendChild(
      el("button", {
        class: `btn btn-sm ${activeSection === key ? "btn-primary" : ""}`,
        type: "button",
        "aria-pressed": String(activeSection === key),
        onclick: () => { activeSection = key; renderTripDetail(container, tripId); },
      }, label)
    );
  });
  container.appendChild(subnav);

  const body = el("div", {});
  container.appendChild(body);
  if (activeSection === "overview") renderOverview(body, trip);
  else if (activeSection === "days") renderDays(body, trip);
  else if (activeSection === "packing") renderPacking(body, trip);
  else renderSummary(body, trip);
}

/* ---- Overview: travellers + cities ------------------------ */
function renderOverview(body, trip) {
  // Travellers
  const travellersCard = el("div", { class: "card" }, [el("h3", { text: "Travellers" })]);
  if (!trip.travellers.length) travellersCard.appendChild(el("p", { class: "meta", text: "No travellers added yet." }));
  const tList = el("div", { style: "display:flex;flex-wrap:wrap;gap:.5rem" });
  trip.travellers.forEach((name, idx) => {
    tList.appendChild(
      el("span", { class: "chip" }, [
        `\u{1F464} ${name}`,
        el("button", {
          class: "icon-btn btn-sm", type: "button", "aria-label": `Remove ${name}`, title: `Remove ${name}`,
          style: "width:24px;height:24px;font-size:.9rem",
          onclick: () => { update((d) => { const t = findTrip(d, trip.id); t.travellers.splice(idx, 1); }); rerender(trip.id); },
        }, "\u00D7"),
      ])
    );
  });
  travellersCard.appendChild(tList);

  // Pick from People (master list) — show those not already on the trip.
  const people = load().people || [];
  const onTrip = new Set(trip.travellers.map((n) => n.toLowerCase()));
  const available = people.filter((p) => p.name && !onTrip.has(p.name.toLowerCase()));
  if (available.length) {
    const pick = el("div", { style: "margin-top:.75rem" }, [
      el("p", { class: "field-hint", text: "Add from Travellers:" }),
    ]);
    const chips = el("div", { style: "display:flex;flex-wrap:wrap;gap:.4rem" });
    available.forEach((p) => {
      chips.appendChild(
        el("button", { class: "chip chip-primary", type: "button", style: "cursor:pointer", "aria-label": `Add ${p.name} to trip`,
          onclick: () => { update((d) => findTrip(d, trip.id).travellers.push(p.name)); rerender(trip.id); } },
          `\uFF0B ${p.name}`)
      );
    });
    pick.appendChild(chips);
    travellersCard.appendChild(pick);
  }

  // Manual add (with opt-in save to People)
  const addT = el("form", { style: "margin-top:.75rem" }, [
    el("div", { style: "display:flex;gap:.5rem" }, [
      el("input", { type: "text", name: "t", placeholder: "Add a traveller", "aria-label": "Traveller name", autocomplete: "off" }),
      el("button", { class: "btn btn-sm", type: "submit" }, "Add"),
    ]),
    el("label", { style: "display:flex;align-items:center;gap:.4rem;margin-top:.4rem;font-weight:400;font-size:var(--fs-sm)" }, [
      el("input", { type: "checkbox", name: "save", style: "width:auto;min-height:auto" }),
      "Also save to Travellers for reuse",
    ]),
  ]);
  addT.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(addT);
    const name = String(fd.get("t") || "").trim();
    if (!name) return;
    const alsoSave = fd.get("save") === "on";
    update((d) => {
      const t = findTrip(d, trip.id);
      t.travellers.push(name);
      if (alsoSave) {
        if (!Array.isArray(d.people)) d.people = [];
        if (!d.people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          d.people.push({ id: uid("person"), name, birthday: "", ageText: "", gender: "" });
        }
      }
    });
    if (alsoSave) announce(`${name} added to trip and saved to Travellers.`);
    rerender(trip.id);
  });
  travellersCard.appendChild(addT);
  body.appendChild(travellersCard);

  // Cities
  const citiesCard = el("div", { class: "card" }, [
    el("h3", { text: "Cities" }),
    el("p", { class: "meta", text: "Add each place you'll visit to get its weather." }),
  ]);
  if (!trip.places.length) citiesCard.appendChild(el("p", { class: "meta", text: "No cities added yet." }));
  trip.places.forEach((place) => {
    citiesCard.appendChild(
      el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.4rem 0;border-top:1px solid var(--border)" }, [
        el("span", {}, [
          el("strong", { text: place.name }),
          el("span", { class: "meta", text: `  ${[place.admin, place.country].filter(Boolean).join(", ")}` }),
        ]),
        el("button", {
          class: "btn btn-danger btn-sm", type: "button", "aria-label": `Remove ${place.name}`, title: `Remove ${place.name}`,
          onclick: async () => {
            const ok = await confirmDialog({ title: "Remove city?", body: `Remove ${place.name} and its cached weather from this trip?`, confirmLabel: "Remove", danger: true });
            if (!ok) return;
            update((d) => { const t = findTrip(d, trip.id); t.places = t.places.filter((p) => p.id !== place.id); });
            rerender(trip.id);
          },
        }, "Remove"),
      ])
    );
  });
  citiesCard.appendChild(
    el("button", { class: "btn btn-sm btn-block", type: "button", style: "margin-top:.75rem", onclick: () => openAddCity(trip) }, "\uFF0B Add a city")
  );
  body.appendChild(citiesCard);

  // Flights
  const flights = trip.flights || [];
  const flightsCard = el("div", { class: "card" }, [
    el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
      el("h3", { style: "margin:0", text: "Flights" }),
      el("button", { class: "btn btn-sm", type: "button", onclick: () => openFlightForm(trip.id) }, "\uFF0B Add flight"),
    ]),
  ]);
  if (!flights.length) flightsCard.appendChild(el("p", { class: "meta", text: "No flights added." }));
  flights.forEach((fl) => {
    flightsCard.appendChild(
      el("div", { style: "padding:.5rem 0;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start" }, [
        el("div", {}, [
          el("strong", { text: `${fl.label || "Flight"}${fl.flightNo ? " \u00B7 " + fl.flightNo : ""}` }),
          el("div", { class: "meta", text: `${fl.from || "?"} \u2192 ${fl.to || "?"}` }),
          el("div", { class: "meta", text: `${fmtDate(fl.date)}${fl.depTime ? " \u00B7 dep " + fl.depTime : ""}${fl.arrTime ? " \u00B7 arr " + fl.arrTime : ""}` }),
        ]),
        el("div", { style: "display:flex;gap:.25rem" }, [
          el("button", { class: "btn btn-sm", type: "button", "aria-label": `Edit ${fl.label || "flight"}`, title: "Edit flight", onclick: () => openFlightForm(trip.id, fl.id) }, "Edit"),
          el("button", { class: "btn btn-danger btn-sm", type: "button", "aria-label": `Remove ${fl.label || "flight"}`, title: "Remove flight", onclick: () => { update((d) => { const t = findTrip(d, trip.id); t.flights = (t.flights || []).filter((x) => x.id !== fl.id); }); rerender(trip.id); } }, "\u00D7"),
        ]),
      ])
    );
  });
  body.appendChild(flightsCard);

  // Accommodation
  const stays = trip.stays || [];
  const staysCard = el("div", { class: "card" }, [
    el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
      el("h3", { style: "margin:0", text: "Accommodation" }),
      el("button", { class: "btn btn-sm", type: "button", onclick: () => openStayForm(trip.id) }, "\uFF0B Add stay"),
    ]),
  ]);
  if (!stays.length) staysCard.appendChild(el("p", { class: "meta", text: "No accommodation added." }));
  stays.forEach((st) => {
    staysCard.appendChild(
      el("div", { style: "padding:.5rem 0;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start" }, [
        el("div", {}, [
          el("strong", { text: st.name || "Stay" }),
          st.city ? el("div", { class: "meta", text: st.city }) : null,
          el("div", { class: "meta", text: `${st.checkIn ? "In " + fmtDate(st.checkIn) : ""}${st.checkOut ? " \u00B7 Out " + fmtDate(st.checkOut) : ""}` }),
        ]),
        el("div", { style: "display:flex;gap:.25rem" }, [
          el("button", { class: "btn btn-sm", type: "button", "aria-label": `Edit ${st.name || "stay"}`, title: "Edit accommodation", onclick: () => openStayForm(trip.id, st.id) }, "Edit"),
          el("button", { class: "btn btn-danger btn-sm", type: "button", "aria-label": `Remove ${st.name || "stay"}`, title: "Remove accommodation", onclick: () => { update((d) => { const t = findTrip(d, trip.id); t.stays = (t.stays || []).filter((x) => x.id !== st.id); }); rerender(trip.id); } }, "\u00D7"),
        ]),
      ])
    );
  });
  body.appendChild(staysCard);

  // Notes
  const notesCard = el("div", { class: "card" }, [el("h3", { text: "Notes" })]);
  const ta = el("textarea", { placeholder: "Trip notes, reservations, ideas...", "aria-label": "Trip notes" });
  ta.value = trip.notes || "";
  let saveTimer;
  ta.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => update((d) => (findTrip(d, trip.id).notes = ta.value)), 400);
  });
  notesCard.appendChild(ta);
  body.appendChild(notesCard);

  // Attachments (screenshots, PDFs, txt files — stored as Base64)
  const attachmentsCard = el("div", { class: "card" }, [el("h3", { text: "Attachments" })]);
  const attachList = el("div", { class: "stack", style: "gap:.5rem" });
  
  // Display existing attachments
  const attachments = trip.attachments || [];
  if (!attachments.length) {
    attachList.appendChild(el("p", { class: "meta", text: "No attachments yet. Add tickets, screenshots, or documents." }));
  } else {
    attachments.forEach((att, idx) => {
      const ext = att.name.split(".").pop().toLowerCase();
      const icon = ext === "pdf" ? "📄" : (["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ? "🖼️" : "📋");
      const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
      const isPdf = ext === "pdf";
      
      attachList.appendChild(
        el("div", { style: "display:flex;justify-content:space-between;align-items:center;padding:.4rem;background:var(--surface-2);border-radius:6px" }, [
          el("div", { style: "display:flex;align-items:center;gap:.5rem;min-width:0" }, [
            el("span", { text: icon, style: "flex-shrink:0" }),
            el("span", { style: "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", title: att.name, text: att.name }),
            el("span", { class: "meta", text: ` (${(att.data.length / 1024).toFixed(1)}KB)` }),
          ]),
          el("div", { style: "display:flex;gap:.25rem;flex-shrink:0" }, [
            // View button (images and PDFs)
            isImage ? el("button", {
              class: "btn btn-sm", type: "button",
              "aria-label": `View ${att.name}`, title: `View ${att.name}`,
              onclick: () => {
                openModal(
                  el("div", { style: "display:flex;flex-direction:column;align-items:center;gap:1rem;max-height:80vh;overflow:auto;padding:1rem" }, [
                    el("div", { style: "text-align:center;flex:1;display:flex;align-items:center;justify-content:center;width:100%;max-width:500px" }, [
                      el("img", { src: att.data, style: "max-width:100%;max-height:70vh;border-radius:6px;object-fit:contain" }),
                    ]),
                    el("div", { style: "text-align:center;width:100%" }, [
                      el("p", { class: "meta", style: "margin:0 0 .75rem 0", text: att.name }),
                      el("div", { style: "display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap" }, [
                        el("button", { class: "btn btn-sm", type: "button", onclick: () => downloadFile(att) }, "⬇️ Download"),
                        el("button", { class: "btn btn-primary btn-sm", type: "button", onclick: closeModal }, "✕ Close"),
                      ]),
                    ]),
                  ])
                );
              },
            }, "👁️ View") : (isPdf ? el("button", {
              class: "btn btn-sm", type: "button",
              "aria-label": `Open ${att.name}`, title: `Open ${att.name} in new tab`,
              onclick: () => {
                const blob = dataUrlToBlob(att.data);
                const url = URL.createObjectURL(blob);
                const win = window.open(url, "_blank");
                if (!win) {
                  // Fallback: download instead if popup blocked
                  downloadFile(att);
                  announce("Browser blocked the popup — downloading instead.");
                  URL.revokeObjectURL(url);
                }
                // Revoke after a delay so the tab has time to load
                setTimeout(() => URL.revokeObjectURL(url), 60000);
              },
            }, "👁️ View") : null),
            // Download button
            el("button", {
              class: "btn btn-sm", type: "button",
              "aria-label": `Download ${att.name}`, title: `Download ${att.name}`,
              onclick: () => downloadFile(att),
            }, "⬇️"),
            // Remove button
            el("button", {
              class: "btn btn-danger btn-sm", type: "button",
              "aria-label": `Remove ${att.name}`, title: `Remove ${att.name}`,
              onclick: () => {
                update((d) => {
                  const t = findTrip(d, trip.id);
                  t.attachments = (t.attachments || []).filter((_, i) => i !== idx);
                });
                rerender(trip.id);
              },
            }, "✕"),
          ]),
        ])
      );
    });
  }
  attachmentsCard.appendChild(attachList);

  // File upload input (hidden, triggered by button)
  const fileInput = el("input", {
    type: "file",
    multiple: true,
    accept: ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt",
    style: "display:none",
    "aria-label": "Select files to attach",
    onchange: async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      // Convert files to Base64 and add to attachments
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          announce(`${file.name} is too large (max 5MB). Use File API for larger files (planned for v2).`, true);
          continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          update((d) => {
            const t = findTrip(d, trip.id);
            if (!Array.isArray(t.attachments)) t.attachments = [];
            t.attachments.push({
              id: uid("attachment"),
              name: file.name,
              type: file.type,
              data: reader.result, // Base64 data URL
            });
          });
        };
        reader.readAsDataURL(file);
      }

      // Reset input so the same file can be re-uploaded
      setTimeout(() => { fileInput.value = ""; rerender(trip.id); }, 500);
    },
  });
  attachmentsCard.appendChild(fileInput);

  // Upload button
  attachmentsCard.appendChild(
    el("button", {
      class: "btn btn-sm btn-block", type: "button", style: "margin-top:.75rem",
      onclick: () => fileInput.click(),
    }, "📎 Add attachment")
  );

  body.appendChild(attachmentsCard);

  // Delete trip
  const dangerCard = el("div", { class: "card" }, [
    el("button", { class: "btn btn-danger btn-block", type: "button", onclick: async () => {
      const ok = await confirmDialog({ title: "Delete trip?", body: `Delete "${trip.name || "this trip"}" and everything in it? This can't be undone.`, confirmLabel: "Delete trip", danger: true });
      if (!ok) return;
      update((d) => { d.trips = d.trips.filter((t) => t.id !== trip.id); });
      announce("Trip deleted.");
      navigate("trips");
    } }, "Delete this trip"),
  ]);
  body.appendChild(dangerCard);
}

/* ---- Add-city modal with geocoding ------------------------ */
function openAddCity(trip) {
  const results = el("div", { class: "stack", "aria-live": "polite" });
  const input = el("input", { type: "search", name: "q", placeholder: "Search a city", "aria-label": "City search", autocomplete: "off" });
  const form = el("form", { class: "stack" }, [
    el("h3", { text: "Add a city" }),
    el("div", { class: "field" }, [
      el("label", { for: "city-q", text: "City name" }),
      input,
    ]),
    results,
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Close"),
    ]),
  ]);
  input.id = "city-q";

  let timer;
  const runSearch = async () => {
    const q = input.value.trim();
    clear(results);
    if (q.length < 2) return;
    results.appendChild(el("p", { class: "meta", text: "Searching\u2026" }));
    try {
      const matches = await geocode(q, trip.country?.code || "");
      clear(results);
      if (!matches.length) { results.appendChild(el("p", { class: "meta", text: "No matches found." })); return; }
      matches.forEach((m) => {
        results.appendChild(
          el("button", {
            class: "btn btn-block", type: "button",
            style: "justify-content:flex-start;text-align:left",
            onclick: () => addPlace(trip, m),
          }, `${m.name} \u2014 ${[m.admin, m.country].filter(Boolean).join(", ")}`)
        );
      });
    } catch {
      clear(results);
      results.appendChild(el("p", { class: "meta state-error", text: "Couldn't reach the location service. Check your connection." }));
    }
  };

  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(runSearch, 350); });
  form.addEventListener("submit", (e) => { e.preventDefault(); clearTimeout(timer); runSearch(); });

  openModal(form);
}

function addPlace(trip, match) {
  const place = {
    id: uid("place"),
    query: match.name,
    name: match.name,
    lat: match.lat,
    lon: match.lon,
    admin: match.admin,
    country: match.country,
    weatherCache: null,
  };
  update((d) => {
    const t = findTrip(d, trip.id);
    t.places.push(place);
    // adopt the country from the first city if not set
    if (!t.country?.name && match.country) t.country = { name: match.country, code: match.countryCode || "" };
    else if (match.countryCode && !t.country.code) t.country.code = match.countryCode;
  });
  closeModal();
  announce(`${match.name} added.`);
  rerender(trip.id);
}

/* ---- Trip days: combined itinerary + per-city weather ----- */
function renderDays(body, trip) {
  const days = dateList(trip.startDate, trip.endDate);
  if (!days.length) {
    body.appendChild(stateBlock("\u{1F4C5}", "Set the trip's start and end dates (in Overview \u2192 Edit) to see day-by-day plans and weather."));
    return;
  }

  // Refresh-weather control + status banner
  if (trip.places.length) {
    body.appendChild(
      el("div", { style: "display:flex;justify-content:flex-end;margin-bottom:.5rem" }, [
        el("button", { class: "btn btn-sm", type: "button", id: "refresh-weather", onclick: () => refreshAllWeather(trip) }, "\u21BB Refresh weather"),
      ])
    );

    // Explain the weather situation up front so "?" chips aren't a mystery.
    const daysToStart = daysFromToday(trip.startDate);
    const anyCached = trip.places.some((p) => p.weatherCache?.daily?.length);
    if (daysToStart != null && daysToStart > FORECAST_HORIZON_DAYS) {
      body.appendChild(weatherBanner(
        "\u{1F4C5}",
        `This trip starts in about ${daysToStart} days. Forecasts are only available within ${FORECAST_HORIZON_DAYS} days, so weather will appear closer to the date.`
      ));
    } else if (!anyCached) {
      body.appendChild(weatherBanner(
        "\u2601\uFE0F",
        'Tap "Refresh weather" to load the forecast for each city.'
      ));
    }
  } else {
    body.appendChild(el("p", { class: "meta", text: "Add a city in Overview to see weather alongside each day." }));
  }

  days.forEach((iso) => {
    const dayObj = trip.itinerary.find((d) => d.date === iso) || { date: iso, entries: [] };
    const card = el("div", { class: "card" }, [el("h3", { text: fmtDate(iso, { weekday: "long", day: "numeric", month: "long" }) })]);

    // weather per city for this date
    if (trip.places.length) {
      const wrap = el("div", { style: "display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem" });
      trip.places.forEach((place) => wrap.appendChild(weatherChip(place, iso)));
      card.appendChild(wrap);
    }

    // itinerary entries
    const entries = el("div", { class: "stack" });
    dayObj.entries.forEach((text, idx) => {
      entries.appendChild(
        el("div", { style: "display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start" }, [
          el("span", { text: `\u2022 ${text}` }),
          el("button", {
            class: "icon-btn btn-sm", type: "button", "aria-label": "Remove entry", title: "Remove this entry",
            style: "width:28px;height:28px",
            onclick: () => { update((d) => removeEntry(d, trip.id, iso, idx)); rerender(trip.id); },
          }, "\u00D7"),
        ])
      );
    });
    card.appendChild(entries);

    const addForm = el("form", { style: "display:flex;gap:.5rem;margin-top:.5rem" }, [
      el("input", { type: "text", name: "e", placeholder: "Add a plan for this day", "aria-label": `Plan for ${iso}`, autocomplete: "off" }),
      el("button", { class: "btn btn-sm", type: "submit" }, "Add"),
    ]);
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = String(new FormData(addForm).get("e") || "").trim();
      if (!val) return;
      update((d) => addEntry(d, trip.id, iso, val));
      rerender(trip.id);
    });
    card.appendChild(addForm);

    body.appendChild(card);
  });
}

function weatherChip(place, iso) {
  const cache = place.weatherCache;
  const day = cache?.daily?.find((d) => d.date === iso);
  if (day) {
    const { icon, label } = describeCode(day.code);
    return el("span", {
      class: "chip",
      title: `${place.name}: ${label}`,
      "aria-label": `${place.name}: ${label}, high ${day.tempMax} degrees, low ${day.tempMin} degrees`,
    }, [
      `${icon} ${place.name} ${day.tempMax}\u00B0/${day.tempMin}\u00B0`,
    ]);
  }
  return el("span", { class: "chip", title: `${place.name}: no forecast yet`, "aria-label": `${place.name}: no forecast yet` }, [
    `\u2753 ${place.name} \u00B7 no forecast`,
  ]);
}

async function refreshAllWeather(trip) {
  const btn = document.getElementById("refresh-weather");
  if (btn) { btn.disabled = true; btn.textContent = "Loading\u2026"; }
  announce("Fetching weather\u2026");
  let anyOutOfRange = false, anyError = false, okCount = 0;

  for (const place of trip.places) {
    const res = await fetchForecast(place.lat, place.lon, trip.startDate, trip.endDate);
    if (res.status === "ok") {
      update((d) => {
        const p = findTrip(d, trip.id).places.find((x) => x.id === place.id);
        if (p) p.weatherCache = { fetchedAt: new Date().toISOString(), daily: res.daily };
      });
      okCount++;
    } else if (res.status === "out-of-range") {
      anyOutOfRange = true;
    } else {
      anyError = true;
    }
  }

  let msg = `Weather updated for ${okCount} ${okCount === 1 ? "city" : "cities"}.`;
  if (anyOutOfRange) msg += " Some dates are beyond the 16-day forecast.";
  if (anyError) msg += " Some cities couldn't be reached (showing cached data if available).";
  announce(msg, anyError);
  rerender(trip.id);
}

/* ---- Packing ---------------------------------------------- */
function renderPacking(body, trip) {
  const tools = el("div", { style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem" });
  if (!trip.packing.length) {
    tools.appendChild(el("button", { class: "btn btn-sm btn-primary", type: "button", onclick: () => { seedDefaults(trip); } }, "Start a blank list (defaults)"));
    tools.appendChild(el("button", { class: "btn btn-sm", type: "button", onclick: () => openApplyTemplate(trip.id, () => rerender(trip.id)) }, "Start from a preset"));
    body.appendChild(tools);
    body.appendChild(stateBlock("\u{1F9F3}", "No packing list yet. Start blank with default categories, or from a saved preset."));
    return;
  }

  tools.appendChild(el("button", { class: "btn btn-sm", type: "button", onclick: () => openSaveTemplate(trip.id) }, "Save as preset"));
  tools.appendChild(el("button", { class: "btn btn-sm", type: "button", onclick: () => openApplyTemplate(trip.id, () => rerender(trip.id)) }, "Replace from preset"));
  body.appendChild(tools);

  trip.packing.forEach((cat) => {
    const packedInCat = cat.items.filter((i) => i.packed).length;
    const card = el("div", { class: "card" }, [
      el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
        el("h3", { style: "margin:0", text: cat.category }),
        el("span", { class: "chip chip-primary", text: `${packedInCat}/${cat.items.length}` }),
      ]),
    ]);

    cat.items.forEach((item) => {
      const cb = el("input", { type: "checkbox", id: `item-${item.id}`, style: "width:auto;min-height:auto" });
      cb.checked = item.packed;
      cb.addEventListener("change", () => { update((d) => setPacked(d, trip.id, item.id, cb.checked)); rerender(trip.id); });
      card.appendChild(
        el("div", { style: "display:flex;align-items:center;gap:.6rem;padding:.35rem 0;border-top:1px solid var(--border)" }, [
          cb,
          el("label", { for: `item-${item.id}`, style: `flex:1;margin:0;font-weight:400;${item.packed ? "text-decoration:line-through;color:var(--muted)" : ""}`, text: `${item.label}${item.qty > 1 ? "  \u00D7" + item.qty : ""}` }),
          el("button", { class: "icon-btn btn-sm", type: "button", "aria-label": `Remove ${item.label}`, title: `Remove ${item.label}`, style: "width:28px;height:28px", onclick: () => { update((d) => removeItem(d, trip.id, item.id)); rerender(trip.id); } }, "\u00D7"),
        ])
      );
    });

    const addForm = el("form", { style: "display:flex;gap:.5rem;margin-top:.5rem" }, [
      el("input", { type: "text", name: "label", placeholder: "Add item", "aria-label": `Add item to ${cat.category}`, autocomplete: "off" }),
      el("input", { type: "number", name: "qty", value: "1", min: "1", "aria-label": "Quantity", style: "max-width:70px" }),
      el("button", { class: "btn btn-sm", type: "submit" }, "Add"),
    ]);
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(addForm);
      const label = String(fd.get("label") || "").trim();
      if (!label) return;
      const qty = Math.max(1, parseInt(fd.get("qty"), 10) || 1);
      update((d) => addItem(d, trip.id, cat.category, label, qty));
      rerender(trip.id);
    });
    card.appendChild(addForm);
    body.appendChild(card);
  });

  // add a new category
  const addCat = el("form", { style: "display:flex;gap:.5rem;margin-top:.5rem" }, [
    el("input", { type: "text", name: "cat", placeholder: "Add a category", "aria-label": "New category name", autocomplete: "off" }),
    el("button", { class: "btn btn-sm", type: "submit" }, "Add category"),
  ]);
  addCat.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(new FormData(addCat).get("cat") || "").trim();
    if (!name) return;
    update((d) => {
      const t = findTrip(d, trip.id);
      if (!t.packing.some((c) => c.category.toLowerCase() === name.toLowerCase())) {
        t.packing.push({ category: name, items: [] });
      }
    });
    rerender(trip.id);
  });
  body.appendChild(addCat);
}

function seedDefaults(trip) {
  update((d) => {
    const t = findTrip(d, trip.id);
    t.packing = DEFAULT_CATEGORIES.map((category) => ({ category, items: [] }));
  });
  rerender(trip.id);
}

/* ---- Edit trip modal -------------------------------------- */
function openEditTrip(tripId) {
  const trip = load().trips.find((t) => t.id === tripId);
  const form = el("form", { class: "stack" }, [
    el("h3", { text: "Edit trip" }),
    fieldWith("Trip name", "name", trip.name, "text"),
    fieldWith("Destination country", "country", trip.country?.name || "", "text"),
    el("div", { class: "field-row" }, [
      fieldWith("Start date", "start", trip.startDate, "date"),
      fieldWith("End date", "end", trip.endDate, "date"),
    ]),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, "Save"),
    ]),
  ]);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = String(f.get("name") || "").trim();
    if (!name) return;
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    if (start && end && end < start) { announce("End date can't be before the start date.", true); return; }
    update((d) => {
      const t = findTrip(d, tripId);
      t.name = name;
      t.country = { name: String(f.get("country") || "").trim(), code: t.country?.code || "" };
      t.startDate = start; t.endDate = end;
    });
    closeModal();
    rerender(tripId);
  });
  openModal(form);
}

function fieldWith(label, name, value, type) {
  const input = el("input", { type, name, value: value || "", autocomplete: "off" });
  input.id = "edit-" + name;
  return el("div", { class: "field" }, [el("label", { for: input.id, text: label }), input]);
}

/* ---- Flight add / edit modal ------------------------------ */
function openFlightForm(tripId, flightId) {
  const trip = load().trips.find((t) => t.id === tripId);
  const existing = (trip.flights || []).find((f) => f.id === flightId);
  const v = existing || { label: "", flightNo: "", from: "", to: "", date: "", depTime: "", arrTime: "" };

  const form = el("form", { class: "stack" }, [
    el("h3", { text: existing ? "Edit flight" : "Add flight" }),
    modalField("Label (e.g. Outbound, Return)", "label", v.label, "text"),
    modalField("Flight number (e.g. 6E-1027)", "flightNo", v.flightNo, "text"),
    el("div", { class: "field-row" }, [
      modalField("From", "from", v.from, "text"),
      modalField("To", "to", v.to, "text"),
    ]),
    modalField("Date", "date", v.date, "date"),
    el("div", { class: "field-row" }, [
      modalField("Departure time", "depTime", v.depTime, "time"),
      modalField("Arrival time", "arrTime", v.arrTime, "time"),
    ]),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, existing ? "Save" : "Add flight"),
    ]),
  ]);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const rec = {
      label: String(f.get("label") || "").trim(),
      flightNo: String(f.get("flightNo") || "").trim(),
      from: String(f.get("from") || "").trim(),
      to: String(f.get("to") || "").trim(),
      date: String(f.get("date") || ""),
      depTime: String(f.get("depTime") || ""),
      arrTime: String(f.get("arrTime") || ""),
    };
    if (!rec.label && !rec.flightNo && !rec.from && !rec.to) { announce("Add at least a label or route.", true); return; }
    update((d) => {
      const t = findTrip(d, tripId);
      if (!Array.isArray(t.flights)) t.flights = [];
      if (existing) Object.assign(t.flights.find((x) => x.id === flightId), rec);
      else t.flights.push({ id: uid("flt"), ...rec });
    });
    closeModal();
    rerender(tripId);
  });
  openModal(form);
}

/* ---- Accommodation add / edit modal ----------------------- */
function openStayForm(tripId, stayId) {
  const trip = load().trips.find((t) => t.id === tripId);
  const existing = (trip.stays || []).find((s) => s.id === stayId);
  const v = existing || { name: "", city: "", checkIn: "", checkOut: "", notes: "" };

  const form = el("form", { class: "stack" }, [
    el("h3", { text: existing ? "Edit accommodation" : "Add accommodation" }),
    modalField("Name (e.g. Village Hotel Bugis)", "name", v.name, "text"),
    modalField("City", "city", v.city, "text"),
    el("div", { class: "field-row" }, [
      modalField("Check-in", "checkIn", v.checkIn, "date"),
      modalField("Check-out", "checkOut", v.checkOut, "date"),
    ]),
    modalField("Notes", "notes", v.notes, "text"),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, existing ? "Save" : "Add stay"),
    ]),
  ]);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const rec = {
      name: String(f.get("name") || "").trim(),
      city: String(f.get("city") || "").trim(),
      checkIn: String(f.get("checkIn") || ""),
      checkOut: String(f.get("checkOut") || ""),
      notes: String(f.get("notes") || "").trim(),
    };
    if (!rec.name) { announce("Give the stay a name.", true); return; }
    if (rec.checkIn && rec.checkOut && rec.checkOut < rec.checkIn) { announce("Check-out can't be before check-in.", true); return; }
    update((d) => {
      const t = findTrip(d, tripId);
      if (!Array.isArray(t.stays)) t.stays = [];
      if (existing) Object.assign(t.stays.find((x) => x.id === stayId), rec);
      else t.stays.push({ id: uid("stay"), ...rec });
    });
    closeModal();
    rerender(tripId);
  });
  openModal(form);
}

function modalField(label, name, value, type) {
  const input = el("input", { type, name, value: value || "", autocomplete: "off" });
  input.id = "fld-" + name;
  return el("div", { class: "field" }, [el("label", { for: input.id, text: label }), input]);
}

/* ---- Summary view (printable) ----------------------------- */
function renderSummary(body, trip) {
  body.appendChild(
    el("div", { style: "display:flex;justify-content:flex-end;margin-bottom:.5rem" }, [
      el("button", { class: "btn btn-sm no-print", type: "button", id: "save-summary-btn", onclick: () => saveSummary(trip) }, "\u{1F4BE} Save / Export"),
    ])
  );

  const summary = el("div", { class: "card summary" });

  // Header
  summary.appendChild(el("h3", { class: "summary-title", text: trip.name || "Trip" }));
  summary.appendChild(el("p", { class: "meta", text: `${trip.country?.name ? trip.country.name + " \u00B7 " : ""}${fmtRange(trip.startDate, trip.endDate)}` }));

  const places = (trip.places || []).map((p) => p.name).filter(Boolean);
  if (places.length) {
    const pc = el("p", {});
    pc.appendChild(el("strong", { text: "Places covered: " }));
    pc.appendChild(document.createTextNode(places.join(", ")));
    summary.appendChild(pc);
  }
  if ((trip.travellers || []).length) {
    const tv = el("p", {});
    tv.appendChild(el("strong", { text: "Travellers: " }));
    tv.appendChild(document.createTextNode(trip.travellers.join(", ")));
    summary.appendChild(tv);
  }

  // Flights
  const flights = trip.flights || [];
  if (flights.length) {
    summary.appendChild(el("h4", { class: "summary-h", text: "Flights" }));
    flights.forEach((fl) => {
      summary.appendChild(el("p", { class: "summary-line", text:
        `${fl.label ? fl.label + ": " : ""}${fl.from || "?"} \u2192 ${fl.to || "?"}` +
        `${fl.flightNo ? " (" + fl.flightNo + ")" : ""}` +
        `${fl.date ? " \u2014 " + fmtDate(fl.date) : ""}` +
        `${fl.depTime ? ", dep " + fl.depTime : ""}${fl.arrTime ? ", arr " + fl.arrTime : ""}`
      }));
    });
  }

  // Accommodation
  const stays = trip.stays || [];
  if (stays.length) {
    summary.appendChild(el("h4", { class: "summary-h", text: "Accommodation" }));
    stays.forEach((st) => {
      summary.appendChild(el("p", { class: "summary-line", text:
        `${st.name}${st.city ? ", " + st.city : ""}` +
        `${st.checkIn ? " \u2014 in " + fmtDate(st.checkIn) : ""}${st.checkOut ? ", out " + fmtDate(st.checkOut) : ""}`
      }));
    });
  }

  // Day-by-day
  const days = dateList(trip.startDate, trip.endDate);
  if (days.length) {
    summary.appendChild(el("h4", { class: "summary-h", text: "Itinerary" }));
    days.forEach((iso) => {
      const day = (trip.itinerary || []).find((d) => d.date === iso);
      const line = el("div", { class: "summary-day" }, [
        el("div", { class: "summary-day-date", text: fmtDate(iso, { weekday: "short", day: "numeric", month: "short" }) }),
        el("div", { class: "summary-day-body" }, (day && day.entries.length)
          ? day.entries.map((t) => el("div", { text: t }))
          : [el("div", { class: "meta", text: "\u2014" })]),
      ]);
      summary.appendChild(line);
    });
  } else {
    summary.appendChild(el("p", { class: "meta", text: "Set trip dates to build the day-by-day itinerary." }));
  }

  body.appendChild(summary);
}

/* ---- mutation helpers ------------------------------------- */
function findTrip(d, id) { return d.trips.find((t) => t.id === id); }
function dayFor(t, iso) {
  let day = t.itinerary.find((x) => x.date === iso);
  if (!day) { day = { date: iso, entries: [] }; t.itinerary.push(day); }
  return day;
}
function addEntry(d, tripId, iso, text) { dayFor(findTrip(d, tripId), iso).entries.push(text); }
function removeEntry(d, tripId, iso, idx) { const day = findTrip(d, tripId).itinerary.find((x) => x.date === iso); if (day) day.entries.splice(idx, 1); }
function addItem(d, tripId, category, label, qty) {
  const cat = findTrip(d, tripId).packing.find((c) => c.category === category);
  if (cat) cat.items.push({ id: uid("item"), label, qty, packed: false });
}
function removeItem(d, tripId, itemId) {
  findTrip(d, tripId).packing.forEach((c) => { c.items = c.items.filter((i) => i.id !== itemId); });
}
function setPacked(d, tripId, itemId, packed) {
  findTrip(d, tripId).packing.forEach((c) => c.items.forEach((i) => { if (i.id === itemId) i.packed = packed; }));
}

function rerender(tripId) {
  renderTripDetail(document.getElementById("view-trip"), tripId);
}

/* Whole-number days from today to an ISO date (null if unset). */
function daysFromToday(iso) {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  if (isNaN(target)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function weatherBanner(icon, text) {
  return el("div", { class: "note" }, [
    el("span", { "aria-hidden": "true", text: icon + "  " }),
    el("span", { text }),
  ]);
}

/** Convert a Base64 data URL to a Blob (works cross-browser for view + download). */
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Download an attachment to the user's device via a Blob URL. */
function downloadFile(att) {
  const blob = dataUrlToBlob(att.data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = att.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  announce(`Downloading ${att.name}...`);
}

/** Download the itinerary summary as PDF (desktop) or image (mobile). */
async function saveSummary(trip) {
  const btn = document.getElementById("save-summary-btn");
  const resetBtn = () => { if (btn) { btn.disabled = false; btn.textContent = "\u{1F4BE} Save / Export"; } };
  const isMobile = window.innerWidth < 720;
  const filename = `${(trip.name || "trip").replace(/[^a-z0-9 _-]/gi, "")}-itinerary-${new Date().toISOString().slice(0, 10)}`;

  if (btn) { btn.disabled = true; btn.textContent = isMobile ? "Converting\u2026" : "Generating\u2026"; }

  try {
    const summary = document.querySelector(".summary");
    if (!summary) { announce("Could not find the itinerary to export.", true); resetBtn(); return; }

    // Load html2canvas (needed for both paths)
    await ensureScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    if (typeof window.html2canvas !== "function") throw new Error("html2canvas failed to load.");

    const canvas = await window.html2canvas(summary, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    if (isMobile) {
      // Mobile: export as JPEG image
      canvas.toBlob((blob) => {
        if (!blob) { announce("Could not generate the image.", true); resetBtn(); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        announce("Itinerary exported as image.");
        resetBtn();
      }, "image/jpeg", 0.92);
    } else {
      // Desktop: export as multi-page PDF
      // jsPDF UMD attaches as window.jspdf (lowercase), the constructor is window.jspdf.jsPDF
      await ensureScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      const JsPDFCtor = window.jspdf?.jsPDF;
      if (!JsPDFCtor) throw new Error("jsPDF failed to load.");

      const pdf = new JsPDFCtor({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;                             // mm each side
      const usableW = pageW - margin * 2;            // ~190 mm on A4
      const usableH = pageH - margin * 2;            // ~277 mm on A4

      // Scale the captured canvas to fit the usable width
      const imgW = usableW;
      const imgH = (canvas.height * usableW) / canvas.width;

      // If it fits on one page, just add it
      if (imgH <= usableH) {
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, imgW, imgH);
      } else {
        // Slice the canvas into page-sized chunks and add one per page
        const pxPerPage = (canvas.width * usableH) / usableW; // canvas-px height per PDF page
        let srcY = 0;
        let page = 0;

        while (srcY < canvas.height) {
          const sliceH = Math.min(pxPerPage, canvas.height - srcY);
          // Draw a slice of the source canvas onto a temporary canvas
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceH;
          const ctx = slice.getContext("2d");
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

          if (page > 0) pdf.addPage();
          const sliceImgH = (sliceH * usableW) / canvas.width;
          pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, imgW, sliceImgH);

          srcY += sliceH;
          page++;
        }
      }

      pdf.save(`${filename}.pdf`);
      announce("Itinerary exported as PDF.");
      resetBtn();
    }
  } catch (err) {
    announce(`Could not export: ${err.message}`, true);
    resetBtn();
  }
}

/** Load a CDN script once (de-duped). */
function ensureScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
