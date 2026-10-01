<script>
  // Trips list — hero + New trip, All/Domestic/International seg filter,
  // Domestic/International grouping with status-sorted cards.
  // Ported from the shipped renderTripsView().
  import { store } from "../lib/store.svelte.js";
  import { navigate, currentParams } from "../lib/router.svelte.js";
  import { isDomestic, tripStatus } from "../lib/dates.js";
  import SegNav from "../components/SegNav.svelte";
  import TripCard from "../components/TripCard.svelte";
  import NewTripModal from "../components/NewTripModal.svelte";

  const filter = $derived(
    ["all", "domestic", "international"].includes(currentParams().filter)
      ? currentParams().filter
      : "all"
  );

  const count = $derived(store.trips.length);
  const heroSub = $derived(
    count
      ? `${count} ${count === 1 ? "trip" : "trips"} planned. Pick one to keep planning, or start a new adventure.`
      : "Start your first trip and plan it day by day."
  );

  const sections = [
    { key: "all", label: "All" },
    { key: "domestic", label: "🏠 Domestic" },
    { key: "international", label: "✈️ International" },
  ];

  // Sort: in-progress/upcoming first (soonest start), completed last.
  const sorted = $derived(
    [...store.trips].sort((a, b) => {
      const sa = tripStatus(a).order, sb = tripStatus(b).order;
      if (sa !== sb) return sa - sb;
      return (a.startDate || "9999").localeCompare(b.startDate || "9999");
    })
  );
  const domestic = $derived(sorted.filter((t) => isDomestic(t)));
  const international = $derived(sorted.filter((t) => !isDomestic(t)));

  const showDomestic = $derived(filter !== "international" && domestic.length > 0);
  const showInternational = $derived(filter !== "domestic" && international.length > 0);
  const shownCount = $derived(
    (filter !== "international" ? domestic.length : 0) + (filter !== "domestic" ? international.length : 0)
  );

  let showNew = $state(false);

  function setFilter(key) {
    navigate("trips", { filter: key });
  }
</script>

<div class="hero hero-compact">
  <div class="hero-text">
    <h2>My plans</h2>
    <p>{heroSub}</p>
  </div>
  <button class="btn" type="button" title="Create a new trip" aria-label="Create a new trip" onclick={() => (showNew = true)}>
    <span aria-hidden="true">＋ </span>New trip
  </button>
</div>

{#if count === 0}
  <div class="state">
    <span class="state-icon" aria-hidden="true">🧳</span>
    <p>No trips yet. Create your first trip to start planning.</p>
  </div>
{:else}
  <SegNav items={sections} active={filter} onselect={setFilter} ariaLabel="Filter trips" />

  {#if showDomestic}
    <section class="trip-section" aria-label="Domestic">
      <div class="trip-section-head">
        <h3>🏠 Domestic</h3>
        <span class="meta">Within India · {domestic.length}</span>
      </div>
      <div class="card-grid">
        {#each domestic as trip (trip.id)}
          <TripCard {trip} />
        {/each}
      </div>
    </section>
  {/if}

  {#if showInternational}
    <section class="trip-section" aria-label="International">
      <div class="trip-section-head">
        <h3>✈️ International</h3>
        <span class="meta">Outside India · {international.length}</span>
      </div>
      <div class="card-grid">
        {#each international as trip (trip.id)}
          <TripCard {trip} />
        {/each}
      </div>
    </section>
  {/if}

  {#if shownCount === 0}
    <div class="state">
      <span class="state-icon" aria-hidden="true">🗺️</span>
      <p>{filter === "domestic" ? "No domestic trips yet." : "No international trips yet."}</p>
    </div>
  {/if}
{/if}

{#if showNew}
  <NewTripModal onclose={() => (showNew = false)} />
{/if}

<style>
  /* Tighter hero + shorter heading. On desktop it no longer stretches full
     width — it sizes to its content and leaves room on the right for the
     global location/home widget, which sits centred beside it. */
  .hero-compact {
    padding: var(--sp-3) var(--sp-5);
  }
  .hero-compact :global(h2) { font-size: 1.25rem; }

</style>

