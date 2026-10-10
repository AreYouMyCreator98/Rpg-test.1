# Realm of the Fallen — The Shattered Marches

A procedural 3D browser action RPG with a continuous expanded overworld, five settlements, thirty-three quests, fourteen bosses, five dungeons, pets, mounts and optional persistent four-player Supabase co-op. The original forest, hero, equipment, goblins, village and Goblin Chief remain playable.

**Game files:** `emerald-vale.js`, `emerald-landscape.js`, `environment-art.js`, `account-storage.js`, `scout-model.js`, `assets/environment/emerald-library.glb`, `assets/models/goblin_scout.glb`, `assets/models/goblin_scout_lod.glb`, `assets/goblin-scout.gltf`, `gathering.js`, `gathering-rules.js`, `prologue.js`, `homestead.js`, `building-rules.js`, `scene-batch.js`, `accounts.js`, `expansion-data.js`, `expansion-models.js`, `expansion-world.js`, `companions.js`, `supabase/game-catalog.json`, `progression.js`, `adventure-motion.js`, `visual-world.js`, `ui.css`, `ui.js`, `index.html`, `frontier.js`, `living-world.js`, `multiplayer.js`, `supabase-rooms.js` and `multiplayer-config.js`. Keep them together. No frontend build is required. Solo needs no backend or credentials; optional multiplayer uses Supabase. Three.js remains pinned to **0.160.1** on jsDelivr; environment and character assets are hosted here; no game-time asset generation tools are required.

## GitHub Pages

Upload **all thirty-six runtime files (including `supabase/game-catalog.json` `assets/models/goblin_scout.glb`, `assets/models/goblin_scout_lod.glb`, `assets/goblin-scout.gltf`, and `assets/environment/emerald-library.glb` in their folders)** to the repository root on `main`. In **Settings → Pages**, select **Deploy from a branch → main → / (root)** and save. The **Validate game release** workflow checks that the static files use one consistent cache version. GitHub’s branch-based Pages publisher is the sole deployment path; the validation workflow deliberately does not publish a competing artifact. No application build or package installation is needed.

Expected address: https://areyoumycreator98.github.io/Rpg-test.1/

`README.md` and `tests/` are documentation and optional development checks, not runtime dependencies. The original playable version is preserved by Git tag **`v1.0-pre-living-world`**, pointing to commit `fbb002b`. Restoring that tag's `index.html` restores V1. Keep your browser's original save backup if rolling back; V1 cannot interpret new V2 equipment variants.

The working V2 baseline is preserved by tag **`v2.0-pre-multiplayer`** (`645f83e`).

## Emerald Vale benchmark

Follow the western road beyond Briarfield to the bridge at x −430. **The Emerald Vale** covers a 200 × 200 area around that crossing, on the southern edge of Verdant Reach. Its forest uses a repository-hosted Blender-authored GLB library, instancing, near/far tree geometry, wind and moisture-based ground cover. Riverbanks use the shared terrain function; the atlas uses the same colour field. The original tree collision roots, bridge, settlements, quests and saves remain in place.

The authored library now serves 7,171 existing tree roots across the overworld. Nearby terrain and undergrowth stream in bounded cells; a coarse forest/terrain layer keeps the horizon continuous. **Settings → Environment & rendering** provides render scale, vegetation, view distance, shadows, water, effects and separate audio volumes. Low/Medium/High/Ultra/Auto preserve camera preferences and character saves.

Asset generation (development only): `blender -b --python scripts/build-emerald-assets.py`. The exported GLB is committed; GitHub Pages needs no Blender or build process. Optional `?diagnostics` shows render workload and rolling frame statistics. See [architecture](docs/ENVIRONMENT-ARCHITECTURE.md) and [benchmark validation](docs/EMERALD-VALE-VALIDATION.md) for the historical checkpoint. The current [Living Landscape validation](docs/LIVING-LANDSCAPE-VALIDATION.md) documents the wider rollout, tests and remaining device-validation limits.

## Cinematic world presentation

The existing world now has emerald woodland layers, wind-touched grass, wildflowers and ferns, worn paths, roof courses and timber bracing, framed glowing lanterns, a taller ruin skyline and a distant northern citadel. Warm sunlight, a cool sky gradient, filmic tone mapping, terrain ambient shading and soft character grounding work together without a full-screen postprocessing pass. Medium and High retain real-time sun shadows. Lantern glow is an inexpensive procedural halo, not screen-space bloom or an extra light per lantern.

The existing hero rig has a pleated cape, faceted pauldrons, hair and ear detail, metal sword fittings and a heraldic shield. Equipment still recolours the same live armour/weapon materials. The camera tries a small shoulder adjustment around obstacles before increasing elevation; movement and the minimap follow its actual bearing.

`visual-world.js` owns presentation only. Terrain uses the existing height function and is split into cullable tiles; building surfaces are batched; repeated scenery is spatially instanced; nearby grass has a simple vertex wind shader. Adaptive resolution steps down after sustained slow frames and recovers gradually, within the selected graphics preset. No combat timing, quest rewards, enemy counts, network protocol or save schema changed. The original is preserved as **`v2.3-pre-cinematic-world`**.

This is a playable visual upgrade, not a claim of pixel-identical reproduction of the reference. Physical Samsung/iPhone frame rates and thermal behaviour still need device testing. See `VALIDATION.md` for actual checks and measured rendering workloads.

## Quiet dark-fantasy interface

The default HUD keeps health/stamina, name/level, a single **Menu** action and mobile combat controls. **Menu → Journey** contains equipment, quests, world map, currency/XP, settings, multiplayer, controls and journey options. The minimap is off by default; enable **Minimap on HUD** in Journey to keep it visible. This preference is saved separately from your character. Heal shows potion quantity, and contextual interactions remain available beside nearby NPCs and loot.

All menus share the charcoal, muted-gold design tokens and SVG icons in `ui.css` / `ui.js`. Keyboard shortcuts remain available. See [UI-DESIGN-SYSTEM.md](UI-DESIGN-SYSTEM.md). This layout supersedes the older screenshot-recreation HUD at the user's request.

## The Shattered Marches expansion

The playable overworld covers **795,600 square world units**, three times the preceding frontier map, bounded by x −585…180 and z −860…180. Follow the western road from the original village to **Dawnwatch City**, then explore **Briarfield**, **Frostmere** and **Reedhaven**. Northern roads climb into the mountains; four bridges connect the riverbanks, including the western crossing into the Emerald Vale. Village fountains restore health and stamina through Interact. Terrain, trees, buildings, enemies and combat remain genuine WebGL geometry.

| Territory / quest giver | New enemies | Boss / unique weapon |
| --- | --- | --- |
| Briarfield · Warden Rowan | Greyfang wolves | Fenrir, the Moonfang · Moonfang Sabre |
| Dawnwatch · Sister Aveline | Restless skeletons | Morvain, the Bone Regent · Dawnbreaker |
| Dawnwatch · Marshal Cera | Ashroad brigands | Captain Rook, the Oathbreaker · Oathkeeper |
| Reedhaven · Herbalist Nessa | Mirefang spiders | Silkmaw, Brood Mother · Silksteel Fang |
| Frostmere · Sage Orin | Stormbound elementals | Astrax, the Stormheart · Stormheart Edge |

Each giver offers a four-enemy hunt and a boss quest. Accept and claim rewards in conversation. Hunt counters start on acceptance; boss victories are remembered even if their quest is accepted later. Rewards can be claimed once. Boss weapons drop in the world and can be equipped and tempered at Bram's forge. Normal enemies respawn; defeated frontier bosses stay defeated in that solo save.

The **minimap** renders terrain relief and elevation contours, trees, rocks, roads, river crossings, buildings, quest targets, villagers, enemies, loot and party members. Use **+/−** for range, **N** to toggle north-up, and **Map** for the full atlas. Click or tap the atlas to place a waypoint; the minimap displays its distance. Inside Hollowroot, the map switches to cave rooms, the gate, pool, crystal formations and chest locations.

Old saves retain their original key, character, equipment, coins and quests. New quests and boss flags receive defaults; expanded positions and new weapons survive reload. Co-op synchronizes the expanded coordinates, telegraphs, boss completion and unique loot. Co-op supports selected account characters in persistent rooms and fresh characters in guest rooms. Both keep the solo world separate. Clients on different world revisions receive a reload message instead of silently desynchronizing.

The pre-expansion working version is preserved by **`v2.1-pre-frontier`**. Repeated new trees and rocks use spatially grouped instancing; nearby collision uses a spatial grid; Low graphics reduces vegetation draw distance. Device frame rates depend on hardware and have not been certified.

## The living village

The original starting campfire remains at the centre of the settlement. Four timber-and-plaster buildings surround the village, alongside a forge, market stall, lanterns, barrels, fences and noticeboard.

- **Bram, blacksmith:** buy swords, equip purchases, or temper a weapon up to three times. Each upgrade adds **4 weapon damage**. Costs start at **35 coins and 2 teeth**; later ranks require more coins, more teeth and a moonstone. The forge previews costs and damage before purchase.
- **Mira, merchant:** buy potions and armour, sell trophies and unwanted equipment. Equipped gear must be unequipped before sale. Quest items cannot be sold or dropped.
- **Elowen, village keeper:** explains the main questline. The noticeboard opens your journal; accept and complete quests in conversations with their giver.

New characters receive **45 coins** to afford a first sword or basic armour. Returning characters keep their existing balance. Upgrading converts exactly one inventory copy into an upgraded variant; it does not duplicate the weapon or improve other copies for free.

## Six quests

| Quest | Giver | Task | Reward |
| --- | --- | --- | --- |
| A quieter forest | Bram | Defeat 5 scouts after acceptance | 45 coins, 40 XP |
| Teeth for the forge | Bram | Deliver 10 goblin teeth | 60 coins, 55 XP |
| The missing caravan | Mira | Clear the camp and recover its marked supplies | 75 coins, 65 XP |
| Beyond Stonebridge | Elowen | Discover the river crossing and Mountain Ruins | 60 coins, 70 XP |
| Beneath the roots | Elowen | Defeat Hollowroot's Guardian | 130 coins, 120 XP |
| A light brought home | Elowen | Bring the ancient relic back to the village | 180 coins, 140 XP |

Rewards can only be claimed once. Delivery quests consume their required items. Previously discovered landmarks and an already-defeated Guardian count when accepting those quests; scout kills count from acceptance. Selling or upgrading with teeth can reduce your current delivery progress until you gather more.

The journal separates main and side quests. Track an accepted quest for a distance indicator and a nearby golden world marker. The map shows your position, the original trail, river, locations, and discoveries. The original Chief objective remains available when no village quest is tracked.

## Hollowroot Cave

Follow the western branch from Whispering Forest to the rock entrance. Interact to enter; the exit remains behind you in the entry passage.

Explore torchlit corridors and the eastern scaffold chamber. Defeat nearby guards, open its chest and collect the **Hollowroot Key**. Interact with the iron gate to consume the key and open it permanently. Beyond it lies a larger chamber with crystals, underground water, hidden treasure and **Varg, the Rootbound Guardian**.

Varg has three telegraphed attacks: a sweeping strike, a committed lunge, and a wider ground slam. The amber ring marks the danger zone. Dodge or leave that zone before contact; a shield can soften a frontal hit. Defeating him drops **Hollowroot Fang**, an **Ancient Relic**, and coins. Collect them before returning to Elowen. Uncollected drops also survive reloads.

The Guardian is a persistent one-time encounter per new game. Gruk, the original Goblin Chief, remains in the Mountain Ruins and can still be reset from the pause menu. Resetting Gruk does not reset quests, cave treasure or the Guardian.

## Combat and controls

| Desktop | Action |
| --- | --- |
| W A S D | Camera-relative movement |
| Shift | Sprint; drains stamina |
| Right mouse drag / wheel | Orbit / zoom |
| Left click | Strike; click during a swing to queue the next combo hit |
| Space | Dodge; costs 25 stamina |
| F, held | Raise shield against frontal attacks |
| E | Collect nearby loot, talk, open chests/gates, enter/exit cave, rest |
| I | Inventory and equipment |
| H | Drink potion |
| J / M | Quest journal / world map |
| Escape | Pause / close menu |

On phones, move with the joystick; push it fully to sprint. Swipe open world space to orbit. Use Attack, Dodge, Heal, Block, Interact/Loot, Satchel, Journal and Pause. **Block is held**, not toggled. Movement works simultaneously with attack or blocking. Portrait and landscape are supported.

Stamina regenerates after a short pause. Sprinting and dodging spend it; blocking consumes stamina on impact and slowly while held. A successful frontal block reduces incoming damage by roughly 78%. If your guard breaks, you briefly cannot dodge, but ordinary walking and sword attacks still work. Turning your back to an attacker leaves you unprotected.

The three-hit combo identity is unchanged. V2 adds eased attack transitions, hip/shoulder counter-rotation, tucked rolls, enemy recoil, brief impact shake, light/heavy hit sounds and improved group separation. Potions restore up to 65 HP; the original campfire fully heals you. Level cap remains 20.

## Saves and compatibility

V2 continues using the existing **`realm-fallen-save-v1` LocalStorage key**, with a **version 2 payload**. It migrates V1 levels, XP, health, coins, inventory, equipment, discoveries, chest state, drops and Chief completion. Before the first migration on Continue, the original payload is backed up as **`realm-fallen-save-v1-backup`** when storage is available.

V2 also saves upgraded item identities, stamina, quest statuses/counters, gate/key/chest state, Guardian completion, relic ownership and the current region. New Game asks before replacing progress. Saves belong to that browser and website origin; they do not transfer automatically between localhost and GitHub Pages. Private browsing or clearing site data can remove saves. Corrupt or unsupported save versions are rejected rather than crashing the game.

## Development and validation

Serve this directory with any static HTTP server. For example, if Python is available:

```sh
python -m http.server 8000
```

Use the existing checkout; no worktree or application build is needed. `index.html` retains V1 rendering, character rigs, controls, combat, inventory and saves. `living-world.js` adds village/economy, quest, and cave systems through explicit integration hooks.

Optional automated checks are in `tests/`. They need an existing Node.js, Playwright and Chromium installation **for testing only**. Set `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` if those tools are installed outside normal locations. `GAME_URL` defaults to the locally served root. `THREE_TEST_MODULE` optionally points to a certificate-verified copy of the pinned CDN module when a test machine's browser cannot trust its HTTPS proxy. No certificate checks are disabled.

```sh
node tests/v2-browser.cjs
node tests/v2-combat.cjs
node tests/v2-mobile.cjs
node tests/v2-navigation.cjs
```

`?test` enables deterministic stepping and inspection hooks for the automated tests; normal URLs do not expose them. Tests set up fixtures to isolate economy, quest and combat cases, then exercise the real transaction, item, collision, animation and damage paths. Touch tests dispatch Chromium multitouch events.

See [VALIDATION.md](VALIDATION.md) for tested outcomes and remaining limitations. Physical Android/iPhone performance, Safari and hardware FPS targets require device testing; headless software WebGL does not establish those results.

## Multiplayer: private rooms and public worlds

Choose **Play together** on the title screen. Up to four players can join a private
invite-code room or browse public worlds. Movement, equipment, sword attacks,
enemy AI, bosses, ground loot, chests and the cave gate are shared. Nearby players
earn kill XP; personal shops and quests remain available.

This mode uses **Supabase**. Follow [the step-by-step setup](supabase/SETUP.md) to
create a free-plan project, enable anonymous sign-in, run the SQL and configure
the browser-safe URL/publishable key. The static game still needs no build process;
include `multiplayer.js`, `supabase-rooms.js` and `multiplayer-config.js` alongside
the other game files. GitHub Pages serves the versioned runtime files directly from main.
Supabase's pinned SDK loads from jsDelivr only when connecting to multiplayer.

The room creator's browser simulates the shared world. The host must keep the tab
active; there is no host migration. Menus do not pause the world. Rooms use fresh,
separate room-world state and never overwrite solo-world progress. Account characters keep validated progression; guest characters remain session-only. Leaving restores solo
progress. This is casual co-op, with client-reported movement/equipment, not an
MMO or a cheat-resistant competitive service. Public/private room authorization
is enforced with Supabase RPC/RLS and per-sender private Realtime topics.

Additional optional development tests:

```sh
# Requires @electric-sql/pglite@0.3.14, only for testing SQL locally.
node tests/multiplayer-sql.cjs
node tests/multiplayer-browser.cjs
```

`PGLITE_PATH` can point to an externally installed PGlite package. The SQL test
runs actual PostgreSQL functions and RLS in PGlite. The browser suite uses two
clients with a deterministic Supabase service double; it tests the real transport
adapter/game integration but does **not** establish connectivity to a live project.

An opt-in live test is available as `node tests/multiplayer-live.cjs`. It creates
two anonymous users and temporary rooms in the configured project, then cleans
up room membership. Run it only when authorized to test that project. It uses
real Supabase RPC and Realtime traffic. For this proxy-constrained cloud workspace,
set `REALM_TEST_PROXY=1` and `NETWORK_TOOLS_ROOT` to a directory containing
`ws@8.22.0` and `https-proxy-agent@7.0.6`. The proxy test path verifies TLS for
both HTTP and WebSockets and preserves binary frames; it does not weaken the game’s
normal browser connection.

## Expansion Stage 1 — movement and camera

The shared hero rig now has articulated knees and a forward shoulder roll with anticipation, tuck and recovery; core-mesh ground contact is maintained while the existing collision movement and invulnerability remain active. Remote party members use the same pose. Base stamina is 150, regeneration is 18/second after the existing recovery delay, and dodging costs 25. Old saves preserve their stamina percentage; rest points refill the new maximum.

Open **Menu → Settings → Camera & accessibility** for live FOV (45–100°, default 70°), classic/shoulder/first-person view, shoulder side, sensitivity and vertical inversion. Preferences stay on this device. First-person hides the local head, torso and cape while retaining the existing weapon rig and combat. Mobile orbit uses the same preferences. Mounts blend camera height with their mounting transition and remain excluded from dungeon interiors.

## Expansion Stage 2 — character builds

**Journey → Attributes / Skill trees** adds five attributes (30 allocated points maximum each), preview-and-confirm spending, and three connected six-node skill paths. Each level grants three attribute points and one skill point. Returning characters receive the points earned by their existing levels. The cap is now 40; the original XP curve through level 20 remains intact, then grows more steeply. Beyond level 20, enemy health/damage/XP scale on starting a world or respawning, without changing an ongoing fight.

All 18 nodes change combat calculations. Whirlwind Slash changes the third attack in the existing combo into a circular sweep, so it uses the same desktop/touch attack control. Other nodes improve damage, criticals, stagger, defence, potion healing, stamina, movement, dodge or blocking. Skills can be reset for 50 + 10 × level gold. Resetting does not refill health or stamina. Attribute allocation is permanent for this stage.

Saves use schema 3 under the original storage key. Before continuing an older save, the exact original is retained under `realm-fallen-save-v1-pre-progression`; if that backup cannot be written, migration stops instead of overwriting it. Original quest/boss state and equipment remain separate from character attributes. Account characters retain their builds between solo and persistent co-op; guest rooms remain session-only.

## Accurate atlas and material detail

The minimap follows the camera with a white view arrow and fan. A small gold tick shows the hero's facing direction separately. North-up and the full atlas retain compass orientation. Terrain colours and paths share the world's terrain function; river width, bridges and village building footprints use the world data. Map waypoints, quest targets, NPCs and party markers remain interactive.

The presentation uses three generated 128×128 detail textures for ground, timber and masonry, merged building materials, warmer sunlight and adjusted filmic exposure. No image downloads or additional drawing batches are needed. These are subtle material improvements, not a replacement world or a promise of reference-image parity.

## Accounts, cloud saves and persistent co-op

Open **Accounts & characters** on the title screen, or **Journey → Adventurers**. Create/confirm an email account, then choose one of five slots. You can start fresh or import the existing local character once. Importing writes `realm-fallen-save-v1-before-account-import` before contacting the server; the original local save remains untouched. Legacy imports are explicitly grandfathered, while future progression uses validated server events.

Choose an account adventurer before creating/joining a persistent room. All participants in that room need an account character. Guest rooms remain available with fresh session-only heroes. Solo position, quests and boss completion stay separate from room-world state; legitimate character progression returns with the adventurer.

Offline actions are queued locally after the game has loaded. Reconnecting renews the character lease and replays typed commands, not arbitrary inventory snapshots. Conflicting revisions preserve both copies and pause synchronization. The Accounts screen can download a recovery copy or explicitly resume the newer cloud copy. Delete confirms before archiving a slot; historical revisions remain private to its owner.

The existing project is configured with the Pages Auth callback. For a new project, install these reviewed SQL files in order: `multiplayer.sql`, `characters-foundation.sql`, `character-commands.sql`, `character-runtime.sql`, `game-catalog-seed.sql`, `persistent-rooms.sql`, `prologue.sql`, `homesteads.sql`. Enable email Auth and anonymous Auth for guest rooms. Set the Auth site URL/redirect allowlist to your Pages directory. Keep service-role and management tokens out of game files. Only the browser-safe publishable key belongs in `multiplayer-config.js`.

The database owns prices, resources, point budgets, encounter/reward rules, claim IDs and account bounty clocks. RLS protects each owner's characters and backups. See [EXPANSION-STATUS.md](EXPANSION-STATUS.md) for the trust boundary and [VALIDATION.md](VALIDATION.md) for executed tests.

## Dungeons, contracts and companions

Speak with Elowen for ten creature hunts and seven boss quests. The forest leads to Rootbound Catacombs; marsh paths lead to the Sunken Temple; mountain routes reach Frostspire Crypt; the northwestern ruins lead to the Obsidian Forge. Each contains connected rooms, an alternate route, treasure, a gate and a named boss. Three additional bosses await in the overworld. Hollowroot and all seven earlier bosses remain.

The large village bounty board offers repeatable elite and boss contracts. Account cooldowns use server time; local cooldowns count active playtime. Unique boss weapons cannot be repeatedly awarded to the same account character.

**Journey → Companions** unlocks five pets with small passive bonuses. **Mount stable** unlocks the horse, dire wolf and Emberhorn. Summon/dismount there or with **R**; Attack/Dodge also dismount before combat. The stamina bar shows mount stamina while riding. Pets and mounted riders are visible to party members. No additional HUD panels are required.

### Map navigation

The open map has independent **− / +** zoom controls. Drag to pan, pinch with two fingers or use a mouse wheel to zoom. The pin button centers the hero; the expand-arrows button fits the entire map. Tap the terrain to place a waypoint at the displayed coordinates. More readable landmark labels appear as space becomes available while zooming. These controls also work in Hollowroot and the four expansion dungeons. Terrain is refreshed when opening the atlas or returning to the browser tab.

## Resuming an account or switching browsers

Use **Continue → choose your adventurer** (or **Accounts & characters**, then sign in). Local solo saves and account characters are separate. Each browser, including Safari and Messenger, needs its own sign-in to the same email account.

If synchronization is paused, **Use cloud copy (keep offline backup)** resumes the last accepted cloud progress and archives unsynced local actions first. **Download previous offline backup** exports that archive; its JSON text is a recovery file, not a playable page. Do not delete a character or clear browser data to resolve a conflict.

Before switching devices or browsers, use **Accounts → Save & release for another browser**. If a crashed or closed browser still holds the character, wait up to 90 seconds for its lease to expire. Only one browser may play the same character at a time.


## The Unburied and building a home

New solo characters awaken with their rusty blade in the Unmarked Graves. Read the warning, defeat three grave robbers, break the northern gate, then follow the road to Bram’s charter at the village. Story checkpoints and defeated grave robbers persist. Existing characters keep their level, equipment, position and progression; missing prologue data means an established journey, not a new character. Co-op still starts in the village.

Open **Journey → Build / foundations** (desktop **B**). Choose **Home Base foundation** or **Co-op Base foundation**, then mark its plot on the map. The plots are south-west of Wanderer’s Village. Walk near a cell, choose a part, rotate with the button or **T**, and place a green preview. Finish exits construction. Movement and camera controls stay active. Mounting still uses R.

Both bases support foundations, walls, window walls, working doors, stairs, upper floors and pitched roofs. New foundations attach to existing ones; upper floors need stairs, and roofs need two supporting walls. Closed doors block passage; use Interact to open them. Storeys are selected in the construction menu. Salvage returns half the material cost and cannot remove occupied supports.

Each base has separate supplies and a 64-piece limit. Existing buildings and stock are preserved. The old replenishing supply pile is now a workbench and storage chest; gather raw materials to replenish construction supplies. These supplies are separate from equipment, currency and progression.

A Home Base belongs to its owner; visitors cannot edit it. The Co-op Base belongs to the host’s character and is shared by that host’s parties, not duplicated for every room. Account bases persist in Supabase across devices. Server commands enforce membership, ownership, material costs, placement/support rules, proximity, version conflicts and idempotent retries. Anonymous parties use host-authoritative construction; their base remains on the host’s browser. Solo local homes remain in the existing save. Account and anonymous base stores are intentionally separate; existing character imports do not automatically import browser-built structures.

For a new Supabase installation, apply the complete schema sequence above. On an existing configured project, install the updated runtime/catalog and the additive prologue/homesteads migrations. They change the default for future characters and add protected estate tables; they do not reset existing characters.


## Gathering, tools and the first shelter

Speak to Bram and choose **Learn to gather & build a shelter**, or open **Journey → Gather & craft**. Each Home/Co-op plot has a fixed workbench and storage chest on its eastern edge. The workshop can mark these stations and resource deposits on the real map.

Craft a stone axe (4 timber, 2 stone) and pickaxe (4 timber, 3 stone) from existing stored supplies. At marked trees, stone deposits and iron veins, use **Interact / E** to swing the appropriate tool. Three strikes collect 6 logs, 6 rough stone or 4 ore into your builder pack. Deposits regenerate after two minutes. If supplies run out before making tools, collect loose branches and stones by hand; iron needs a pickaxe. Ordinary attack remains sword combat.

Deposit gathered materials at the chest, then use the workbench:

- 2 logs → 8 timber planks.
- 2 rough stone → 6 stone blocks.
- 2 iron ore → 6 nails.
- 8 timber + 6 nails → iron axe upgrade.
- 8 timber + 8 nails → iron pickaxe upgrade.

Iron tools deplete a deposit in two strikes. Tools and carried materials belong to each builder **at that base**; they do not automatically travel between bases. Co-op stored supplies are shared, while each builder has their own pack. Each material is capped at 500. Transfers, recipes and building consume actual stock atomically.

Accept **A roof of your own** before gathering. Collect 6 logs and 6 rough stone, craft 8 timber and 6 blocks, then build a foundation with four wall edges including a door and window, plus a roof. Claim 80 timber and 40 stone once per base at Bram or the workbench. Home and Co-op track separate contracts; party contributions count together for the shared base.

Account-backed gathering uses server time, position checks, character identity, version checks and request replay protection. Install the updated `supabase/homesteads.sql` on an existing project before serving this release. It adds protected commands without resetting buildings or character progression. Anonymous co-op remains host-authoritative.


## Return to the main town

After visiting **Wanderer’s Village**, open **Journey → Return to village** or the world map’s **Return to Wanderer’s Village** button. Confirm to arrive at the campfire. This is free, one-way travel to the main starting village only; no other destinations are offered. It does not heal you, consume gold, reset encounters or move your party members. Mounts are dismounted and companions arrive beside you.

Return is unavailable before your first village visit, while dead, inside dungeons, within 20 metres of living enemies, or for eight seconds after combat. Existing saved village discoveries are preserved. Cloud characters need a connection; the server validates discovery and safety, and retries reuse the same request. Co-op returns change only your current party position, preserving your separate solo position.

Deploy the updated `supabase/character-runtime.sql` before this frontend release. The additive migration preserves existing discoveries once; new visits come from validated server positions. It does not reset characters or progression.

### Goblin Scout asset

The Red Cowl Scout is authored with free Blender/Python and loaded from
`assets/models/goblin_scout.glb`: 9,925 triangles, 22 bones, 11 material primitives
and six animation clips. An optional 4,928-triangle LOD streams in the background
and reuses the same rig at distance. Seven ordinary Scouts use independent skinned skeletons
with shared geometry/materials. AI, HP, hitboxes, rewards and saves are unchanged.
The original `assets/goblin-scout.gltf` and procedural model remain loading fallbacks.

See [the free authoring pipeline](scripts/characters/README.md) for regeneration
commands and [the validation record](docs/RED-COWL-VALIDATION.md) for actual checks
and limitations. Players need no Blender, Python or build process. Static staging
includes both assets and uses the game's pinned Three.js 0.160.1.

### Wildlands landscape update

The overworld is now 765 × 1,040 world metres (795,600 square metres), exactly three times its previous area. Expansion is north and west; original towns, enemy homes, boss arenas, quest IDs and saved discovery indices stay in place. Four scenic regions—Verdant Reach, Jadegrove Hollow, Cloudstep Highlands and Crown of Heaven—are connected by traversable trails; a fourth wooden bridge crosses the western river. These are exploration landscapes, not additional quest/boss encounters.

`environment-art.js` supplies shared smooth foliage and wind animation. Rounded canopy clusters, layered evergreen shapes, softer outdoor light, ridged mountain silhouettes and terrain shading establish an anime-inspired environment while existing characters and equipment remain intact. Near terrain is distance culled; coarse terrain, instanced mountains and lower-detail distant pines preserve the horizon. The Low/Medium/High settings and adaptive rendering remain available. No new asset service or build step is required.

The minimap/full map derive extents from `BOUNDS`. Multiplayer pose validation and `supabase/character-runtime.sql` use the expanded coordinate range; install the updated SQL before deploying this client to a different Supabase project. This deployment has already updated the existing project's validator.

Account storage now writes the essential outbox before attempting its optional rolling backup. Only byte-identical backup duplicates may be reclaimed automatically; distinct recovery copies and other characters are preserved. Accounts offers **Retry saving & resume sync** after a storage failure. If browser storage is actually unavailable, keep the tab open and download a recovery copy before freeing space; the game does not silently discard pending progress.
