# Living Landscape release — validation and limits

Release identity: `realm-living-landscape-1`. Recovery point: `checkpoint/emerald-phase1-f24651d` (f24651d). Earlier unmodified-world checkpoint: `checkpoint/pre-emerald-vale-20261010` (12d9398).

## Implemented after the Emerald Vale checkpoint

- **Rendering:** 64m terrain cells sampled from the original authoritative `ground` function. Nearby 2m detail is built incrementally, cached briefly and disposed on departure. Fine cells replace their coarse cells; 5m skirts seal detail-level boundaries. A single coarse indexed draw, culled by the current camera, keeps the horizon continuous. There is no lowered duplicate ground plane.
- **Scenery streaming:** authored forest meshes are allocated near the player, switch near/far geometry with hysteresis, and release their instance buffers after departure. Ground-cover cells are generated deterministically on demand and evicted. Shared GLB geometries/materials remain cached. Existing fallback/decorative batches retire their GPU instance buffers after an eight-second grace period. Persistent gameplay objects never participate in this lifecycle.
- **Authored library:** 42 Blender-exported vertex-colour meshes in one repository-hosted GLB. Near/far oak A/B/C, pine A/B/C, birch A/B, ancient oak, willow, fir, dead tree and sapling; ferns, flowers, reeds, short/tall grass, bush, mushrooms, moss, ivy, river/moss rocks, stepping stone, outcrop, log, stump and branch. The reproducible authoring script is included. No external textures or paid asset services are required.
- **World rollout:** 7,171 existing tree roots, including the original starting forest, use the authored library. Cold regions select conifers, river approaches select willows, and woodland groves use deterministic species clusters. A single coarse canopy draw represents distant forest. Original roads, settlements, dungeon entrances, collision roots and discovery indices remain unchanged.
- **Terrain/lighting:** smooth biome/road/bank colour fields shared with the atlas; analytical terrain normals; vertex contact shading around obstacles; warm sunlight and scalable shadows; textured ground, wood and masonry; four continuous layered horizon ranges, snow-tinted crests, procedural sky/clouds and distance haze. Distant ranges remain backdrop geometry outside the playable bounds.
- **Environment:** shader wind; turquoise depth/shoreline colouring and animated water highlights; two small hillside cascade ribbons and a bounded mist pool; twelve bounded animated birds, butterflies and rabbits, reduced by quality. Ambient creatures are decorative and do not change combat or rewards.
- **Audio:** gesture-unlocked forest/water ambience, bird chirps, surface-dependent footsteps and quiet procedural music. Music, combat, environment and interface volumes are independent. There are no external audio downloads.
- **Graphics:** Low, Medium, High, Ultra and Auto; render scale, ground-cover density, view distance, shadows, water, environmental effects and 30/60 FPS adaptive targets. Auto changes quality tier as well as resolution after sustained measurements. Camera settings persist independently. The single frame loop starts after module installation, avoiding drawing a half-initialized world.
- **Map:** existing accurate terrain/river/road/structure data, smooth biome transitions, and additional vector trees/rocks/buildings at higher zoom. Drag, pinch, wheel, zoom buttons, player centring, label collision avoidance and world-space waypoints remain functional.

## Tests actually performed

| Check | Evidence |
|---|---|
| Real WebGL startup, GLB loading and shader errors | `tests/emerald-vale-browser.cjs`, `tests/visual-browser.cjs` |
| Ground contact and traversable Vale/bridge | Raycasts within 0.12m of the authoritative height field; 9,379 reachable mount-width navigation samples; deep water remains blocked |
| Repeated regional travel and dungeon unloading | `tests/world-streaming.cjs`; resident counts, return-trip resource bounds and fine/coarse boundary raycasts |
| Graphics controls and persistence | Actual menu controls, Ultra/shadow override/render scale/density; 80% scale produces pixel ratio 0.8 on DPR 1; reload retains FOV 83 and shoulder mode; Auto lowers to Low and recovers under simulated frame measurements |
| Touch controls and menus | `tests/v2-mobile.cjs`: simultaneous move/attack, move/block, release, camera orbit, NPC shop purchase/equip, journal/map/inventory, portrait and landscape bounds |
| Map interactions | `tests/map-controls.cjs`: zoom, drag, pinch, waypoint coordinates, map recovery, both cave map types and desktop wheel |
| Combat/loot/mount compatibility | Actual sword contact, death, XP, loot collection and mount summon inside the Vale |
| Expansion encounters | `tests/expansion-content.cjs`: four dungeon gates/treasures, root puzzle, seven expansion bosses with phase transitions and three damaging attack patterns, unique drops, five animated pets and three mounts |
| Co-op | `tests/multiplayer-browser.cjs`: two real game clients using the real adapter and a deterministic Supabase SDK service double; shared enemy/loot authority, guest combat, bosses, gates/chests, pets/mounts, building/gathering, town return, host departure |
| Progression and recovery | `tests/progression-unit.cjs`, `tests/account-storage.cjs` |
| Server reward rules | `tests/character-runtime-sql.cjs` against PGlite: owner isolation, leases, typed operations, cooldown/position validation, single pickup, idempotency and legacy import |
| Static release | `scripts/stage-pages.py`: 34 runtime files and one coherent cache identity; `git diff --check` |

The browser tests use Chromium software WebGL, not a physical GPU/phone. Logic-only multiplayer tests suppress drawing; separate visual tests exercise actual rendering. Early concurrent software-rendering runs timed out; affected checks were rerun rather than counted as passes.

## Measurements and screenshots

See `living-landscape-benchmark.json`, `living-landscape-streaming.json` and the `benchmarks/living-landscape-*.png` captures. The benchmark samples eight isolated, synchronized WebGL renders per view. Those timings include possible shader/resource warm-up, exclude a sustained gameplay workload, and **must not be presented as phone FPS**. The Low village regression remains below 300 draws / 180,000 triangles; its measured release check was 270 draws / 166,141 triangles.

| View | Draw calls | Triangles | Software render mean / max (ms) |
|---|---:|---:|---:|
| mobile-low | 137 | 116,799 | 20.85 / 128.70 |
| panorama-low | 298 | 288,930 | 7.66 / 13.80 |
| panorama-medium | 331 | 391,020 | 19.34 / 102.30 |

The final ground-level and elevated captures were visually inspected. Compared with the Phase 1 capture, the horizon gap is gone, authored woodland extends beyond the Vale, distant canopy silhouettes persist, canopy volume is fuller, and hills/biomes no longer use rectangular colour bands. This is an implemented art-direction improvement, not a claim of a pixel-identical match to the reference.

## What remains unverified or incomplete

- No physical Android/iPhone or Safari device was available. Sustained 30–60 FPS, thermal behaviour, battery consumption, touch feel and GPU-driver compatibility on those devices remain unverified.
- No live four-player Supabase session or live account-recovery sign-in was performed for this visual release. Two-client service-double and SQL tests are not substitutes for those checks.
- This release does not include a full manual playthrough of every quest and original boss. Automated coverage above is specific; preserved catalog counts are not a playthrough.
- The library uses authored geometry and vertex colours rather than a textured PBR asset pack. Cliff scenery is generated ridgeline geometry; some existing bridge, fence, ruin and settlement props retain their prior geometry with improved materials. Small cascades are not a new navigable river network or swimming system.
- Streaming jobs are budgeted between meshes; an individual mesh build cannot be pre-empted. Worker-based generation, GPU-specific shader prewarming and further device-driven tuning remain possible improvements.

Do not label physical-device QA or a final reference-quality acceptance gate as complete on the strength of these browser results.
