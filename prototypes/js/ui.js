/* ============================================================
   ui.js - shared DOM + UI helpers
   ============================================================ */

/** el("div", {class:"x", onclick}, [children|text]) */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "dataset") {
      Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv));
    } else if (v === true) {
      node.setAttribute(k, "");
    } else {
      node.setAttribute(k, v);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  kids.forEach((c) => {
    if (c == null || c === false) return;
    node.appendChild(typeof c === "string" || typeof c === "number"
      ? document.createTextNode(String(c))
      : c);
  });
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/** Announce a message via the polite live region (screen readers + status).
 *  Clears first, then sets after a short delay so (a) repeated identical
 *  messages still fire and (b) a rapid follow-up message replaces the previous
 *  one cleanly rather than both clipping. The latest message always wins. */
let announceTimer = null;
export function announce(message, isError = false) {
  const live = document.getElementById("live");
  if (!live) return;
  live.textContent = "";
  if (announceTimer) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { live.textContent = message; }, 120);
  if (isError) console.warn("Travel Planner:", message);
}

/** The shared "Powered by Forje" footer (print-excluded via .no-print). */
export function footer() {
  const year = new Date().getFullYear();
  return el("footer", { class: "app-footer no-print" }, [
    el("span", { class: "app-footer-brand", text: "Powered by Forj\u00E9" }),
    el("span", { class: "app-footer-copy", text: `\u00A9 ${year} Isaac A Gera. All rights reserved.` }),
  ]);
}

/** Empty / error state block. */
export function stateBlock(icon, message, isError = false) {
  return el("div", { class: `state ${isError ? "state-error" : ""}` }, [
    el("span", { class: "state-icon", "aria-hidden": "true", text: icon }),
    el("p", { text: message }),
  ]);
}

/* ---- Modal + confirm -------------------------------------- */
const root = () => document.getElementById("modal-root");
let lastFocused = null;

export function openModal(contentNode) {
  const r = root();
  clear(r);
  lastFocused = document.activeElement;
  const modal = el("div", { class: "modal", role: "dialog", "aria-modal": "true" }, [contentNode]);
  r.appendChild(modal);
  r.hidden = false;

  const onKey = (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") trapFocus(e, modal);
  };
  r.addEventListener("keydown", onKey);
  r._onKey = onKey;

  // focus first focusable
  const focusable = modal.querySelector(
    'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
  );
  (focusable || modal).focus();

  r.addEventListener("click", (e) => { if (e.target === r) closeModal(); }, { once: true });
  return modal;
}

export function closeModal() {
  const r = root();
  if (r._onKey) r.removeEventListener("keydown", r._onKey);
  r.hidden = true;
  clear(r);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function trapFocus(e, modal) {
  const items = modal.querySelectorAll(
    'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Promise-based confirm dialog. Resolves true/false. */
export function confirmDialog({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const content = el("div", {}, [
      el("h3", { text: title }),
      el("p", { class: "meta", text: body }),
      el("div", { class: "modal-actions" }, [
        el("button", { class: "btn btn-ghost", type: "button", onclick: () => { closeModal(); resolve(false); } }, cancelLabel),
        el("button", {
          class: `btn ${danger ? "btn-danger" : "btn-primary"}`,
          type: "button",
          onclick: () => { closeModal(); resolve(true); },
        }, confirmLabel),
      ]),
    ]);
    openModal(content);
  });
}

/* ---- date formatting -------------------------------------- */
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

/** Local YYYY-MM-DD (avoids the UTC shift that toISOString() introduces in
 *  timezones ahead of UTC, e.g. IST). */
function toLocalISO(d) {
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
