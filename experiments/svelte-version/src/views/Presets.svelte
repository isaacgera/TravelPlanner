<script>
  // Presets view — Travellers (master list) + Packing presets, with an
  // All/Travellers/Packing seg switcher. Ported from renderTemplatesView().
  import { store, update } from "../lib/store.svelte.js";
  import { navigate, announce, currentParams } from "../lib/router.svelte.js";
  import { fmtDate, ageFromBirthday } from "../lib/dates.js";
  import SegNav from "../components/SegNav.svelte";
  import PersonFormModal from "../components/PersonFormModal.svelte";
  import PresetBuilderModal from "../components/PresetBuilderModal.svelte";

  const section = $derived(
    ["all", "people", "packing"].includes(currentParams().section)
      ? currentParams().section
      : "all"
  );

  const sections = [
    { key: "all", label: "All" },
    { key: "people", label: "👥 Travellers" },
    { key: "packing", label: "🧳 Packing" },
  ];

  // Modal state
  let personModal = $state(null); // { id } | { id: null } | null
  let presetModal = $state(null); // { id } | { id: null } | null

  function selectSection(key) {
    navigate("templates", { section: key });
  }

  function personDetail(p) {
    const bits = [];
    const age = ageFromBirthday(p.birthday);
    if (age != null) bits.push(`${age} yrs`);
    else if (p.ageText) bits.push(p.ageText);
    if (p.gender) bits.push(p.gender);
    if (p.birthday) bits.push(`🎂 ${fmtDate(p.birthday, { day: "numeric", month: "short" })}`);
    return bits.join(" · ") || "No details added";
  }

  function removePerson(p) {
    if (!window.confirm(`Remove ${p.name} from your Travellers list? Trips they're already on keep them.`)) return;
    update((d) => { d.people = (d.people || []).filter((x) => x.id !== p.id); });
    announce(`${p.name} removed from Travellers.`);
  }

  function presetItemCount(tpl) {
    return tpl.categories.reduce((n, c) => n + c.items.length, 0);
  }

  function removePreset(tpl) {
    if (!window.confirm(`Delete the "${tpl.name}" preset?`)) return;
    update((d) => { d.templates = d.templates.filter((x) => x.id !== tpl.id); });
    announce("Preset deleted.");
  }
</script>

<div class="view-head"><h2>Presets</h2></div>

<SegNav items={sections} active={section} onselect={selectSection} ariaLabel="Preset sections" />

{#if section !== "packing"}
  <div class="section-head" style="margin-top:.5rem">
    <h3 style="margin:0">Travellers</h3>
    <button class="add-pill" type="button" aria-label="Add a traveller" title="Add a traveller" onclick={() => (personModal = { id: null })}>
      <span aria-hidden="true">Add </span><span class="add-pill-plus" aria-hidden="true">＋</span>
    </button>
  </div>
  <p class="meta">A reusable list of travellers you can quickly add to any trip.</p>

  {#if !store.people.length}
    <div class="state">
      <span class="state-icon" aria-hidden="true">👥</span>
      <p>No travellers yet. Add family and friends here to reuse across trips.</p>
    </div>
  {:else}
    <div class="card-grid">
      {#each store.people as p (p.id)}
        <div class="card entity-card">
          <div class="entity-head">
            <span class="person-avatar" aria-hidden="true">{(p.name.trim()[0] || "?").toUpperCase()}</span>
            <h3 class="entity-title" style="margin:0">{p.name}</h3>
            <span class="entity-actions">
              <button class="icon-btn-sm" type="button" aria-label={`Edit ${p.name}`} title={`Edit ${p.name}`} onclick={() => (personModal = { id: p.id })}>✎</button>
              <button class="icon-btn-sm icon-btn-danger" type="button" aria-label={`Remove ${p.name}`} title={`Remove ${p.name}`} onclick={() => removePerson(p)}>×</button>
            </span>
          </div>
          <p class="meta" style="margin:.35rem 0 0">{personDetail(p)}</p>
        </div>
      {/each}
    </div>
  {/if}
{/if}

{#if section !== "people"}
  <div class="section-head" style="margin-top:1.5rem">
    <h3 style="margin:0">Packing presets</h3>
    <button class="add-pill" type="button" aria-label="Create a packing preset" title="Create a packing preset" onclick={() => (presetModal = { id: null })}>
      <span aria-hidden="true">Add </span><span class="add-pill-plus" aria-hidden="true">＋</span>
    </button>
  </div>
  <p class="meta">
    Reusable packing lists you can apply to any trip. Create one here, or from a trip's packing
    list (Trip → Packing → Save as preset).
  </p>

  {#if !store.templates.length}
    <div class="state">
      <span class="state-icon" aria-hidden="true">📋</span>
      <p>No presets yet. Tap Add to build one.</p>
    </div>
  {:else}
    <div class="card-grid" style="margin-top:1rem">
      {#each store.templates as tpl (tpl.id)}
        <div class="card entity-card">
          <div class="entity-head">
            <span class="entity-icon" aria-hidden="true">🧳</span>
            <h3 class="entity-title" style="margin:0">{tpl.name}</h3>
            <span class="entity-actions">
              <button class="icon-btn-sm" type="button" aria-label={`Edit ${tpl.name}`} title={`Edit ${tpl.name}`} onclick={() => (presetModal = { id: tpl.id })}>✎</button>
              <button class="icon-btn-sm icon-btn-danger" type="button" aria-label={`Delete ${tpl.name}`} title={`Delete ${tpl.name}`} onclick={() => removePreset(tpl)}>×</button>
            </span>
          </div>
          <p class="meta" style="margin:.35rem 0 0">{tpl.categories.length} categories · {presetItemCount(tpl)} items</p>
          <p class="meta" style="margin:.15rem 0 0">{tpl.categories.map((c) => c.category).join(", ")}</p>
        </div>
      {/each}
    </div>
  {/if}
{/if}

{#if personModal}
  <PersonFormModal personId={personModal.id} onclose={() => (personModal = null)} />
{/if}
{#if presetModal}
  <PresetBuilderModal presetId={presetModal.id} onclose={() => (presetModal = null)} />
{/if}
