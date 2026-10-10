# Forest refinement — realm-forest-1

Continues the village benchmark using the existing authored GLB/instancing path.
No terrain function, tree root, obstacle, map position or gameplay state changed.

## Changes

- Rebuilt `assets/environment/emerald-library.glb` with Blender 4.3.2 headless.
  The reusable Python authoring script and model manifest are committed.
- Lobed broadleaf crowns, brighter terminal shoots and branch connections.
- Serrated pine boughs in both LODs and connected needle spires instead of oval caps.
- Bent two-tone grass blades; no transparent leaf textures or new dependencies.
- Leaf-only indirect-light approximation in the existing forest shader, preserving
  the bark palette and existing wind. No additional lights or postprocess passes.
- LOD distance now uses the nearest actual tree in a batch, rather than its cell
  centre. Low uses an 18-unit transition with a 5-unit hysteresis band. Other
  presets retain their distance-scaled ranges. Collision is not LOD-dependent.

The library retains 42 named meshes and costs 2,569,728 bytes. Example authored
triangle counts: oak near/far 1,482/443; pine near/far 1,470/455; grass tuft 14.
The loaded geometry/material sharing, incremental construction, cell eviction,
quality presets and playable original-scenery fallback are retained.

## Validation

`tests/forest-visual.cjs` captures matched 390x844 village-path views with the
library actually ready. It also checks real near/far geometry transitions when
moving to and away from a single-tree batch. Console and shader errors fail it.

`tests/emerald-vale-browser.cjs` exercises GLB loading, preserved roster and legacy
save, terrain contact, mount-width navigation, river/bridge restrictions, Low and
Medium render budgets, real sword combat, loot/XP/pickup, mount summon, save/reload
and fallback when the library is unavailable.

The final runs passed. The matched path capture recorded 385 draw calls in both
versions, with rendered triangles increasing from 232,294 to 263,317. Low and
Medium panoramic budgets also passed the existing test thresholds.

Screenshots and rendering counts describe Chromium software WebGL, not physical
phone FPS. Android/iOS hardware, Safari, thermal behaviour and live multiplayer
were not tested in this checkpoint. This stage does not replace the player model
or complete the remaining world-overhaul phases.
