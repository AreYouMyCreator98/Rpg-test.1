# Free Blender character pipeline

The Red Cowl Scout is original mesh geometry authored with Blender Python from
the supplied front, side, three-quarter and rear references. No paid tools,
asset APIs, generation credits or external texture assets are used.

## Reproduce in Codex

Blender **4.3.2** is installed at `/usr/bin/blender`. Headless Python, GLB export
and Cycles CPU rendering have been executed successfully. This build lacks
OpenImageDenoise and Draco libraries, so denoising is disabled and the GLB is
uncompressed. Its optional extension-cache warning does not prevent export.
No GPU, manual desktop operation or installation changes were required.

From the repository root:

```sh
blender -b -t 4 --python scripts/characters/build_goblin.py
blender -b /tmp/realm-character/goblin-scout.blend -t 4 --python scripts/characters/render_animation_review.py
blender -b /tmp/realm-character/goblin-scout.blend -t 4 --python scripts/characters/build_scout_lod.py
```

Generator options after `--`: `--first-only` renders only three-quarter;
`--no-render` rebuilds the GLB and editable temporary Blender checkpoint.
The animation review script accepts `-- --death-only` for focused iteration.
The scripts and JSON configuration are the reproducible source; the temporary
`.blend` need not be committed. Final GLB and review PNGs are checked in.

## Geometry and skeleton

`assets/models/goblin_scout.glb`: **9,925 triangles**, 22 bones, 11 shared PBR
material primitives. Vertex colours provide variation without texture requests.
Purpose-built cross sections, face planes, thick pointed ears, amber eyes,
tusks, leather accessories, layered cloth, stitched hood and steel dagger are
actual mesh geometry. This remains a stylized interpretation, not an exact
reproduction of every painted reference detail.

`humanoid.py` provides a reusable scaled biped skeleton: root, pelvis,
spine/chest, neck/head, shoulders, arms/forearms/hands, weapon sockets and
thighs/shins/feet. Limb sections blend weights around knees and elbows;
armour is rigidly weighted. The dagger is weighted to the right hand.
Use this skeleton for future humanoid authoring; create separate skeletons and
locomotion for quadrupeds or other non-humanoids. No animal generator is claimed.

Six in-place clips: **Idle, Walk, Run, Attack, Hit, Death**. Poses are keyed at
30 FPS with corrected support height. Death buckles the knees, falls forward
and settles; the spine bends so the head reaches the floor rather than hanging
above it. These are authored animation cycles, not physics or terrain-aware IK.
Uneven-terrain foot planting and secondary cloth simulation are not implemented.

## Game integration

Seven ordinary Scouts use GLTFLoader, SkeletonUtils cloning and AnimationMixer.
Each has an independent skeleton; geometry/materials stay shared. Its eleven
primitives share one bone palette per character. The model is scaled to the old
2.1-unit height before the original enemy scale. The head, arms, legs and weapon
attachment remain accessible to the visual adapter.

The original AI controls collision, stats, contact timing, HP, XP, drops and
respawns. Visual attack time is remapped so the dagger slash contacts at the
existing 58% gameplay hit frame. Damage/Stagger states use the Hit clip.
The old `assets/goblin-scout.gltf` is the first fallback; the original procedural
character remains if both files or CDN imports fail. Other enemies are unchanged.

Browser preview: serve the repository and open `previews/goblin-scout/index.html`.
It loads the real GLB with the game's pinned Three.js 0.160.1 and never touches
saves. The game itself requires only static files; no Blender/Python/build step.

## Validation

See `docs/RED-COWL-VALIDATION.md` for executed checks and limitations.
For browser tests, set `PLAYWRIGHT_PATH` to the installed module and
`TEST_ARTIFACT_DIR` to a writable artifact folder. In proxy-limited environments,
`SCOUT_TEST_CACHE` can contain TLS-verified pinned copies of `three.module.js`,
`GLTFLoader.js`, `BufferGeometryUtils.js`, and `SkeletonUtils.js`.

Future model changes must regenerate the GLB, inspect renders and rerun asset,
combat and fallback tests. Rotate the shared release query identity for deployment
so cached modules cannot mix incompatible asset adapters.

## Mobile detail levels

The independent `build_scout_lod.py` pass simplifies a freshly generated Blender
checkpoint without modifying the primary GLB or saved `.blend`. It exports
`assets/models/goblin_scout_lod.glb`: **4,928 exported triangles**, 836,880 bytes,
22 bones, 11 materials. Blender's intermediate count is 4,962; the glTF exporter
drops 34 degenerate triangles. The manifest records both counts. The supplemental
file intentionally omits animations: gameplay reuses the main rig and clips.
Repeated generation produced identical GLB hashes and left the primary untouched.

Only compatible geometry can be attached. The loader checks material names,
mesh transforms, bind matrices, bone order and inverse-bind matrices before
swapping buffers. No additional skeletons or mixers are created per Scout.

Distance from the actual game camera controls switching:

| Preset | Simplify beyond | Restore full detail at |
| --- | ---: | ---: |
| Low | 12 units | 9 units |
| Medium | 18 units | 15 units |
| High | 26 units | 23 units |
| Ultra | 36 units | 33 units |

Auto uses its currently measured quality tier. The gap between entry and exit
prevents oscillation. Each client selects visual detail locally; no extra network
messages or gameplay changes are involved. The optional download does not gate
startup, and a missing/incompatible LOD retains the primary skinned Scout.

`tests/scout-lod.cjs` checks binding compatibility, weights, animated bounds,
thresholds, Auto changes, pose/time preservation, repeated-switch GPU resources,
and missing-file behavior. See `docs/SCOUT-LOD-VALIDATION.md` for measured scope.
