<script>
  // New-trip modal. Ported from the shipped openNewTrip().
  import { update, uid } from "../lib/store.svelte.js";
  import { navigate, announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { onclose } = $props();

  let name = $state("");
  let country = $state("");
  let start = $state("");
  let end = $state("");

  function create(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (start && end && end < start) {
      announce("End date can't be before the start date.", true);
      return;
    }
    const trip = {
      id: uid("trip"),
      name: trimmed,
      notes: "",
      country: { name: country.trim(), code: "" },
      places: [],
      startDate: start,
      endDate: end,
      travellers: [],
      itinerary: [],
      packing: [],
      flights: [],
      stays: [],
      attachments: [],
    };
    update((d) => d.trips.push(trip));
    announce("Trip created.");
    onclose?.();
    navigate("trip", { id: trip.id });
  }
</script>

<Modal title="New trip" {onclose}>
  <form class="stack" onsubmit={create}>
    <div class="field">
      <label for="nt-name">Trip name</label>
      <input id="nt-name" type="text" bind:value={name} required placeholder="e.g. Summer in Italy" autocomplete="off" />
    </div>
    <div class="field">
      <label for="nt-country">Destination country</label>
      <input id="nt-country" type="text" bind:value={country} placeholder="e.g. Italy" autocomplete="off" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="nt-start">Start date</label>
        <input id="nt-start" type="date" bind:value={start} />
      </div>
      <div class="field">
        <label for="nt-end">End date</label>
        <input id="nt-end" type="date" bind:value={end} />
      </div>
    </div>
    <p class="field-hint">Tip: click a date field to open the calendar picker.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">Create trip</button>
    </div>
  </form>
</Modal>
