# V4.0 mobile character rendering fix

The earlier vector art included a redundant 64px X translation on every animation frame even though the figure's vertices were already centered around x=64. The frame then cropped the right half of the actor.

V4 rebuilds all 234 individual SVG frames with `translate(0, dy)` instead of `translate(64, dy)`. Each image has a padded 192x192 canvas with `viewBox="-32 0 192 192"`. The renderer scales using `FRAME_W=192` while keeping the same actor height and floor alignment. Tests assert these exact geometry properties for every frame.

This is a fix to the existing procedural vector sprites, not the requested AI-illustrated character art package.
