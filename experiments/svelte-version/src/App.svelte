<script>
  // App shell: responsive sidebar/tab-bar layout, routed views, aria-live
  // status region, and the Forjé footer. Route + appearance are reactive
  // modules, so the shell renders declaratively from state.
  import { onMount } from "svelte";
  import { route, status, preview, initNavCollapsed } from "./lib/router.svelte.js";
  import { initAppearance } from "./lib/theme.svelte.js";
  import Nav from "./components/Nav.svelte";
  import TopBar from "./components/TopBar.svelte";
  import Footer from "./components/Footer.svelte";
  import LocationBar from "./components/LocationBar.svelte";
  import Trips from "./views/Trips.svelte";
  import TripDetail from "./views/TripDetail.svelte";
  import Presets from "./views/Presets.svelte";
  import Personalization from "./views/Personalization.svelte";
  import About from "./views/About.svelte";

  onMount(() => {
    initAppearance();
    initNavCollapsed();
  });

  // Effective view: hover-preview takes over unless a trip is open (matches
  // the shipped previewNav — hovering nav never blows away an open trip).
  const viewName = $derived(
    preview.name && route.name !== "trip" ? preview.name : route.name
  );
</script>

<div class="app-shell">
  <Nav />

  <div class="content-col">
    <TopBar />
    <main id="main" class="main" tabindex="-1">
      <h1 class="visually-hidden">Travel Planner (Svelte experiment)</h1>
      <div class="page-top no-print">
        <span class="proto-badge">Svelte experiment · v0.1.0-proto</span>
        <LocationBar />
      </div>

      {#if viewName === "trip"}
        <TripDetail tripId={route.params.id} />
      {:else if viewName === "trips"}
        <Trips />
      {:else if viewName === "templates"}
        <Presets />
      {:else if viewName === "personalization"}
        <Personalization />
      {:else if viewName === "about"}
        <About />
      {:else}
        <Trips />
      {/if}
    </main>

    <Footer />
  </div>

  <!-- Screen-reader + on-screen status announcements -->
  <div class="status-region" class:is-error={status.error} aria-live="polite" role="status">
    {#if status.message}<span>{status.message}</span>{/if}
  </div>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    /* 200px matches the shipped app's --sidebar-w (narrower than 240 so the
       footer copyright wraps the same way). Collapses to a 68px icon rail. */
    grid-template-columns: 200px 1fr;
    transition: grid-template-columns var(--t-mid) var(--ease);
  }
  :global(html.nav-collapsed) .app-shell {
    grid-template-columns: 68px 1fr;
  }
  .content-col {
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }
  /* Top row on every page: proto badge on the left, location + home widget on
     the right. Flows in the layout (not floating), so it always reads as one
     tidy row above the page content. */
  .page-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    margin-bottom: var(--sp-4);
  }
  .main {
    flex: 1;
    /* match shipped: wider content + more generous padding */
    max-width: 1040px;
    width: 100%;
    margin: 0 auto;
    padding: var(--sp-5) var(--sp-6);
    outline: none;
    transition: max-width var(--t-mid) var(--ease);
  }
  /* When the sidebar is collapsed, reclaim width + zoom the UI a notch. */
  :global(html.nav-collapsed) .main { max-width: 1180px; }
  .proto-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--primary);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 10px;
    flex: none;
  }

  .status-region {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary-strong, var(--primary));
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    box-shadow: var(--shadow);
    font-size: 0.85rem;
    z-index: 60;
    max-width: 90vw;
  }
  .status-region:empty { display: none; }
  .status-region.is-error { background: #b02a3a; }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ---- Mobile: single column block flow (Nav is fixed, out of flow) ---- */
  @media (max-width: 719px) {
    .app-shell {
      display: block;      /* drop grid so the fixed Nav can't reserve a track */
    }
    .main {
      max-width: none;
      /* clear the fixed footer strip (~1.8rem) + bottom tab bar (~62px) + safe area */
      padding-bottom: calc(62px + 2.5rem + env(safe-area-inset-bottom, 0px));
    }
  }
</style>
