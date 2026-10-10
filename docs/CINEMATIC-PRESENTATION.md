# Cinematic presentation — realm-cinematic-1

This update changes presentation only: warm directional sunlight, cooler reduced
hemisphere fill and a tighter 64-unit shadow camera improve contrast and shadow
texel density. Low retains disabled shadows; Medium enables them. Existing shadow
quality controls still apply. No new shadow-casting lights were added.

Settings now offers Off / Subtle / Cinematic depth of field, saved per device.
The optional WebGL2 pass samples actual depth, focuses on the hero, leaves nearby
combat sharp and rejects foreground samples when blurring distant scenery. It
uses twelve taps plus the centre, a colour/depth target and a fullscreen draw.
It bypasses first-person and unsupported WebGL versions. Targets resize with the
renderer and are disposed when disabled. Render diagnostics count both passes.
Default is Off; physical-phone performance has not been established.

The existing humanoid rig gains a pleated/tapered cloak, layered tassets and knee
plates, crossed leather harness, wrist fittings, clasp and angular cheek planes.
Equipment materials, animation attachment points, roll bounds and first-person
head hiding are retained. These are procedural geometry refinements, not a new
Blender-authored player asset. Shared character creation also gives remote
humanoids the same detailing without adding network fields.

Validation commands:
- `node tests/cinematic.cjs`: real mobile-sized Chromium WebGL, depth shader,
  target disposal, equipment material, roll, first-person bypass and saved setting.
- `node tests/v2-mobile.cjs`: simultaneous touch movement/combat, camera, shops,
  inventory, journal/map and portrait/landscape controls.
- `python scripts/stage-pages.py`: static release/dependency validation.

No Safari/physical Android testing or live Supabase multiplayer was performed
for this presentation update. GPU frame-rate gains are not claimed.
