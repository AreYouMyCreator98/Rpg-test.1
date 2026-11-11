# CHAINFALL: Oath of Ash (V1)
Original mobile-first hack-and-slash action arena inspired by the genre's spectacle, **not** a God of War game or use of its intellectual property.

## Run
Open index.html in a browser, or serve this folder from a static web server. No npm/build/API keys required. Render static site: publish path chainfall-mobile, build command echo ready.

## Combat
8 selectable weapons: Chain Blades, Oathbreaker Greatsword, Dawn Spear, Nightfang Daggers, Earthshaker Hammer, Twin Ravagers, Soul Scythe, Rune Gauntlets. Every weapon has independent combo data, a heavy attack and a 50-Fury special. Dodge invulnerability, hitboxes, stagger, knockback, screen shake, projectiles, particles, procedural skeletal attack animation, enemy AI, waves and a boss.

## Mobile
Landscape recommended. Drag the left stick to move, tap STRIKE/HEAVY/FURY/DODGE/JUMP, select weapon icons. For desktop use A/D, W/Space, J/K/L, Shift, 1-8, Esc.

## Offline
Web manifest and service worker cache source files on supported HTTPS origins. Sound is generated in Web Audio; all icons and scene effects are original procedural/vector art. Player progress remains local to browser storage.

## Scope
This is a playable **2D vertical slice**, not a full 3D console-size game. It uses real-time canvas animation and physics rather than pre-rendered frame sheets. No copyrighted game art, characters or audio included.

## Deployment
The files live under chainfall-mobile/ on a dedicated Git branch so the repository's main project remains unchanged.

## V2: ASH REFORGED
- Five original, layered vector arenas: Sundered Gate, Cathedral of Embers, Bone Forge, Moonlit Abyss, Throne of Ash.
- Original authored SVG sprite atlases: 6 frames per animation for the hero and five enemy species; 234 rendered art frames, with real animation-state selection. If artwork isn't loaded yet the previous procedural renderer is used as fallback.
- Persistent souls wallet, eight unlockable weapons, Armory on title/pause/death, purchase and equip buttons. Only Chain Blades are unlocked from a new save.
- Weapon unlock costs: 0, 120, 250, 400, 620, 900, 1300, 1800. Souls are banked on death or returning to title.
- Progress is stored locally under `chainfall_v2_progress`; existing lifetime totals are separate.
- Mobile performance: atlas images loaded asynchronously and reused.

## V5 Illustrated hero
Added the four original generated transparent character animation sheets in assets/hero-v5: idle, walk, run, attack. Each is WebP RGBA 768x512 (3 columns x 2 rows, each frame 256x256). The renderer creates **24 separate 256x256 canvases** once at load and draws a single canvas per animation tick. Only Chain Blades (weapon index 0) use this illustrated character; other weapons use the V4 original rendering until matching weapon-specific animations are created. Game combat, hitboxes, upgrades and enemy systems unchanged. The originals as separate full-resolution PNG frame files are also provided in the downloadable asset ZIP.
