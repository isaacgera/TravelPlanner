/* ============================================================
   app.js - bootstrap, routing, theme, backup wiring
   Travel Planner (Option A: vanilla no-build PWA)
   ============================================================ */

import { load, exportData, parseImport, save } from "./store.js";
import { renderTripsView } from "./views/trips.js";
import { renderTripDetail } from "./views/trip-detail.js";
import { renderTemplatesView } from "./views/templates.js";
import { renderPersonalizationView } from "./views/personalization.js";
import { renderAboutView } from "./views/about.js";
import { announce, confirmDialog } from "./ui.js";
import { initPalette } from "./theme.js";

export const APP_VERSION = "1.0.1";

const views = {
  trips: { el: document.getElementById("view-trips"), tab: "trips" },
  trip: { el: document.getElementById("view-trip"), tab: "trips" },
  templates: { el: document.getElementById("view-templates"), tab: "templates" },
  personalization: { el: document.getElementById("view-personalization"), tab: "personalization" },
  about: { el: document.getElementById("view-about"), tab: "about" },
};

/* ---- Router ----------------------------------------------- */
const route = { name: "trips", params: {} };

export function navigate(name, params = {}) {
  route.name = name;
  route.params = params;
  render();
  document.getElementById("main").focus({ preventScroll: false });
  window.scrollTo({ top: 0, behavior: "auto" });
}

/** Set the trips filter from anywhere (e.g. the on-screen segmented control),
 *  keeping the route + sidebar sub-nav highlight in sync. Single source of truth. */
export function setTripsFilter(filter) {
  route.name = "trips";
  route.params = { filter };
  renderTripsView(views.trips.el, filter);
  syncTripFilterHighlight(filter);
}

/** Preview a nav destination on hover (desktop): renders the view + syncs the
 *  highlights, but WITHOUT stealing focus or scrolling. Used uniformly by every
 *  sidebar tab and sub-tab so hover consistently shows that content. Never on
 *  the trip-detail route (hovering nav shouldn't blow away an open trip). */
function previewNav(name, params = {}) {
  if (name === "trip") return;
  route.name = name;
  route.params = params;
  render();
}

function render() {
  Object.values(views).forEach((v) => (v.el.hidden = true));
  const view = views[route.name] || views.trips;
  view.el.hidden = false;

  // Clear any stale sub-nav highlight/open state before applying the current view's.
  resetSubnavState();

  // Sync tab highlight
  document.querySelectorAll(".tab").forEach((t) => {
    const active = t.dataset.nav === (views[route.name]?.tab || "trips");
    if (active) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });

  switch (route.name) {
    case "trips":
      renderTripsView(view.el, route.params.filter || "all");
      syncTripFilterHighlight(route.params.filter || "all");
      break;
    case "trip": renderTripDetail(view.el, route.params.id); break;
    case "templates":
      renderTemplatesView(view.el, route.params.section || "all");
      syncPresetSubnav(route.params.section || "all");
      break;
    case "personalization":
      renderPersonalizationView(view.el, route.params.section || "appearance");
      syncPersonalizationSubnav(route.params.section || "appearance");
      break;
    case "about": renderAboutView(view.el); break;
    default: renderTripsView(view.el, "all");
  }
}

/** Highlight the active Presets sub-item; keep sub-nav open when a specific
 *  section (not "all") is selected. */
function syncPresetSubnav(section) {
  const onTemplates = route.name === "templates";
  document.querySelectorAll('.subtab[data-nav="templates"]').forEach((s) => {
    const active = onTemplates && s.dataset.section === section;
    s.classList.toggle("is-active", active);
    s.setAttribute("aria-current", active ? "true" : "false");
  });
  const subnav = document.querySelector('.nav-subnav[data-subnav="templates"]');
  if (subnav) subnav.classList.toggle("is-open", onTemplates && section !== "all");
}

/** Highlight the active Personalization sub-item (Appearance / Data). */
function syncPersonalizationSubnav(section) {
  const on = route.name === "personalization";
  document.querySelectorAll('.subtab[data-nav="personalization"]').forEach((s) => {
    const active = on && s.dataset.section === section;
    s.classList.toggle("is-active", active);
    s.setAttribute("aria-current", active ? "true" : "false");
  });
  const subnav = document.querySelector('.nav-subnav[data-subnav="personalization"]');
  if (subnav) subnav.classList.toggle("is-open", on);
}

/** Highlight the active sidebar sub-tab (Domestic/International) and keep the
 *  sub-nav revealed while a specific filter is active. */
function syncTripFilterHighlight(filter) {
  const onTrips = route.name === "trips";
  // Only touch the Trips sub-tabs (scoped), and keep its sub-nav open when a
  // specific filter is active.
  document.querySelectorAll('.subtab[data-nav="trips"]').forEach((s) => {
    const active = onTrips && s.dataset.filter === filter;
    s.classList.toggle("is-active", active);
    s.setAttribute("aria-current", active ? "true" : "false");
  });
  const subnav = document.querySelector('.nav-subnav[data-subnav="trips"]');
  if (subnav) subnav.classList.toggle("is-open", onTrips && (filter === "domestic" || filter === "international"));
}

/** Reset every sub-nav's active/open state. Called on each navigation so only
 *  the current view's sub-nav can be highlighted/held open (no stale state). */
function resetSubnavState() {
  document.querySelectorAll(".subtab").forEach((s) => {
    s.classList.remove("is-active");
    s.setAttribute("aria-current", "false");
  });
  document.querySelectorAll(".nav-subnav").forEach((n) => n.classList.remove("is-open"));
}

/* ---- Theme ------------------------------------------------ */
const THEME_KEY = "travelplanner_theme";

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("theme-toggle-side")?.addEventListener("click", toggleTheme);
  syncThemeButton();
}

function currentTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  syncThemeButton();
}

/** Exposed for the Personalization view's theme button. */
export function toggleThemeExternal() { toggleTheme(); }

function syncThemeButton() {
  const isDark = currentTheme() === "dark";
  const icon = isDark ? "\u263D" : "\u2600";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", nextLabel);
    const i = btn.querySelector(".theme-icon");
    if (i) i.textContent = icon;
  }

  const side = document.getElementById("theme-toggle-side");
  if (side) {
    side.setAttribute("aria-pressed", String(isDark));
    side.setAttribute("aria-label", nextLabel);
    const si = side.querySelector(".theme-icon-side");
    if (si) si.textContent = icon;
  }
}

/* ---- Backup actions --------------------------------------- */
/** Triggered by the sidebar Data buttons and the About-page backup card. */
export function doExport() {
  exportData();
  announce("Backup exported.");
}
export function doImport() {
  document.getElementById("import-file").click();
}

function initBackupMenu() {
  const importFile = document.getElementById("import-file");
  // Export/Import buttons now live in the Personalization > Data view and call
  // doExport()/doImport() directly; this only wires the shared file input.

  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    importFile.value = "";
    if (!file) return;
    const text = await file.text();
    const result = parseImport(text);
    if (!result.ok) { announce(result.error, true); return; }

    const ok = await confirmDialog({
      title: "Replace all data?",
      body: `This backup has ${result.summary.trips} trip(s) and ${result.summary.templates} template(s). Importing replaces everything currently in the app. This can't be undone.`,
      confirmLabel: "Import & replace",
      danger: true,
    });
    if (!ok) return;
    save(result.data);
    announce("Backup imported.");
    navigate("trips");
  });
}

/* ---- Nav wiring ------------------------------------------- */
function initNav() {
  // Primary tabs. Trips resets to the "all" filter.
  // Default params per top-level tab (so hover + click show the same content).
  const tabParams = (nav) => (nav === "trips" ? { filter: "all" } : {});

  document.querySelectorAll(".tab").forEach((tab) => {
    const nav = tab.dataset.nav;
    tab.addEventListener("click", () => {
      navigate(nav, tabParams(nav));
      // Touch discoverability: reveal this tab's sub-nav (if any) on tap.
      const sub = tab.parentElement?.querySelector(".nav-subnav");
      if (sub) sub.classList.add("is-open");
    });
    // Consistent hover-preview across every top-level tab.
    tab.addEventListener("mouseenter", () => previewNav(nav, tabParams(nav)));
  });

  // Sub-tabs: click commits (navigate), hover previews - uniform for all groups.
  document.querySelectorAll(".subtab").forEach((sub) => {
    const nav = sub.dataset.nav;
    // Trips uses data-filter; Presets/Personalization use data-section.
    const params = nav === "trips" ? { filter: sub.dataset.filter } : { section: sub.dataset.section };
    sub.addEventListener("click", () => navigate(nav, params));
    sub.addEventListener("mouseenter", () => previewNav(nav, params));
  });
}

/* ---- Sidebar collapse (desktop) --------------------------- */
const COLLAPSE_KEY = "travelplanner_nav_collapsed";

function initSidebarCollapse() {
  const btn = document.getElementById("nav-collapse");
  if (!btn) return;

  const apply = (collapsed) => {
    document.documentElement.classList.toggle("nav-collapsed", collapsed);
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    btn.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
    const icon = btn.querySelector(".nav-collapse-icon");
    if (icon) icon.textContent = collapsed ? "\u276F" : "\u276E"; // > when collapsed, < when open
  };

  apply(localStorage.getItem(COLLAPSE_KEY) === "1");

  btn.addEventListener("click", () => {
    const collapsed = !document.documentElement.classList.contains("nav-collapsed");
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    apply(collapsed);
  });
}

/* ---- Service worker --------------------------------------- */
function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) =>
        console.warn("Service worker registration failed:", err)
      );
    });
  }
}

/* ---- Boot ------------------------------------------------- */
function boot() {
  load();
  initPalette();
  initTheme();
  initNav();
  initBackupMenu();
  initSidebarCollapse();
  initServiceWorker();
  navigate("trips");
}

document.addEventListener("DOMContentLoaded", boot);
