# Sutradhar — prototype

A **canned, on-script demo** of an operating system for an interior design firm.
Laptop-only. No backend. No persistence. No real AI calls. Synthetic data.

The spec this implements is `docs/spec/` — read the relevant section before building a screen.
**Where the prose and a wireframe disagree on a figure, the wireframe wins.** It is what the
demo puts on screen; `src/fixtures/firm.ts` is authored from the wireframes and
`firm.test.ts` pins every number to one.

---

## Non-negotiables

These are architectural, not stylistic. Violating one means the work gets reverted.

1. **No component holds business data.** Blocks and screens render from selectors. If a
   component contains a rupee figure, a date, or an entity name as a literal, it is wrong.
   The only exceptions are `src/fixtures/**` and `src/canvas/canned/**`.

2. **Money is `Paise` (branded integer), never `number`.** No floats, no `parseFloat`, no
   arithmetic on money outside `src/lib/money.ts`. Formatting is `formatINR()` only.

3. **Only `Confirmed<T>` counts.** `sumMoney()` accepts `Confirmed<Paise>[]` and nothing else.
   If you need a total that includes unconfirmed values, you are misreading the spec — go
   read §5.5. Totals state their exclusions.

4. **All writes go through `applyChange(changeSet)`.** No direct `set()` on the store outside
   `src/store/change.ts`. This is what makes audit and undo work. There is no `delete` op;
   only `archive`.

5. **The canvas planner returns a plan, never data.** Block types, entity refs, filters — no
   numbers, no strings pulled from fixtures. The resolver fills values from the store. A plan
   containing a literal figure is a bug, even if the figure is correct.

6. **Layout law.** Every composed answer: answer top-left, evidence right column, working area
   centre, actions bottom strip. Positions never vary. Only the blocks inside them change.

7. **No new blocks.** The vocabulary is the ten in `src/blocks/`. If something doesn't fit,
   stop and ask — don't invent an eleventh.

8. **No `any`, no `as` casts on domain types, no `@ts-expect-error`.** The types encode the
   spec's rules; escaping them defeats the point.

9. **The clock is fixed.** `TODAY` is 12 August 2026, in `src/lib/dates.ts`. Never call
   `new Date()` or `Date.now()` in `src/` — use `now()`, `nowISO()`, `todayISO()`. The
   fixtures are dated relative to that day: the Iyer instalment is due today, Sharma's
   ₹80,000 two days out, the coverage gap opens at day 14. A wall-clock read makes the
   demo drift out of shape overnight.

---

## Stack

Vite 8 · React 19 · TypeScript strict · Tailwind v4 · shadcn (new-york) · Zustand + Immer ·
TanStack Table · Recharts · Zod · React Router v7 · Biome · Vitest

**Never install a package without asking.** The dependency list is deliberate and small.

---

## Structure

```
src/
  lib/         money.ts field.ts dates.ts cn.ts      pure, no React
  domain/      types.ts + selectors/                 entities and derived reads
  store/       store.ts change.ts audit.ts undo.ts   the only mutation path
  fixtures/    the synthetic firm + scenarios.ts
  canvas/      plan.ts (zod) planner.ts resolver.ts questions.ts
  blocks/      the ten blocks — the product
  screens/     compositions of blocks — thin
  chrome/      rail, topbar, ask-bar
  lab/         /lab route: every block in every state
  components/ui/  shadcn primitives — do not hand-edit
```

Screens are thin. If a screen file passes 150 lines, logic has leaked out of a block or a
selector.

## Blocks before screens

A screen may only compose blocks that already exist and already render correctly in `/lab`.
When asked for a screen whose blocks aren't built, build the blocks first — in `/lab`, with
every state — then the screen.

## Every block obeys the same contract

Editable in place · shows provenance on hover · exportable · pinnable · writes only via a
change preview. A block that can't do these isn't finished.

## Scenarios, not persistence

State is in memory and resets on refresh. `?s=fresh|extracted|live` seeds a starting state
from `src/fixtures/scenarios.ts`. Never add localStorage, IndexedDB, or a service worker.

## On-script only

The ask bar is a **filtered picker over canned questions** — free text narrows the list, it
never submits. There is no path to an unprogrammed answer. The "Prototype · canned responses"
badge in the chrome is permanent; do not remove it.

## Verification

After any UI work: `/verify`. It typechecks, lints, and screenshots `/lab` and the affected
screen so you can compare against `docs/spec/wireframes/`. Don't report a screen as done
without having looked at the screenshot.

## Tone of the product's own copy

Plain, specific, slightly understated. It states consequence, not status: "Thursday's ₹80,000
to Sharma has no cover if today's instalment slips" — not "Payment due Thursday". Never
exclamation marks, never "Oops!", never an emoji.
