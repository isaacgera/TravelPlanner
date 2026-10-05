/* ============================================================
   views/about.js - in-app About / Help
   ============================================================ */

import { el, clear } from "../ui.js";
import { APP_VERSION } from "../app.js";

export function renderAboutView(container) {
  clear(container);
  container.appendChild(el("div", { class: "view-head" }, [el("h2", { text: "About" })]));

  container.appendChild(
    el("div", { class: "card" }, [
      el("h3", { text: "Travel Planner" }),
      el("p", { class: "meta", text: `Version ${APP_VERSION}` }),
      el("p", { text: "Plan family and friends trips: add travellers and the cities you'll visit, plan each day, see the weather per city, and build reusable packing checklists." }),
      el("p", { class: "meta", text: "Customise the look and manage your backup under Personalize." }),
    ])
  );

  container.appendChild(
    el("div", { class: "card" }, [
      el("h3", { text: "Tips" }),
      el("ul", { style: "margin:0;padding-left:1.2rem;color:var(--text-light)" }, [
        el("li", { text: "Set trip dates to unlock the day-by-day view and weather." }),
        el("li", { text: "Weather forecasts reach about 16 days ahead; beyond that you'll see a note until the dates get closer." }),
        el("li", { text: "Save a packing list you like as a preset, then reuse it on future trips." }),
        el("li", { text: "Install it: use your browser's \u201CAdd to Home Screen\u201D / \u201CInstall\u201D option to run it like an app, offline." }),
      ]),
    ])
  );
}
