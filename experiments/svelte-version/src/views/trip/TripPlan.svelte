<script>
  // Trip → Plan: travellers, cities, flights, accommodation, notes, attachments,
  // delete. Ported from renderOverview(). Reactive store means edits reflect
  // immediately without manual rerender() calls.
  import { store, update, uid } from "../../lib/store.svelte.js";
  import { navigate, announce } from "../../lib/router.svelte.js";
  import { fmtDate } from "../../lib/dates.js";
  import AddCityModal from "../../components/AddCityModal.svelte";
  import FlightFormModal from "../../components/FlightFormModal.svelte";
  import StayFormModal from "../../components/StayFormModal.svelte";

  let { trip } = $props();

  // Modal state
  let showAddCity = $state(false);
  let flightModal = $state(null); // { id } | { id: null } | null
  let stayModal = $state(null);

  // Traveller add form
  let newTraveller = $state("");
  let alsoSave = $state(false);

  const availablePeople = $derived.by(() => {
    const onTrip = new Set(trip.travellers.map((n) => n.toLowerCase()));
    return (store.people || []).filter((p) => p.name && !onTrip.has(p.name.toLowerCase()));
  });

  function removeTraveller(idx) {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.travellers.splice(idx, 1);
    });
  }
  function addFromPeople(p) {
    update((d) => d.trips.find((x) => x.id === trip.id).travellers.push(p.name));
  }
  function addTraveller(e) {
    e.preventDefault();
    const name = newTraveller.trim();
    if (!name) return;
    const save = alsoSave;
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.travellers.push(name);
      if (save) {
        if (!Array.isArray(d.people)) d.people = [];
        if (!d.people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          d.people.push({ id: uid("person"), name, birthday: "", ageText: "", gender: "" });
        }
      }
    });
    if (save) announce(`${name} added to trip and saved to Travellers.`);
    newTraveller = "";
    alsoSave = false;
  }

  function removeCity(place) {
    if (!window.confirm(`Remove ${place.name} and its cached weather from this trip?`)) return;
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.places = t.places.filter((p) => p.id !== place.id);
    });
  }

  function removeFlight(fl) {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.flights = (t.flights || []).filter((x) => x.id !== fl.id);
    });
  }
  function removeStay(st) {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.stays = (t.stays || []).filter((x) => x.id !== st.id);
    });
  }

  // Notes (debounced save)
  let notesTimer;
  function onNotes(e) {
    const val = e.target.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      update((d) => (d.trips.find((x) => x.id === trip.id).notes = val));
    }, 400);
  }

  // Attachments
  let fileInput;
  function attIcon(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📄";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
    return "📋";
  }
  function isImage(name) {
    return ["png", "jpg", "jpeg", "gif", "webp"].includes(name.split(".").pop().toLowerCase());
  }
  function isPdf(name) {
    return name.split(".").pop().toLowerCase() === "pdf";
  }
  function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function downloadAtt(att) {
    const url = URL.createObjectURL(dataUrlToBlob(att.data));
    const a = document.createElement("a");
    a.href = url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    announce(`Downloading ${att.name}…`);
  }
  let lightbox = $state(null); // att | null
  function viewAtt(att) {
    if (isImage(att.name)) {
      lightbox = att;
    } else if (isPdf(att.name)) {
      const url = URL.createObjectURL(dataUrlToBlob(att.data));
      const win = window.open(url, "_blank");
      if (!win) {
        downloadAtt(att);
        announce("Browser blocked the popup — downloading instead.");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }
  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        announce(`${file.name} is too large (max 5MB).`, true);
        continue;
      }
      const data = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(file);
      });
      update((d) => {
        const t = d.trips.find((x) => x.id === trip.id);
        if (!Array.isArray(t.attachments)) t.attachments = [];
        t.attachments.push({ id: uid("attachment"), name: file.name, type: file.type, data });
      });
    }
    e.target.value = "";
  }
  function removeAtt(att) {
    update((d) => {
      const t = d.trips.find((x) => x.id === trip.id);
      t.attachments = (t.attachments || []).filter((a) => a.id !== att.id);
    });
  }

  function deleteTrip() {
    if (!window.confirm(`Delete "${trip.name || "this trip"}" and everything in it? This can't be undone.`)) return;
    update((d) => { d.trips = d.trips.filter((t) => t.id !== trip.id); });
    announce("Trip deleted.");
    navigate("trips", { filter: "all" });
  }
</script>

<!-- Travellers -->
<div class="card">
  <h3>Travellers</h3>
  {#if !trip.travellers.length}
    <p class="meta">No travellers added yet.</p>
  {/if}
  <div class="chip-wrap">
    {#each trip.travellers as name, idx (idx)}
      <span class="chip">👤 {name}
        <button class="chip-close" type="button" aria-label={`Remove ${name}`} title={`Remove ${name}`} onclick={() => removeTraveller(idx)}>×</button>
      </span>
    {/each}
  </div>

  {#if availablePeople.length}
    <div style="margin-top:.75rem">
      <p class="field-hint">Add from Travellers:</p>
      <div class="chip-wrap">
        {#each availablePeople as p (p.id)}
          <button class="chip chip-primary" type="button" style="cursor:pointer" aria-label={`Add ${p.name} to trip`} onclick={() => addFromPeople(p)}>＋ {p.name}</button>
        {/each}
      </div>
    </div>
  {/if}

  <form style="margin-top:.75rem" onsubmit={addTraveller}>
    <div class="inline-form">
      <input type="text" bind:value={newTraveller} placeholder="Add a traveller" aria-label="Traveller name" autocomplete="off" style="flex:1" />
      <button class="btn btn-sm" type="submit">Add</button>
    </div>
    <label class="save-check">
      <input type="checkbox" bind:checked={alsoSave} class="check" />
      Also save to Travellers for reuse
    </label>
  </form>
</div>

<!-- Cities -->
<div class="card">
  <h3>Cities</h3>
  <p class="meta">Add each place you'll visit to get its weather.</p>
  {#if !trip.places.length}
    <p class="meta">No cities added yet.</p>
  {/if}
  {#each trip.places as place (place.id)}
    <div class="detail-row">
      <span>
        <strong>{place.name}</strong>
        <span class="meta">  {[place.admin, place.country].filter(Boolean).join(", ")}</span>
      </span>
      <button class="btn btn-danger btn-sm" type="button" aria-label={`Remove ${place.name}`} title={`Remove ${place.name}`} onclick={() => removeCity(place)}>Remove</button>
    </div>
  {/each}
  <button class="btn btn-sm btn-block" type="button" style="margin-top:.75rem" onclick={() => (showAddCity = true)}>＋ Add a city</button>
</div>

<!-- Flights -->
<div class="card">
  <div class="card-head">
    <h3 style="margin:0">Flights</h3>
    <button class="btn btn-sm" type="button" onclick={() => (flightModal = { id: null })}>＋ Add flight</button>
  </div>
  {#if !(trip.flights || []).length}
    <p class="meta">No flights added.</p>
  {/if}
  {#each trip.flights || [] as fl (fl.id)}
    <div class="detail-row">
      <div>
        <strong>{fl.label || "Flight"}{fl.flightNo ? " · " + fl.flightNo : ""}</strong>
        <div class="meta">{fl.from || "?"} → {fl.to || "?"}</div>
        <div class="meta">{fmtDate(fl.date)}{fl.depTime ? " · dep " + fl.depTime : ""}{fl.arrTime ? " · arr " + fl.arrTime : ""}</div>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm" type="button" aria-label="Edit flight" title="Edit flight" onclick={() => (flightModal = { id: fl.id })}>Edit</button>
        <button class="btn btn-danger btn-sm" type="button" aria-label="Remove flight" title="Remove flight" onclick={() => removeFlight(fl)}>×</button>
      </div>
    </div>
  {/each}
</div>

<!-- Accommodation -->
<div class="card">
  <div class="card-head">
    <h3 style="margin:0">Accommodation</h3>
    <button class="btn btn-sm" type="button" onclick={() => (stayModal = { id: null })}>＋ Add stay</button>
  </div>
  {#if !(trip.stays || []).length}
    <p class="meta">No accommodation added.</p>
  {/if}
  {#each trip.stays || [] as st (st.id)}
    <div class="detail-row">
      <div>
        <strong>{st.name || "Stay"}</strong>
        {#if st.city}<div class="meta">{st.city}</div>{/if}
        <div class="meta">{st.checkIn ? "In " + fmtDate(st.checkIn) : ""}{st.checkOut ? " · Out " + fmtDate(st.checkOut) : ""}</div>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm" type="button" aria-label="Edit accommodation" title="Edit accommodation" onclick={() => (stayModal = { id: st.id })}>Edit</button>
        <button class="btn btn-danger btn-sm" type="button" aria-label="Remove accommodation" title="Remove accommodation" onclick={() => removeStay(st)}>×</button>
      </div>
    </div>
  {/each}
</div>

<!-- Notes -->
<div class="card">
  <h3>Notes</h3>
  <textarea placeholder="Trip notes, reservations, ideas..." aria-label="Trip notes" value={trip.notes || ""} oninput={onNotes}></textarea>
</div>

<!-- Attachments -->
<div class="card">
  <h3>Attachments</h3>
  <div class="stack" style="gap:.5rem">
    {#if !(trip.attachments || []).length}
      <p class="meta">No attachments yet. Add tickets, screenshots, or documents.</p>
    {/if}
    {#each trip.attachments || [] as att (att.id)}
      <div class="att-row">
        <div class="att-name">
          <span style="flex-shrink:0">{attIcon(att.name)}</span>
          <span class="att-label" title={att.name}>{att.name}</span>
          <span class="meta"> ({(att.data.length / 1024).toFixed(1)}KB)</span>
        </div>
        <div class="row-actions">
          {#if isImage(att.name) || isPdf(att.name)}
            <button class="btn btn-sm" type="button" aria-label={`View ${att.name}`} title={`View ${att.name}`} onclick={() => viewAtt(att)}>👁️ View</button>
          {/if}
          <button class="btn btn-sm" type="button" aria-label={`Download ${att.name}`} title={`Download ${att.name}`} onclick={() => downloadAtt(att)}>⬇️</button>
          <button class="btn btn-danger btn-sm" type="button" aria-label={`Remove ${att.name}`} title={`Remove ${att.name}`} onclick={() => removeAtt(att)}>×</button>
        </div>
      </div>
    {/each}
  </div>
  <input bind:this={fileInput} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt" style="display:none" aria-label="Select files to attach" onchange={onFiles} />
  <button class="btn btn-sm btn-block" type="button" style="margin-top:.75rem" onclick={() => fileInput.click()}>📎 Add attachment</button>
</div>

<!-- Delete -->
<div class="card">
  <button class="btn btn-danger btn-block" type="button" onclick={deleteTrip}>Delete this trip</button>
</div>

{#if showAddCity}
  <AddCityModal tripId={trip.id} onclose={() => (showAddCity = false)} />
{/if}
{#if flightModal}
  <FlightFormModal tripId={trip.id} flightId={flightModal.id} onclose={() => (flightModal = null)} />
{/if}
{#if stayModal}
  <StayFormModal tripId={trip.id} stayId={stayModal.id} onclose={() => (stayModal = null)} />
{/if}
{#if lightbox}
  <div class="lightbox" role="presentation" onclick={() => (lightbox = null)}>
    <div class="lightbox-inner" role="dialog" aria-modal="true" aria-label={lightbox.name}>
      <img src={lightbox.data} alt={lightbox.name} />
      <p class="meta" style="margin:.5rem 0">{lightbox.name}</p>
      <div class="lightbox-actions">
        <button class="btn btn-sm" type="button" onclick={(e) => { e.stopPropagation(); downloadAtt(lightbox); }}>⬇️ Download</button>
        <button class="btn btn-primary btn-sm" type="button" onclick={() => (lightbox = null)}>✕ Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .chip-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .save-check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.4rem;
    font-weight: 400;
    font-size: var(--fs-sm);
  }
  .att-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem;
    background: var(--surface-2);
    border-radius: 6px;
  }
  .att-name { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
  .att-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: grid;
    place-items: center;
    z-index: 100;
    padding: 1rem;
  }
  .lightbox-inner {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 1rem;
    max-width: 520px;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    text-align: center;
  }
  .lightbox-inner img { max-width: 100%; max-height: 70vh; border-radius: 6px; object-fit: contain; }
  .lightbox-actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
</style>
