<script>
  // Trip detail container: header + sub-nav (Plan / Trip days / Packing /
  // Itinerary) + the active sub-section. Ported from renderTripDetail().
  import { store } from "../lib/store.svelte.js";
  import { navigate } from "../lib/router.svelte.js";
  import { fmtRange } from "../lib/dates.js";
  import EditTripModal from "../components/EditTripModal.svelte";
  import TripPlan from "./trip/TripPlan.svelte";
  import TripDays from "./trip/TripDays.svelte";
  import TripPacking from "./trip/TripPacking.svelte";
  import TripSummary from "./trip/TripSummary.svelte";

  let { tripId } = $props();

  const trip = $derived(store.trips.find((t) => t.id === tripId));

  const sections = [
    { key: "overview", label: "Plan" },
    { key: "days", label: "Trip days" },
    { key: "packing", label: "Packing" },
    { key: "summary", label: "Itinerary" },
  ];

  let active = $state("overview");
  let showEdit = $state(false);
</script>

{#if !trip}
  <div class="state">
    <span class="state-icon" aria-hidden="true">❓</span>
    <p>That trip couldn't be found.</p>
  </div>
  <button class="btn" type="button" onclick={() => navigate("trips", { filter: "all" })}>Back to trips</button>
{:else}
  <button class="back-link" type="button" onclick={() => navigate("trips", { filter: "all" })}>
    <span aria-hidden="true">← </span>All trips
  </button>

  <div class="view-head" style="display:flex;align-items:center;gap:.6rem;justify-content:space-between">
    <h2 style="margin:0">{trip.name || "Untitled trip"}</h2>
    <button class="btn btn-sm" type="button" onclick={() => (showEdit = true)}>Edit</button>
  </div>
  <p class="meta">{trip.country?.name ? trip.country.name + " · " : ""}{fmtRange(trip.startDate, trip.endDate)}</p>

  <div class="subnav" role="group" aria-label="Trip sections">
    {#each sections as s (s.key)}
      <button
        class="btn btn-sm"
        class:btn-primary={active === s.key}
        type="button"
        aria-pressed={active === s.key}
        onclick={() => (active = s.key)}
      >
        {s.label}
      </button>
    {/each}
  </div>

  {#if active === "overview"}
    <TripPlan {trip} />
  {:else if active === "days"}
    <TripDays {trip} />
  {:else if active === "packing"}
    <TripPacking {trip} />
  {:else}
    <TripSummary {trip} />
  {/if}

  {#if showEdit}
    <EditTripModal {tripId} onclose={() => (showEdit = false)} />
  {/if}
{/if}
