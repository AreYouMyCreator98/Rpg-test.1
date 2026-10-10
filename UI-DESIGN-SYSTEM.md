# Realm UI design system

The current HUD follows the user’s later request for a quieter, dark-fantasy interface, superseding the original emerald reference layout. Gameplay, world geometry, combat formulas, quests, economy, save schema and multiplayer authority are unchanged.

## Owners

- `ui.css`: the single interface stylesheet. `:root` owns the charcoal surfaces, muted antique gold, sage, ivory/sage text, three bar gradients, serif/sans fonts, borders, glass blur, inner highlights, shadows, radius, motion and safe-area variables. All HUD and menu selectors live here; game modules no longer inject separate stylesheets.
- `ui.js`: the single inline SVG icon family and UI adapter. `icon(name)` provides consistent silhouettes/strokes; `itemIcon(id,item)` selects equipment/loot art. `installUI()` connects existing elements to live player and quest state and adds presentation-only feedback.
- `index.html`: existing gameplay functions and stable DOM action IDs. The status rows, gold pill and equipment switch are semantic markup; the update loop calls the UI adapter after existing HUD/quest updates.
- `frontier.js`: retains real terrain/map painting. Only map-control presentation changed: compass, expand action and map-menu zoom controls. The north indicator follows the actual map orientation.

Do not add a new `<style>` injection in a game module. Extend tokens/classes here. Do not hardcode a new emoji icon in a menu: add a vector to `ui.js` and use `icon()` or `itemIcon()`. World materials, item rarity colors, NPC portrait colors and cartographic terrain colors remain game data, not theme tokens.

## Layout and behavior

The default HUD shows slim health/stamina bars, name/level, one Menu button and the touch combat controls. The quest card, currency pill, equipment card, XP row, separate Satchel button and minimap are hidden. Their existing live-state bindings remain intact. Journey shows currency, HP, XP, equipment statistics and the current objective, with working destinations for equipment, quests, world map, settings, multiplayer, controls and less-used journey options.

The minimap can be restored through Journey → Minimap on HUD. This presentation preference uses the separate `realm-ui-minimap` key; it does not alter or migrate gameplay saves. Hidden minimaps skip canvas painting. NPC labels appear only within seven world units. Potions show their live quantity on the Heal control. The HUD uses subdued charcoal surfaces, narrow gold borders and smaller circles, while preserving at least 44px action targets. Joystick and combat controls remain separated in portrait and landscape. Existing safe-area variables remain authoritative.

Existing actions remain authoritative: `pickup`, `inventory`, `pause`, `startAttack`, `startDodge`, shield pointer capture and potion consumption. Only joystick displacement normalization changed to use the rendered stick radius, so proportional resizing retains smooth 360-degree analog input. Separate touch pointers continue to support move/orbit/attack and held blocking.

The contextual action appears only for the existing valid interaction. Nameplates project from real NPC coordinates, fade with distance and avoid each other and major HUD panels. Menus hide underlying HUD/nameplates to prevent visual interference. Coins/quests flash only on changes; reduced-motion preferences disable effects. Potion availability and dodge cooldown/stamina restrictions reflect live state.

## Visual verification

`tests/ui-browser.cjs` runs the current `quiet-ui.cjs` acceptance suite, replacing assertions for the superseded reference layout. It checks default decluttering, control bounds/separation, menu destinations, optional map persistence, saved currency, touch movement plus attack, NPC/shop entry and JavaScript errors at 360×650, 320×568, 844×390 and 1440×900. `v2-mobile.cjs` retains simultaneous movement/block, orbit, shop/equip and settings checks using the new menu routes. Physical Android/iPhone/Safari testing remains unperformed.

## Deployment cache compatibility

GitHub Pages can retain HTML and modules independently for ten minutes. Keep every local import and stylesheet URL versioned. `scripts/stage-pages.py` validates the shared release identity and copies the nine runtime files unchanged. The Pages setting publishes `main` directly; the custom workflow validates only, avoiding two competing publishers. The source files run directly without staging. Before each runtime update, rotate the release string consistently in `index.html`, `frontier.js` and `multiplayer.js`; the validator rejects missing or inconsistent local dependency versions.

Do not remove the legacy-HUD check at the top of `frontier.js` while old entry pages may remain in browser caches. It recovers old HTML via a versioned navigation before creating the map, preserving LocalStorage. The startup CSS check prevents exposing a playable, unstyled HUD when styling fails. `tests/ui-cache-upgrade.cjs` covers stale-entry recovery and failed CSS with a saved character.

## Character builds and camera

Journey adds Attributes and Skill trees; camera controls remain under Settings. Attribute upgrades show current → proposed values and require confirmation. Skill branches use the existing gold/mint tokens and the shared `--ui-skill-unlocked` surface. Mobile stacks branches inside the scrolling modal; desktop shows three columns. Neither system adds always-visible HUD panels.
