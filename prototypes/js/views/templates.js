/* ============================================================
   views/templates.js - reusable packing templates
   - Templates view (list / rename / delete)
   - openSaveTemplate: save a trip's packing list as a template
   - openApplyTemplate: replace a trip's packing list from a template
   ============================================================ */

import { load, update, uid, DEFAULT_CATEGORIES } from "../store.js";
import { el, clear, stateBlock, openModal, closeModal, confirmDialog, announce, fmtDate } from "../ui.js";
import { navigate } from "../app.js";

/* ---- People (master list) --------------------------------- */
function renderPeopleSection(container, data) {
  const people = data.people || [];
  container.appendChild(
    el("div", { id: "section-people", class: "section-head", style: "display:flex;align-items:center;gap:.6rem;margin-top:.5rem;scroll-margin-top:1rem" }, [
      el("h3", { style: "margin:0", text: "Travellers" }),
      el("button", { class: "add-pill", type: "button", "aria-label": "Add a traveller", title: "Add a traveller", onclick: () => openPersonForm() }, [
        el("span", { "aria-hidden": "true", text: "Add " }),
        el("span", { class: "add-pill-plus", "aria-hidden": "true", text: "\uFF0B" }),
      ]),
    ])
  );
  container.appendChild(el("p", { class: "meta", text: "A reusable list of travellers you can quickly add to any trip." }));

  if (!people.length) {
    container.appendChild(stateBlock("\u{1F465}", "No travellers yet. Add family and friends here to reuse across trips."));
    return;
  }

  const list = el("div", { class: "card-grid" });
  people.forEach((p) => {
    const bits = [];
    const age = ageFromBirthday(p.birthday);
    if (age != null) bits.push(`${age} yrs`);
    else if (p.ageText) bits.push(p.ageText);
    if (p.gender) bits.push(p.gender);
    if (p.birthday) bits.push(`\u{1F382} ${fmtDate(p.birthday, { day: "numeric", month: "short" })}`);
    const detail = bits.join(" \u00B7 ");
    const initial = (p.name.trim()[0] || "?").toUpperCase();

    list.appendChild(
      el("div", { class: "card entity-card" }, [
        el("div", { class: "entity-head" }, [
          el("span", { class: "person-avatar", "aria-hidden": "true", text: initial }),
          el("h3", { class: "entity-title", style: "margin:0", text: p.name }),
          el("span", { class: "entity-actions" }, [
            el("button", { class: "icon-btn-sm", type: "button", "aria-label": `Edit ${p.name}`, title: `Edit ${p.name}`, onclick: () => openPersonForm(p.id) }, "\u270E"),
            el("button", { class: "icon-btn-sm icon-btn-danger", type: "button", "aria-label": `Remove ${p.name}`, title: `Remove ${p.name}`, onclick: async () => {
              const ok = await confirmDialog({ title: "Remove traveller?", body: `Remove ${p.name} from your Travellers list? Trips they're already on keep them.`, confirmLabel: "Remove", danger: true });
              if (!ok) return;
              update((d) => { d.people = (d.people || []).filter((x) => x.id !== p.id); });
              announce(`${p.name} removed from Travellers.`);
              renderTemplatesView(container);
            } }, "\u00D7"),
          ]),
        ]),
        el("p", { class: "meta", style: "margin:.35rem 0 0", text: detail || "No details added" }),
      ])
    );
  });
  container.appendChild(list);
}

function openPersonForm(personId) {
  const data = load();
  const existing = (data.people || []).find((p) => p.id === personId);
  const v = existing || { name: "", birthday: "", ageText: "", gender: "" };

  const nameInput = el("input", { type: "text", name: "name", value: v.name, placeholder: "Full name", autocomplete: "off", required: true });
  nameInput.id = "person-name";
  const bdayInput = el("input", { type: "date", name: "birthday", value: v.birthday });
  bdayInput.id = "person-bday";
  const ageInput = el("input", { type: "text", name: "ageText", value: v.ageText, placeholder: "e.g. 30s (if birthday unknown)", autocomplete: "off" });
  ageInput.id = "person-age";
  const genderSelect = el("select", { name: "gender", "aria-label": "Gender" }, [
    el("option", { value: "" }, "Prefer not to say"),
    el("option", { value: "Female" }, "Female"),
    el("option", { value: "Male" }, "Male"),
    el("option", { value: "Other" }, "Other"),
  ]);
  genderSelect.value = v.gender || "";
  genderSelect.id = "person-gender";

  const form = el("form", { class: "stack" }, [
    el("h3", { text: existing ? "Edit traveller" : "Add traveller" }),
    el("div", { class: "field" }, [el("label", { for: "person-name", text: "Name" }), nameInput]),
    el("div", { class: "field" }, [el("label", { for: "person-bday", text: "Birthday (optional)" }), bdayInput]),
    el("div", { class: "field" }, [el("label", { for: "person-age", text: "Age note (optional)" }), ageInput]),
    el("div", { class: "field" }, [el("label", { for: "person-gender", text: "Gender (optional)" }), genderSelect]),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, existing ? "Save" : "Add traveller"),
    ]),
  ]);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const rec = { name, birthday: bdayInput.value || "", ageText: ageInput.value.trim(), gender: genderSelect.value };
    update((d) => {
      if (!Array.isArray(d.people)) d.people = [];
      if (existing) Object.assign(d.people.find((x) => x.id === personId), rec);
      else d.people.push({ id: uid("person"), ...rec });
    });
    closeModal();
    announce(existing ? "Traveller updated." : `${name} added to Travellers.`);
    // re-render the whole presets view
    const container = document.getElementById("view-templates");
    if (container) renderTemplatesView(container);
  });
  openModal(form);
}

/** Whole-year age from an ISO birthday, or null if unset/invalid/future. */
function ageFromBirthday(iso) {
  if (!iso) return null;
  const b = new Date(iso + "T00:00:00");
  if (isNaN(b)) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export function renderTemplatesView(container, section = "all") {
  clear(container);
  const data = load();
  const s = ["all", "people", "packing"].includes(section) ? section : "all";

  container.appendChild(el("div", { class: "view-head" }, [el("h2", { text: "Presets" })]));

  // On-screen switcher (primary control on mobile, where the sidebar sub-nav is hidden).
  const segs = [["all", "All"], ["people", "\u{1F465} Travellers"], ["packing", "\u{1F9F3} Packing"]];
  const segbar = el("div", { class: "seg", role: "group", "aria-label": "Preset sections" });
  segs.forEach(([key, label]) => {
    segbar.appendChild(
      el("button", {
        class: `seg-btn ${s === key ? "is-active" : ""}`,
        type: "button", "aria-pressed": String(s === key),
        onclick: () => navigate("templates", { section: key }),
      }, label)
    );
  });
  container.appendChild(segbar);

  // ---- Travellers (master list) ----------------------------
  if (s !== "packing") renderPeopleSection(container, data);

  // ---- Packing presets -------------------------------------
  if (s !== "people") renderPackingSection(container, data);
}

function renderPackingSection(container, data) {
  container.appendChild(
    el("div", { id: "section-packing", class: "section-head", style: "display:flex;align-items:center;gap:.6rem;margin-top:1.5rem;scroll-margin-top:1rem" }, [
      el("h3", { style: "margin:0", text: "Packing presets" }),
      el("button", { class: "add-pill", type: "button", "aria-label": "Create a packing preset", title: "Create a packing preset", onclick: () => openPresetBuilder() }, [
        el("span", { "aria-hidden": "true", text: "Add " }),
        el("span", { class: "add-pill-plus", "aria-hidden": "true", text: "\uFF0B" }),
      ]),
    ])
  );
  container.appendChild(el("p", { class: "meta", text: "Reusable packing lists you can apply to any trip. Create one here, or from a trip's packing list (Trip \u2192 Packing \u2192 Save as preset)." }));

  if (!data.templates.length) {
    container.appendChild(stateBlock("\u{1F4CB}", "No presets yet. Tap Add to build one."));
    return;
  }

  const list = el("div", { class: "card-grid", style: "margin-top:1rem" });
  data.templates.forEach((tpl) => {
    const itemCount = tpl.categories.reduce((n, c) => n + c.items.length, 0);
    list.appendChild(
      el("div", { class: "card entity-card" }, [
        el("div", { class: "entity-head" }, [
          el("span", { class: "entity-icon", "aria-hidden": "true", text: "\u{1F9F3}" }),
          el("h3", { class: "entity-title", style: "margin:0", text: tpl.name }),
          el("span", { class: "entity-actions" }, [
            el("button", { class: "icon-btn-sm", type: "button", "aria-label": `Edit ${tpl.name}`, title: `Edit ${tpl.name}`, onclick: () => openPresetBuilder(tpl.id) }, "\u270E"),
            el("button", { class: "icon-btn-sm icon-btn-danger", type: "button", "aria-label": `Delete ${tpl.name}`, title: `Delete ${tpl.name}`, onclick: async () => {
              const ok = await confirmDialog({ title: "Delete preset?", body: `Delete the "${tpl.name}" preset?`, confirmLabel: "Delete", danger: true });
              if (!ok) return;
              update((d) => { d.templates = d.templates.filter((x) => x.id !== tpl.id); });
              announce("Preset deleted.");
              renderTemplatesView(container);
            } }, "\u00D7"),
          ]),
        ]),
        el("p", { class: "meta", style: "margin:.35rem 0 0", text: `${tpl.categories.length} categories \u00B7 ${itemCount} items` }),
        el("p", { class: "meta", style: "margin:.15rem 0 0", text: tpl.categories.map((c) => c.category).join(", ") }),
      ])
    );
  });
  container.appendChild(list);
}

/* ---- Build / edit a packing preset from scratch ----------- */
function openPresetBuilder(presetId) {
  const existing = presetId ? (load().templates || []).find((t) => t.id === presetId) : null;
  // Working copy. New presets seed the default categories (empty items).
  const draft = existing
    ? { name: existing.name, categories: existing.categories.map((c) => ({ category: c.category, items: c.items.map((i) => ({ label: i.label, qty: i.qty || 1 })) })) }
    : { name: "", categories: DEFAULT_CATEGORIES.map((category) => ({ category, items: [] })) };

  const body = el("div", { class: "stack" });
  const modal = openModal(body);
  // After a re-render, restore focus to a sensible control (keyboard users
  // shouldn't be dropped to <body>). Set by add-item / add-category handlers.
  let focusAfterDraw = null; // { type:"item", index } | { type:"category" }

  function draw() {
    clear(body);
    body.appendChild(el("h3", { text: existing ? "Edit packing preset" : "New packing preset" }));

    const nameInput = el("input", { type: "text", value: draft.name, placeholder: "Preset name (e.g. Beach weekend)", "aria-label": "Preset name", autocomplete: "off" });
    nameInput.addEventListener("input", () => { draft.name = nameInput.value; });
    body.appendChild(el("div", { class: "field" }, [el("label", { text: "Preset name" }), nameInput]));

    draft.categories.forEach((cat, ci) => {
      const catCard = el("div", { class: "card", style: "padding:.75rem" });
      catCard.appendChild(
        el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.4rem" }, [
          el("strong", { text: cat.category }),
          el("button", { class: "icon-btn-sm icon-btn-danger", type: "button", "aria-label": `Remove category ${cat.category}`, title: "Remove category", onclick: () => { draft.categories.splice(ci, 1); draw(); } }, "\u00D7"),
        ])
      );
      cat.items.forEach((it, ii) => {
        catCard.appendChild(
          el("div", { style: "display:flex;align-items:center;gap:.4rem;padding:.15rem 0" }, [
            el("span", { style: "flex:1", text: `${it.label}${it.qty > 1 ? "  \u00D7" + it.qty : ""}` }),
            el("button", { class: "icon-btn-sm", type: "button", "aria-label": `Remove ${it.label}`, title: "Remove item", onclick: () => { cat.items.splice(ii, 1); draw(); } }, "\u00D7"),
          ])
        );
      });
      const itemInput = el("input", { type: "text", name: "l", placeholder: "Add item", "aria-label": `Add item to ${cat.category}`, autocomplete: "off", style: "flex:1", dataset: { focus: `item-${ci}` } });
      const addItem = el("form", { style: "display:flex;gap:.4rem;margin-top:.4rem" }, [
        itemInput,
        el("input", { type: "number", name: "q", value: "1", min: "1", "aria-label": "Quantity", style: "max-width:64px" }),
        el("button", { class: "btn btn-sm", type: "submit" }, "Add"),
      ]);
      addItem.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(addItem);
        const label = String(fd.get("l") || "").trim();
        if (!label) return;
        const qty = Math.max(1, parseInt(fd.get("q"), 10) || 1);
        cat.items.push({ label, qty });
        focusAfterDraw = `item-${ci}`; // refocus this category's item input
        draw();
      });
      catCard.appendChild(addItem);
      body.appendChild(catCard);
    });

    // add a category
    const addCat = el("form", { style: "display:flex;gap:.4rem;margin-top:.25rem" }, [
      el("input", { type: "text", name: "c", placeholder: "Add a category", "aria-label": "New category", autocomplete: "off", style: "flex:1", dataset: { focus: "category" } }),
      el("button", { class: "btn btn-sm", type: "submit" }, "Add category"),
    ]);
    addCat.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = String(new FormData(addCat).get("c") || "").trim();
      if (!name) return;
      if (!draft.categories.some((c) => c.category.toLowerCase() === name.toLowerCase())) {
        draft.categories.push({ category: name, items: [] });
      }
      focusAfterDraw = "category"; // refocus the new-category input
      draw();
    });
    body.appendChild(addCat);

    body.appendChild(
      el("div", { class: "modal-actions" }, [
        el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
        el("button", { class: "btn btn-primary", type: "button", onclick: saveDraft }, existing ? "Save changes" : "Create preset"),
      ])
    );

    // Restore focus into the modal so keyboard users aren't dropped to <body>.
    if (focusAfterDraw) {
      const target = body.querySelector(`[data-focus="${focusAfterDraw}"]`);
      if (target) target.focus();
      focusAfterDraw = null;
    }
  }

  function saveDraft() {
    const name = draft.name.trim();
    if (!name) { announce("Give the preset a name.", true); return; }
    const categories = draft.categories
      .map((c) => ({ category: c.category, items: c.items.map((i) => ({ label: i.label, qty: i.qty || 1 })) }))
      .filter((c) => c.category);
    update((d) => {
      if (!Array.isArray(d.templates)) d.templates = [];
      if (existing) {
        const t = d.templates.find((x) => x.id === presetId);
        if (t) { t.name = name; t.categories = categories; }
      } else {
        d.templates.push({ id: uid("tpl"), name, categories });
      }
    });
    closeModal();
    announce(existing ? "Preset updated." : `Created "${name}" preset.`);
    const container = document.getElementById("view-templates");
    if (container) renderTemplatesView(container);
  }

  draw();
}

/* ---- Save a trip's packing list as a template ------------- */
export function openSaveTemplate(tripId) {
  const trip = load().trips.find((t) => t.id === tripId);
  if (!trip || !trip.packing.length) { announce("Nothing to save yet.", true); return; }

  const input = el("input", { type: "text", name: "name", placeholder: "e.g. Beach weekend", "aria-label": "Preset name", autocomplete: "off", required: true });
  input.id = "tpl-name";
  const form = el("form", { class: "stack" }, [
    el("h3", { text: "Save as preset" }),
    el("p", { class: "meta", text: "Saves this trip's categories and item names as a reusable packing list you can apply to future trips." }),
    el("div", { class: "field" }, [el("label", { for: "tpl-name", text: "Preset name" }), input]),
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, "Save preset"),
    ]),
  ]);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    const template = {
      id: uid("tpl"),
      name,
      categories: trip.packing.map((c) => ({
        category: c.category,
        items: c.items.map((i) => ({ label: i.label, qty: i.qty })),
      })),
    };
    update((d) => d.templates.push(template));
    closeModal();
    announce(`Saved "${name}" preset.`);
  });
  openModal(form);
}

/* ---- Apply a template to a trip (replaces the list) ------- */
export function openApplyTemplate(tripId, onDone) {
  const data = load();
  const trip = data.trips.find((t) => t.id === tripId);
  if (!data.templates.length) { announce("No presets saved yet.", true); return; }

  const list = el("div", { class: "stack" });
  data.templates.forEach((tpl) => {
    const itemCount = tpl.categories.reduce((n, c) => n + c.items.length, 0);
    list.appendChild(
      el("button", { class: "btn btn-block", type: "button", style: "justify-content:flex-start;text-align:left", onclick: async () => {
        if (trip.packing.length) {
          const ok = await confirmDialog({ title: "Replace packing list?", body: `This replaces the current packing list with the "${tpl.name}" preset.`, confirmLabel: "Replace", danger: true });
          if (!ok) return;
        }
        update((d) => {
          const t = d.trips.find((x) => x.id === tripId);
          t.packing = tpl.categories.map((c) => ({
            category: c.category,
            items: c.items.map((i) => ({ id: uid("item"), label: i.label, qty: i.qty || 1, packed: false })),
          }));
        });
        closeModal();
        announce(`Applied "${tpl.name}" preset.`);
        onDone && onDone();
      } }, `${tpl.name} \u2014 ${itemCount} items`)
    );
  });

  openModal(el("div", { class: "stack" }, [
    el("h3", { text: "Start from a preset" }),
    list,
    el("div", { class: "modal-actions" }, [el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel")]),
  ]));
}
