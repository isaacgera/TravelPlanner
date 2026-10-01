<script>
  // Save a trip's packing list as a reusable preset. Ported from openSaveTemplate().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { tripId, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);
  let name = $state("");

  function save(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!trip || !trip.packing.length) {
      announce("Nothing to save yet.", true);
      return;
    }
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      d.templates.push({
        id: uid("tpl"),
        name: trimmed,
        categories: t.packing.map((c) => ({
          category: c.category,
          items: c.items.map((i) => ({ label: i.label, qty: i.qty })),
        })),
      });
    });
    announce(`Saved "${trimmed}" preset.`);
    onclose?.();
  }
</script>

<Modal title="Save as preset" {onclose}>
  <form class="stack" onsubmit={save}>
    <p class="meta">
      Saves this trip's categories and item names as a reusable packing list you can apply to
      future trips.
    </p>
    <div class="field">
      <label for="sp-name">Preset name</label>
      <input id="sp-name" type="text" bind:value={name} required placeholder="e.g. Beach weekend" autocomplete="off" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">Save preset</button>
    </div>
  </form>
</Modal>
