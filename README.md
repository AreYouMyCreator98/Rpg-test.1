# Realm of the Fallen — V2: The Living World

A procedural 3D browser action RPG, now with a village, shops, six quests, a cave dungeon, and stamina-based combat. V2 extends the original forest, hero, equipment, goblins and Goblin Chief encounter.

**Game files:** `index.html` and `living-world.js`. Keep both together. No build, backend, account or API key is required. Three.js remains pinned to **0.160.1** on jsDelivr; every model, effect and sound is generated locally.

## GitHub Pages

Upload **both game files** to the repository root on `main`. In **Settings → Pages**, select **Deploy from a branch → main → / (root)** and save. GitHub publishes updates when that branch changes.

Expected address: https://areyoumycreator98.github.io/Rpg-test.1/

`README.md` and `tests/` are documentation and optional development checks, not runtime dependencies. The original playable version is preserved by Git tag **`v1.0-pre-living-world`**, pointing to commit `fbb002b`. Restoring that tag's `index.html` restores V1. Keep your browser's original save backup if rolling back; V1 cannot interpret new V2 equipment variants.

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
