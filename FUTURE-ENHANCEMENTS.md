# Travel Planner - Future Enhancements

Parking-lot for post-v1.0.0 ideas. Not committed work; each needs its own
decision on scope/stack/rigour before building.

## Family sharing of trips (v2 candidate)
Let a family share the same set of trips **without passing JSON files around**.

Two distinct goals - decide which before building, as they differ hugely in effort:

1. **"Family can view the plan" (lighter)**
   - Share a trip via a **URL-encoded link** (trip compressed into the link / a short code),
     or a **published read-only itinerary** page built on the existing Itinerary summary view.
   - Stays close to local-first: no accounts, no backend.
   - Trade-off: one-time snapshot, not live sync; long trips need URL compression.

2. **"Family co-edits live trips" (heavier - architectural shift)**
   - Real shared storage / sync via a lightweight backend (e.g. Firebase/Firestore or Supabase).
   - True shared, live, multi-editor experience.
   - Trade-off: backend + user accounts/auth + security rules + network dependency + possible
     cost. Moves the app from **local-first** to **cloud-backed** - a deliberate track change
     (revisit privacy stance, rigour, and data-safety), not a bolt-on.

**Note:** anything that shares data off-device crosses the app's local-first / no-tracking
stance - flag and confirm before building (per the build standards).

## Other parked ideas
- **Svelte Option B** - a parallel reimplementation of v1 as a learning exercise
  (planned under `experiments/svelte-version/`).
- **Per-person packing** - packing items assigned to individual travellers.
- **Multiple destination countries per trip** (v1 is one country + multiple cities).
- **Per-city date ranges** within a trip.
