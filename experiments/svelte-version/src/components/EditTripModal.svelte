<script>
  // Edit an existing trip's name/country/dates. Ported from openEditTrip().
  import { store, update } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { tripId, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);

  let name = $state(trip?.name ?? "");
  let country = $state(trip?.country?.name ?? "");
  let start = $state(trip?.startDate ?? "");
  let end = $state(trip?.endDate ?? "");

  function save(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (start && end && end < start) {
      announce("End date can't be before the start date.", true);
      return;
    }
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      if (!t) return;
      t.name = trimmed;
      t.country = { name: country.trim(), code: t.country?.code || "" };
      t.startDate = start;
      t.endDate = end;
    });
    onclose?.();
  }
</script>

<Modal title="Edit trip" {onclose}>
  <form class="stack" onsubmit={save}>
    <div class="field">
      <label for="et-name">Trip name</label>
      <input id="et-name" type="text" bind:value={name} required autocomplete="off" />
    </div>
    <div class="field">
      <label for="et-country">Destination country</label>
      <input id="et-country" type="text" bind:value={country} autocomplete="off" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="et-start">Start date</label>
        <input id="et-start" type="date" bind:value={start} />
      </div>
      <div class="field">
        <label for="et-end">End date</label>
        <input id="et-end" type="date" bind:value={end} />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">Save</button>
    </div>
  </form>
</Modal>
