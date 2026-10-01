<script>
  // Mobile-only top bar: brand + theme toggle. Hidden on desktop (the sidebar
  // carries both there). Matches the shipped app, where the mobile theme toggle
  // lives up top and the bottom bar is tabs only.
  import { appearance, toggleTheme } from "../lib/theme.svelte.js";

  const themeIcon = $derived(appearance.theme === "dark" ? "\u263D" : "\u2600");
  const themeLabel = $derived(
    appearance.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
</script>

<header class="topbar no-print">
  <div class="topbar-title">
    <span class="topbar-mark" aria-hidden="true">✈️</span>
    <span class="topbar-name">Travel Planner</span>
  </div>
  <button
    class="topbar-toggle"
    onclick={toggleTheme}
    aria-pressed={appearance.theme === "dark"}
    aria-label={themeLabel}
    title={themeLabel}
  >
    <span aria-hidden="true">{themeIcon}</span>
  </button>
</header>

<style>
  .topbar {
    display: none; /* desktop: hidden */
  }

  @media (max-width: 719px) {
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 30;
      /* glass top bar */
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(160%);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
      border-bottom: 1px solid var(--glass-border);
      box-shadow: var(--glass-hi);
      padding: 0.6rem 1rem;
      /* respect iOS notch */
      padding-top: max(0.6rem, env(safe-area-inset-top, 0));
    }
    .topbar-title {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--primary);
      font-weight: 700;
    }
    .topbar-mark { font-size: 1.15rem; }
    .topbar-name { font-size: 1rem; }
    .topbar-toggle {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      font-size: 1.05rem;
      cursor: pointer;
      background: transparent;
      color: var(--text-light);
      border: 1px solid var(--border);
      border-radius: 50%;
    }
    .topbar-toggle:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 2px;
    }
  }
</style>
