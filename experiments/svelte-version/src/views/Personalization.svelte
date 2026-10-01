<script>
  // Personalization view — matches the shipped app:
  //   Appearance / Data seg switcher, three-dot palette swatches (11 presets +
  //   Custom), a custom-colour modal with a contrast warning, and an in-view
  //   light/dark toggle. Data section: export / import backup.
  import { navigate, announce, currentParams } from "../lib/router.svelte.js";
  import {
    PALETTES,
    appearance,
    setPalette,
    setCustom,
    toggleTheme,
    whiteContrastOK,
  } from "../lib/theme.svelte.js";
  import { exportData, parseImport, replaceAll } from "../lib/store.svelte.js";
  import SegNav from "../components/SegNav.svelte";
  import Modal from "../components/Modal.svelte";

  const sections = [
    { key: "appearance", label: "\u{1F3A8} Appearance" },
    { key: "data", label: "\u{1F4BE} Data" },
  ];

  const section = $derived(
    ["appearance", "data"].includes(currentParams().section)
      ? currentParams().section
      : "appearance"
  );

  const isDark = $derived(appearance.theme === "dark");

  // Custom palette modal state
  let showCustom = $state(false);
  let customPrimary = $state(appearance.custom.primary);
  let customAccent = $state(appearance.custom.accent);
  const primaryTooLight = $derived(!whiteContrastOK(customPrimary));

  let fileInput;

  function selectSection(key) {
    navigate("personalization", { section: key });
  }

  function applyPreset(p) {
    setPalette(p.id);
    announce(`${p.name} theme applied.`);
  }

  function openCustom() {
    customPrimary = appearance.custom.primary;
    customAccent = appearance.custom.accent;
    showCustom = true;
  }

  function applyCustom() {
    setCustom(customPrimary, customAccent);
    announce("Custom theme applied.");
    showCustom = false;
  }

  function onExport() {
    exportData();
    announce("Backup exported.");
  }

  async function onImportChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = parseImport(text);
    if (!result.ok) {
      announce(result.error, true);
      return;
    }
    const ok = window.confirm(
      `This backup has ${result.summary.trips} trip(s) and ${result.summary.templates} preset(s). Importing replaces everything currently in the app. This can't be undone.`
    );
    if (!ok) return;
    replaceAll(result.data);
    announce("Backup imported.");
    navigate("trips", { filter: "all" });
  }
</script>

<div class="view-head"><h2>Personalization</h2></div>

<SegNav items={sections} active={section} onselect={selectSection} ariaLabel="Personalization sections" />

{#if section === "appearance"}
  <div class="card">
    <h3>Appearance</h3>
    <p class="meta">Pick a colour theme. Works with light and dark mode.</p>

    <div class="palette-grid">
      {#each PALETTES as p (p.id)}
        <button
          class="palette-swatch"
          class:is-active={appearance.paletteId === p.id}
          type="button"
          aria-pressed={appearance.paletteId === p.id}
          aria-label={`Use ${p.name} theme`}
          title={`${p.name} theme`}
          onclick={() => applyPreset(p)}
        >
          {#if appearance.paletteId === p.id}
            <span class="palette-check" aria-hidden="true">✓</span>
          {/if}
          <span class="palette-dots" aria-hidden="true">
            <span class="palette-dot" style="background:{p.primary}"></span>
            <span class="palette-dot" style="background:{p.accent}"></span>
          </span>
          <span class="palette-name">{p.name}</span>
        </button>
      {/each}

      <!-- Custom swatch: opens the colour-picker modal -->
      <button
        class="palette-swatch"
        class:is-active={appearance.paletteId === "custom"}
        type="button"
        aria-pressed={appearance.paletteId === "custom"}
        aria-label="Create a custom theme"
        title="Custom theme"
        onclick={openCustom}
      >
        {#if appearance.paletteId === "custom"}
          <span class="palette-check" aria-hidden="true">✓</span>
        {/if}
        <span class="palette-dots" aria-hidden="true">
          <span class="palette-dot" style="background:{appearance.custom.primary}"></span>
          <span class="palette-dot" style="background:{appearance.custom.accent}"></span>
        </span>
        <span class="palette-name">Custom</span>
      </button>
    </div>

    <div class="theme-row">
      <button class="btn" type="button" aria-pressed={isDark} onclick={toggleTheme}>
        <span aria-hidden="true">{isDark ? "☀ " : "☾ "}</span>
        {isDark ? "Switch to light theme" : "Switch to dark theme"}
      </button>
    </div>
  </div>
{:else}
  <div class="card">
    <h3>Data</h3>
    <p class="meta">
      Everything is stored on this device — no accounts, no tracking. Export a JSON copy to
      keep it safe or move it to another device; importing replaces the current data (you'll
      be asked to confirm).
    </p>
    <div class="data-actions">
      <button class="btn btn-primary" type="button" onclick={onExport}>
        <span aria-hidden="true">⮃ </span>Export backup
      </button>
      <button class="btn" type="button" onclick={() => fileInput.click()}>
        <span aria-hidden="true">⮁ </span>Import backup
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onchange={onImportChange}
      />
    </div>
  </div>
{/if}

{#if showCustom}
  <Modal title="Custom theme" onclose={() => (showCustom = false)}>
    <form class="stack" onsubmit={(e) => { e.preventDefault(); applyCustom(); }}>
      <p class="meta">
        Choose a primary and accent colour. Lighter/darker shades are derived automatically.
      </p>
      <div class="field-row">
        <div class="field">
          <label for="cp">Primary</label>
          <input id="cp" type="color" bind:value={customPrimary} aria-label="Primary colour" />
        </div>
        <div class="field">
          <label for="ca">Accent</label>
          <input id="ca" type="color" bind:value={customAccent} aria-label="Accent colour" />
        </div>
      </div>
      <p class="field-hint" aria-live="polite">
        {#if primaryTooLight}
          Note: this primary is quite light — it'll be darkened automatically so white text
          stays readable.
        {/if}
      </p>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" onclick={() => (showCustom = false)}>Cancel</button>
        <button class="btn btn-primary" type="submit">Apply custom theme</button>
      </div>
    </form>
  </Modal>
{/if}

<style>
  .theme-row {
    margin-top: var(--sp-4);
    padding-top: var(--sp-4);
    border-top: 1px solid var(--border);
  }
  .data-actions {
    display: flex;
    gap: var(--sp-2);
    flex-wrap: wrap;
    margin-top: var(--sp-2);
  }
  input[type="color"] {
    height: 44px;
    padding: 4px;
    cursor: pointer;
  }
</style>
