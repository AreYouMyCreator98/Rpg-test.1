# Graveyard Scout visual fix

Release: `realm-red-cowl-3`.

The Scout adapter incorrectly excluded enemies with a `prologue` field. This
left the Grave-picker and Lantern thief using the original procedural model,
even after the authored Scout was deployed in the forest.

The adapter now includes those two type-0 Scouts. Type-1 Veyr remains unchanged,
as do non-goblin families and expansion enemies. There are nine authored Scouts.
No AI, HP, damage, quest, reward, collision, save or network rules changed.

Validation: the mobile-sized Chromium graveyard test confirmed both new skinned
models, three sword fights, warning dialogue, gate unlock, saved kills after
reload, the village charter and legacy Level 26 preservation. The Scout browser
test confirmed all nine models, independent skeletons, LOD switching, animation,
combat, XP/loot and respawn without JavaScript exceptions. An actual graveyard
WebGL capture was inspected. Physical-phone testing remains unavailable.
