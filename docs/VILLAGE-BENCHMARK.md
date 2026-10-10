# Village quality benchmark — realm-village-1

## Audit and ownership

- `index.html` owns camera, renderer, sun, character rig, combat and settings.
- `graphics.js` owns the five existing presets and device-local graphics values.
- `cinematic.js` already provides optional depth-aware background focus.
- `visual-world.js` batches architecture by world cell, shades terrain/masonry,
  owns the sky and manages decoration visibility. It already supplies wind,
  contact shadows, lantern halos and adaptive resolution. These were reused.
- `living-world.js` owns settlement positions, physical building bounds and NPCs.
- `hero-detail.js` refines the shared humanoid rig without replacing equipment.

The major visible limitation at Bram was flat building elevations and roof planes,
with minimal depth at windows. Increasing postprocessing would not resolve that.

## Implemented benchmark

`village-art.js` authors reusable scalloped shingles, stonework, deep window
surrounds, crossbars, shutters, planted boxes, gable braces, chimney courses and
worn paving and a stone working apron at the smith through the existing instancing collector. Existing roof rails in
this village are suppressed so they do not intersect the new roof courses.
Side elevations are detailed as well as front/back. No settlement, collision,
NPC, entrance or saved coordinate moved. No additional loop or light was added.

The shared humanoid now uses curved armour shells in place of spherical shoulder
pieces, smaller eye details and swept hair locks. Existing animation and equipment
material references are retained. HUD touch targets remain in place; surfaces,
pressed feedback and NPC labels are refined using existing design tokens.

These assets are reusable procedural geometry, not newly exported Blender GLBs.
The existing GLB loader/library and Scout assets remain intact.

## Comparison and limits

Matched 390x844 Chromium WebGL captures at the workshop, Low preset:
- Before: 260 draw calls; 67,582 rendered triangles.
- After final refinement: 278 draw calls; 79,770 rendered triangles.

These are single-view rendering counts, not FPS claims or physical-phone tests.
The added geometry is instanced and uses existing world-cell culling. DOM labels
and sunlight animation can vary between captures; camera positions are identical.

Browser validation includes shader/JS error capture and the existing touch suite:
movement+attack, block release, camera orbit, Bram interaction, purchases/equipment,
journal/map, settings and portrait/landscape controls. Physical Android, Safari,
account-backed multiplayer and phone thermal performance remain unverified here.

## Remaining wider overhaul

This is the village benchmark stage. New authored player GLBs, expanded forest
asset replacement, reflective water, new weather/day-night, expanded combat
presentation and full-world rollout are not implemented by this checkpoint.
No claim is made that the entire eight-phase overhaul is complete.
