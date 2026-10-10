# Free character authoring — draft checkpoint

This is an original procedurally authored Blender mesh, based on the supplied
front, side, three-quarter and rear Red Cowl goblin references. No external
asset generation service, credits, paid tools, or purchased assets are used.
It is a first review draft, not a claim of reference-level finish.

## Reproduce on Codex's Linux workspace

Blender 4.3.2 is installed at `/usr/bin/blender`. Headless Python, GLB export,
and Cycles CPU rendering were executed successfully. This distribution lacks
OpenImageDenoise: the scripts explicitly disable denoising. No GPU is required.
No new installation or environment configuration was necessary.

From the repository root:

```sh
mkdir -p /tmp/realm-character
blender -b -t 4 --python scripts/characters/build_goblin.py
blender -b /tmp/realm-character/goblin-scout.blend -t 4 --python scripts/characters/render_animation_review.py
```

`-- --first-only` renders only the three-quarter view. `-- --no-render` rebuilds
the GLB and editable temporary Blender checkpoint without studio rendering.
Generated runtime geometry: `assets/models/goblin_scout.glb`.
Review images and manifest: `previews/goblin-scout/`.
The source of truth is the Python script and JSON palette/seed, not the temporary
`.blend`. No authoring tools are needed by the eventual browser game.

The existing `assets/goblin-scout.gltf` and `scout-model.js` remain unchanged.
The draft is not in the deployment manifest or connected to any enemy.

## Model and rig

Authored cross sections, face planes, thick ear wedges, inset eyes, layered
cloth, leather trim, belt hardware, boot soles, pouches, bedroll, and a steel
dagger. Seeded vertex colours use eleven shared PBR materials; no texture
requests. The mesh is joined before export and split into material primitives.

The 22-bone humanoid includes a root, pelvis, spine/chest, neck/head,
shoulders, upper arms, forearms, hands, weapon sockets, thighs, shins and feet.
Continuous limb sections blend weights around knees and elbows; hard accessories
use rigid weights. The dagger follows the right hand.

Six in-place draft clips: Idle, Walk, Run, Attack, Hit, Death. Keyframe support
height is corrected against the deformed mesh. This does not constitute an IK
foot-lock system: gait sliding, intermediate contact, and cloth clipping require
further review before gameplay integration. Death currently uses a simple fall
and must receive a more articulated collapse pass.

## Browser review

Serve the repository with a static server, then open
`previews/goblin-scout/index.html` for GLTFLoader/AnimationMixer playback.
It uses the game's pinned Three.js 0.160.1 and does not touch saves or game state.

`tests/blender-scout.cjs` loads the actual GLB in Chromium WebGL at a mobile-sized
viewport. It checks the triangle budget, skin weight sums, six clip names,
finite sampled bounds and changing animation poses. Set `PLAYWRIGHT_PATH` to
the installed Playwright module and `TEST_ARTIFACT_DIR` to a writable directory.
`SCOUT_TEST_CACHE` optionally supplies TLS-verified copies of the pinned Three.js
modules for cloud browser environments whose proxy cannot be used directly.
This is an asset test, not a physical-phone performance or combat test.

## Next review pass

- Refine face, hood profile, torn cloth and material detail toward the references.
- Review all sampled poses, add grounded knee/hip death staging and foot locking.
- Validate deformation through entire clips, not just selected frames.
- Extract proportions/rig definitions for future humanoids after this design settles.
  Animals will need a separate rig; a quadruped generator is not implemented here.
- Only after visual review: adapt gameplay state names (Damage/Stagger -> Hit),
  clone skinned skeletons with SkeletonUtils, scale to the original Scout hitbox,
  then run live combat, fallback, multiplayer and mobile regression tests.

Do not directly substitute this GLB into the current rigid-joint clone path.

## Validation recorded for this draft

- Blender 4.3.2 headless Python, GLB export and CPU PNG render passed.
- Export: 9,396 triangles, 22 bones, 11 material primitives, six named clips.
- Chromium/Three.js asset test passed at 390 × 844 with touch emulation.
- Five studio views and eighteen animation-pose PNGs were actually rendered.
- Front, side, rear and representative movement/attack/hit/death poses were inspected.
- Review found remaining hood/nape seams, simple cloth surfaces, a stiff fall,
  and gait refinement needs. These are draft limitations, not completed polish.
- The browser test does not establish combat compatibility, four-player safety,
  hardware performance, or Android/iOS rendering. None of those is claimed.
- Current gameplay files, release identity, original Scout asset and saves were
  not modified. This checkpoint has not been deployed.
