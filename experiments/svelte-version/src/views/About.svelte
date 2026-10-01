<script>
  const version = "0.1.0-proto";
</script>

<section class="view">
  <h2>About</h2>
  <div class="card">
    <p>
      <strong>Travel Planner — Option B</strong> is a Svelte 5 + Vite learning
      reimplementation of the shipped vanilla Travel Planner PWA, built against the
      same spec for an apples-to-apples comparison.
    </p>
    <p class="hint">Experiment version {version}. Not the shipped app.</p>
  </div>
  <div class="card">
    <h3>Tips</h3>
    <ul>
      <li>Everything is stored locally on this device (namespaced separately from the real app).</li>
      <li>Weather comes from Open-Meteo — no API key, only city coordinates leave the device.</li>
      <li>Back up your data from Personalize → Data.</li>
    </ul>
  </div>
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem 1.2rem;
    box-shadow: var(--shadow);
    margin-bottom: 1rem;
  }
  h3 { margin: 0.2rem 0 0.3rem; color: var(--primary); }
  .hint { color: var(--text-light); font-size: 0.85rem; }
  ul { margin: 0.3rem 0; padding-left: 1.2rem; }
  li { margin-bottom: 0.3rem; }
</style>
