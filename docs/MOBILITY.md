# Exploration stamina, sprint and target lock

Release: `realm-mobility-1`.

- Exploration sprint, dodge and holding block do not consume stamina. Regeneration continues. Mount stamina also regenerates while travelling outside combat.
- Combat begins on dealing/receiving damage or when a chasing/attacking enemy is within 15 units on the same floor and map. Damage keeps combat active for eight seconds. Combat stamina costs, guard breaks and dodge invulnerability remain intact.
- On-foot sprint increases from 6.5 to 9.75 units/second before skill bonuses. Walk and mount speeds are unchanged. Full joystick tilt no longer automatically sprints. Tap Sprint to toggle; desktop Shift remains hold-to-sprint. Menus, blur and new games clear the toggle.
- Tap the reticle beside Attack (desktop Q) to acquire/release a visible enemy ahead. Acquisition range is 22 units; retention is 28. The camera and hero smoothly face the target while movement can strafe. Death, mounting, leaving range/floor or sustained obstruction releases the lock. Dodges retain their movement direction.
- No save migration or server schema change. Sprint with the speed skill reaches 10.53 units/second, below the existing trusted movement allowance of 15.

Validation: `tests/mobility-browser.cjs` exercises actual game movement, exploration and combat stamina, touch sprint toggle, target acquisition/death/range release, concurrent touch movement/sprint/attack, blur reset and non-overlapping 44px controls at 320×700, 390×844 and 740×360. Chromium mobile emulation is not physical Android/iOS testing. Progression unit tests and static Pages release validation remain applicable.
