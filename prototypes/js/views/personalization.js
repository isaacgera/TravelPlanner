/* ============================================================
   views/personalization.js - Appearance + Data settings
   - Appearance: colour palette picker (+ theme toggle on mobile)
   - Data: export / import backup
   Sub-nav filters which section shows (like Trips / Presets).
   ============================================================ */

import { el, clear, announce, openModal, closeModal } from "../ui.js";
import { doExport, doImport, toggleThemeExternal, navigate } from "../app.js";
import { PALETTES, currentPaletteId, setPalette, setCustom, getCustom, whiteContrastOK } from "../theme.js";

export function renderPersonalizationView(container, section = "appearance") {
  clear(container);
  const s = ["appearance", "data"].includes(section) ? section : "appearance";

  container.appendChild(el("div", { class: "view-head" }, [el("h2", { text: "Personalization" })]));

  // On-screen switcher (primary control on mobile, where the sidebar sub-nav is hidden).
  const segs = [["appearance", "\u{1F3A8} Appearance"], ["data", "\u{1F4BE} Data"]];
  const segbar = el("div", { class: "seg", role: "group", "aria-label": "Personalization sections" });
  segs.forEach(([key, label]) => {
    segbar.appendChild(
      el("button", {
        class: `seg-btn ${s === key ? "is-active" : ""}`,
        type: "button", "aria-pressed": String(s === key),
        onclick: () => navigate("personalization", { section: key }),
      }, label)
    );
  });
  container.appendChild(segbar);

  if (s === "appearance") renderAppearance(container);
  else renderData(container);
}

/* ---- Appearance ------------------------------------------- */
function renderAppearance(container) {
  const active = currentPaletteId();
  const card = el("div", { class: "card", id: "section-appearance", style: "scroll-margin-top:1rem" }, [
    el("h3", { text: "Appearance" }),
    el("p", { class: "meta", text: "Pick a colour theme. Works with light and dark mode." }),
  ]);

  const grid = el("div", { class: "palette-grid" });
  PALETTES.forEach((p) => {
    grid.appendChild(swatch(p.id, p.name, p.primary, p.accent, active, container));
  });

  const custom = getCustom();
  grid.appendChild(swatch("custom", "Custom", custom.primary, custom.accent, active, container, true));
  card.appendChild(grid);

  // Light/dark toggle - shown here for reach on mobile (desktop also has the
  // sidebar toggle, but having it here too is harmless and convenient).
  const dark = document.documentElement.getAttribute("data-theme") === "dark"
    || (!document.documentElement.getAttribute("data-theme")
        && window.matchMedia("(prefers-color-scheme: dark)").matches);
  card.appendChild(
    el("div", { style: "margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)" }, [
      el("button", { class: "btn", type: "button", "aria-pressed": String(dark),
        onclick: () => { toggleThemeExternal(); renderPersonalizationView(container, "appearance"); } }, [
        el("span", { "aria-hidden": "true", text: (dark ? "\u2600 " : "\u263D ") }),
        dark ? "Switch to light theme" : "Switch to dark theme",
      ]),
    ])
  );

  container.appendChild(card);
}

/** One palette swatch. isCustom opens the custom modal instead of applying. */
function swatch(id, name, primary, accent, active, container, isCustom = false) {
  const isActive = active === id;
  return el("button", {
    class: `palette-swatch ${isActive ? "is-active" : ""}`,
    type: "button",
    "aria-label": isCustom ? "Create a custom theme" : `Use ${name} theme`,
    title: isCustom ? "Custom theme" : `${name} theme`,
    "aria-pressed": String(isActive),
    onclick: isCustom
      ? () => openCustomPalette(container)
      : () => { setPalette(id); announce(`${name} theme applied.`); renderPersonalizationView(container, "appearance"); },
  }, [
    // Non-colour active cue: a check badge (not colour-alone).
    isActive ? el("span", { class: "palette-check", "aria-hidden": "true", text: "\u2713" }) : null,
    el("span", { class: "palette-dots", "aria-hidden": "true" }, [
      el("span", { class: "palette-dot", style: `background:${primary}` }),
      el("span", { class: "palette-dot", style: `background:${accent}` }),
    ]),
    el("span", { class: "palette-name", text: name }),
  ]);
}

/* ---- Data (backup) ---------------------------------------- */
function renderData(container) {
  container.appendChild(
    el("div", { class: "card", id: "section-data", style: "scroll-margin-top:1rem" }, [
      el("h3", { text: "Data" }),
      el("p", { text: "Everything is stored on this device \u2014 no accounts, no tracking. Export a JSON copy to keep it safe or move it to another device; importing replaces the current data (you'll be asked to confirm)." }),
      el("div", { style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem" }, [
        el("button", { class: "btn btn-primary", type: "button", onclick: doExport }, [
          el("span", { "aria-hidden": "true", text: "\u2B83 " }), "Export backup",
        ]),
        el("button", { class: "btn", type: "button", onclick: doImport }, [
          el("span", { "aria-hidden": "true", text: "\u2B81 " }), "Import backup",
        ]),
      ]),
    ])
  );
}

/* ---- Custom palette modal --------------------------------- */
function openCustomPalette(container) {
  const c = getCustom();
  const primary = el("input", { type: "color", value: c.primary, "aria-label": "Primary colour" });
  const accent = el("input", { type: "color", value: c.accent, "aria-label": "Accent colour" });
  const warn = el("p", { class: "field-hint", style: "min-height:1.1em" });
  let warnTimer = null, lastWarned = false;
  const updateWarn = () => {
    const tooLight = !whiteContrastOK(primary.value);
    warn.textContent = tooLight
      ? "Note: this primary is quite light \u2014 it'll be darkened automatically so white text stays readable."
      : "";
    // Announce via the shared polite live region, debounced, only on change.
    if (tooLight !== lastWarned) {
      lastWarned = tooLight;
      if (warnTimer) clearTimeout(warnTimer);
      if (tooLight) warnTimer = setTimeout(() => announce("Light primary colour will be darkened for readable text."), 300);
    }
  };
  primary.addEventListener("input", updateWarn);
  const form = el("form", { class: "stack" }, [
    el("h3", { text: "Custom theme" }),
    el("p", { class: "meta", text: "Choose a primary and accent colour. Lighter/darker shades are derived automatically." }),
    el("div", { class: "field-row" }, [
      el("div", { class: "field" }, [el("label", { text: "Primary" }), primary]),
      el("div", { class: "field" }, [el("label", { text: "Accent" }), accent]),
    ]),
    warn,
    el("div", { class: "modal-actions" }, [
      el("button", { class: "btn btn-ghost", type: "button", onclick: closeModal }, "Cancel"),
      el("button", { class: "btn btn-primary", type: "submit" }, "Apply custom theme"),
    ]),
  ]);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setCustom(primary.value, accent.value);
    announce("Custom theme applied.");
    closeModal();
    renderPersonalizationView(container, "appearance");
  });
  openModal(form);
  updateWarn();
}
