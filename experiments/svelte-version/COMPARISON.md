# Option A (vanilla) vs Option B (Svelte 5 + Vite) — comparison

A learning writeup from building the same app twice against the same SPEC. Option A
is the shipped Travel Planner (vanilla, no-build PWA, v1.0.1). Option B is this
Svelte 5 + Vite reimplementation. Both target `SPEC-requirements.md` /
`SPEC-design.md`, so differences here are about the *stack*, not the feature set.

This is an experiment note, not a recommendation to switch. The shipped app stays
vanilla.

## TL;DR

- Svelte's **runes reactivity** removed the single biggest source of manual work in
  the vanilla app: the "mutate state, then manually re-render the view" loop.
- The **component model + scoped styles** made the UI easier to compose and reason
  about than the `el()` DOM-builder helper.
- The cost is a **real build step**: Node, npm, Vite, and — on this managed BT laptop
  — a corporate-proxy certificate hurdle before `npm install` would even run.
- **Bundle:** the whole app's own code gzips to ~43 kB. The heavy chunks are the PDF
  export libraries, which are the same in both versions (Option A loads them from a
  CDN at runtime; Option B bundles + lazy-loads them).
- **Supply chain:** Option A has *zero* npm dependencies and therefore zero
  dependency vulnerabilities. Option B pulls in a known-vulnerable `dompurify` (via
  jsPDF). Not exploitable given our usage, but it's a real contrast.

## Developer experience

### Reactivity — the biggest win
The vanilla app's core pattern is: mutate the data, then call `rerender(tripId)` (or
`renderTemplatesView(container)`) to tear down and rebuild the DOM. Every handler ends
with a manual re-render call, and forgetting one is a class of bug on its own.

In Svelte, state lives in a `$state` rune (`store.svelte.js`). Components read
`store.trips` and re-render automatically when it changes. There are **no manual
re-render calls anywhere** in Option B. The clearest example is the packing-preset
builder: the vanilla version has a `draw()` function it calls after every add/remove,
plus a `focusAfterDraw` dance to restore keyboard focus after each rebuild. The Svelte
version just mutates a `$state` array and the list updates itself — the whole redraw
apparatus disappears.

### Components + scoped styles vs `el()` + one big stylesheet
Option A builds DOM with an `el(tag, attrs, children)` helper and keeps all CSS in one
~1000-line `styles.css`. It works, but a "card" is spread across a JS builder and a
distant CSS block.

Option B is ~30 `.svelte` components, each co-locating its markup, logic, and
scoped styles. Shared patterns (buttons, cards, seg switcher, palette swatches) still
live in a global `app.css` — ported from the shipped tokens so the look matches — but
component-specific styling sits with its component. Composition (e.g. reusing `Modal`,
`SegNav` across views) is noticeably tidier.

### Forms
Vanilla reads inputs via `FormData` on submit. Svelte's `bind:value` two-way binding
made the many small forms (new trip, edit trip, flight, stay, person, preset) shorter
and removed a layer of "read the field back out" plumbing.

### HMR
Vite's hot-module reload updated the running app on every save, usually sub-second.
The vanilla workflow is a manual browser refresh (fine, but slower to iterate). This
genuinely sped up the many UI-matching iterations (the sidebar footer alone took
several rounds).

### Where vanilla is actually nicer
- **No toolchain.** Open the file, or point Live Server at it. Done.
- **Nothing to keep updated** — no `node_modules`, no dependency churn, no build to break.
- **Debugging** is the code you wrote, not compiler output.

## Build step & tooling cost (the honest friction)

Getting Option B to `npm install` at all took real effort on the managed laptop:
- Node isn't installed by default; installed v24.21.0 into the user folder and fixed
  the user `Path` (the env-var dialog fought back — a separate `Node` variable does
  nothing; the folder has to go *inside* `Path`).
- `npm install` then failed with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` — BT's **Zscaler**
  TLS-inspecting proxy re-signs HTTPS with a corporate CA that Node doesn't trust.
  Fixed properly by exporting the Zscaler root cert and pointing Node at it
  (`NODE_EXTRA_CA_CERTS`) — not by disabling TLS.
- npm 11 also blocks package install scripts by default; had to approve `esbuild` and
  `core-js`.

None of this touches the vanilla app, which has no install step at all. For a personal
project on a locked-down work machine, that's a meaningful tax — worth paying for a
deliberate learning exercise, less so for a quick tool.

## Bundle size (production `npm run build`)

| Chunk | Raw | Gzip | Notes |
|---|---|---|---|
| `index.html` | 0.58 kB | 0.36 kB | entry |
| app CSS | 23.14 kB | 4.84 kB | all styles |
| **app JS (+ Svelte runtime)** | **129.16 kB** | **43.20 kB** | the whole app UI + framework |
| `purify` (lazy) | 22.03 kB | 8.77 kB | via jsPDF |
| `html2canvas` (lazy) | 202.38 kB | 48.04 kB | export only |
| `jspdf` (lazy) | ~358 + 160 kB | ~118 + 54 kB | export only |

Takeaways:
- The **app's own code gzips to ~43 kB**, Svelte runtime included. The framework is
  not the heavy part.
- The export libraries (html2canvas + jsPDF) dwarf the app — but **both versions use
  them**. Option A pulls them from a CDN at runtime; Option B bundles them and, because
  they're imported with dynamic `import()`, they're split into **separate chunks that
  only download when the user clicks Save/Export**. So the initial load is just the
  ~43 kB app + 5 kB CSS. That lazy-split is a small Vite/Svelte win over the shipped
  app's CDN-script approach (and it works offline, unlike the CDN).

## Supply-chain surface

- **Option A: zero dependencies.** No `node_modules`, no `npm audit` findings, nothing
  to patch. The no-build stance eliminates the entire supply-chain attack surface.
- **Option B:** `npm audit` reports 2 vulnerabilities (1 moderate, 1 critical), **all
  in `dompurify` ≤3.4.12**, pulled in transitively by jsPDF. These are DOMPurify
  HTML-sanitisation bypasses. **Not exploitable here** — our export path renders a
  canvas to an image and places it in the PDF; we never feed untrusted HTML through
  DOMPurify, and the app is local-first with no attacker-supplied input. But it's a
  genuine illustration of the trade-off: adding a build ecosystem means inheriting its
  dependency risks, even for a feature (HTML→PDF) you don't use. (Left as-is for the
  experiment; a shipped version would pin/override dompurify or swap the PDF lib.)

## Feature parity

All v1 features were ported and verified: trips (create/edit/delete, domestic/
international grouping, status badges), travellers (master list + per-trip, opt-in
save), cities via Open-Meteo geocoding, per-city daily weather with the 16-day horizon
+ offline banners, packing lists + reusable presets, flights, accommodation,
attachments (upload/view/download, image lightbox, PDF open), printable itinerary with
adaptive PDF (desktop) / JPEG (mobile) export, 11 palettes + custom with contrast
guard, light/dark, and JSON export/import. Verified on desktop (`npm run build`, clean)
and on a real phone via a Netlify deploy of `dist/`.

## Known gaps vs the shipped app (deliberate, for the experiment)

- **No PWA layer** — no service worker or manifest, so no offline/install. The shipped
  app added these as a separate finishing pass; the experiment skipped them.
- **Delete confirms use the browser's `window.confirm()`** rather than the shipped
  app's styled confirm modal. Functional, not a visual match. A `ConfirmModal`
  component would close the gap.
- **dompurify vulnerability** left unpatched (see above).

## Verdict (for this app family)

For small, local-first, offline-first single-page tools like this one, **vanilla
remains the better default**: no toolchain, no supply-chain surface, trivial to host,
and the app is small enough that manual re-rendering is manageable. Svelte's
ergonomics genuinely shine as interactivity and state complexity grow — the reactivity
and component model would pay off more on something bigger or more dynamic. The build
step and (on this laptop) the corporate-proxy friction are the main costs.

The experiment did what it was meant to: an honest, apples-to-apples feel for what
Svelte 5 buys and what it costs, without touching the shipped app.

---
Powered by Forjé
© 2026 Isaac A Gera. All rights reserved.
