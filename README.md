# Realm of the Fallen

A playable, procedural 3D fantasy action RPG for desktop and mobile browsers. The complete game is in **index.html**. No installation, build, account, API key, or backend is needed.

## Play on GitHub Pages

1. Upload `index.html` to the root of this repository, on your `main` branch.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select **main** and **/ (root)**, then click **Save**.
5. Wait for GitHub's Pages deployment to finish, then open the website link shown in that settings page.

For this repository, the expected address is:
`https://areyoumycreator98.github.io/Rpg-test.1/`

This address becomes available only after you upload the files and enable Pages. This delivery does not publish the site automatically. An internet connection is required to load the pinned Three.js 0.160.1 module from jsDelivr. Everything else—models, terrain, interface, effects, and sound—is generated locally.

## Your journey

Start at the campfire and follow the pale trail into Whispering Forest. Defeat scouts, collect their loot, and equip upgrades in your satchel. Cross Stonebridge River, clear the goblin encampment and its guarded chest, then follow the uphill trail to Mountain Ruins. Defeat Gruk to receive the legendary Ember Sword and Guardian Armour. Continue exploring after victory, or reset the chief encounter from the pause menu.

- Three attack animations form a combo; click again during a swing to queue the next strike.
- Dodge through enemy attacks. Large enemies telegraph slower, stronger attacks.
- Gruk alternates quick slashes, heavier strikes, and a wider area attack.
- Collect nearby drops with the Loot action. Coins enter your balance; equipment, potions, teeth, and moonstones enter your inventory.
- Equipment changes the hero's appearance and combat statistics. Materials are collectible trophies; there is no shop or crafting system.
- Potions restore 65 HP, capped at maximum health. Rest at your starting campfire for a full heal.
- Two bridges and the eastern shallows cross the river. Deep water blocks movement.
- Regular enemies return after approximately 75 seconds once their area is out of sight. The chief returns only when you reset his encounter.
- Falling in battle returns you to camp without losing equipment or XP.
- The maximum level is 20.

## Controls

| Desktop | Action |
| --- | --- |
| W A S D | Move relative to camera |
| Shift | Sprint |
| Right mouse drag | Orbit camera |
| Mouse wheel | Zoom |
| Left click | Attack / queue combo |
| Space | Dodge roll |
| E | Collect nearby loot, open chest, rest at fire |
| I | Inventory and equipment |
| H | Drink a potion |
| Escape | Pause / close menu |

On phones and tablets, use the left joystick and the Attack, Dodge, Loot, Heal, Satchel, and Pause buttons. Swipe the world to orbit the camera. Movement and attack support simultaneous touches. Portrait and landscape layouts are supported.

## Settings and saves

Low graphics limits rendering resolution and turns off shadows; Medium and High increase resolution and enable shadows. Audio starts after interaction and can be switched off in Settings.

Progress saves automatically after important actions, every eight seconds during play, and when leaving the page. **Continue** restores your character, position, inventory, equipment, coins, XP, discoveries, opened chests, remaining loot, and chief completion. **Begin new game** asks before replacing an existing save.

Saves belong to the current browser and website origin. Private browsing, storage restrictions, or clearing browser data may prevent or erase saving. Changing from a local address to GitHub Pages does not transfer saves. Invalid saves are rejected defensively.

## Development and validation

The game is a static HTML document with inline CSS and JavaScript. It uses genuine Three.js WebGL geometry, instanced vegetation, delta-time movement, articulated character rigs, contact-window melee checks, and Web Audio synthesis. There are no asset files or build dependencies.

For optional local development, any static HTTP server can serve the repository. For example, if Python is already available:

```sh
python -m http.server 8000
```

The game itself does not need Python or a server installation when hosted on GitHub Pages. Use the existing checkout; a separate Git worktree is unnecessary.

Browser validation was performed with headless Chromium and software WebGL, using automated desktop input and emulated touchscreen input. Checks exercised startup/rendering, keyboard movement, camera orbit, combat damage, death and loot, inventory/equipment changes, healing, dodging, river/bridge collision, save restoration, boss rewards, corrupt saves, touch multitasking, responsive layouts, and settings. Test-only instrumentation is available when the URL includes `?test`; normal play does not expose it.

The test machine's Chromium did not trust its network proxy certificate. Browser tests therefore received the exact pinned CDN module fetched separately over certificate-verified HTTPS. Certificate validation was not disabled. Physical Android/iPhone devices, Safari, production GitHub Pages deployment, and hardware frame-rate targets have not been verified here.
