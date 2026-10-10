# Living settlements — realm-settlements-1

## Delivered

- Eight villages including Wanderer's Village (previously four), plus Dawnwatch City. New villages: Amberwick (-430,70), Cedarwatch (-462,-225), Highhearth (-350,-440), Skyrest (-157,-651).
- Dawnwatch retains its location, fountain and quest givers, with expanded walls, gateways, residential streets, a stone keep, towers, market and forge stalls. There are 51 settlement buildings across the world, including 47 Frontier buildings and the four original village buildings. Homes remain exterior buildings; this update does not add enterable house interiors.
- The existing authored shingle/window/shutter/flower-box/timber/stonework library now scales to every settlement building. Settlement streets participate in the same terrain road field and atlas. Shop stalls are also recorded on the map.
- All fourteen boss courts gain masonry relief and torch-framed arches. Hollowroot has timber supports; the four expansion dungeons gain themed gateways, corridor arches, chamber paving, recessed wall details and friezes. Existing fog gates, dungeon keys, puzzles, hazards, alternate paths, enemies and rewards remain intact.
- 43 new humanoid NPCs: residents, town/castle guards, a knight, three wandering warriors, regional traders and two travelling merchants. 26 use walking routes. Sella travels between Briarfield and Dawnwatch. These NPCs are peaceful and offer dialogue/directions; guards and wandering warriors do not introduce a new allied combat system.
- 19 additional merchant/smith shop locations reuse the existing stock, upgrades, equipment and sale logic. NPCs stop near players; map/nameplate positions track their actual bodies.

## Architecture and limits

`settlement-life.js` owns bounded A* routing and civilian movement. It queries the original `blocked` predicate at nodes and segment midpoints, checks each live movement step, replans after obstruction and has a one-search-per-frame budget. Routes are not a separate collision mesh. Failed searches retry safely; player-built walls can temporarily obstruct a route. Distant NPC models and animations are culled while travel continues. Existing character geometries/materials are reused; no new character asset downloads.

The host simulates citizens in co-op and replicates positions in the existing world snapshot. Guests interpolate those positions; civilians do not alter shared combat or loot authority. Same-release clients should reload before joining together.

`stronghold-art.js` batches architectural detail and culls by proximity/interior. `village-art.js` remains the shared settlement detailing library. New settlement POIs are appended after the original POIs to preserve discovery indices. No character save-schema or enemy-roster changes.

`supabase/settlement-trade.sql` extends the existing server event validator transactionally, retaining ownership, lease, revision, currency and item checks. It validates named static shops within five units, and travelling merchants within reviewed route corridors allowing collision detours. It does not accept arbitrary browser-defined vendor locations. The browser checks the authenticated capability RPC before allowing new regional cloud transactions; old Bram/Mira trading remains compatible. Purchases/sales/upgrades no longer debit locally if the account outbox rejects the event.

## Executed validation

- Mobile-sized Chromium/WebGL: all NPC spawn positions clear, all route legs found, 26 walking NPCs moved, all 19 new shops purchased using the live game functions, duplicate equipment buys rejected, sales consume inventory and cannot repeat after depletion. Actual city/village/dungeon renders inspected. No captured JS/shader errors.
- Fourteen boss gates: entry, sealed departure, collision-safe route to boss, damage-handler defeat, gate release and save/reload passed after the architectural changes.
- Two-client browser test with Supabase SDK service double: civilian positions replicate and guards interpolate; existing room lifecycle, movement/equipment, combat, loot, dungeon structures, pets/mounts, building, gathering, town return and solo restoration passed.
- PostgreSQL (PGlite): migration applies twice, all 19 vendor zones, capability permissions, private validation helper, prices, idempotent request replay, wrong vendor/role/location and owner rejection passed. Existing character runtime ownership/progression/reward tests also passed.
- Real browser connected to test PostgreSQL: existing account import/recovery/level-26 Continue flow and the new regional shop capability/purchase persisted correctly.
- Live Supabase management API: previous event-function definition backed up before applying the migration; verified capability=1, updated validator, accepted city merchant, rejected wrong role and no authenticated direct execution of the private helper. No live player character was modified for testing.
- Static GitHub Pages staging validates 42 runtime files and consistent release URLs.

No physical Android/iPhone performance or Safari test was available. The two-client gameplay checks use a service double, not two authenticated accounts on live Supabase. No 30/60 FPS guarantee is claimed.

## Reproducing checks

Use Chromium, Playwright and the repository's static HTTP server. Tests support `PLAYWRIGHT_PATH`; SQL checks support `PGLITE_PATH`. PGlite 0.3.14 was installed for development only using `npm install --cache /tmp/npm-cache --prefix /tmp/realm-sql --no-audit --no-fund @electric-sql/pglite@0.3.14`. There is no runtime build or npm dependency for players.

Run `tests/settlements-browser.cjs`, `tests/boss-arenas.cjs`, `tests/multiplayer-browser.cjs`, `tests/accounts-browser.cjs`, `tests/settlement-trade-sql.cjs`, `tests/character-runtime-sql.cjs` with the documented environment paths/cache overrides in those scripts. `scripts/build-settlement-trade.py` regenerates the migration from the reviewed `supabase/settlement-trade.json`; an optional argument accepts the browser-exported route file.
