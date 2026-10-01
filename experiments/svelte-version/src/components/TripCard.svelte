<script>
  // A single trip card — entity-card style with status badge + chips.
  // Ported from the shipped tripCard().
  import { navigate } from "../lib/router.svelte.js";
  import { fmtRange, tripStatus } from "../lib/dates.js";

  let { trip } = $props();

  const status = $derived(tripStatus(trip));

  const cities = $derived(trip.places.map((p) => p.name).filter(Boolean));
  const country = $derived((trip.country?.name || "").trim());

  const locationText = $derived.by(() => {
    if (!cities.length) return country || "No destination set";
    const cityText = cities.join(", ");
    const onlyCityIsCountry =
      cities.length === 1 && cities[0].toLowerCase() === country.toLowerCase();
    return country && !onlyCityIsCountry ? `${country} · ${cityText}` : cityText;
  });

  const packed = $derived.by(() => {
    let total = 0, done = 0;
    (trip.packing || []).forEach((c) => c.items.forEach((i) => { total++; if (i.packed) done++; }));
    return { total, done };
  });

  function open() {
    navigate("trip", { id: trip.id });
  }
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }
</script>

<div
  class="card entity-card"
  class:is-completed={status.key === "completed"}
  role="button"
  tabindex="0"
  aria-label={`Open trip: ${trip.name || "Untitled trip"} (${status.label})`}
  title={`Open ${trip.name || "this trip"}`}
  onclick={open}
  onkeydown={onKey}
>
  <div class="entity-head">
    <h3 class="entity-title" style="margin:0">{trip.name || "Untitled trip"}</h3>
    <span class="status-badge {status.cls}">{status.label}</span>
  </div>
  <p class="meta" style="margin-top:.35rem">{locationText}</p>
  <p class="meta" style="margin:.15rem 0 0">{fmtRange(trip.startDate, trip.endDate)}</p>
  <div class="chips">
    {#if trip.travellers.length}
      <span class="chip">👥 {trip.travellers.length}</span>
    {/if}
    {#if cities.length}
      <span class="chip">📍 {cities.length} {cities.length === 1 ? "city" : "cities"}</span>
    {/if}
    {#if packed.total}
      <span class="chip chip-primary">🧳 {packed.done}/{packed.total} packed</span>
    {/if}
  </div>
</div>

<style>
  .chips {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
