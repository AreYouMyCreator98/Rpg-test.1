# Expansion delivery status

## Playable and validated

- Stage 1 (`d2f1102`): grounded shoulder roll with knee articulation and shared remote animation; FOV 45–100/default 70; three camera modes, shoulder side, sensitivity/inversion; stamina 150 and regeneration 18/sec.
- Stage 2 (`416a132`): level 40; five attributes; three six-node skill branches, real combat effects and combo-triggered Whirlwind; previews, prerequisites, respec, point budgets, schema-3 save migration and recoverable original backup. Session-only co-op continues to work with these builds. The existing 49 enemies, seven bosses and sixteen quests remain.

The camera has not been tested on mounts because mounts are not implemented. Physical Android/iOS performance is unverified. `VALIDATION.md` distinguishes browser checks from device and hosted-backend checks.

## Stage 3: hosted foundation tested; game integration still in progress

`supabase/characters-foundation.sql` is a reviewed, locally tested database foundation, **not a complete account system**. It adds private account-owned character rows, five active slots, optimistic revisions for metadata, recoverable archives, and renewable exclusive character leases based on database time. RLS prevents another owner reading character data or backups. Browsers have no permission to write inventory, currency, XP or arbitrary progression JSON. Existing room tables and policies are untouched.

`tests/characters-foundation-sql.cjs` executes the SQL twice and tests authorization under a real non-owner PostgreSQL role through PGlite. It does not establish that the migration is installed in the hosted project. Do not treat running this foundation alone as enabling accounts or cloud saves.

Supabase management access was verified on 2026-10-10. The foundation and `supabase/character-commands.sql` are now installed on project `dvntscsqpzecughxcnhm`. Transactional hosted checks passed for owner isolation, protected writes, server-priced purchases, idempotent retries, exclusive leases, private backups and rejection of anonymous character creation. Test users and character fixtures were rolled back. Existing room tables and authentication settings were not changed.

The new command layer validates equipment, purchases, sales, potion use, weapon upgrade resources, attribute budgets, skill prerequisites and respec costs against server-owned data. It records requests so retries cannot spend or award twice, checks revisions and active leases, and saves pre-change backups. It does **not** accept arbitrary progression JSON, XP grants or browser-reported rewards. These endpoints are backend preparation; they are not connected to the released game's local economy yet.

Remaining Stage 3 work is explicit:

1. Complete the encounter/reward validator and connect the tested economy command layer. RLS and trusting host-reported kills alone are insufficient. Validate reward catalog, encounter participation, inventory operations and expected revisions on the server before changing protected character state.
2. Wire email Auth/recovery, five-slot selection, previews, confirmed deletion, character/world separation and session leases. Deploy and test Auth callback configuration and the completed database/server functions together.
3. Implement recoverable legacy imports and offline action reconciliation, with explicit revision conflicts. Keep the original local save until successful migration is confirmed; never replace server progression with an arbitrary client snapshot.
4. Replace room-session heroes with selected characters only after the trusted path passes two-account tests: owner isolation, duplicate leases/pickups/rewards, stale revisions, disconnect/reconnect, host departure and preservation of the separate solo world.

No fake login or cloud-save buttons were added. Existing co-op remains session-only and preserves the solo save. The backend is deliberately unused by the released browser game until the complete stage can be validated.

## Pending stages

Stages 4 and 5 have not started: ten enemy types, four dungeons, seven additional bosses, repeatable bounties, five pets and three mounts. Following the requested order, these wait for the persistent-character backend. Stage 6 full-expansion balancing, device QA and two-account live tests also remain pending. The validated Stage 1–2 game is the retained playable baseline.
