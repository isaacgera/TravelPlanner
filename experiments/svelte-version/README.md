# Travel Planner — Option B (Svelte 5 + Vite) experiment

This is a **learning experiment**, not the shipped app.

The shipped Travel Planner (v1.0.1) is the vanilla, no-build PWA in the parent
folder. This folder is a parallel reimplementation of the **same SPEC**
(`../../SPEC-requirements.md`, `../../SPEC-design.md`) in **Svelte 5 + Vite**, built
for an apples-to-apples comparison of developer experience, code shape, and bundle
size. It never becomes the shipped app unless a later, explicit decision says so.

## Why it lives here

- Keeps the experiment isolated from the shipped app (`experiments/` subfolder).
- Adds a Node/npm build step that the shipped app deliberately avoids — flagged and
  accepted as the cost of the experiment.

## Data isolation

This experiment namespaces its `localStorage` under a **`tpsvelte_`** prefix so it
can never read or overwrite the shipped app's real `travelplanner_` data.

## Prerequisites

- Node.js (tested with v24.21.0) and npm (11.19.0).

## Run it (commands for Isaac's terminal)

From inside `experiments/svelte-version/`:

```cmd
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To produce a production build and preview it:

```cmd
npm run build
npm run preview
```

## Status

Scaffold in place; feature port in progress. See the parent app's `SESSION-LOG.md`
for the running experiment notes and the eventual comparison writeup.

---
Powered by Forjé
© 2026 Isaac A Gera. All rights reserved.
