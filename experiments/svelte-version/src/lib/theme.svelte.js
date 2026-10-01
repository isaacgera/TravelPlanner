/* ============================================================
   theme.svelte.js - light/dark toggle + colour palette (runes)
   ------------------------------------------------------------
   Ported from the shipped app's theme.js. The colour maths (shade/tint/
   contrast guard) is identical; the difference is that theme + palette id
   live in reactive `$state`, so the UI (e.g. the active-palette highlight and
   the theme icon) tracks them automatically instead of via manual DOM sync.

   Storage namespaced tpsvelte_ to stay isolated from the shipped app.
   ============================================================ */

const THEME_KEY = "tpsvelte_theme";
const PALETTE_KEY = "tpsvelte_palette";
const CUSTOM_KEY = "tpsvelte_palette_custom";

/** 11 preset schemes (same set as the shipped app). */
export const PALETTES = [
  { id: "teal",     name: "Teal",     primary: "#0f8a7e", strong: "#0a6459", soft: "#d7efe9", accent: "#f2994a" },
  { id: "indigo",   name: "Indigo",   primary: "#5b5bd6", strong: "#3f3fae", soft: "#e5e5fb", accent: "#f2c14e" },
  { id: "rose",     name: "Rose",     primary: "#c2415f", strong: "#97283f", soft: "#fbe0e7", accent: "#3aa6a0" },
  { id: "forest",   name: "Forest",   primary: "#2f8f4e", strong: "#206637", soft: "#dcf0e1", accent: "#d9564f" },
  { id: "slate",    name: "Slate",    primary: "#3f6b8a", strong: "#2b4d66", soft: "#e0eaf1", accent: "#e8a13c" },
  { id: "plum",     name: "Plum",     primary: "#8b3a8f", strong: "#642966", soft: "#f3e2f4", accent: "#4cae8a" },
  { id: "sunset",   name: "Sunset",   primary: "#c65328", strong: "#993d1c", soft: "#fce4d8", accent: "#3a8fb0" },
  { id: "ocean",    name: "Ocean",    primary: "#1f6fb2", strong: "#154e7e", soft: "#dcebf7", accent: "#f2884b" },
  { id: "crimson",  name: "Crimson",  primary: "#b02a3a", strong: "#821c29", soft: "#f9dce0", accent: "#c9a227" },
  { id: "graphite", name: "Graphite", primary: "#4a5568", strong: "#2f3646", soft: "#e4e7ec", accent: "#5aa9e0" },
  { id: "mint",     name: "Mint",     primary: "#1f9d6b", strong: "#15734d", soft: "#d8f2e6", accent: "#e06fa0" },
];

/** Reactive appearance state. */
export const appearance = $state({
  theme: readTheme(),        // "light" | "dark"
  paletteId: localStorage.getItem(PALETTE_KEY) || "teal",
  custom: readCustom(),      // { primary, accent }
});

function readTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { primary: "#0f8a7e", accent: "#f2994a" };
}

/* ---- Theme toggle ----------------------------------------- */

export function toggleTheme() {
  appearance.theme = appearance.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, appearance.theme);
  document.documentElement.setAttribute("data-theme", appearance.theme);
}

/* ---- Palette ---------------------------------------------- */

export function setPalette(id) {
  appearance.paletteId = id;
  localStorage.setItem(PALETTE_KEY, id);
  applyPalette(id);
}

export function setCustom(primary, accent) {
  appearance.custom = { primary, accent };
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(appearance.custom));
  setPalette("custom");
}

/** Report whether white text is legible on a colour (>= 3:1). */
export function whiteContrastOK(hex) {
  return contrastWithWhite(hex) >= 3;
}

function resolve(id) {
  if (id === "custom") {
    const c = appearance.custom;
    const safePrimary = ensureWhiteLegible(c.primary);
    return {
      primary: safePrimary,
      strong: shade(safePrimary, -0.22),
      soft: tint(safePrimary, 0.82),
      accent: c.accent,
    };
  }
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}

export function applyPalette(id) {
  const p = resolve(id);
  const root = document.documentElement.style;
  root.setProperty("--primary", p.primary);
  root.setProperty("--primary-strong", p.strong);
  root.setProperty("--primary-soft", p.soft);
  root.setProperty("--accent", p.accent);
  root.setProperty("--accent-strong", shade(p.accent, -0.22));
  root.setProperty("--accent-soft", tint(p.accent, 0.8));
  root.setProperty("--brand-grad", `linear-gradient(160deg, ${p.primary} 0%, ${p.strong} 60%, ${shade(p.strong, -0.15)} 100%)`);
  root.setProperty("--brand-grad-accent", `linear-gradient(120deg, ${p.strong} 0%, ${p.primary} 45%, ${ensureWhiteLegible(p.accent)} 100%)`);
}

/** Apply saved theme + palette on boot. */
export function initAppearance() {
  document.documentElement.setAttribute("data-theme", appearance.theme);
  applyPalette(appearance.paletteId);
}

/* ---- colour helpers (identical maths to the shipped app) --- */
function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) { return "#" + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join(""); }
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
function tint(hex, amt) { return shade(hex, Math.abs(amt)); }
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastWithWhite(hex) {
  const l = luminance(hex);
  return (1.0 + 0.05) / (l + 0.05);
}
function ensureWhiteLegible(hex) {
  let c = hex;
  let guard = 0;
  while (contrastWithWhite(c) < 3.5 && guard < 20) {
    c = shade(c, -0.08);
    guard++;
  }
  return c;
}
