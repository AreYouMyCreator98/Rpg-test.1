# Realm UI design system

The supplied emerald-glass portrait reference drives the HUD. Gameplay, world geometry, combat formulas, quests, economy, save schema and multiplayer authority are unchanged.

## Owners

- `ui.css`: the single interface stylesheet. `:root` owns the forest/pine/jade surfaces, antique gold, mint, ivory/sage text, three bar gradients, serif/sans fonts, borders, glass blur, inner highlights, shadows, radius, motion and safe-area variables. All HUD and menu selectors live here; game modules no longer inject separate stylesheets.
- `ui.js`: the single inline SVG icon family and UI adapter. `icon(name)` provides consistent silhouettes/strokes; `itemIcon(id,item)` selects equipment/loot art. `installUI()` connects existing elements to live player and quest state and adds presentation-only feedback.
- `index.html`: existing gameplay functions and stable DOM action IDs. The status rows, gold pill and equipment switch are semantic markup; the update loop calls the UI adapter after existing HUD/quest updates.
- `frontier.js`: retains real terrain/map painting. Only map-control presentation changed: compass, expand action and map-menu zoom controls. The north indicator follows the actual map orientation.

Do not add a new `<style>` injection in a game module. Extend tokens/classes here. Do not hardcode a new emoji icon in a menu: add a vector to `ui.js` and use `icon()` or `itemIcon()`. World materials, item rarity colors, NPC portrait colors and cartographic terrain colors remain game data, not theme tokens.

## Layout and behavior

Portrait proportions follow the reference: 49.2% status-card width, gold/navigation above the right-hand tracker, 24.7% circular minimap, contextual interaction at centre-lower, concentric joystick, and the heal/block/attack/dodge diamond. Native Georgia supplies the reference's serif appearance without an additional network/font dependency. The actual existing 3D world remains visible behind individual glass panels; the modal backdrop does not blur the scene.

Narrow layouts make necessary exceptions for readable text and minimum 44px action targets. Long currency balances keep their full numeric value; small screens stack the coin stamp and balance. Equipment names can ellipsize and remain available in full through the inventory. Landscape rearranges compact HUD cards; safe-area tokens account for cutouts and the home indicator.

Existing actions remain authoritative: `pickup`, `inventory`, `pause`, `startAttack`, `startDodge`, shield pointer capture and potion consumption. Only joystick displacement normalization changed to use the rendered stick radius, so proportional resizing retains smooth 360-degree analog input. Separate touch pointers continue to support move/orbit/attack and held blocking.

The contextual action appears only for the existing valid interaction. Nameplates project from real NPC coordinates, fade with distance and avoid each other and major HUD panels. Menus hide underlying HUD/nameplates to prevent visual interference. Coins/quests flash only on changes; reduced-motion preferences disable effects. Potion availability and dodge cooldown/stamina restrictions reflect live state.

## Visual verification

`tests/ui-browser.cjs` captures actual Chromium/WebGL screenshots at 864×1536, 390×844, 320×568, 844×390 and 1440×900, plus a simulated 44px top/34px bottom safe area. It checks reference anchors, action target sizes, circular control separation, full currency display and menu actions. Screenshots go to `TEST_ARTIFACT_DIR` or `/tmp/realm-tests`.

The reference was compared visually and by normalized HUD anchors, not by an automated pixel-difference score. The world scene, camera/player location, live values and platform font rasterization differ from the supplied image; this is not a claim of literal pixel identity. Physical Android/iPhone/Safari behavior and sustained device performance have not been tested in this environment.

## Deployment cache compatibility

GitHub Pages can retain HTML and modules independently for ten minutes. Keep every local import and stylesheet URL versioned. `scripts/stage-pages.py` validates the shared release identity and copies the eight runtime files unchanged. The Pages setting publishes `main` directly; the custom workflow validates only, avoiding two competing publishers. The source files run directly without staging. Before each runtime update, rotate the release string consistently in `index.html`, `frontier.js` and `multiplayer.js`; the validator rejects missing or inconsistent local dependency versions.

Do not remove the legacy-HUD check at the top of `frontier.js` while old entry pages may remain in browser caches. It recovers old HTML via a versioned navigation before creating the map, preserving LocalStorage. The startup CSS check prevents exposing a playable, unstyled HUD when styling fails. `tests/ui-cache-upgrade.cjs` covers stale-entry recovery and failed CSS with a saved character.
