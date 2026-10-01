<script>
  // Add/edit a traveller in the master list. Ported from openPersonForm().
  import { store, update, uid } from "../lib/store.svelte.js";
  import { announce } from "../lib/router.svelte.js";
  import Modal from "./Modal.svelte";

  let { personId = null, onclose } = $props();

  const existing = personId ? store.people.find((p) => p.id === personId) : null;

  let name = $state(existing?.name ?? "");
  let birthday = $state(existing?.birthday ?? "");
  let ageText = $state(existing?.ageText ?? "");
  let gender = $state(existing?.gender ?? "");

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const rec = { name: trimmed, birthday, ageText: ageText.trim(), gender };
    update((d) => {
      if (!Array.isArray(d.people)) d.people = [];
      if (existing) {
        const p = d.people.find((x) => x.id === personId);
        if (p) Object.assign(p, rec);
      } else {
        d.people.push({ id: uid("person"), ...rec });
      }
    });
    announce(existing ? "Traveller updated." : `${trimmed} added to Travellers.`);
    onclose?.();
  }
</script>

<Modal title={existing ? "Edit traveller" : "Add traveller"} {onclose}>
  <form class="stack" onsubmit={submit}>
    <div class="field">
      <label for="pf-name">Name</label>
      <input id="pf-name" type="text" bind:value={name} required placeholder="Full name" autocomplete="off" />
    </div>
    <div class="field">
      <label for="pf-bday">Birthday (optional)</label>
      <input id="pf-bday" type="date" bind:value={birthday} />
    </div>
    <div class="field">
      <label for="pf-age">Age note (optional)</label>
      <input id="pf-age" type="text" bind:value={ageText} placeholder="e.g. 30s (if birthday unknown)" autocomplete="off" />
    </div>
    <div class="field">
      <label for="pf-gender">Gender (optional)</label>
      <select id="pf-gender" bind:value={gender} aria-label="Gender">
        <option value="">Prefer not to say</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary" type="submit">{existing ? "Save" : "Add traveller"}</button>
    </div>
  </form>
</Modal>
