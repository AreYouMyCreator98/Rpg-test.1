# Boss arenas — realm-arenas-1

Fourteen existing main bosses now have bounded encounter courts and animated mist entrances. Gruk occupies a ruined castle courtyard with corner towers, battlements, banners and a throne. Other courts use themed architecture: Fenrir's moonstone circle, Morvain's tombs, Rook's burned bastion, Silkmaw's webs, Astrax's stormglass, Varg's roots, the Grove Warden's shrine, Nythra's drowned altar, the Hollow Knight's hall, Skarveth's ice throne, the Ash Titan's crucible, Selene's observatory and the Forgotten King's court.

Approach the south entrance and use the existing Interact control (E on desktop). Traversal checks a safe landing against existing collision and dismounts the player. The living boss seals the entrance against departure; defeat opens it. Existing death/respawn and dungeon key/puzzle gates remain in charge of their original gameplay. Prologue enemies are unchanged.

`boss-arenas.js` owns arena geometry, perimeter collision, camera collision and fog presentation. It reads existing boss HP instead of saving another encounter flag. Existing replicated HP opens the same gate on both clients. Existing bounty respawns reseal it. Coordinates, AI, damage, rewards, quests and save schemas are unchanged. Walls remain after defeat, with an open central entrance. Old decorative tall tower extensions at Gruk's ruins were removed to avoid duplicate architecture.

Static architecture is instanced by the existing scenery batcher. Only nearby courts in the current world/interior are displayed and animated. Each entrance uses one transparent shader plane; there is no fog particle emitter, new light or separate render loop.

## Validation

- `tests/boss-arenas.cjs`: actual Chromium/WebGL at 390 × 844 with touch enabled. All fourteen gates seal, accept entry, refuse exit while alive, animate, and open after the existing damage/death handler kills the boss. All fourteen have collision-safe landing positions and a sampled traversable route from entry to boss centre. Walls remain solid after defeat. Defeated states survive save/reload. No captured JavaScript or shader errors.
- `tests/multiplayer-browser.cjs`: two real browser clients with the existing Supabase SDK service double. Both cross Gruk's gate; host defeat opens the guest gate. Existing movement, equipment, shared combat/loot, dungeon gates, pets/mounts, housing, gathering, town return and leave/solo restoration checks passed.
- Actual rendered mobile-sized castle preview: `previews/arenas/gruk-castle.png`.
- These checks use scripted damage, not manual completion of every boss fight. Physical Android/iPhone performance, Safari and live Supabase co-op were not tested. No phone FPS claim is made.
