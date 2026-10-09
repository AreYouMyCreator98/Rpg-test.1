# Realm of the Fallen — The Shattered Marches

A procedural 3D browser action RPG with a continuous expanded overworld, five settlements, sixteen quests, seven bosses, a cave dungeon and optional four-player Supabase co-op. The original forest, hero, equipment, goblins, village and Goblin Chief remain playable.

**Game files:** `ui.css`, `ui.js`, `index.html`, `frontier.js`, `living-world.js`, `multiplayer.js`, `supabase-rooms.js` and `multiplayer-config.js`. Keep them together. No frontend build is required. Solo needs no backend or credentials; optional multiplayer uses Supabase. Three.js remains pinned to **0.160.1** on jsDelivr; every model, effect and sound is generated locally.

## GitHub Pages

Upload **all eight game files** to the repository root on `main`. In **Settings → Pages**, select **Deploy from a branch → main → / (root)** and save. The **Validate game release** workflow checks that the static files use one consistent cache version. GitHub’s branch-based Pages publisher is the sole deployment path; the validation workflow deliberately does not publish a competing artifact. No application build or package installation is needed.

Expected address: https://areyoumycreator98.github.io/Rpg-test.1/

`README.md` and `tests/` are documentation and optional development checks, not runtime dependencies. The original playable version is preserved by Git tag **`v1.0-pre-living-world`**, pointing to commit `fbb002b`. Restoring that tag's `index.html` restores V1. Keep your browser's original save backup if rolling back; V1 cannot interpret new V2 equipment variants.

The working V2 baseline is preserved by tag **`v2.0-pre-multiplayer`** (`645f83e`).

## Emerald glass interface

The HUD follows the supplied portrait reference: separate gold pill, circular navigation, compass minimap/location pill, contextual talk action, illustrated equipment, concentric joystick and asymmetrical combat controls. Inventory, shops, journal, dialogue, settings and co-op menus use the same local design system. See [UI-DESIGN-SYSTEM.md](UI-DESIGN-SYSTEM.md) for tokens, SVG icons, integration points and validation limits. The previous interface is preserved by tag `v2.2-pre-reference-ui`.

## The Shattered Marches expansion

The playable overworld is approximately **eight times its previous area**, bounded by x −330…180 and z −340…180. Follow the western road from the original village to **Dawnwatch City**, then explore **Briarfield**, **Frostmere** and **Reedhaven**. Northern roads climb into the mountains; a third bridge links Dawnwatch to the northern territories. Village fountains restore health and stamina through Interact. Terrain, trees, buildings, enemies and combat remain genuine WebGL geometry.

| Territory / quest giver | New enemies | Boss / unique weapon |
| --- | --- | --- |
| Briarfield · Warden Rowan | Greyfang wolves | Fenrir, the Moonfang · Moonfang Sabre |
| Dawnwatch · Sister Aveline | Restless skeletons | Morvain, the Bone Regent · Dawnbreaker |
| Dawnwatch · Marshal Cera | Ashroad brigands | Captain Rook, the Oathbreaker · Oathkeeper |
| Reedhaven · Herbalist Nessa | Mirefang spiders | Silkmaw, Brood Mother · Silksteel Fang |
| Frostmere · Sage Orin | Stormbound elementals | Astrax, the Stormheart · Stormheart Edge |

Each giver offers a four-enemy hunt and a boss quest. Accept and claim rewards in conversation. Hunt counters start on acceptance; boss victories are remembered even if their quest is accepted later. Rewards can be claimed once. Boss weapons drop in the world and can be equipped and tempered at Bram's forge. Normal enemies respawn; defeated frontier bosses stay defeated in that solo save.

The **minimap** renders terrain relief and elevation contours, trees, rocks, roads, river crossings, buildings, quest targets, villagers, enemies, loot and party members. Use **+/−** for range, **N** to toggle north-up, and **Map** for the full atlas. Click or tap the atlas to place a waypoint; the minimap displays its distance. Inside Hollowroot, the map switches to cave rooms, the gate, pool, crystal formations and chest locations.

Old saves retain their original key, character, equipment, coins and quests. New quests and boss flags receive defaults; expanded positions and new weapons survive reload. Co-op synchronizes the expanded coordinates, telegraphs, boss completion and unique loot. As before, co-op uses fresh session characters and leaves solo saves untouched. Clients on different world revisions receive a reload message instead of silently desynchronizing.

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
the existing two game files. The Pages workflow publishes all five automatically.
Supabase's pinned SDK loads from jsDelivr only when connecting to multiplayer.

The room creator's browser simulates the shared world. The host must keep the tab
active; there is no host migration. Menus do not pause the world. Rooms use fresh,
session-only characters and never overwrite solo saves. Leaving restores solo
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
