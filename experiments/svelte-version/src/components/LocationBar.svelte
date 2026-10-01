<script>
  // Global top-right widget (all pages): a Home button (→ Trips) + an opt-in
  // device-location weather chip (GPS → reverse-geocode → current conditions).
  //
  // Privacy: local-first. The only outbound data is the device coordinates sent
  // to Open-Meteo (keyless) for reverse-geocoding + weather — same stance as the
  // rest of the app. GPS is opt-in (a tap), the result is cached, and it degrades
  // gracefully if permission is denied or unavailable (e.g. iOS quirks).
  import { onMount } from "svelte";
  import { navigate, route } from "../lib/router.svelte.js";
  import { currentConditions, reverseGeocode, describeCode } from "../lib/weather.js";

  const CACHE_KEY = "tpsvelte_home_weather";
  const MAX_AGE_MS = 30 * 60 * 1000; // re-fetch weather if cache older than 30 min

  // status: "idle" | "locating" | "ok" | "denied" | "error"
  let status = $state("idle");
  let place = $state(null);   // { name, country }
  let weather = $state(null); // { temp, icon, label }

  onMount(() => {
    // Reuse a recent cached fix so we don't re-prompt on every navigation.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.place) {
          place = c.place;
          weather = c.weather;
          status = "ok";
          // Refresh weather quietly if the fix is stale but we have coords.
          if (c.coords && Date.now() - (c.at || 0) > MAX_AGE_MS) {
            refreshWeather(c.coords.lat, c.coords.lon);
          }
        }
      }
    } catch { /* ignore bad cache */ }
  });

  async function locate() {
    if (!("geolocation" in navigator)) {
      status = "error";
      return;
    }
    status = "locating";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const [geo, cond] = await Promise.all([
          reverseGeocode(lat, lon),
          currentConditions(lat, lon),
        ]);
        // Prefer city + country; fall back to region, then a neutral label.
        const cityName = geo?.name || geo?.admin || "";
        place = {
          name: cityName || "Current location",
          country: geo?.country || "",
        };
        weather = cond.status === "ok"
          ? { temp: cond.temp, ...describeCode(cond.code) }
          : null;
        status = "ok";
        persist({ lat, lon });
      },
      (err) => {
        status = err.code === err.PERMISSION_DENIED ? "denied" : "error";
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60 * 1000 }
    );
  }

  async function refreshWeather(lat, lon) {
    const cond = await currentConditions(lat, lon);
    if (cond.status === "ok") {
      weather = { temp: cond.temp, ...describeCode(cond.code) };
      persist({ lat, lon });
    }
  }

  function persist(coords) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ place, weather, coords, at: Date.now() }));
    } catch { /* ignore quota */ }
  }

  const label = $derived.by(() => {
    if (status === "locating") return "Locating…";
    if (status === "denied") return "Location off";
    if (status === "error") return "Unavailable";
    if (status === "ok" && place) {
      const loc = [place.name, place.country].filter(Boolean).join(", ");
      return weather ? `${loc}` : loc;
    }
    return "My weather";
  });
</script>

<div class="locbar no-print">
  <button
    class="loc-chip"
    class:is-idle={status === "idle" || status === "denied" || status === "error"}
    type="button"
    onclick={locate}
    title={status === "ok" ? "Refresh my location weather" : "Show weather for my location"}
    aria-label={status === "ok" ? "Refresh weather for my location" : "Get weather for my location"}
  >
    {#if status === "ok" && weather}
      <span class="loc-ico" aria-hidden="true">{weather.icon}</span>
      <span class="loc-text">
        <span class="loc-name">{label}</span>
        <span class="loc-temp">{weather.temp}° · {weather.label}</span>
      </span>
    {:else}
      <span class="loc-ico" aria-hidden="true">📍</span>
      <span class="loc-text"><span class="loc-name">{label}</span></span>
    {/if}
  </button>

  <button
    class="home-btn"
    type="button"
    onclick={() => navigate("trips", { filter: "all" })}
    aria-current={route.name === "trips" ? "page" : undefined}
    title="Home (all trips)"
    aria-label="Go to Trips home"
  >
    <span aria-hidden="true">🏠</span>
  </button>
</div>

<style>
  .locbar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .loc-chip,
  .home-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font: inherit;
    color: var(--text);
    background: var(--glass-bg);
    backdrop-filter: blur(14px) saturate(160%);
    -webkit-backdrop-filter: blur(14px) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-hi);
    border-radius: 999px;
    transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease),
      background var(--t-fast) var(--ease);
  }
  .loc-chip { padding: 0 0.8rem; height: 40px; max-width: 15rem; }
  .home-btn { padding: 0; width: 40px; height: 40px; justify-content: center; font-size: 1.05rem; }
  .loc-chip:hover,
  .home-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--glass-hi), 0 6px 16px rgba(15, 23, 42, 0.12);
  }
  .loc-chip:focus-visible,
  .home-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .loc-ico { font-size: 1.05rem; flex: none; }
  .loc-text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; text-align: left; }
  .loc-name {
    font-size: var(--fs-xs);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .loc-temp { font-size: 0.66rem; color: var(--text-light); white-space: nowrap; }
  .is-idle { color: var(--text-light); }

  /* On narrow phones, hide the location text (keep the icon) so it doesn't crowd
     the top bar; the home button always stays. */
  @media (max-width: 400px) {
    .loc-chip { max-width: none; padding: 0.3rem; }
    .loc-text { display: none; }
  }
</style>
