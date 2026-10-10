# Major RPG expansion — implementation status

Release identity: `realm-expansion-20261010-1`. The pre-expansion playable baseline is commit `545da2a`; the original local save key remains `realm-fallen-save-v1`.

## Integrated systems

1. **Movement/camera:** grounded shoulder roll, three camera modes, FOV/sensitivity/inversion, 150 base stamina. Mounted camera height blends with mounting and dismounting; new dungeon walls participate in camera collision.
2. **Progression:** level 40, five attributes, three six-node skill branches, real passive/combo effects, point previews and respec. Existing schema-3 characters retain their builds.
3. **Accounts:** Supabase email Auth, confirmation/recovery callbacks, five character slots, rename/confirmed archive, local legacy import with original backup, private cloud progression, a recoverable offline command outbox, revision conflicts and exclusive character leases. Account adventurers can enter persistent co-op rooms; guest rooms remain available separately. Character progression and solo/room world state are separate.
4. **World:** ten new creature families, four connected dungeon layouts, seven additional bosses with two phases and three attack patterns, seventeen additional quests and repeatable bounty contracts. Totals: 106 enemies, fourteen bosses, thirty-three quests and five dungeons including Hollowroot. Existing encounters are retained.
5. **Companions:** five animated pets with small bonuses and three rideable mounts. Purchases, selection, movement, rider poses, mounting/dismounting, mount stamina, outdoor restrictions and remote replication are integrated. Secondary menus stay inside Journey.

Rootbound contains the ordered root/moon/ember puzzle, plant creatures and undead revenants. Sunken has flooded chambers and a safe bridge. Frostspire has ice traps and drifting snow. Obsidian has lava lanes and moving forge gears. Each includes a side route, treasure, a locked boss chamber and a safe surface exit. Dungeon maps draw the actual room layout, hazards, gate, chests, glyphs, enemies, party and camera bearing.

## Account trust model

The user explicitly authorized **legacy imports with validation of future rewards**. One old local character per account can become a grandfathered baseline. The original save is backed up before the import; its prior history is not claimed to be verified.

After import, browsers cannot upload arbitrary inventory, currency or XP totals. Typed PostgreSQL commands validate catalog items, ownership, prices/materials, point budgets, character leases, revisions, movement/time bounds, attack cooldowns/damage limits, encounter HP/participation, loot claim IDs, quest requirements and bounty cooldowns. Requests are idempotent. Unique boss rewards are recorded per account character; dropped owned items use a one-claim escrow. Account-owned tables use RLS; internal ledgers have no client table grants.

The host still simulates the world. The database validates reward-producing events and economy operations; it is not a second full physics server or a claim of cheat-proof browser simulation. Conflicts pause cloud synchronization and preserve the outbox/recovery copy rather than overwriting newer server progress. Offline play is supported after the game has loaded; this is not an installable offline asset cache.

Local bounty cooldowns count active playtime. Account bounties use database time: thirty minutes for elite contracts, two hours for major bosses. Persistent and guest rooms are separated so unvalidated guest-session rewards cannot enter account progression.

## Validation and limits

See the dated expansion section in `VALIDATION.md` for executed checks. Hosted tests use two disposable confirmed email accounts and real Auth, RLS, RPC and private Realtime channels. They are distinct from deterministic browser service doubles and local PostgreSQL tests.

Physical Samsung/iPhone frame rates, Safari behaviour, thermal throttling, email inbox delivery and long-duration balance are not certified by desktop Chromium automation. Confirmation and recovery use the real Supabase APIs and configured Pages callback, but email delivery itself must be checked with a real inbox.
