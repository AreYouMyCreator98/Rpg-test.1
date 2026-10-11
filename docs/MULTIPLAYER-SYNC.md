# Multiplayer synchronization patch

`realm-net-sync-1` adds per-sender packet sequencing, rejects delayed poses/snapshots, and coalesces unsent state instead of queuing obsolete movement. Action commands carry position/facing so an attack or pickup does not depend on a separately delivered pose. Teleports and initial enemy positions snap rather than interpolating across the world.

Enemy snapshots run at 5 Hz; player poses remain 10 Hz. Full world/estate/citizen data is sent once per second and on initial synchronization. Numeric wire values are rounded to three decimal places. Large payloads use bounded 40,000-character fragments with limited, expiring reassembly buffers. This removes the old silent 196,608-character whole-snapshot rejection.

Joining waits for character loading; early snapshots are retained until loading completes. Guest skeleton rise offsets are explicitly cleared before normal animation and remote attack timers advance between packets. Old network clients are told to reload.

Validation uses actual two-client Chromium gameplay through a deterministic Supabase SDK service double: guest-triggered skeleton emergence, visible grounded bodies, delayed packet rejection, oversized world-state delivery, combat, shared loot, world gates, housing and room cleanup. `tests/network-packets.cjs` exercises reordering, duplicate fragments and malformed packet bounds. This is not a physical-phone or real mobile-network latency benchmark.
