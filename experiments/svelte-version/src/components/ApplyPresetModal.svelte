<script>
  // Apply a preset to a trip (replaces the packing list). Ported from openApplyTemplate().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { tripId, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);

  function apply(tpl) {
    if (trip.packing.length) {
      if (!window.confirm(`This replaces the current packing list with the "${tpl.name}" preset.`)) return;
    }
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      t.packing = tpl.categories.map((c) => ({
        category: c.category,
        items: c.items.map((i) => ({ id: uid("item"), label: i.label, qty: i.qty || 1, packed: false })),
      }));
    });
    announce(`Applied "${tpl.name}" preset.`);
    onclose?.();
  }

  function itemCount(tpl) {
    return tpl.categories.reduce((n, c) => n + c.items.length, 0);
  }
</script>

<Modal title="Start from a preset" {onclose}>
  <div class="stack">
    {#if !store.templates.length}
      <p class="meta">No presets saved yet. Build one in Presets → Packing.</p>
    {:else}
      {#each store.templates as tpl (tpl.id)}
        <button class="btn btn-block" type="button" style="justify-content:flex-start;text-align:left" onclick={() => apply(tpl)}>
          {tpl.name} — {itemCount(tpl)} items
        </button>
      {/each}
    {/if}
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
    </div>
  </div>
</Modal>
