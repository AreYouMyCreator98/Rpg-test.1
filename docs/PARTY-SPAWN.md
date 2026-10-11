# Graveyard party starts

New multiplayer worlds start Chapter Zero in the Unmarked Graves. Up to four party members stand in a row at x=46,48,50,52 and z=153.5, facing the graveyard gate. The warning and eight-skeleton encounter use the existing host-authoritative prologue.

Apply `supabase/party-spawn.sql` after `persistent-rooms.sql` and `character-runtime.sql`. It allocates stable membership slots under a room lock and returns authoritative character-context positions. Existing contexts, character progression and solo-world data are retained. Leaving co-op still restores the solo world.

Validation: `tests/party-spawn-sql.cjs` checks four positions, slot reuse, reconnect positions and unchanged character/solo data using PGlite. `tests/multiplayer-browser.cjs` checks actual game clients through the Supabase SDK service double, including adjacent graveyard starts. Physical phone testing is separate.

## Party-scaled ambush

Release `realm-party-graves-2` locks the encounter at the warning: 8/16/24/32 skeletons for 1/2/3/4 players, with +10% damage per additional player (rounded). Health and individual XP remain unchanged. Joining or leaving after the warning does not resize/reset the encounter. Reserve enemy IDs are appended after the original 114 entries; inactive reserves remain buried and cannot block the gate. The objective and journal display the locked total; saved kill indices support all 32.

Apply the updated `game-catalog-seed.sql` and `graveyard-party.sql` before deploying the client. Persistent parties obtain their locked size from authenticated server membership. Server encounter insertion rejects reserve enemies outside the locked encounter. The original eight enemies and all existing catalog IDs remain stable.
