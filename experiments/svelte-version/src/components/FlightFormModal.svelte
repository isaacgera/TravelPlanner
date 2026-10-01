<script>
  // Add/edit a flight leg. Ported from openFlightForm().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { tripId, flightId = null, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);
  const existing = flightId ? (trip?.flights || []).find((f) => f.id === flightId) : null;

  let label = $state(existing?.label ?? "");
  let flightNo = $state(existing?.flightNo ?? "");
  let from = $state(existing?.from ?? "");
  let to = $state(existing?.to ?? "");
  let date = $state(existing?.date ?? "");
  let depTime = $state(existing?.depTime ?? "");
  let arrTime = $state(existing?.arrTime ?? "");

  function save(e) {
    e.preventDefault();
    const rec = {
      label: label.trim(), flightNo: flightNo.trim(), from: from.trim(),
      to: to.trim(), date, depTime, arrTime,
    };
    if (!rec.label && !rec.flightNo && !rec.from && !rec.to) {
      announce("Add at least a label or route.", true);
      return;
    }
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      if (!Array.isArray(t.flights)) t.flights = [];
      if (existing) Object.assign(t.flights.find((x) => x.id === flightId), rec);
      else t.flights.push({ id: uid("flt"), ...rec });
    });
    onclose?.();
  }
</script>

<Modal title={existing ? "Edit flight" : "Add flight"} {onclose}>
  <form class="stack" onsubmit={save}>
    <div class="field">
      <label for="fl-label">Label (e.g. Outbound, Return)</label>
      <input id="fl-label" type="text" bind:value={label} autocomplete="off" />
    </div>
    <div class="field">
      <label for="fl-no">Flight number (e.g. 6E-1027)</label>
      <input id="fl-no" type="text" bind:value={flightNo} autocomplete="off" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="fl-from">From</label>
        <input id="fl-from" type="text" bind:value={from} autocomplete="off" />
      </div>
      <div class="field">
        <label for="fl-to">To</label>
        <input id="fl-to" type="text" bind:value={to} autocomplete="off" />
      </div>
    </div>
    <div class="field">
      <label for="fl-date">Date</label>
      <input id="fl-date" type="date" bind:value={date} />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="fl-dep">Departure time</label>
        <input id="fl-dep" type="time" bind:value={depTime} />
      </div>
      <div class="field">
        <label for="fl-arr">Arrival time</label>
        <input id="fl-arr" type="time" bind:value={arrTime} />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">{existing ? "Save" : "Add flight"}</button>
    </div>
  </form>
</Modal>
