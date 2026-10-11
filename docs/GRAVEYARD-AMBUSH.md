# Graveyard ambush — realm-graves-1

The chapter-zero graveyard now contains eight skeletal vanguard soldiers, including Veyr. Before the player accepts **Keep the warning**, they remain buried, invisible and inactive. Accepting starts a staggered 1.8-second rise at each grave, separated by 0.28 seconds, with pooled earth particles. Rising enemies cannot attack or take damage. Their bone geometry uses the existing animated combat rig; individual rigid limbs are batched without losing joint movement. Forest goblins and bosses are unchanged.

The northern gate requires all eight kills. The warning cannot retrigger the encounter. Prologue save version 2 preserves the read flag and individual kill IDs. Version-1 in-progress saves keep their original three kill IDs; escaped/completed journeys and saves predating the prologue keep the gate open with no revived enemies. Surviving enemies resume above ground on reload. Death does not reset the ambush or award duplicate kills.

Roster slots 0–108 retain their identities; the three former graveyard slots become skeletons, and five slots are appended. The trusted Supabase catalogue has 114 encounters. Graveyard rewards are four coins and one potion per ordinary skeleton, or 18 coins and one potion for Veyr, plus existing XP. No new item or currency authority is introduced. The catalogue also corrects the former Veyr coin mismatch. Apply the generated `supabase/game-catalog-seed.sql` when deploying independently; this updates definitions, not characters. Mixed-release co-op clients are rejected by the existing roster-version safeguard. Standard co-op worlds already skip chapter zero; snapshots preserve burial state and hide dormant enemies.

Validation on 2026-10-11:
- Chromium mobile viewport and touch input: warning acceptance, dormant immunity, eight staggered rises, no duplicate trigger, eight real sword kills, gate, partial-save restoration, reload, charter and legacy level-26 preservation; no JavaScript exceptions.
- Scout browser regression: seven forest GLB scouts, animation states, AI damage, sword kills, loot, XP, respawn and independent rigs.
- PGlite runtime regression: authoritative rewards, owner isolation, retries, inventory escrow and protected saves.
- Two Chromium clients with the Supabase SDK service double: room creation/join, shared combat and loot, building/gathering, fog gates, host departure and solo restoration; no browser exceptions.
- Physical Android/iPhone rendering and performance were not tested.

Recovery checkpoint: `checkpoint/pre-grave-skeletons` at `ad416a4`. A pre-release live catalogue backup is kept outside the repository; no account records were modified for testing.
