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

All local stylesheet/module URLs now carry a shared release identity; `scripts/stage-pages.py` stamps the GitHub commit SHA into those URLs during static deployment. The map module detects the obsolete HUD before initialization and navigates to a fresh entry URL. Missing UI CSS prevents entering unstyled gameplay. Neither recovery path clears browser storage.

`tests/ui-cache-upgrade.cjs` passed against staged deployment files: stale HTML automatically recovered, the minimap stayed under 110px in a 360×650 touch viewport, SVG controls appeared, and the exact saved character persisted (456 coins, 83 HP, Steel Sword). A failed-stylesheet case kept Play disabled and the save intact. This explicitly exercises an upgrade from an older page, rather than only a clean browser launch.
