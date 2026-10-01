<script>
  // Primary navigation: left sidebar on desktop, bottom tab bar on mobile.
  // Desktop: each tab with sub-sections has a sub-nav that reveals on
  // hover/focus (or when active), plus an edge chevron that collapses the
  // sidebar to an icon rail. Ported to match the shipped app.
  import {
    route,
    preview,
    navigate,
    previewNav,
    clearPreview,
    ui,
    toggleNavCollapsed,
  } from "../lib/router.svelte.js";
  import { appearance, toggleTheme } from "../lib/theme.svelte.js";

  // Tabs, each optionally with sub-items. Sub-item param key differs:
  // Trips uses `filter`, others use `section`.
  const tabs = [
    {
      id: "trips",
      label: "Trips",
      icon: "\u{1F4BC}",
      paramKey: "filter",
      defaultParam: { filter: "all" },
      sub: [
        { key: "domestic", label: "Domestic", icon: "\u{1F3E0}" },
        { key: "international", label: "International", icon: "\u2708\uFE0F" },
      ],
    },
    {
      id: "templates",
      label: "Presets",
      icon: "\u{1F4CB}",
      paramKey: "section",
      defaultParam: {},
      sub: [
        { key: "people", label: "Travellers", icon: "\u{1F465}" },
        { key: "packing", label: "Packing lists", icon: "\u{1F9F3}" },
      ],
    },
    {
      id: "personalization",
      label: "Personalize",
      icon: "\u2699\uFE0F",
      paramKey: "section",
      defaultParam: {},
      sub: [
        { key: "appearance", label: "Appearance", icon: "\u{1F3A8}" },
        { key: "data", label: "Data", icon: "\u{1F4BE}" },
      ],
    },
    { id: "about", label: "About", icon: "\u2139\uFE0F", sub: null },
  ];

  // Highlights follow the effective route: the hover-preview when active
  // (unless a trip is open), otherwise the committed route.
  const effName = $derived(
    preview.name && route.name !== "trip" ? preview.name : route.name
  );
  const effParams = $derived(
    preview.name && route.name !== "trip" ? preview.params : route.params
  );
  const activeTab = $derived(effName === "trip" ? "trips" : effName);
  const activeSub = $derived(effParams.filter ?? effParams.section ?? null);

  const themeIcon = $derived(appearance.theme === "dark" ? "\u263D" : "\u2600");
  const themeLabel = $derived(
    appearance.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
  const collapseIcon = $derived(ui.navCollapsed ? "\u276F" : "\u276E");
  const collapseLabel = $derived(ui.navCollapsed ? "Expand sidebar" : "Collapse sidebar");

  function goTab(tab) {
    navigate(tab.id, tab.defaultParam ?? {});
  }
  function goSub(tab, key) {
    navigate(tab.id, { [tab.paramKey]: key });
  }
  // Hover-preview (desktop): render a tab's content on hover without committing.
  function hoverTab(tab) {
    previewNav(tab.id, tab.defaultParam ?? {});
  }
  function hoverSub(tab, key) {
    previewNav(tab.id, { [tab.paramKey]: key });
  }
</script>

<nav class="nav" aria-label="Primary" onmouseleave={clearPreview}>
  <!-- Collapse chevron (desktop only) -->
  <button
    class="nav-collapse"
    type="button"
    aria-label={collapseLabel}
    aria-expanded={!ui.navCollapsed}
    title={collapseLabel}
    onclick={toggleNavCollapsed}
  >
    <span class="nav-collapse-icon" aria-hidden="true">{collapseIcon}</span>
  </button>

  <div class="brand">
    <span class="brand-mark" aria-hidden="true">✈️</span>
    <span class="brand-text">
      <span class="brand-name">Travel Planner</span>
      <span class="brand-tag">Plan every journey</span>
    </span>
  </div>

  <ul class="nav-list">
    {#each tabs as tab (tab.id)}
      <li class="nav-item">
        <button
          class="tab"
          class:is-active={activeTab === tab.id}
          aria-current={activeTab === tab.id ? "page" : undefined}
          title={tab.label}
          onclick={() => goTab(tab)}
          onmouseenter={() => hoverTab(tab)}
          onfocus={() => hoverTab(tab)}
        >
          <span class="tab-icon" aria-hidden="true">{tab.icon}</span>
          <span class="tab-label">{tab.label}</span>
        </button>

        {#if tab.sub}
          <div
            class="nav-subnav"
            class:is-open={activeTab === tab.id && activeSub && activeSub !== "all"}
          >
            {#each tab.sub as s (s.key)}
              <button
                class="subtab"
                class:is-active={activeTab === tab.id && activeSub === s.key}
                aria-current={activeTab === tab.id && activeSub === s.key ? "true" : "false"}
                title={s.label}
                onclick={() => goSub(tab, s.key)}
                onmouseenter={() => hoverSub(tab, s.key)}
                onfocus={() => hoverSub(tab, s.key)}
              >
                <span class="tab-icon" aria-hidden="true">{s.icon}</span>
                <span class="tab-label">{s.label}</span>
              </button>
            {/each}
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  <!-- Sidebar footer (desktop): theme toggle + Forjé credit -->
  <div class="nav-footer no-print">
    <button
      class="theme-toggle-btn"
      onclick={toggleTheme}
      aria-pressed={appearance.theme === "dark"}
      aria-label={themeLabel}
      title={themeLabel}
    >
      <span class="theme-icon" aria-hidden="true">{themeIcon}</span>
    </button>
    <span class="footer-text">
      <span class="footer-brand">Powered by Forjé</span>
      <span class="footer-copy">
        © 2026 Isaac A Gera. <span class="footer-rights">All rights reserved.</span>
      </span>
    </span>
  </div>
</nav>

<style>
  .nav {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    /* liquid glass sidebar */
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    border-right: 1px solid var(--glass-border);
    box-shadow: 1px 0 0 var(--glass-border), 8px 0 30px rgba(11, 79, 108, 0.08);
    overflow: visible;
  }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .nav { background: var(--surface); }
  }

  /* Collapse chevron on the right edge, vertically centred, appears on hover */
  .nav-collapse {
    display: grid;
    place-items: center;
    position: absolute;
    top: 50%;
    right: -14px;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-light);
    font-size: 0.72rem;
    z-index: 30;
    cursor: pointer;
    box-shadow: 2px 0 8px rgba(11, 79, 108, 0.12);
    opacity: 0.5;
    transition: opacity var(--t-fast) var(--ease), background var(--t-fast) var(--ease),
      color var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
  }
  .nav:hover .nav-collapse,
  .nav-collapse:focus-visible { opacity: 1; }
  .nav-collapse:hover {
    background: var(--primary);
    color: #fff;
    transform: translateY(-50%) scale(1.12);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 1.1rem 1.1rem 0.8rem;
    color: var(--primary);
  }
  .brand-mark { font-size: 1.3rem; }
  .brand-text { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
  .brand-name { font-size: 1.05rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .brand-tag { font-size: 0.7rem; color: var(--text-light); font-weight: 500; white-space: nowrap; }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0.4rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    overflow-y: auto;
  }
  .nav-item { display: flex; flex-direction: column; gap: 2px; }

  .tab {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font: inherit;
    font-size: var(--fs-sm);
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    background: transparent;
    color: var(--text-light);
    border: none;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    min-height: 44px;
    transition: transform var(--t-fast) var(--ease), background var(--t-fast) var(--ease),
      color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
  }
  .tab {
    position: relative;
    overflow: hidden;
  }
  /* liquid sheen sweep on hover */
  .tab::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--glass-sheen);
    opacity: 0;
    transition: opacity var(--t-fast) var(--ease);
    pointer-events: none;
  }
  .tab:hover::after { opacity: 1; }
  .tab:hover {
    color: var(--accent-strong);
    background: color-mix(in srgb, var(--surface) 55%, transparent);
    transform: scale(1.03);
    box-shadow: inset 3px 0 0 var(--accent), var(--glass-hi);
  }
  .tab.is-active {
    background: color-mix(in srgb, var(--primary-soft) 75%, transparent);
    color: var(--primary-strong);
    font-weight: 700;
    box-shadow: inset 3px 0 0 var(--accent), var(--glass-hi),
      0 0 16px color-mix(in srgb, var(--primary) 22%, transparent);
  }
  .tab:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .tab-icon { font-size: 1.15rem; width: 1.4rem; text-align: center; flex: none; }

  /* Sub-nav: collapsed by default; reveals on hover/focus of the item or when active */
  .nav-subnav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 0 0 var(--sp-4);
    padding-left: var(--sp-3);
    border-left: 2px solid var(--border);
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height var(--t-mid) var(--ease), opacity var(--t-mid) var(--ease),
      margin var(--t-mid) var(--ease);
  }
  .nav-item:hover .nav-subnav,
  .nav-item:focus-within .nav-subnav,
  .nav-subnav.is-open {
    max-height: 120px;
    opacity: 1;
    margin: 2px 0 2px var(--sp-4);
  }
  .subtab {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
    border-radius: 8px;
    font: inherit;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text-light);
    background: transparent;
    border: none;
    text-align: left;
    width: 100%;
    min-height: 38px;
    cursor: pointer;
    transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease),
      transform var(--t-fast) var(--ease);
  }
  .subtab .tab-icon { font-size: 1rem; }
  .subtab:hover { color: var(--accent-strong); background: var(--surface-2); transform: translateX(2px); }
  .subtab.is-active { color: var(--primary-strong); background: var(--primary-soft); box-shadow: inset 2px 0 0 var(--accent); }
  .subtab:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

  /* Sidebar footer: toggle floats far-left, credit centred full-width */
  .nav-footer {
    position: relative;
    padding: 0.9rem 0.8rem;
    border-top: 1px solid var(--border);
    color: var(--text-light);
    font-size: var(--fs-xs);
    line-height: 1.5;
  }
  .theme-toggle-btn {
    position: absolute;
    left: 0.4rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;                /* sit above the full-width footer text */
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    font: inherit;
    font-size: 1rem;
    cursor: pointer;
    background: transparent;
    color: var(--text-light);
    border: 1px solid var(--border);
    border-radius: 50%;
    transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
  }
  .theme-toggle-btn:hover { background: var(--primary-soft); transform: translateY(-50%) scale(1.1); }
  .theme-toggle-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  /* The centred credit text is non-interactive; let clicks fall through to the
     toggle button that sits beneath its left edge (it was swallowing them). */
  .footer-text { display: block; text-align: center; pointer-events: none; }
  .footer-brand { display: block; color: var(--primary); font-weight: 600; letter-spacing: 0.2px; }
  .footer-copy { display: block; opacity: 0.9; }
  .footer-rights { white-space: nowrap; }

  /* ---- Collapsed (icon rail) ---- */
  :global(html.nav-collapsed) .nav { align-items: stretch; }
  :global(html.nav-collapsed) .brand-text,
  :global(html.nav-collapsed) .tab-label,
  :global(html.nav-collapsed) .nav-subnav,
  :global(html.nav-collapsed) .footer-text { display: none; }
  :global(html.nav-collapsed) .brand { justify-content: center; padding: 1rem 0 0.6rem; }
  :global(html.nav-collapsed) .tab { justify-content: center; padding: 0.6rem 0; gap: 0; }
  :global(html.nav-collapsed) .tab-icon { width: auto; }
  :global(html.nav-collapsed) .nav-footer { display: flex; justify-content: center; padding: 0.8rem 0; }
  :global(html.nav-collapsed) .theme-toggle-btn { position: static; transform: none; }
  :global(html.nav-collapsed) .theme-toggle-btn:hover { transform: scale(1.1); }

  /* ---- Mobile: fixed bottom tab bar, tabs only, evenly spread ---- */
  @media (max-width: 719px) {
    .nav {
      position: fixed;
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      height: auto;
      flex-direction: row;
      border-right: none;
      border-top: 1px solid var(--glass-border);
      /* glass tab bar */
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(160%);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
      box-shadow: 0 -1px 0 var(--glass-border), 0 -6px 24px rgba(11, 79, 108, 0.12);
      z-index: 40;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .nav-collapse { display: none; }
    .brand { display: none; }
    .nav-footer { display: none; }
    .nav-subnav { display: none; }  /* sub-nav is the on-screen SegNav on mobile */
    .nav-list {
      flex-direction: row;
      padding: 0.25rem 0.15rem;
      gap: 0;
      width: 100%;
      overflow: visible;
    }
    .nav-item { flex: 1 1 0; min-width: 0; }
    .tab {
      flex-direction: column;
      gap: 0.15rem;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 0.5rem 0.25rem;
      min-height: 52px;
      border-radius: 10px;
    }
    .tab:hover { transform: none; box-shadow: none; }
    .tab-icon { width: auto; font-size: 1.15rem; }
    .tab-label { font-size: 0.66rem; line-height: 1.1; }
  }
</style>
