---
description: Typecheck, lint, and screenshot what changed
---

Run, in order, and stop at the first failure:

1. `pnpm exec tsc -b --noEmit`
2. `pnpm exec biome check .`
3. `pnpm exec vitest run --silent` (only if files under `src/lib`, `src/domain`, `src/store`,
   or `src/canvas` changed)
4. `pnpm exec knip` — report dead files, don't delete them without asking

Then, with the Playwright MCP against the running dev server:
- Screenshot `/lab` and any screen touched by this change, at 1440×900, `?s=live`
- Look at the screenshots. Compare against `docs/spec/wireframes/`.

Report: what passed, what differs from the wireframe, and anything you changed that wasn't
asked for. If nothing differs, say so plainly — don't pad the summary.
