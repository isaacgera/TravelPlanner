/* ============================================================
   router.svelte.js - tiny reactive router (runes)
   ------------------------------------------------------------
   The shipped app hides/shows <section> elements and toggles aria-current by
   hand in app.js. Here the route is a single `$state`, and components render
   conditionally from it with {#if} — no manual show/hide DOM code.
   ============================================================ */

export const route = $state({
  name: "trips",           // trips | trip | templates | personalization | about
  params: {},
});

/** Sidebar collapsed state (desktop icon-rail), persisted. */
const COLLAPSE_KEY = "tpsvelte_nav_collapsed";
export const ui = $state({
  navCollapsed: localStorage.getItem(COLLAPSE_KEY) === "1",
});

export function toggleNavCollapsed() {
  ui.navCollapsed = !ui.navCollapsed;
  localStorage.setItem(COLLAPSE_KEY, ui.navCollapsed ? "1" : "0");
  document.documentElement.classList.toggle("nav-collapsed", ui.navCollapsed);
}

export function initNavCollapsed() {
  document.documentElement.classList.toggle("nav-collapsed", ui.navCollapsed);
}

/** Toast/announce message for screen-reader + on-screen status (aria-live). */
export const status = $state({ message: "", error: false });

export function navigate(name, params = {}) {
  preview.name = null;      // committing clears any hover-preview
  preview.params = {};
  route.name = name;
  route.params = params;
  window.scrollTo({ top: 0, behavior: "auto" });
}

/**
 * Hover-preview state (desktop): hovering a sidebar tab renders that view's
 * content without committing navigation (matches the shipped previewNav).
 * The shell renders `preview` when set, else `route`. Never previews the
 * trip-detail route so hovering nav can't blow away an open trip.
 */
export const preview = $state({ name: null, params: {} });

export function previewNav(name, params = {}) {
  // Desktop-only: skip on touch/coarse-pointer devices (mobile uses the
  // on-screen SegNav and taps commit directly).
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return;
  if (route.name === "trip") return;   // don't preview over an open trip
  if (name === "trip") return;
  preview.name = name;
  preview.params = params;
}

export function clearPreview() {
  preview.name = null;
  preview.params = {};
}

/** True when a hover-preview is currently overriding the committed route. */
export function isPreviewing() {
  return !!preview.name && route.name !== "trip";
}

/**
 * Effective params for the currently-rendered view: the preview's params when
 * previewing, otherwise the committed route's params. Views read filter/section
 * from here so hover-preview shows the right sub-section too.
 */
export function currentParams() {
  return isPreviewing() ? preview.params : route.params;
}

export function announce(message, error = false) {
  status.message = message;
  status.error = error;
  // Auto-clear so repeated identical messages still re-announce.
  clearTimeout(announce._t);
  announce._t = setTimeout(() => {
    status.message = "";
    status.error = false;
  }, 4000);
}
