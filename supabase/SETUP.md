# Connect Realm of the Fallen to Supabase

The website stays on GitHub Pages. Supabase provides room discovery, anonymous
identities and private Realtime channels. No separate Node server is needed.
Use a dedicated free-plan project for this game; usage remains subject to your
Supabase plan's quotas. Do not enable paid upgrades just to follow these steps.

1. Open https://supabase.com/dashboard and choose **New project**. Name it
   **Realm of the Fallen**, set a strong database password and choose a nearby
   region. Keep the database password private.
2. In **Authentication → Sign In / Providers**, enable **Anonymous Sign-ins**.
   Dashboard labels can change; search for “Anonymous” in Authentication settings.
   The game uses temporary anonymous identities, not player email/passwords.
3. Open **SQL Editor → New query**. Copy the entire contents of
   [multiplayer.sql](multiplayer.sql), paste them into the editor, and press **Run**.
   The script creates only `realm_*` tables/functions and two named Realtime
   policies. It can be run again safely. Do not disable row-level security.
4. In **Realtime settings**, allow private channels (disable public channels if
   you do not need them). Database replication/publications are **not** required:
   gameplay uses Broadcast, and room discovery uses RPC.
5. Open the project's **Connect** dialog, or **Settings → API / API Keys**.
   Copy the Project URL and **publishable key** (`sb_publishable_…`). A legacy
   **anon** key also works. Never use a secret key, service-role key, database
   password or personal access token in the game.
6. To configure everyone, put those two browser-safe values in the existing
   [multiplayer-config.js](../multiplayer-config.js) exports and publish that file
   alongside the game. Both values are intentionally public. Access protection
   comes from the database policies, not from hiding the publishable key.
   Alternatively, each tester can enter them under **Play together → Supabase
   connection → Save connection**. That override is saved only in that browser.
7. Open the game on two devices. Choose **Play together → Create private room**
   on one, then join its 16-character invite code on the other. Also test
   **Create public world** and **Refresh worlds**. Public listings must not show
   the private room. A fifth player must be refused.

## How rooms work

Each room supports four players. The creator's browser runs enemy AI, resolves
sword contacts, and grants shared ground loot once. Supabase authenticates room
membership and restricts each sender to its own private Broadcast topic. Guests
cannot send messages on the host's topic. Nearby players earn kill XP; the cave
key/gate and chests are shared, and collecting the ancient relic gives each
current party member a quest copy. Shops and quest choices belong to each player.

Co-op characters begin fresh. Progress lasts for that room session and never
writes over the existing solo save. Leave the room to resume your solo character.
Items cannot be dropped from inventory during co-op; sell them at Mira's shop.
This prevents a client from creating shared item drops through that UI.

The host must keep the game open and active. Menus do not pause the shared world;
menu users are marked away and excluded from new enemy targeting. Mobile browsers
may suspend background tabs. Leaving, suspension or losing the host connection
ends the room; there is no host migration or reconnect-to-an-old-session feature.
Stale rooms expire after 45 seconds. Live snapshots are temporary, not stored in
Postgres. No chat, accounts, PvP or permanent online economy is included.

This is casual, host-authoritative co-op, not a cheat-resistant competitive server.
Player movement, equipment and local defensive actions are client-reported; a
modified client or host can cheat inside its room. There is no co-op-to-solo item
transfer. Supabase RLS protects membership and sender identity, not game fairness.

## Troubleshooting

- **Anonymous sign-ins are disabled:** enable that provider in Authentication.
- **Function not found:** run the complete SQL script in the same project as the URL.
- **Private channel error:** check the two `realm_broadcast_*` Realtime policies.
  A pre-existing broad permissive policy in a reused project can override their
  intended restrictions; use a dedicated project or review existing policies.
- **No worlds:** the host must be connected, use the same Supabase project, and
  create a *public* world. Private rooms require their invite code.
- **Project paused / quota exceeded:** inspect the Supabase dashboard and its
  current free-plan limits. Resume a paused project there.
- **Connection lost:** solo progress is safe; create a new room to start again.

Before opening unrestricted public access, review Supabase's anonymous-auth abuse
controls and service quotas. The built-in 100-room/four-member caps are resource
bounds, not a replacement for provider rate limits. Anonymous Auth users remain in
Supabase after rooms expire; manage their retention in the dashboard.
