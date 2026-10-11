# Graveyard party starts

New multiplayer worlds start Chapter Zero in the Unmarked Graves. Up to four party members stand in a row at x=46,48,50,52 and z=153.5, facing the graveyard gate. The warning and eight-skeleton encounter use the existing host-authoritative prologue.

Apply `supabase/party-spawn.sql` after `persistent-rooms.sql` and `character-runtime.sql`. It allocates stable membership slots under a room lock and returns authoritative character-context positions. Existing contexts, character progression and solo-world data are retained. Leaving co-op still restores the solo world.

Validation: `tests/party-spawn-sql.cjs` checks four positions, slot reuse, reconnect positions and unchanged character/solo data using PGlite. `tests/multiplayer-browser.cjs` checks actual game clients through the Supabase SDK service double, including adjacent graveyard starts. Physical phone testing is separate.
