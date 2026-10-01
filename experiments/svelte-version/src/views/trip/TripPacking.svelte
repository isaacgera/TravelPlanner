<script>
  // Trip → Packing: categorised checklist + save/apply preset.
  // Ported from renderPacking().
  import { store, update, uid, DEFAULT_CATEGORIES } from "../../lib/store.svelte.js";
  import SavePresetModal from "../../components/SavePresetModal.svelte";
  import ApplyPresetModal from "../../components/ApplyPresetModal.svelte";

  let { trip } = $props();

  let newItemLabel = $state({});
  let newItemQty = $state({});
  let newCategory = $state("");
  let showSave = $state(false);
  let showApply = $state(false);

  function seedDefaults() {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.packing = DEFAULT_CATEGORIES.map((category) => ({ category, items: [] }));
    });
  }

  function togglePacked(itemId, checked) {
    update((d) => {
      d.trips.find((x) => x.id === trip.id).packing.forEach((c) =>
        c.items.forEach((i) => { if (i.id === itemId) i.packed = checked; })
      );
    });
  }
  function removeItem(itemId) {
    update((d) => {
      d.trips.find((x) => x.id === trip.id).packing.forEach((c) => {
        c.items = c.items.filter((i) => i.id !== itemId);
      });
    });
  }
  function addItem(cat, e) {
    e.preventDefault();
    const label = (newItemLabel[cat.category] || "").trim();
    if (!label) return;
    const qty = Math.max(1, parseInt(newItemQty[cat.category], 10) || 1);
    update((d) => {
      const c = d.trips.find((x) => x.id === trip.id).packing.find((c) => c.category === cat.category);
      if (c) c.items.push({ id: uid("item"), label, qty, packed: false });
    });
    newItemLabel[cat.category] = "";
    newItemQty[cat.category] = 1;
  }
  function addCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      if (!t.packing.some((c) => c.category.toLowerCase() === name.toLowerCase())) {
        t.packing.push({ category: name, items: [] });
      }
    });
    newCategory = "";
  }

  function packedInCat(cat) {
    return cat.items.filter((i) => i.packed).length;
  }
</script>

{#if !trip.packing.length}
  <div class="tools">
    <button class="btn btn-sm btn-primary" type="button" onclick={seedDefaults}>Start a blank list (defaults)</button>
    <button class="btn btn-sm" type="button" onclick={() => (showApply = true)}>Start from a preset</button>
  </div>
  <div class="state">
    <span class="state-icon" aria-hidden="true">🧳</span>
    <p>No packing list yet. Start blank with default categories, or from a saved preset.</p>
  </div>
{:else}
  <div class="tools">
    <button class="btn btn-sm" type="button" onclick={() => (showSave = true)}>Save as preset</button>
    <button class="btn btn-sm" type="button" onclick={() => (showApply = true)}>Replace from preset</button>
  </div>

  {#each trip.packing as cat (cat.category)}
    <div class="card">
      <div class="card-head">
        <h3 style="margin:0">{cat.category}</h3>
        <span class="chip chip-primary">{packedInCat(cat)}/{cat.items.length}</span>
      </div>
      {#each cat.items as item (item.id)}
        <div class="pack-row">
          <input type="checkbox" id={`item-${item.id}`} class="check" checked={item.packed} onchange={(e) => togglePacked(item.id, e.target.checked)} />
          <label for={`item-${item.id}`} class="packed-label" class:packed-done={item.packed}>
            {item.label}{item.qty > 1 ? `  ×${item.qty}` : ""}
          </label>
          <button class="icon-btn-sm" type="button" aria-label={`Remove ${item.label}`} title={`Remove ${item.label}`} onclick={() => removeItem(item.id)}>×</button>
        </div>
      {/each}
      <form class="inline-form" onsubmit={(e) => addItem(cat, e)}>
        <input type="text" bind:value={newItemLabel[cat.category]} placeholder="Add item" aria-label={`Add item to ${cat.category}`} autocomplete="off" style="flex:1" />
        <input type="number" bind:value={newItemQty[cat.category]} min="1" placeholder="1" aria-label="Quantity" style="max-width:70px" />
        <button class="btn btn-sm" type="submit">Add</button>
      </form>
    </div>
  {/each}

  <form class="inline-form" onsubmit={addCategory}>
    <input type="text" bind:value={newCategory} placeholder="Add a category" aria-label="New category name" autocomplete="off" style="flex:1" />
    <button class="btn btn-sm" type="submit">Add category</button>
  </form>
{/if}

{#if showSave}
  <SavePresetModal tripId={trip.id} onclose={() => (showSave = false)} />
{/if}
{#if showApply}
  <ApplyPresetModal tripId={trip.id} onclose={() => (showApply = false)} />
{/if}

<style>
  .tools { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .pack-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0;
    border-top: 1px solid var(--border);
  }
</style>
