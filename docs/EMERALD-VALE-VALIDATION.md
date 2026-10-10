# Emerald Vale — playable benchmark checkpoint

## Scope and status

This is a **Phase 1 checkpoint**, not completion of the six-phase overhaul and not a claim of matching the reference image. The reference is still substantially richer in canopy density, cliff composition, water detail and atmospheric layering. Do not mass-roll this asset density across the world until the remaining streaming and device-performance work is validated.

Implemented in the actual game:

- 200 × 200 region, x −535…−335 / z −120…80; existing western bridge retained. A new path connects to Vale Overlook. Both discoveries append after all existing locations.
- Blender 4.3.2 authored, repository-hosted `emerald-library.glb`, loaded by pinned Three.js GLTFLoader. Seven tree designs with near/far meshes, plus seven ground-cover/prop meshes (21 named meshes total). No downloaded art or runtime Blender dependency.
- Instanced replacements at existing tree roots, original collision footprints, deterministic grove types and moisture-based ground cover. Nearby ferns, grasses, flowers, reeds, mossy stones and fallen logs. Vertex wind with distance attenuation.
- Bounded incremental instance construction (maximum three batches / approximately 3 ms scheduling budget per update), distance culling and tree LOD hysteresis. Shared geometry and one material. This is **not full chunk unloading/streaming**; the small benchmark library and instance buffers remain resident.
- Gentler banks via the existing authoritative `ground()` function, feathered at region boundaries; locally refined original terrain triangles. The atlas samples the same terrain/colour data. The existing deep-water rule and bridge surface remain authoritative.
- Animated turquoise river shading, moving procedural sky clouds, a continuous western ridgeline mesh replacing the western cone backdrop, existing warm sun/hemisphere and quality-scaled shadows.
- Two quiet filtered-noise ambience voices for forest/water, using the existing gesture-unlocked audio context and sound toggle. Independent audio buses, birds and surface footsteps remain pending; listening quality has not been verified on a physical device.
- Optional `?diagnostics` overlay with rolling frame time, p95, slow frames, draw calls, triangles, Vale cells/instances, GPU resources and live enemy count. Existing camera/FOV/settings remain intact.
- Missing GLB retains original forest visuals and playable startup. No save schema, progression, account, server reward or multiplayer protocol changes. Versioned module/asset URLs prevent mixed cached files.

## Browser checks

`tests/emerald-vale-browser.cjs` uses real Chromium WebGL at 390 × 844 portrait and 960 × 640 landscape. It loads the exported GLB, raycasts rendered ground against authoritative heights, floods traversable cells with mount-width clearance, verifies bridge/deep-water/boundary collision, uses actual sword contact/death/XP/loot/pickup/mount logic, reloads saved progression, and simulates a missing asset. Combat testing relocates an existing Scout in a disposable browser fixture; **the benchmark does not introduce new native enemy camps or server rewards**.

The sampled western bridge route's maximum rendered/analytical ground deviation is approximately **0.027 units**. This is not a proof of exact contact over every triangle in the entire overworld. The unchanged roster remains **109 enemies, 14 bosses, 33 quests**.

Additional regression suites:

- `tests/map-controls.cjs`: terrain atlas, recovery, buttons, drag, actual two-finger pinch, waypoints, both dungeon map systems and mouse wheel.
- `tests/v2-mobile.cjs`: simultaneous movement/attack and movement/block, release, orbit, NPC dialogue, buy/equip, journal/map/inventory/settings, portrait/landscape control bounds. CDN fixture now routes the actual loader separately rather than replacing every CDN module with Three core.
- `tests/multiplayer-browser.cjs`: two actual game browser clients with a Supabase service double; host/guest combat and loot, expanded coordinates, dungeons, pets/mounts, co-op building/gathering, town return, departure and restoration. **This is not a live Supabase multiplayer test.**
- `tests/visual-browser.cjs`: existing village draw budget, camera framing, generated textures, adaptive resolution, cave visibility/lighting, quality switching and save reload.
- `scripts/stage-pages.py`: all 30 runtime files, binary GLB copied verbatim, matching release identities and relative module paths.

## Measurements

See `emerald-benchmark.json` for the measured after snapshot and `emerald-baseline.json` for the checkpoint comparison. Baseline is extracted from Git checkpoint `pre-emerald-vale-20261010` and served separately. Same view coordinates, viewport sizes, Low/Medium presets and settings UI are used. Medium really enables the existing shadow map.

Eight isolated renders per view are timed with `performance.now()` and WebGL `finish()`. These **software-WebGL render timings exclude most gameplay simulation and are not phone FPS, sustained frame pacing or thermal measurements**. Max values may include shader/geometry warm-up. Added detail increases draw calls and triangles; this is not a claim of an overall performance improvement.

Ground and elevated captures are in `benchmarks/`. The ground view keeps the actual gameplay camera; the elevated view changes the camera only in the test harness. There is no cinematic replacement scene.

| View | Before draws / triangles | After draws / triangles | After isolated mean / max ms |
|---|---:|---:|---:|
| mobile-low | 154 / 103,059 | 165 / 142,115 | 8.55 / 28.30 |
| panorama-low | 226 / 177,203 | 331 / 311,731 | 7.45 / 17.60 |
| panorama-medium | 273 / 263,241 | 394 / 420,770 | 16.34 / 71.60 |

## Remaining gates and phases

- Phase 1 art/performance gate: denser, more natural canopy composition, less repetitive far scenery, additional cliff/riverbank detail, waterfall treatment and actual Android/iPhone sustained traversal measurements. No real phones or Safari devices were available. New natural encounter placement requires a separate gameplay/catalog change; only compatibility was tested here.
- Phase 2: true bounded visual chunk residency/cache/unloading, stitched terrain LOD across the world, broader shader warm-up/profiling, Ultra/Auto and individual graphics controls. Current global coarse terrain overlap has not been replaced.
- Phase 3: complete requested asset catalogue, waterfalls/mist, wildlife, richer environmental audio and separate volume buses.
- Phase 4: region-by-region rollout, global biome transitions and full landmark/collision audit. Other regions still use the prior scenery and some hard biome boundaries.
- Phase 5: broader atlas detail/label/waypoint improvements; existing map interaction fixes are preserved and retested.
- Phase 6: sustained hardware profiling, full account/cloud recovery regression, real four-player networking, full boss/quest playthrough, balancing and final reference comparison.

The original working game is recoverable at `checkpoint/pre-emerald-vale-20261010` (12d9398). No cloud characters or reward tables are modified by this checkpoint.
