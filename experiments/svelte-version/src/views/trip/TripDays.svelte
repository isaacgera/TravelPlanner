<script>
  // Trip → Trip days: combined day-by-day itinerary + per-city weather.
  // Ported from renderDays(). Weather via Open-Meteo (task #6).
  import { update } from "../../lib/store.svelte.js";
  import { announce } from "../../lib/router.svelte.js";
  import { fmtDate, dateList } from "../../lib/dates.js";
  import { fetchForecast, describeCode, FORECAST_HORIZON_DAYS } from "../../lib/weather.js";

  let { trip } = $props();

  const days = $derived(dateList(trip.startDate, trip.endDate));

  // New-entry inputs keyed by ISO date
  let newEntry = $state({});
  let refreshing = $state(false);

  const daysToStart = $derived.by(() => {
    if (!trip.startDate) return null;
    const target = new Date(trip.startDate + "T00:00:00");
    if (isNaN(target)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  });
  const anyCached = $derived(trip.places.some((p) => p.weatherCache?.daily?.length));

  function entryFor(iso) {
    return trip.itinerary.find((d) => d.date === iso)?.entries ?? [];
  }

  function weatherFor(place, iso) {
    const day = place.weatherCache?.daily?.find((d) => d.date === iso);
    if (!day) return null;
    return { ...day, ...describeCode(day.code) };
  }

  function addEntry(iso, e) {
    e.preventDefault();
    const val = (newEntry[iso] || "").trim();
    if (!val) return;
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      let day = t.itinerary.find((x) => x.date === iso);
      if (!day) { day = { date: iso, entries: [] }; t.itinerary.push(day); }
      day.entries.push(val);
    });
    newEntry[iso] = "";
  }

  function removeEntry(iso, idx) {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      const day = t.itinerary.find((x) => x.date === iso);
      if (day) day.entries.splice(idx, 1);
    });
  }

  async function refreshWeather() {
    refreshing = true;
    announce("Fetching weather…");
    let anyOutOfRange = false, anyError = false, okCount = 0;
    for (const place of trip.places) {
      const res = await fetchForecast(place.lat, place.lon, trip.startDate, trip.endDate);
      if (res.status === "ok") {
        update((d) => {
          const p = d.trips.find((x) => x.id === trip.id).places.find((x) => x.id === place.id);
          if (p) p.weatherCache = { fetchedAt: new Date().toISOString(), daily: res.daily };
        });
        okCount++;
      } else if (res.status === "out-of-range") {
        anyOutOfRange = true;
      } else {
        anyError = true;
      }
    }
    let msg = `Weather updated for ${okCount} ${okCount === 1 ? "city" : "cities"}.`;
    if (anyOutOfRange) msg += " Some dates are beyond the 16-day forecast.";
    if (anyError) msg += " Some cities couldn't be reached (showing cached data if available).";
    announce(msg, anyError);
    refreshing = false;
  }
</script>

{#if !days.length}
  <div class="state">
    <span class="state-icon" aria-hidden="true">📅</span>
    <p>Set the trip's start and end dates (in Plan → Edit) to see day-by-day plans and weather.</p>
  </div>
{:else}
  {#if trip.places.length}
    <div style="display:flex;justify-content:flex-end;margin-bottom:.5rem">
      <button class="btn btn-sm" type="button" onclick={refreshWeather} disabled={refreshing}>
        {refreshing ? "Loading…" : "↻ Refresh weather"}
      </button>
    </div>
    {#if daysToStart != null && daysToStart > FORECAST_HORIZON_DAYS}
      <div class="note">
        <span aria-hidden="true">📅</span>
        <span>This trip starts in about {daysToStart} days. Forecasts are only available within {FORECAST_HORIZON_DAYS} days, so weather will appear closer to the date.</span>
      </div>
    {:else if !anyCached}
      <div class="note">
        <span aria-hidden="true">☁️</span>
        <span>Tap "Refresh weather" to load the forecast for each city.</span>
      </div>
    {/if}
  {:else}
    <p class="meta">Add a city in Plan to see weather alongside each day.</p>
  {/if}

  {#each days as iso (iso)}
    <div class="card">
      <h3>{fmtDate(iso, { weekday: "long", day: "numeric", month: "long" })}</h3>

      {#if trip.places.length}
        <div class="weather-wrap">
          {#each trip.places as place (place.id)}
            {@const w = weatherFor(place, iso)}
            {#if w}
              <span class="chip" title={`${place.name}: ${w.label}`} aria-label={`${place.name}: ${w.label}, high ${w.tempMax} degrees, low ${w.tempMin} degrees`}>
                {w.icon} {place.name} {w.tempMax}°/{w.tempMin}°
              </span>
            {:else}
              <span class="chip" title={`${place.name}: no forecast yet`} aria-label={`${place.name}: no forecast yet`}>❓ {place.name} · no forecast</span>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="stack">
        {#each entryFor(iso) as text, idx (idx)}
          <div class="entry-row">
            <span>• {text}</span>
            <button class="icon-btn-sm" type="button" aria-label="Remove entry" title="Remove this entry" onclick={() => removeEntry(iso, idx)}>×</button>
          </div>
        {/each}
      </div>

      <form class="inline-form" onsubmit={(e) => addEntry(iso, e)}>
        <input type="text" bind:value={newEntry[iso]} placeholder="Add a plan for this day" aria-label={`Plan for ${iso}`} autocomplete="off" style="flex:1" />
        <button class="btn btn-sm" type="submit">Add</button>
      </form>
    </div>
  {/each}
{/if}

<style>
  .weather-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
  .entry-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: flex-start;
  }
</style>
