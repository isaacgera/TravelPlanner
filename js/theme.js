/* ============================================================
   theme.js - colour palette picker (WealthOrah-style)
   5 preset schemes + 1 custom, persisted, applied via CSS vars.
   Works alongside the light/dark toggle (data-theme).
   ============================================================ */

const PALETTE_KEY = "travelplanner_palette";
const CUSTOM_KEY = "travelplanner_palette_custom";

/** Preset schemes. Each derives strong/soft/gradient from primary + accent. */
export const PALETTES = [
  { id: "teal",     name: "Teal",     primary: "#0f8a7e", strong: "#0a6459", soft: "#d7efe9", accent: "#f2994a" }, // coral
  { id: "indigo",   name: "Indigo",   primary: "#5b5bd6", strong: "#3f3fae", soft: "#e5e5fb", accent: "#f2c14e" }, // gold
  { id: "rose",     name: "Rose",     primary: "#c2415f", strong: "#97283f", soft: "#fbe0e7", accent: "#3aa6a0" }, // teal
  { id: "forest",   name: "Forest",   primary: "#2f8f4e", strong: "#206637", soft: "#dcf0e1", accent: "#d9564f" }, // brick red
  { id: "slate",    name: "Slate",    primary: "#3f6b8a", strong: "#2b4d66", soft: "#e0eaf1", accent: "#e8a13c" }, // amber
  { id: "plum",     name: "Plum",     primary: "#8b3a8f", strong: "#642966", soft: "#f3e2f4", accent: "#4cae8a" }, // green
  { id: "sunset",   name: "Sunset",   primary: "#c65328", strong: "#993d1c", soft: "#fce4d8", accent: "#3a8fb0" }, // sky blue
  { id: "ocean",    name: "Ocean",    primary: "#1f6fb2", strong: "#154e7e", soft: "#dcebf7", accent: "#f2884b" }, // orange
  { id: "crimson",  name: "Crimson",  primary: "#b02a3a", strong: "#821c29", soft: "#f9dce0", accent: "#c9a227" }, // mustard
  { id: "graphite", name: "Graphite", primary: "#4a5568", strong: "#2f3646", soft: "#e4e7ec", accent: "#5aa9e0" }, // cyan-blue
  { id: "mint",     name: "Mint",     primary: "#1f9d6b", strong: "#15734d", soft: "#d8f2e6", accent: "#e06fa0" }, // pink
];

export function currentPaletteId() {
  return localStorage.getItem(PALETTE_KEY) || "teal";
}

function customColors() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { primary: "#0f8a7e", accent: "#f2994a" };
}

/** Resolve a palette id to a full colour set (strong/soft derived for custom).
 *  For custom colours we guard contrast: the primary is darkened until white
 *  text on it clears ~3.5:1, so the white-on-gradient chrome stays legible
 *  even if the user picks a very light colour. */
function resolve(id) {
  if (id === "custom") {
    const c = customColors();
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

/** Report whether white text is legible on a colour (>= 3:1). Used by the
 *  custom dialog to warn the user. */
export function whiteContrastOK(hex) {
  return contrastWithWhite(hex) >= 3;
}

/** Darken a colour until white text reaches ~3.5:1, capping iterations. */
function ensureWhiteLegible(hex) {
  let c = hex;
  let guard = 0;
  while (contrastWithWhite(c) < 3.5 && guard < 20) {
    c = shade(c, -0.08);
    guard++;
  }
  return c;
}

/** Apply a palette by setting CSS custom properties on :root. */
export function applyPalette(id) {
  const p = resolve(id);
  const root = document.documentElement.style;
  root.setProperty("--primary", p.primary);
  root.setProperty("--primary-strong", p.strong);
  root.setProperty("--primary-soft", p.soft);
  root.setProperty("--accent", p.accent);
  // Derive accent shades so hover/active accents track the chosen palette.
  root.setProperty("--accent-strong", shade(p.accent, -0.22));
  root.setProperty("--accent-soft", tint(p.accent, 0.80));
  root.setProperty("--brand-grad", `linear-gradient(160deg, ${p.primary} 0%, ${p.strong} 60%, ${shade(p.strong, -0.15)} 100%)`);
  root.setProperty("--brand-grad-warm", `linear-gradient(135deg, ${tint(p.primary, 0.12)} 0%, ${p.primary} 60%, ${p.strong} 100%)`);
  // Primary -> accent blend (used by the trips hero). Accent end is darkened
  // enough to keep white hero text legible even for light accents.
  root.setProperty("--brand-grad-accent", `linear-gradient(120deg, ${p.strong} 0%, ${p.primary} 45%, ${ensureWhiteLegible(p.accent)} 100%)`);
}

export function setPalette(id) {
  localStorage.setItem(PALETTE_KEY, id);
  applyPalette(id);
}

export function setCustom(primary, accent) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify({ primary, accent }));
  setPalette("custom");
}

export function getCustom() { return customColors(); }

/** Apply the saved palette on boot. */
export function initPalette() {
  applyPalette(currentPaletteId());
}

/* ---- tiny colour helpers (hex -> shade/tint) -------------- */
function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) { return "#" + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join(""); }
/** shade: amt<0 darkens toward black, amt>0 lightens toward white. */
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
/** tint: mix toward white by amt (0..1). */
function tint(hex, amt) { return shade(hex, Math.abs(amt)); }

/** WCAG relative luminance of a hex colour. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Contrast ratio of white (#fff) against a colour. */
function contrastWithWhite(hex) {
  const l = luminance(hex);
  return (1.0 + 0.05) / (l + 0.05);
}
