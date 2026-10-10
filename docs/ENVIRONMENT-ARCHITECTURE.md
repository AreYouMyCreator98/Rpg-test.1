# Environment ownership — Emerald Vale checkpoint

Baseline: 12d9398; recover with branch `checkpoint/pre-emerald-vale-20261010`.

| Concern | Owner / dependency |
|---|---|
| Height | index.html `ground`, frontier `extraHeight`; all actors call `surface` (bridges and homestead platforms) |
| Ground colour / biomes | index `landscapeColor`, frontier `terrainColor`; terrain vertices and atlas use the same functions |
| River | index `riverZ`, water mesh, `deep`, `bridgeAt`; frontier atlas uses the same centreline and bridges |
| Bounds | frontier BOUNDS; index collision, map frame, multiplayer pose checks; SQL event bounds already cover this area |
| Vegetation | index starting forest; frontier deterministic forest and obstacle registration; visual-world decorative overlay |
| Collision | index obstacle grid + deep water; living cave; expansion dungeon rooms/gates; prologue; homestead/gathering |
| Streaming | frontier 48m visibility cells; visual-world 64m decoration cells and nearby grass window. Most geometry currently stays resident. |
| Terrain rendering | visual-world splits original triangles into 64m visibility cells plus coarse lowered far terrain. This is not yet stitched terrain LOD. |
| Camera | index cameraDestination/obstruction/updateCamera; adventure-motion settings; companions mounted offsets |
| Mountains / sky / lighting | visual-world decorative skyline, sky, fill and outdoor fog; index sun/hemisphere; living-world indoor overrides |
| Map | frontier atlas sampled from ground/landscapeColor with actual vegetation/structures; expansion maps dungeon rooms |
| Gameplay persistence | accounts/local saves, living/expansion progression; multiplayer host simulation, Supabase typed reward RPCs |
| Housing / harvesting | homestead + gathering, independent persistent objects; never part of visual chunk lifecycle |

No second render loop, terrain owner, save schema, enemy roster or landmark coordinate changes are required for this benchmark. Existing 109 enemies, 14 bosses and 33 quests remain owned by their original modules. Environment assets must never be disposed while instanced meshes still reference them.

## Phase 1 boundary

Emerald Vale: x [-535,-335], z [-120,80], exactly 200 × 200 units; the existing western bridge at x=-430 remains the safe crossing. Verdant Reach remains at (-440,-120). New scenery replaces existing forest instances only after its GLB successfully loads. Failed asset loading leaves the prior forest playable. Existing tree roots retain collision and atlas locations. Ground cover is nonblocking, short and excluded from roads. No new reward-bearing enemy spawns or save migrations.

The benchmark is a gate, not a claim that all six phases are complete. Remaining global streaming, stitched terrain LOD, full asset catalogue, audio/wildlife and atlas improvements require separate measured stages.
