<script>
  // Reusable segmented switcher, matching the shipped app's `.seg` control.
  // Used for Personalization (Appearance/Data), Trips (Domestic/International),
  // and Presets (Travellers/Packing).
  //
  // Props:
  //   items:  [{ key, label }]
  //   active: current key
  //   onselect: (key) => void
  //   ariaLabel: group label
  let { items, active, onselect, ariaLabel = "Sections" } = $props();
</script>

<div class="seg" role="group" aria-label={ariaLabel}>
  {#each items as item (item.key)}
    <button
      class="seg-btn"
      class:is-active={active === item.key}
      type="button"
      aria-pressed={active === item.key}
      onclick={() => onselect(item.key)}
    >
      {item.label}
    </button>
  {/each}
</div>
