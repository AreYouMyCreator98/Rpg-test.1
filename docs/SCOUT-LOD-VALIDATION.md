# Scout mobile detail validation

Release: `realm-red-cowl-2`. This extends the Red Cowl release; the primary model,
animations, combat rules, collision, rewards and character saves are unchanged.

## Actual measurements

- Blender 4.3.2 headless decimation and GLB export executed successfully.
- Primary: 9,925 triangles. Simplified export: 4,928 triangles, a 50.35% reduction.
- Supplemental GLB: 836,880 bytes, 22 joints, 11 material primitives; no duplicate
  animation tracks. Background download does not gate Play.
- Same-camera primary/LOD WebGL screenshots were inspected; the face, equipment
  and major silhouette remain recognisable in the simplified model.
- One visible Scout still uses 11 draw calls. This change reduces triangle work,
  not draw-call count or total world complexity.
- After both representations were rendered, 80 alternating detail switches kept
  GPU counts at 22 shared geometries and one skeleton texture in the isolated
  one-visible-Scout test. No new skeleton, mixer or geometry is created on a switch.

## Tests

`tests/scout-lod.cjs` passed with actual exported GLBs and Chromium WebGL:

- Matching transforms, inverse-bind matrices and bone order.
- Shared geometry across instances; independent character skeletons.
- Normalized simplified skin weights and finite bounds through all six clips.
- Low/High/Auto switching and boundary hysteresis.
- Identical pose, attack time and HP across a geometry swap.
- Stable GPU resource counts over 80 switches.
- Missing optional LOD preserves the fully detailed skinned character.

`tests/scout-browser.cjs` passed against the real game, including actual camera
and settings driven selection, original HP/roster/save data, chase, damage,
loot, XP, respawn and independent animation instances.

The two-client multiplayer regression passed with real game clients and the
existing Supabase SDK service double: shared combat, XP/loot, dungeon interactions,
pets/mounts, housing, gathering, town return and host-departure cleanup. This is
not a live Supabase, Safari, or physical-device performance measurement.

`python scripts/stage-pages.py` validates all 36 runtime files and the shared
release identity. No new frontend build process or backend migration is needed.

## Limits

Physical Android/iPhone FPS and battery/memory profiling remain unverified.
Software WebGL triangle/resource counts cannot establish a phone frame-rate
improvement. The existing environment, UI and input systems are unchanged.
The new LOD changes geometry only, so it deliberately does not reduce animation
update frequency or alter multiplayer simulation timing.
