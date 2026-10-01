<script>
  // Add a city via Open-Meteo geocoding (debounced live search).
  // Ported from openAddCity()/addPlace().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import { geocode } from "../lib/weather.js";
  import Modal from "./Modal.svelte";

  let { tripId, onclose } = $props();

  const trip = store.trips.find((t) => t.id === tripId);

  let query = $state("");
  let matches = $state([]);
  let searching = $state(false);
  let error = $state("");
  let timer;

  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 350);
  }

  async function runSearch() {
    const q = query.trim();
    matches = [];
    error = "";
    if (q.length < 2) return;
    searching = true;
    try {
      matches = await geocode(q, trip?.country?.code || "");
    } catch {
      error = "Couldn't reach the location service. Check your connection.";
    } finally {
      searching = false;
    }
  }

  function pick(m) {
    const place = {
      id: uid("place"),
      query: m.name,
      name: m.name,
      lat: m.lat,
      lon: m.lon,
      admin: m.admin,
      country: m.country,
      weatherCache: null,
    };
    update((d) => {
      const t = d.trips.find((x) => x.id === tripId);
      t.places.push(place);
      // adopt the country from the first city if not set
      if (!t.country?.name && m.country) t.country = { name: m.country, code: m.countryCode || "" };
      else if (m.countryCode && t.country && !t.country.code) t.country.code = m.countryCode;
    });
    announce(`${m.name} added.`);
    onclose?.();
  }
</script>

<Modal title="Add a city" {onclose}>
  <form class="stack" onsubmit={(e) => { e.preventDefault(); clearTimeout(timer); runSearch(); }}>
    <div class="field">
      <label for="city-q">City name</label>
      <input id="city-q" type="search" bind:value={query} oninput={onInput} placeholder="Search a city" aria-label="City search" autocomplete="off" />
    </div>
    <div class="stack" aria-live="polite">
      {#if searching}
        <p class="meta">Searching…</p>
      {:else if error}
        <p class="meta state-error">{error}</p>
      {:else if query.trim().length >= 2 && matches.length === 0}
        <p class="meta">No matches found.</p>
      {:else}
        {#each matches as m (m.name + m.lat + m.lon)}
          <button class="btn btn-block" type="button" style="justify-content:flex-start;text-align:left" onclick={() => pick(m)}>
            {m.name} — {[m.admin, m.country].filter(Boolean).join(", ")}
          </button>
        {/each}
      {/if}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Close</button>
    </div>
  </form>
</Modal>
