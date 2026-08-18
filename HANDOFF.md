# Sutradhar — build state and handoff

**Last updated:** 18 August 2026 · at commit `cc9243f` · 410 tests passing · working tree clean

This document exists so a new session can continue without re-deriving context. It says what
the thing is, what is built, what is not, and what to do next. `CLAUDE.md` holds the rules;
this holds the state.

---

## What we are building

A **canned, on-script demo** of an operating system for an interior design firm — pitched at a
design partner who currently runs their firm across six WhatsApp groups, one payments sheet and
a diary. Laptop-only. No backend, no persistence, no real AI calls, synthetic data.

The product's claim is not "we automate your firm". It is narrower and more defensible:

> Four out of five things this firm knows exist only in one person's head. Hand over a folder,
> and ten minutes later the firm is legible — with every number carrying its source, and
> nothing written until you say yes.

Three ideas carry the whole build, and every architectural rule descends from one of them:

1. **Provenance per field.** Not one source per record — a source for every value. This is why
   `FieldValue<T>` has five states and why block 01 is the shape it is.
2. **Only confirmed money counts.** A total that silently mixes a confirmed figure with one
   read off a photograph is worse than no total. So `sumMoney()` accepts `Confirmed<Paise>[]`
   and nothing else, and every total states its own exclusions.
3. **Nothing is written until a human says yes.** All writes go through `applyChange(changeSet)`,
   which is what makes the audit trail and undo real rather than decorative.

The spec is `docs/spec/` (11 sections + decision log + the original ideation doc). The 14
wireframes are `docs/spec/wireframes/`. **Where prose and a wireframe disagree on a figure, the
wireframe wins** — the wireframe is what goes on screen.

---

## The demo arc (docs/spec/10-demo.md)

Five minutes, seven beats. This is the acceptance test for the whole build — a beat that can't
be walked is a bug regardless of what the code does.

| Time | Screen | What happens | Status |
|---|---|---|---|
| 0:00 | — | A photograph, not the product | n/a |
| 0:30 | Onboarding | Drop a messy folder. Files land unsorted, extraction runs visibly, two files honestly marked unreadable | ✅ works |
| 1:15 | Onboarding | Answer three tapped questions, watch coverage move | ✅ works |
| 1:45 | Home | The brief is already written, the queue has nine items, nothing was configured | ✅ works |
| 2:30 | Canvas | Ask the vendor-exposure question. Blocks compose. Two figures dotted, and it says so unprompted | ✅ works |
| 3:15 | Canvas → preview | Confirm a figure inline, re-gate a payment, see the diff, confirm, watch Money update | ✅ works |
| 4:00 | Money | The coverage gap — 26 Aug, ₹1,70,000 | ✅ works |
| 4:30 | Canvas → pin | Pin the exposure view; it appears in the rail as their own screen | ✅ works |

**All seven beats are walkable today.** The spine has been sound for a while; what has changed
is that the breadth around it — dead links, unbuilt blocks — is mostly gone too.

Two things now exist that the script does not yet use, and both are strong enough to earn a
place if the five minutes can afford them:

- **The project workspace** (`/projects/project-iyer`) holds the unpriced change order in a
  persistent accent panel. The margin-leak story is one of the sharper arguments in the pitch
  and this is the only screen that tells it.
- **`kormangala-handover`** answers "Will Kormangala hit its handover date?" with *no handover
  date on file, and the chain is 4 days behind* — a composed answer whose punchline is an
  absence. It is the clearest demonstration that the product says what it does not know.

What the demo must never do: show a form being filled in, show a settings page, show a loading
state over two seconds, show the AI certain about something it inferred, or explain a screen
before using it.

`/settings` now exists (the rail footer needed a destination) and is read-only with no form in
it, but the rule stands: **do not visit it during the five minutes.**

---

## Stack

Vite 8 · React 19 · TypeScript strict · Tailwind v4 · shadcn (new-york) · Zustand + Immer ·
TanStack Table · Recharts · Zod · React Router v7 · Biome · Vitest

**Never install a package without asking.** Two installed deps are deliberately unused:
TanStack Table (hand-rolled sorting in block 02 instead — its v9 generics fought
`exactOptionalPropertyTypes`; documented in `DataGrid.tsx`, worth revisiting when grouping is
needed) and Recharts (block 07 draws four chart types in SVG directly; documented in
`Chart.tsx`).

TypeScript is strict *plus* `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` and
`noPropertyAccessFromIndexSignature`. That last one requires `params['x']` bracket access,
which Biome's `useLiteralKeys` then forbids — destructure instead of fighting it.

---

## Built — screens

Every one takes a `stateOverride` prop. This is not decoration: Zustand serves its *initial*
snapshot during `renderToStaticMarkup`, so a static test without an override asserts against an
empty firm and passes for the wrong reason.

| Screen | Route | Spec | Wireframe |
|---|---|---|---|
| Home | `/` | §6.1 | w06 |
| Projects | `/projects` | §6.2 | w07 |
| Project workspace | `/projects/:projectId` | §6.3 | w08 |
| Money | `/money` | §6.4 | w09 |
| People | `/people` | §6.5 | w10 |
| Files | `/files` | §6.6 | — |
| Calendar | `/calendar` | §6.7 | — |
| Settings | `/settings` | §6.9 | — |
| Onboarding | `/onboarding` | §5 | w03, w04 |
| Firm Memory | `/memory` | §6.8 | w10 |
| Canvas | `/canvas`, `/canvas/:questionId` | §7 | w11, w12 |
| Lab | `/lab`, `/lab/:section` | — | w13 |

**There are no dead links left.** `src/App.test.tsx` mounts the real route table at every
destination `destinations()` offers and fails if one falls through to the catch-all — which is
exactly what `/files`, `/calendar` and `/settings` used to do. Verified by deleting the `/files`
route and watching it go red; a screenshot would never have caught it, because Home looks fine.

`/` is gated: a firm that has ingested nothing redirects to `/onboarding` (the 0:30 beat) rather
than showing an empty Home. The redirect carries `?s=` through — dropping it silently reseeded
the demo as `live` on refresh.

`App` is split into `App` (owns the `BrowserRouter`) and `AppRoutes` (the table alone), so the
route test can mount the real thing inside a `MemoryRouter` rather than duplicating the list.
That test passes no override, so it asserts on the screens' static headings rather than on data.

---

## Built — blocks (9 of 10)

The vocabulary is closed at ten (`CLAUDE.md` rule 7). Each built block appears in `/lab` in all
seven states: loading, empty, populated, one unconfirmed field, one conflicting field, one
missing field, role-restricted.

| # | Block | File | Notes |
|---|---|---|---|
| 01 | Record card | `src/blocks/RecordCard.tsx` | Rows render themselves via `fieldRow`/`plainRow` — a record mixes a string term with a Paise salary, so a card generic over one value type cannot hold one |
| 02 | Data grid | `src/blocks/DataGrid.tsx` | Generic over `TRow`; owns `FieldCell`, the single place a stored figure becomes text — so provenance and `.fv-*` come for free everywhere |
| 03 | Money timeline | `src/blocks/MoneyTimeline.tsx` | Continuous axis, IN/OUT gutter, dash-bounded gap band. Compact variant drops the date axis (labels overlapped at 34px) |
| 04 | Ledger | `src/blocks/Ledger.tsx` | Mark-paid emits a `settle` op and is **not offered** on an unconfirmed amount — a guess cannot be settled |
| 06 | Report | `src/blocks/Report.tsx` | Four fixed templates, parameters only. `buildReport` skips the role check for callers that already made it; `runReport` applies it |
| 07 | Chart | `src/blocks/Chart.tsx` | `'bar' \| 'hbar' \| 'timeline' \| 'stacked'` as a closed union |
| 08 | Task tree | `src/blocks/TaskTree.tsx` | Nests to any depth, drag to re-parent, `treeitem` roles with a roving tabindex. `highlightIds` lets the Canvas show which rows an answer is about |
| 09 | Change preview | `src/blocks/ChangePreview.tsx` | `changeTag` derives NEW/EDIT/LINK/ARCHIVE from the op, so DELETE is unrepresentable. ⌘↵ confirms |
| 10 | Gap | `src/blocks/Gap.tsx` | Scoped by area or entity — "what is missing *here*". Answers inline via a preview, unlike the onboarding interview which writes directly |

### Not built (1)

| # | Block | Blocks what |
|---|---|---|
| 05 | Document viewer | The source with its passage highlighted. Wanted for its own sake — Files now lists documents but nothing opens one |

`/lab` renders unbuilt blocks as explicit "not built" tiles rather than omitting them, and the
header reads "9 of 10 blocks built" off `BLOCKS.length` — so the counter cannot drift.

---

## Built — the layers underneath

```
src/
  lib/        money.ts  field.ts  dates.ts  cn.ts        pure, no React
  domain/     types.ts + selectors/                      entities, derived reads
  store/      store.ts  change.ts  audit.ts  undo.ts     the only mutation path
  fixtures/   firm.ts  scenarios.ts  ingestion.ts        the synthetic firm
  canvas/     plan.ts (zod)  planner.ts  resolver.ts  questions.ts
  blocks/     the ten blocks — the product
  screens/    compositions — thin, under 150 lines
  chrome/     Rail  Shell  AskBar  RoleSwitcher  ModeSwitch  CoveragePanel  WarningStrip
              + calendar/  canvas/  home/  onboarding/  projects/  workspace/
  lab/        /lab — every block in every state
```

**Selectors:** `calendar.ts` `files.ts` `home.ts` `memory.ts` `money.ts` `people.ts`
`projects.ts` `role.ts` `tasks.ts` `vendors.ts` `workspace.ts`

**Two things on `AppState` are lists, not entities.** `documents` and `siteNotes` sit alongside
`entities` because `EntityKind` must match `EntityRef` in `canvas/plan.ts` exactly, and the
canvas never plans over a site note. Adding a kind there means changing the plan schema — do it
deliberately or use a list.

Five things in here are load-bearing and easy to break:

**The fixed clock.** `TODAY = '2026-08-12'` in `src/lib/dates.ts`. Never call `new Date()` or
`Date.now()` in `src/`. Fixtures are dated relative to it: the Iyer instalment is due today,
Sharma's ₹80,000 is two days out, the coverage gap opens at day 14. A wall-clock read makes the
demo drift out of shape overnight.

**Cover is a link, not a balance.** This was got wrong once and is worth stating plainly. A firm
with ₹10L arriving next month and ₹1L due Thursday is *not covered on Thursday* — money that
has not arrived cannot pay a vendor. `isCovered()` in `money.ts` walks the `gatedOn` link and
checks the inflow lands before the outflow is due. Computing it as a running balance gives
31 Aug / ₹4,20,000 instead of w09's 26 Aug / ₹1,70,000.

**The role cut is applied at the data layer.** §3.2 gives Team no money and no deal values. The
restricted figures are *never computed*, not computed-and-hidden. Two leaks were caught by test:
the brief leaked ₹2,50,000/₹80,000/₹1,70,000 to Ravi, and the pipeline board showed deal values.
§9.2 rule #6 names this exact failure mode. Verified live: "rupees (Admin): 5 / rupees (Team): 0".

**Slippage is recorded, not derived.** `Task.slippedDays` is a tracked field carrying provenance,
and it exists because the first attempt computed "days behind" against `TODAY`. Kormangala's
ceiling is four days behind *the plan* while both its dates are still in the future, so the
clock-based version rendered **"nothing overdue"** as the headline of a question about being
late. A task can be behind where it should be and not yet overdue; only the site knows which.

**Cost is real when work is ordered, not when the cheque clears.** `Project.committed` holds
work owed but unbilled, and margin subtracts it alongside `spent`. Margin from `spent` alone
flatters every project mid-execution — which is exactly the blindness the change-order story is
about.

**Margin: 37.0% on Iyer, and w08's 12.4% is wrong. Decided 17 Aug 2026 — do not re-open.**
No combination of the figures w08 prints in that same row produces 12.4%: value ₹18,40,000,
received ₹9,20,000, spent ₹7,10,000 give 11.4% as `(received − spent) / value` and 61.4% as
`(value − spent) / value`. §6.3 names the field but never defines it, and no §10 beat turns on
the number, so the wireframe loses here — the one place it does, because its own numbers
contradict it. Margin is `(value − spent − committed) / value`; Iyer's ₹4,50,000 committed is
its three open outflows on w09 (Sharma ₹80,000 + ₹2,00,000, Godrej ₹1,70,000), so every term
traces to a payment the demo already shows. Full reasoning in the header of
`src/domain/selectors/workspace.ts`.

**July is closed history; August is the demo.** Six `paid` July payments exist so
`july-across-projects` has a real month to report on. They are all settled and all dated before
`TODAY`, so no August figure moves — but two guardrail tests had assumed every payment was
either scheduled-ahead or overdue, and `paid` is a third category. If a test starts failing on a
count of payments, check whether it means *open* payments.

**Both vendor-terms questions live in `vendorsProfiles`.** `q-godrej-terms` used to sit in
`moneyVendorSide`, which split the two questions that ask a vendor the same thing across two
coverage areas — so `vendors-without-terms`, scoped to "Vendors & terms", found nothing missing
while w11 plainly draws Godrej's terms as "unknown". The shortfall reason moved with it:
"Money — vendor side" now reads "bills not reconciled", which is what that area is actually
about. **A question's `area` decides which coverage bar opens it (§6.8), so it is a routing
decision, not a label.**

**One fixture conflict, resolved and documented** in `firm.ts`'s header: w09 puts Godrej's
payment at ₹1,70,000 and builds the coverage gap on it; w11's exposure column says ₹1,50,000.
**w09 wins** because the gap is load-bearing for the 4:00 beat — total exposure is ₹6,62,000.

---

## The Canvas

The planner returns a **plan** — block types, entity refs, filters. Never a value. Plans are
`safeParse`d against the Zod schema in `plan.ts`, so a plan carrying a literal figure fails in
the build even if the figure is correct. The resolver fills values from the store and builds
mandatory caveats naming each unconfirmed figure.

Eight canned questions in `questions.ts`, covering all six §5.4 shapes. **Six have plans, and
all six answer fully:**

| Question | Group | Status |
|---|---|---|
| `vendor-exposure` | money | ✅ the 2:30 beat |
| `uncovered-payments` | money | ✅ |
| `owed-to-sharma` | money | ✅ |
| `vendors-without-terms` | people | ✅ composes block 10 |
| `kormangala-handover` | projects | ✅ composes block 08 |
| `july-across-projects` | money | ✅ composes block 06 |
| `iyer-margin` | projects | ⛔ no plan — see the margin note below |
| `sharma-bill-capture` | capture | ↪ not unanswered — takes the capture path (§7.6) |

`CoPanel` renders every block a plan can name: `data-grid`, `chart`, `money-timeline`,
`task-tree`, `report` and `gap`. **No answer shows scaffolding on screen any more.**

**A headline must lead with `{metric}`.** The co-panel lifts the figure into the large line and
renders the remainder as the subtitle, so "July closed at {metric} across the firm" renders as
"July closed at across the firm". Put the placeholder first.

Refusal is not one state but **four**, each with its own copy — `CannotAnswer` in
`src/chrome/canvas/` takes `kind`:

- `unknown` — no such question id
- `capture` — the question exists but is a capture, not a question (§7.6). This is where
  `sharma-bill-capture` lands; it is working as designed, not pending
- `out-of-scope` — the role may not see this answer (§3.2)
- `no-data` — the question is real and permitted, but we hold no plan (§7.7)

So of the eight, **one is genuinely pending**, and each says so plainly rather than failing or
faking it.

**`ResolvedMetric.value` is a discriminated union, not `Paise`.** `days-behind-schedule` counts
days, and a day count stored in a money brand is a lie the type system would sign off on. Only
`{ unit: 'money' }` carries `Paise`. `display` is the only part that reaches the screen, and the
mandatory §7.2 caveat says different second halves for the two units — a day count has no total
to be excluded from.

**The ask bar is a filtered picker over canned questions** — free text narrows the list, it
never submits. There is no path to an unprogrammed answer. The "Prototype · canned responses"
badge is permanent.

---

## Pending work

Ordered by what it buys the demo. **Everything the two previous handoffs listed is done** —
block 08, the project workspace, `kormangala-handover`, all three dead rail links, block 06 and
`july-across-projects`. The margin question is settled: 37.0%, recorded above, do not re-open.

### 1. Block 05 — document viewer

The last of the ten. It unlocks no question: `sharma-bill-capture` takes the capture path by
design. It is wanted for its own sake — "the source, passage highlighted" is the visible proof
behind provenance, and nothing on screen shows a source document at all. Files sharpens the
case, since it lists every document and admits plainly that opening one needs a viewer.

`iyer-margin` is the only question still without a plan, and it wants no block — just a decision
about what a margin answer should say now that the figure is settled at 37.0%.

### 2. Settings is thinner than §6.9

§6.9 splits the screen into editable (stage names and order, vendor and cost categories, custom
fields on any entity) and not-editable (folder conventions, users and roles), and says it "exists
because the schema-freedom promise in §7.5 has to be true somewhere".

What is built is the read-only half: roles, users, and a statement of the schema. Nothing is
editable, because §10 forbids the demo showing a form and the screen is never visited during the
five minutes — building editors nobody opens is the wrong trade at this stage.

**But the deviation is real**: schema freedom is currently *asserted* on this screen rather than
demonstrated. If a viewer asks "can I rename a stage?", there is nothing to show them. Worth
building if that question comes up in a rehearsal.

### 3. `/lab/type` font pairing

Open since SETUP.md day 2. The specimen page exists; the decision doesn't. Two CSS variables.

### 4. Rail links drop `?s=`

Every rail link and the Projects → workspace link navigate without carrying the scenario query,
so a refresh after clicking reseeds as `live`. Consistent across the whole app and harmless
mid-demo (state resets on refresh anyway), but it is the same class of bug the onboarding
redirect was fixed for. Worth one pass if the demo ever gets refreshed from a deep link.

---

## How to verify

`/verify` typechecks, lints, and screenshots `/lab` plus the affected screen. **Don't report a
screen as done without having looked at the screenshot** — this is in CLAUDE.md and it has
earned its place.

**Use `npx tsc -b --noEmit`, not `tsc --noEmit`.** The project-references build catches errors
the plain flag misses — a `Task` literal missing a required field passed `--noEmit` and failed
`-b`. `/verify` already runs the `-b` form.

**Screenshots work.** The Playwright MCP browser needs installing once per machine
(`npx @playwright/mcp install-browser chrome-for-testing`); after that, `browser_navigate` and
`browser_take_screenshot` work against the dev server with no restart. The `puppeteer-core`
workaround in earlier notes is no longer needed. Scratch lands in `.playwright-mcp/`, which is
gitignored.

**Check the console, not just the pixels.** The Settings screen rendered a perfectly reasonable
screenshot while throwing a `TypeError` — `RoleSwitcher` was called with none of its required
props, and *`tsc` did not catch it*. `browser_navigate` reports console errors in its result;
read that line.

**A caution from experience:** verification was reported wrong twice in this build — the Money
change-preview and the Canvas action were both called broken when both worked. The cause both
times was asserting on the first `<h3>`, which is "Evidence" under the layout law, not the
answer. If a screen looks broken, check the assertion before checking the screen.

**And two bugs that only the screenshot caught,** neither of which any test would have flagged:
the Calendar printed "To someone ₹4,20,000" for the firm-level salary payment (no counterparty
entity — it carries a `label` instead), and the task tree repeated "Mark done" on all ten rows,
making the loudest thing on screen the wrong thing. Look at the picture.

---

## Rules that get work reverted

Full list in `CLAUDE.md`; these are the ones actually tripped over during this build.

- **No component holds business data.** A rupee figure, date, or entity name as a literal in a
  component is wrong. Only `src/fixtures/**` and `src/canvas/canned/**` are exempt.
- **Money is `Paise`, never `number`.** No arithmetic on money outside `src/lib/money.ts` —
  including `Math.abs()` and `/`. That's what `absPaise` and `ratioPaise` are for. (`ratioPaise`
  exists because money divided by money is not money, and that conversion needs one home.)
- **Only `Confirmed<T>` counts.** Totals state their exclusions.
- **All writes go through `applyChange`.** No direct `set()` outside `store/change.ts`. There is
  no `delete` op — only `archive`.
- **The planner returns a plan, never data.**
- **Layout law.** Answer top-left, evidence right, working area centre, actions bottom. Positions
  never vary; only the blocks inside them change.
- **No new blocks.** Ten. If something doesn't fit, stop and ask.
- **No `any`, no `as` casts on domain types, no `@ts-expect-error`.**
- **The clock is fixed.**
- **Never add localStorage, IndexedDB, or a service worker.** `?s=fresh|extracted|live` seeds
  from `scenarios.ts`; state resets on refresh. That is the whole persistence story.
- **Never install a package without asking.**

Denied by settings: `git push`, `rm -rf`, `git reset --hard`, `pnpm`, `yarn`, `curl`, `wget`,
reading `.env*`, editing `src/components/ui/**` (one documented exception in `sonner.tsx`, noted
in its commit).

---

## Product copy

Plain, specific, slightly understated. It states **consequence, not status**:

> Thursday's ₹80,000 to Sharma has no cover if today's instalment slips

not "Payment due Thursday". Never exclamation marks, never "Oops!", never an emoji.

Proactivity follows §9.3: two to four observations, never nag twice, say the consequence.

---

## Working style that held up

From SETUP.md, and it proved right:

- **One block or one screen per session, then `/clear`.** Drift in a design-system build shows
  up as five slightly different card paddings.
- **Plan mode for anything touching the store or the canvas.**
- **Review the screenshot, not the diff, for UI work.** The diff says what was written; the
  screenshot says whether it's right.
- **Commit per block.** Small commits are how the moment a convention broke gets found.
