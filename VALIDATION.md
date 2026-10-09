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

The Supabase-backed co-op integration has been validated locally. The user-supplied
project URL and browser-safe publishable key are configured in `multiplayer-config.js`.
**Hosted Supabase authentication, SQL installation and Realtime have not been
verified yet.** This workspace’s network proxy rejected HTTPS tunnelling to the
new project with HTTP 403 before the request reached Supabase. Its hostname has
been added to the environment configuration draft; applying that change is still
required for live tests from this workspace. This is not an observed Supabase
authentication failure.

- `tests/multiplayer-sql.cjs` passed using PGlite 0.3.14 (PostgreSQL): SQL
  installation and reinstallation, anonymous-user identities, private-room hiding,
  bad-code rejection, four-member capacity, duplicate-membership rejection,
  per-sender topic authorization, actual RLS rejection of a forged host write,
  leave/host-end handling, public discovery and stale-room expiry. Auth and
  Realtime schemas are test fixtures; hosted Supabase integration remains untested.
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

Still required: apply `supabase/multiplayer.sql` to the actual project, enable
anonymous sign-in, and test private-channel
RLS, two physical devices, public listings, latency and disconnection behavior
against that hosted service. Four-client rendering, physical iOS/Android/Safari,
provider quotas, real-world packet loss and mobile FPS have not been validated.
