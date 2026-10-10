# Red Cowl Scout — validation record

Release: `realm-red-cowl-1`. Authoring and tests executed in the Codex Linux
workspace using Blender 4.3.2, Chromium software WebGL and pinned Three.js 0.160.1.

## Executed and passed

- Real headless Blender Python, GLB export and Cycles CPU PNG rendering.
- Five studio angles (front, left, right, back, three-quarter) and three poses
  per animation. Renders were inspected; hood closure, boot gaps, skirt coverage
  and the suspended death pose were corrected during review.
- `tests/blender-scout.cjs`: actual GLTFLoader and WebGL; 9,925 triangles,
  11 material primitives, normalized weights, six clips and changing bone poses.
  Thirty-one samples across each clip check finite bounds, no floor penetration
  beyond 0.035 authored units, no excessive stretching, and a lowered death pose.
- `tests/scout-browser.cjs`: seven independent skinned Scouts; shared geometry;
  unchanged 109-enemy roster, 30 base HP, prologue model and level-eight legacy
  save. Real chase/attack damage, hero hit contact, death, XP, loot and respawn
  pass. Another Scout's skeleton stays unchanged when one mixer advances.
  A real gameplay screenshot was captured at 390 × 844.
- `tests/scout-fallback.cjs`: blocking the new GLB loads the old animated glTF;
  blocking both preserves the procedural Scout. Both games start with 109
  enemies and 30-HP Scouts, without JavaScript exceptions.
- `tests/v2-mobile.cjs`: new skinned model confirmed loaded; real simultaneous
  touch movement/attack and movement/block, release, camera orbit, NPC dialogue,
  purchasing/equipping, journal/map, inventory/settings, portrait and landscape
  control bounds all pass.
- `tests/multiplayer-browser.cjs`: two real browser game clients both load the
  new Scout; private/public rooms, movement/equipment, host AI/guest combat,
  shared death/XP/loot, gates/chests, pets/mounts, shared building/gathering,
  town return, host departure, solo restoration and leave cleanup pass.
  This uses the existing deterministic Supabase SDK service double; it is not
  a claim of live Supabase or four-device testing.
- `python scripts/stage-pages.py`: 35 static runtime files with one consistent
  release identity, including both Scout assets. No runtime build is required.

## Limits

No physical Android/iPhone, Safari, live four-player service or phone FPS testing
was available. A mobile-sized Chromium viewport is not a physical phone.
The asset uses 11 draw calls per visible Scout (rather than the previous 21),
with more triangles; these counts do not establish a device frame-rate target.
No optional LOD mesh is shipped. Existing enemy distance culling remains active.

Animations are in-place keyed cycles; they do not implement per-foot terrain IK
or simulated cloth. The model interprets the reference with a deliberately
limited geometry budget; fine painted wear and all reference folds are not
reproduced exactly. Other characters, world geometry, game rules, save schemas
and Supabase migrations are unchanged by this release.
