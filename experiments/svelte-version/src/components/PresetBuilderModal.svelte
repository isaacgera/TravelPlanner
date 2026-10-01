<script>
  // Build/edit a packing preset from scratch (categories + items).
  // Ported from openPresetBuilder(). Svelte makes the draft reactive so the
  // whole "redraw on every add/remove" dance the vanilla version does by hand
  // is just state mutation here — a clear DX contrast worth noting.
  import { store, update, uid, DEFAULT_CATEGORIES } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { presetId = null, onclose } = $props();

  const existing = presetId ? store.templates.find((t) => t.id === presetId) : null;

  // Reactive working draft (deep copy so we don't mutate the store until save).
  let draftName = $state(existing?.name ?? "");
  let categories = $state(
    existing
      ? existing.categories.map((c) => ({ category: c.category, items: c.items.map((i) => ({ label: i.label, qty: i.qty || 1 })) }))
      : DEFAULT_CATEGORIES.map((category) => ({ category, items: [] }))
  );

  // Per-category new-item inputs, keyed by index.
  let newItemLabel = $state({});
  let newItemQty = $state({});
  let newCategory = $state("");

  function removeCategory(ci) {
    categories.splice(ci, 1);
  }
  function removeItem(ci, ii) {
    categories[ci].items.splice(ii, 1);
  }
  function addItem(ci, e) {
    e.preventDefault();
    const label = (newItemLabel[ci] || "").trim();
    if (!label) return;
    const qty = Math.max(1, parseInt(newItemQty[ci], 10) || 1);
    categories[ci].items.push({ label, qty });
    newItemLabel[ci] = "";
    newItemQty[ci] = 1;
  }
  function addCategory(e) {
    e.preventDefault();
    const nameC = newCategory.trim();
    if (!nameC) return;
    if (!categories.some((c) => c.category.toLowerCase() === nameC.toLowerCase())) {
      categories.push({ category: nameC, items: [] });
    }
    newCategory = "";
  }

  function save() {
    const name = draftName.trim();
    if (!name) {
      announce("Give the preset a name.", true);
      return;
    }
    const clean = categories
      .map((c) => ({ category: c.category, items: c.items.map((i) => ({ label: i.label, qty: i.qty || 1 })) }))
      .filter((c) => c.category);
    update((d) => {
      if (!Array.isArray(d.templates)) d.templates = [];
      if (existing) {
        const t = d.templates.find((x) => x.id === presetId);
        if (t) { t.name = name; t.categories = clean; }
      } else {
        d.templates.push({ id: uid("tpl"), name, categories: clean });
      }
    });
    announce(existing ? "Preset updated." : `Created "${name}" preset.`);
    onclose?.();
  }
</script>

<Modal title={existing ? "Edit packing preset" : "New packing preset"} {onclose}>
  <div class="stack">
    <div class="field">
      <label for="pb-name">Preset name</label>
      <input id="pb-name" type="text" bind:value={draftName} placeholder="Preset name (e.g. Beach weekend)" autocomplete="off" />
    </div>

    {#each categories as cat, ci (ci)}
      <div class="card" style="padding:.75rem">
        <div class="cat-head">
          <strong>{cat.category}</strong>
          <button class="icon-btn-sm icon-btn-danger" type="button" aria-label={`Remove category ${cat.category}`} title="Remove category" onclick={() => removeCategory(ci)}>×</button>
        </div>
        {#each cat.items as it, ii (ii)}
          <div class="cat-item">
            <span style="flex:1">{it.label}{it.qty > 1 ? `  ×${it.qty}` : ""}</span>
            <button class="icon-btn-sm" type="button" aria-label={`Remove ${it.label}`} title="Remove item" onclick={() => removeItem(ci, ii)}>×</button>
          </div>
        {/each}
        <form class="add-item" onsubmit={(e) => addItem(ci, e)}>
          <input type="text" bind:value={newItemLabel[ci]} placeholder="Add item" aria-label={`Add item to ${cat.category}`} autocomplete="off" style="flex:1" />
          <input type="number" bind:value={newItemQty[ci]} min="1" placeholder="1" aria-label="Quantity" style="max-width:64px" />
          <button class="btn btn-sm" type="submit">Add</button>
        </form>
      </div>
    {/each}

    <form class="add-cat" onsubmit={addCategory}>
      <input type="text" bind:value={newCategory} placeholder="Add a category" aria-label="New category" autocomplete="off" style="flex:1" />
      <button class="btn btn-sm" type="submit">Add category</button>
    </form>

    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="button" onclick={save}>{existing ? "Save changes" : "Create preset"}</button>
    </div>
  </div>
</Modal>

<style>
  .cat-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }
  .cat-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0;
  }
  .add-item,
  .add-cat {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.4rem;
  }
</style>
