---
description: Build or revise one of the ten blocks, in /lab, with every state
argument-hint: <block-name>
---

Build the block `$1`.

Read first, in this order:
1. `docs/spec/08-components.md` — the entry for this block and the universal contract
2. `src/blocks/` — an existing block, to match structure and naming
3. `docs/spec/wireframes/w13_components.png` — how it should look

Rules:
- Props take **ids and queries, never resolved data**. The block calls selectors itself.
- Money renders through `formatINR` / `formatShortINR`. Never string-concatenate a rupee sign.
- Every field renders its `FieldValue` state — use the `.fv-*` classes, don't invent styling.
- Editing is inline, and every edit produces a `ChangeSet` via `proposeChangeSet`. No direct writes.
- No `any`, no non-null assertions.

Then:
- Register it in `src/lab/blocks.tsx` with **every state**: loading, empty, populated,
  one unconfirmed field, one conflicting field, one missing field, and the role-restricted view.
- Run `/verify` and look at the screenshot before telling me it's done.

Stop and ask if the block needs data the selectors don't expose yet — don't reach into the store.
