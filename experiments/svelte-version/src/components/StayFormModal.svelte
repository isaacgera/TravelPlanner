<script>
  // Add/edit accommodation. Ported from openStayForm().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { tripId, stayId = null, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);
  const existing = stayId ? (trip?.stays || []).find((s) => s.id === stayId) : null;

  let name = $state(existing?.name ?? "");
  let city = $state(existing?.city ?? "");
  let checkIn = $state(existing?.checkIn ?? "");
  let checkOut = $state(existing?.checkOut ?? "");
  let notes = $state(existing?.notes ?? "");

  function save(e) {
    e.preventDefault();
    const rec = {
      name: name.trim(), city: city.trim(), checkIn, checkOut, notes: notes.trim(),
    };
    if (!rec.name) {
      announce("Give the stay a name.", true);
      return;
    }
    if (rec.checkIn && rec.checkOut && rec.checkOut < rec.checkIn) {
      announce("Check-out can't be before check-in.", true);
      return;
    }
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      if (!Array.isArray(t.stays)) t.stays = [];
      if (existing) Object.assign(t.stays.find((x) => x.id === stayId), rec);
      else t.stays.push({ id: uid("stay"), ...rec });
    });
    onclose?.();
  }
</script>

<Modal title={existing ? "Edit accommodation" : "Add accommodation"} {onclose}>
  <form class="stack" onsubmit={save}>
    <div class="field">
      <label for="st-name">Name (e.g. Village Hotel Bugis)</label>
      <input id="st-name" type="text" bind:value={name} autocomplete="off" />
    </div>
    <div class="field">
      <label for="st-city">City</label>
      <input id="st-city" type="text" bind:value={city} autocomplete="off" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="st-in">Check-in</label>
        <input id="st-in" type="date" bind:value={checkIn} />
      </div>
      <div class="field">
        <label for="st-out">Check-out</label>
        <input id="st-out" type="date" bind:value={checkOut} />
      </div>
    </div>
    <div class="field">
      <label for="st-notes">Notes</label>
      <input id="st-notes" type="text" bind:value={notes} autocomplete="off" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">{existing ? "Save" : "Add stay"}</button>
    </div>
  </form>
</Modal>
