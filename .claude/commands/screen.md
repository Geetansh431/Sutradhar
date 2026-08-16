---
description: Compose a screen from existing blocks
argument-hint: <screen-name>
---

Build the screen `$1`.

Read first:
1. `docs/spec/06-fixed-screens.md` (or `07-canvas.md`) — the region-by-region table
2. The wireframe in `docs/spec/wireframes/` for this screen
3. `src/blocks/` — what already exists

Hard rules:
- **Compose only blocks that already render correctly in /lab.** If a block is missing,
  stop and build it with `/block` first. Do not inline a one-off version.
- The screen file holds layout and routing. No business logic, no data shaping, no fetch.
  If it passes 150 lines, something belongs in a selector or a block.
- Apply the role cut from `docs/spec/03-personas.md` at the **selector** level, not by
  hiding rendered values.
- Every state in the spec's states table must be reachable — build them all, list how to
  reach each one when you report back.

Then run `/verify` and compare the screenshot to the wireframe. Tell me where they differ
and why, rather than silently diverging.
