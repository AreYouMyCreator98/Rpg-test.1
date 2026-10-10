# V2 validation

Validated against the final V2 game files with headless Chromium, software WebGL and Playwright. All four checked-in suites completed successfully. No JavaScript exceptions were captured.

| Suite | Verified |
| --- | --- |
| `tests/v2-browser.cjs` | Game initialization; NPC conversations; coin debits; weapon upgrade identity and resource consumption; duplicate purchase/sale rejection; equipped-item sale protection; potion purchase; inventory persistence; kill-driven quest progress; material turn-ins; journal/map; cave entry/exit; wall, water and gate collision; key consumption; Guardian loot; separate Chief completion state; cave save restoration; all six quest completions; consumed relic/supplies; one-time rewards after reload. |
| `tests/v2-combat.cjs` | Migration of a V1 character's level, XP, HP, coins, inventory, equipment and Chief completion; original-save backup; default stamina; reduced shield damage and stamina debit; guard break; normal movement while exhausted; dodge lockout/recovery; sprint stamina; all three combo contact windows; Guardian AI selecting three damaging patterns; Guardian and original Chief defeated with normal sword attacks. |
| `tests/v2-mobile.cjs` | Chromium touchscreen events for simultaneous movement/attack and movement/block; block release; touch camera orbit; NPC interaction; purchase/equip; journal/map; inventory; graphics settings; portrait and landscape layout bounds. |
| `tests/v2-navigation.cjs` | Keyboard traversal from cave arrival through the passage to the scaffold chest; key pickup; stopping at the locked gate; unlocking and entering the arena; stopping at underground water; safe portal arrival; scene rendering. |

The tests use controlled fixtures to isolate systems. Combat and traversal can advance the real update functions at a fixed delta through the `?test` hook, while rendering and interface/input checks run in the browser. Enemy kills for economy/quest fixtures use the actual damage/death/drop pipeline; the separate combat suite defeats both bosses using ordinary sword attacks.

## Rendering and source checks

- JavaScript syntax checks passed for the inline game module and `living-world.js`.
- `git diff --check` passed.
- Screenshots were inspected for the village, cave, portrait phone and landscape phone layouts.
- A representative final village view at Low quality measured **234 draw calls, 104,653 triangles and 22 geometries**. This is a workload snapshot, **not a hardware FPS result**.
- Cave floors and walls use instancing. Cave illumination uses a pool of three nearby point lights. The original instanced forest vegetation and quality controls remain intact.
- The test environment's Chromium does not trust its HTTPS proxy certificate. Tests received the exact pinned Three.js module downloaded over certificate-verified HTTPS. TLS verification was not disabled. The game's CDN URL remains unchanged.

## Remaining device checks

Physical Android and iPhone devices, Safari/WebKit, audible sound quality on device speakers, battery consumption and hardware frame-rate targets were not tested here. The touchscreen results are Chromium emulation, not a claim of physical-device testing. Real-device playtesting remains advisable before promising a specific mobile FPS.

## Recovery

The original working V1 is retained at tag `v1.0-pre-living-world`. V2 migrates the original LocalStorage key in place and keeps the first V1 payload in `realm-fallen-save-v1-backup` when available. New Game deliberately replaces current progress only after confirmation.

## Multiplayer update — 9 October 2026

The Supabase-backed co-op integration has been validated locally **and against
the configured live Supabase project**. Anonymous sign-in, the installed room
functions and private Realtime messaging all responded successfully. The user
supplied the browser-safe project URL/key and enabled the Auth/SQL configuration.
The development network restriction was resolved before live testing.

- `tests/multiplayer-sql.cjs` passed using PGlite 0.3.14 (PostgreSQL): SQL
  installation and reinstallation, anonymous-user identities, private-room hiding,
  bad-code rejection, four-member capacity, duplicate-membership rejection,
  per-sender topic authorization, actual RLS rejection of a forged host write,
  leave/host-end handling, public discovery and stale-room expiry. Auth and
  Realtime schemas are fixtures in this local suite; hosted checks are listed below.
- `tests/multiplayer-browser.cjs` passed with two browser clients and the real
  `supabase-rooms.js` adapter against a deterministic Supabase SDK service double:
  private creation/code join, public discovery/join, remote movement/equipment,
  atomic contested loot pickup, remote sword damage, AI chasing and damaging a
  guest, shared death/XP/drops, cave key and gate, Guardian attacking a guest while
  the host's menu is open, host departure, solo-save restoration and cleanup.
  No browser JavaScript exceptions were captured. Rendering is throttled in this
  suite to keep software-GPU load from obscuring the gameplay/transport checks;
  it does not measure network latency or hardware performance.
- The actual pinned Supabase JS **2.117.3** browser SDK and its eight dependencies
  were retrieved over certificate-verified HTTPS from jsDelivr. Chromium imported
  them, created a client and initialized its private-channel API successfully.
  This checks module compatibility, not connectivity to a real Supabase project.
- All four original V2 suites passed during integration. The combat suite passed
  again after the Guardian lunge correction and shared-world loop changes. The
  correction stops the lunge short of its target instead of overshooting contact.
- Solo saves remain in `realm-fallen-save-v1`. Co-op does not write that key;
  tests verified its exact stored value stayed unchanged during the room session.
  Leaving resumes the saved solo character. Co-op progression is session-only.

- `tests/multiplayer-live.cjs` passed against the real project with two Chromium
  clients: anonymous sign-in, private room creation/code join and hidden listing,
  authenticated Realtime, remote avatars, contested loot granted once, a guest
  taking enemy damage and damaging the host's enemy with sword attacks, public
  discovery/join, host departure and room cleanup. No browser exceptions occurred.
  No Supabase responses or gameplay messages were mocked. In this cloud workspace,
  HTTP and WebSocket traffic passed through a certificate-verifying proxy adapter;
  the adapter preserves text and binary frames. This avoids Chromium's untrusted
  proxy certificate without disabling TLS validation. Separate direct live RPC
  checks also verified that the permission helper allows guest reads and denies
  guest writes to the host’s topic.
- Initial live tests exposed a test-proxy binary-frame decoding issue, which was
  corrected. Auth identities are now kept in memory per tab so Supabase's
  persistent-auth BroadcastChannel cannot replace another tab's identity.
- A delayed room-state response delivered after leaving was tested: it does not
  restore stale membership, and the client can immediately join another room.

Not validated: four simultaneous rendered clients, physical iOS/Android/Safari,
mobile FPS, hostile-client anti-cheat, provider quota exhaustion, sustained
packet loss or long-running sessions. The two-client live checks used a single
cloud machine; they are not a substitute for a test on two physical devices.

## Shattered Marches expansion — 10 October 2026

`tests/frontier-browser.cjs` runs the real WebGL game in Chromium. It verifies 49 enemies, 16 quest definitions, four added settlements, collision-grid routes from the starting village to every quest giver and boss, all ten new quests through the real damage/death pipeline, five unique boss weapon drops, rejection of repeated claims, frontier weapon and coordinate persistence, and permanent boss completion after reload. Each new boss takes a normal sword hit and naturally selects all three damaging attack patterns. Map tests cover waypoint placement/clear, journal navigation, cave mode and portrait layout bounds. No page exceptions were captured.

All four original V2 suites were rerun successfully after integration, including original Guardian/Chief sword combat, old-save migration, cave traversal and genuine simultaneous Chromium touch input. `tests/multiplayer-browser.cjs` adds two-client checks for poses beyond z −300, frontier boss flags and unique loot replication; the existing private/public room, authority, shared-loot, cave and solo-save isolation checks remain in place.

Terrain is baked once into the map canvas; dynamic markers update at about 6 Hz. Vegetation uses spatial chunks and lower draw distance on Low. Collision uses nearby grid cells. These checks do **not** establish sustained FPS, battery use or thermal performance on physical Android/iPhone hardware; physical Safari/device testing remains unperformed. Navigation is a collision-grid reachability check, supplemented by the existing real-input cave traversal suite, rather than a complete manual walk of every overworld road.

The expanded two-client suite also passed against the configured **live Supabase project** using its actual anonymous Auth, room RPCs and authenticated Realtime transport. It verified private/public joins, shared pickup exclusivity, authoritative guest combat, northern-region movement, the Stormheart boss completion flag and its weapon drop reaching the other client, host departure and room cleanup. The environment's HTTPS/WebSocket proxy was used with certificate verification enabled; no service double was used for this live suite.

## Emerald glass reference UI — 10 October 2026

The UI uses one shared `ui.css` stylesheet and one `ui.js` SVG/presentation module. It preserves existing world/combat/economy/save/network logic. The only input adjustment normalizes joystick displacement against its resized rendered radius.

The existing `v2-mobile`, `v2-browser`, `frontier-browser` and two-client `multiplayer-browser` suites passed with the new interface. This includes real simultaneous Chromium touchscreen movement/attack and movement/block, touch camera orbit, dialogue and shop purchases, equipment, journal/map, save/load, old quest rewards, expanded bosses/progression, public/private rooms, remote combat and unique loot synchronization. Multiplayer uses the suite's service double with the real adapter; no claim of a new live Supabase run is made for this UI-only release.

UI-specific checks and screenshots cover the reference 864×1536 portrait, 390×844 phone, 320×568 narrow phone, 844×390 landscape, 1440×900 desktop and simulated top/bottom safe areas. Corrections found during testing included the location pill's layout, narrow currency overflow, desktop journal target height and contextual-prompt clearance above the smallest joystick. Images were visually compared with the supplied reference; reference HUD anchor positions are also asserted. Literal image pixel identity, physical mobile Safari/Android performance and hardware-specific blur/font rendering remain unverified. See `UI-DESIGN-SYSTEM.md` for details.

## Mobile mixed-cache repair — 10 October 2026

A user screenshot exposed a release-loading regression missed by the clean-page UI tests. Reproducing pre-interface HTML (`v2.2-pre-reference-ui`) with the current unversioned map module produced the old HUD and a minimap spanning the full 360px viewport, matching the reported failure. GitHub Pages responses advertise `Cache-Control: max-age=600`.

All local stylesheet/module URLs now carry a shared release identity; `scripts/stage-pages.py` validates that those URLs share one identity and copies the source files unchanged. The repository already has branch-based Pages publishing enabled; the competing custom deployment was replaced with validation only. The map module detects the obsolete HUD before initialization and navigates to a fresh entry URL. Missing UI CSS prevents entering unstyled gameplay. Neither recovery path clears browser storage.

`tests/ui-cache-upgrade.cjs` passed against staged deployment files: stale HTML automatically recovered, the minimap stayed under 110px in a 360×650 touch viewport, SVG controls appeared, and the exact saved character persisted (456 coins, 83 HP, Steel Sword). A failed-stylesheet case kept Play disabled and the save intact. This explicitly exercises an upgrade from an older page, rather than only a clean browser launch.

## Cinematic playable world — October 2026

The upgrade is applied to the existing Three.js scene through `visual-world.js` and small renderer/rig/camera integration changes. It retains 49 enemies, 16 quests, the original height/collision functions and save schema. Static building surfaces are batched; terrain is split into frustum-cullable tiles; decorative vegetation uses spatial instancing. Low retains inexpensive terrain ambient shading and soft character grounding; Medium/High add the existing real-time sun shadows. Lantern halos approximate local glow without a full-screen bloom pass.

Executed checks during implementation:

- `v2-browser`: shop transactions, equipment upgrades, duplicate-sale protection, six original quests, cave gate/key, Guardian loot, old/new progression and save/load passed.
- `v2-combat`: V1 migration, shield/stamina, exhaustion, dodging, original three-hit contact windows, Guardian patterns and normal sword kills of Guardian/Chief passed. The suite's obsolete hidden Pause selector was corrected to the current visible button.
- `v2-mobile`: Chromium multitouch movement/attack and movement/block, release, camera orbit, dialogue, purchase/equip, map/journal, inventory, settings and portrait/landscape bounds passed after the camera changes.
- `v2-navigation`: real-keyboard cave traversal through the key chamber, gate and water boundary passed.
- `frontier-browser`: routes to every quest giver/boss, ten expansion quests, unique drops, one-time rewards, all five boss patterns, save coordinates and map/cave minimap passed.
- `ui-browser`: reference portrait, narrow/small phones, safe areas, landscape and desktop layouts passed, including live stats and functional menus. Screenshots were inspected against the supplied reference; this is not a claim of pixel identity.
- `visual-browser`: real WebGL/shader startup, Low rendering budget (final village sample: 199 draw calls / 143,859 triangles), third-person framing at six locations, adaptive resolution under ordinary and severe slow frames, recovery, cave visibility/lighting, quality switching and save reload passed. No JavaScript, shader or console errors were captured.
- `ui-cache-upgrade`: both pre-design-system HTML and the previous emerald HUD release recover to the new asset identity, preserving currency, equipment and HP. Missing CSS still prevents unstyled gameplay and keeps saves intact.

The two-client multiplayer harness caps software-renderer resolution at its pre-existing quarter-resolution test budget, including subsequent adaptive-resolution requests. Initial concurrent runs timed out during combat while sharing the software GPU; assertions were not removed or loosened. The isolated two-client run passed public/private rooms, movement/equipment, shared pickup exclusivity, guest damage and sword hits, expanded-world boss/loot replication, shared cave gate, Guardian combat while the host menu was open, departure and solo-save restoration. Live Supabase networking is unchanged and has not been re-certified for this visual release.

Representative 390×844 Low village captures used approximately 185–206 draw calls and 134–144k triangles during iteration. These are scene workloads, **not FPS measurements**. Quality presets, slower-frame resolution reduction and gradual recovery are exercised by the visual suite. Physical Samsung/iPhone/Safari, battery drain, thermal throttling and sustained 30–60 FPS remain unverified. Distant architecture is scenery; it adds no new dungeon or quest. Existing attack/dodge timing and animation blending are retained; the new equipment details move on the existing articulated rig.

## Quiet dark-fantasy HUD — 10 October 2026

At the user's request, the screenshot-recreation HUD was replaced by a minimal combat HUD and a single Journey menu. Equipment, quests, currency/XP, world map, settings, controls and multiplayer remain reachable. The optional minimap preference is independent of character saves. HUD action targets remain at least 44px; touch controls retain their original gameplay handlers. Combat, world rendering, economy and save formats are unchanged.

`quiet-ui.cjs` (also available through the established `ui-browser.cjs` entry point) verifies decluttering, control bounds/separation, menu destinations, optional-map persistence, currency save/load and NPC/shop access. The mobile checks cover 360×650, 320×568 and 844×390; desktop uses 1440×900. The desktop interaction test lowers software rendering resolution while retaining the CSS viewport. `v2-mobile.cjs` passed simultaneous touch movement/attack and movement/block, release, orbit, shop/equip, journal/map, inventory, settings and portrait/landscape bounds using the new menu routes. `ui-cache-upgrade.cjs` passed both stale-entry cases and missing-CSS protection with saved character data intact.

Actual gameplay and settled-menu screenshots were inspected. This update does not certify physical Samsung/iOS performance or rerun live Supabase network tests. The multiplayer menu entry is exercised; the transport and room rules are unchanged. Older UI-dependent suites have been updated to navigate through Journey rather than clicking controls now intentionally hidden from the HUD.

## Expansion Stage 1 — 2026-10-10

Passed Chromium WebGL `movement-camera.cjs`: actual render frames, grounded core-mesh contact sampled through anticipation/turn/recovery, knee tuck, live FOV, three camera modes and local head visibility, camera preference persistence, 150 stamina / 18-per-second regeneration / 25 roll cost, invulnerability and first-person cave transition. Screenshots inspected for first-person world rendering and camera settings.

Passed `v2-combat.cjs` after the final render-loop correction: V1 inventory/XP/health/coins/equipment/world migration and backup; shield reduction, guard break, exhaustion movement, sprint, combo damage, Guardian patterns and defeat, original Chief defeat. Passed `v2-mobile.cjs`: CDP multitouch move+attack/block, orbit, dialogue, shops/equipment, journal, map, settings and portrait/landscape controls. Passed `multiplayer-browser.cjs`: two rendered clients through the real transport adapter with a service double; room lifecycle, remote poses/equipment, single shared pickups, combat/XP/loot, cave gate and bosses, northern boss, solo restore. This was not a live Supabase test. Static release validation and JavaScript syntax checks passed.

Not verified on physical Samsung/iPhone hardware. Mount camera behaviour cannot be tested before mounts exist. Later expansion stages are not included in these results.

## Expansion Stage 2 — 2026-10-10

Passed `progression-unit.cjs`: effects for all 18 skills and five attributes, allocation budgets/prerequisites, malformed-allocation normalization, migration idempotency, extended XP curve, vital clamps. Passed rendered `progression-browser.cjs`: intact level-20 V2 character/world and exact backup, attribute preview/cancel/confirm, duplicate-handler protection, prerequisite locks, six Warrior unlocks, a rear target hit only by the third Whirlwind strike, one-time respec cost/refund, level-21 and level-40 rewards, schema-3 reload and level-40 enemy health scaling. Mobile skill-tree screenshot inspected.

Passed `v2-combat.cjs`, `v2-browser.cjs` and two-client `multiplayer-browser.cjs` after progression integration: original combat/bosses, economy, all six village quest pipelines, cave collision/key/relic, shared loot/combat/XP/bosses and solo restoration. Multiplayer used the service double, not hosted Supabase. Quiet UI layouts/menu routes passed at 320×568, 844×390 and 1440×900. Cache-upgrade tests passed from both old entry versions, including missing-stylesheet protection and preserved saves.

Passed `visual-browser.cjs`: 241 draw calls / 148,920 triangles on Low at the village; 49 enemies, 16 quests and 343 instanced scenery batches retained; third-person framing across six locations, adaptive resolution, cave visibility/lighting, quality changes and save reload. No JavaScript, shader or console errors. This measures rendering workload, not physical-phone FPS. Full expansion QA, live account tests, real-device Android/iOS tests, pets/mounts and new content remain outstanding.

## Stage 3 database foundation (initial local validation)

`characters-foundation-sql.cjs` passed against PGlite: repeatable installation, anonymous-account rejection, five-slot limit, duplicate-slot rejection, owner-only reads, private backups, denied direct progression updates/deletes, stale/null revision rejection, renewable exclusive character leases, rejection of another session's release, active-character archive rejection and recoverable archive. No cloud-save UI, trusted reward validator or hosted account workflow is enabled. See `EXPANSION-STATUS.md` and the hosted checks below for current deployment status and remaining implementation.

## Published Stages 1–2 smoke check

GitHub validation run `38018240798` and Pages deployment `38018240598` succeeded for `2223273`. A mobile Chromium check loaded the actual Pages URL with release `realm-progression-20261010-1`, using the real pinned CDN and deployed modules through certificate-verified HTTPS. It passed WebGL rendering, quiet HUD/menu/equipment, attack/potion, live FOV and first-person visibility, 150 stamina, level-up, attribute confirmation, skill unlock and schema-3 save checks with no browser errors. All 49 existing enemies and 16 quests were present. The account foundation was not applied to Supabase; its checks remain local only.

## Atlas and material detail — 2026-10-10

`map-orientation.cjs` passed five camera bearings with deliberately opposing hero facing, camera-follow/north-up/cave orientation, actual atlas rendering and waypoint placement/clearing. The atlas and terrain now share the terrain colour/path function; the river width and bridge list come from the world, and village roofs provide their footprints. Inspected the rendered atlas screenshot.

`visual-browser.cjs` passed after the final material changes: three varying 128×128 generated textures, wood/masonry assignments in merged geometry, six-location camera framing, adaptive resolution, cave lighting transitions, quality selection and save reload, with no JavaScript/shader/console errors. Low village workload remains 241 draw calls / 148,920 triangles; 49 enemies, 16 quests and 343 instanced scenery batches remain. Low and Medium screenshots were inspected. The sunlight is warmer with a small exposure adjustment; no new postprocessing passes were added.

`v2-mobile.cjs` passed real CDP multitouch movement+attack/block, release, camera orbit, NPC/shop/equipment, journal/map/inventory/settings and portrait/landscape control bounds. These are Chromium tests; physical Samsung/iPhone frame rate and Safari remain unverified. This update does not claim completion of the remaining expansion stages.

## Hosted Stage 3 database and protected commands — 2026-10-10

Verified Management API access to the existing Supabase project. Installed the additive `characters-foundation.sql` and `character-commands.sql` migrations; existing rooms, Realtime policies and Auth configuration were not modified. Browser account features remain disabled pending integration.

`characters-foundation-sql.cjs` passed again in PGlite. `character-commands-sql.cjs` passed repeat installation, fixed server prices, inventory ownership, equip/sell restrictions, atomic upgrade costs and replacement, potion use, attribute budgets, skill prerequisites, respec charges, duplicate request replay, changed-payload rejection, stale revisions, wrong/expired leases, private ledger reads and denied direct writes. Experience/material fixture grants use the privileged test connection; no browser reward-grant endpoint exists.

`python scripts/check-hosted-characters.py --apply` passed on the actual hosted PostgreSQL database: owner isolation for characters/backups/ledger, protected progression writes, server-priced purchase, idempotent retry, insufficient-funds rejection, exclusive lease and anonymous-account rejection. The test used temporary users and `SET LOCAL ROLE authenticated` with JWT claims inside a transaction; all fixtures were rolled back. It is a real hosted RLS/RPC check, **not** an email sign-in or two-browser account test.

Login/recovery UI, cloud save synchronization, legacy imports, encounter/reward validation and persistent-character co-op are not implemented. Existing solo/local and session-only co-op behaviour is unchanged. The old missing-management-access blocker is resolved; remaining work is implementation, not another key request.
