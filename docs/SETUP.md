# Sutradhar prototype — environment setup

One developer, ten days, Claude Code writing most of it. Everything here is chosen for that
specific situation: fast feedback, hard guardrails, minimum ceremony.

Budget **half a day** for steps 1–8. Do not spend more — if something fights you, note it and
move on.

---

## What's in the scaffold

```
CLAUDE.md                    the project constitution — the highest-leverage file here
biome.json                   format + lint, one tool
tsconfig.json + app + node   strict, with the settings that catch agent mistakes
vite.config.ts
components.json              shadcn config
.claude/settings.json        permissions + hooks
.claude/commands/*.md        /block /screen /verify /fixture
.mcp.json                    shadcn + playwright MCP
.husky/pre-commit
src/styles/globals.css       the wireframe palette in OKLCH + density tokens
src/lib/money.ts             Paise branded type
src/lib/field.ts             the five field states, sumMoney, totalMoney
src/store/change.ts          ChangeSet — the only write path
src/canvas/plan.ts           Zod plan schema — the "no invented numbers" guarantee
src/fixtures/scenarios.ts    scenario seeding instead of persistence
```

---

## 1 — Prerequisites

```bash
node -v      # 22 LTS or newer
corepack enable && corepack prepare pnpm@latest --activate
pnpm -v
```

Node 22+ matters: Vite 8 dropped older runtimes.

## 2 — Scaffold

```bash
pnpm create vite@latest sutradhar -- --template react-ts
cd sutradhar && git init
```

Then copy the scaffold files over the generated ones, keeping `index.html`, `src/main.tsx`,
`src/App.tsx`.

## 3 — Dependencies

Two commands, then **stop adding packages**. `pnpm add` is denied to Claude Code on purpose —
if it wants a library, it has to ask you.

```bash
pnpm add react-router zustand immer @tanstack/react-table zod \
         clsx tailwind-merge class-variance-authority lucide-react \
         date-fns recharts nanoid motion

pnpm add -D tailwindcss @tailwindcss/vite tw-animate-css \
            @biomejs/biome vitest @vitest/coverage-v8 husky knip \
            @types/node
```

| Package | Why it's here |
|---|---|
| `zustand` + `immer` | The store. Immer makes `applyChange` readable without a reducer framework. |
| `@tanstack/react-table` | Block 02 needs filter, sort, group, column pick, inline edit. Hand-rolling this costs two days. |
| `zod` | Validates the canvas plan. The one thing standing between a malformed plan and a broken demo. |
| `recharts` | Block 07 only. The money timeline is hand-built SVG — its axis isn't a chart-library shape. |
| `motion` | The extraction feed and canvas composition. Used sparingly. |
| `knip` | Dead-file detection. Unusually valuable when an agent generates files fast. |

## 4 — Tailwind v4 + shadcn

```bash
pnpm dlx shadcn@latest init
```

Take `new-york`, `stone` base. Then **replace the generated `globals.css` with the scaffold
one** — it carries the wireframe palette, the field-state classes, and the density tokens.

Install only the primitives you actually need, when you need them:

```bash
pnpm dlx shadcn@latest add button input select dialog sheet popover \
  command tooltip badge separator tabs scroll-area skeleton sonner
```

`command` is the one to install early — the ask bar is built on it.

> **`src/components/ui/**` is excluded from Biome and denied to Claude Code for editing.**
> Restyle through tokens, not by editing primitives. When a primitive genuinely needs
> changing, do it yourself and note why in the commit.

## 5 — Fonts

Self-host rather than using the Google CDN — one less network dependency during a demo.

```bash
pnpm add @fontsource-variable/inter @fontsource-variable/source-serif-4
```

Import both in `main.tsx`. Both carry ₹ correctly, which not every font does — check any
replacement against `₹18,40,000` before adopting it.

**Decide the pairing on day 2, not now.** Build `/lab/type` first: render three candidate
pairings against real content — a dense grid row of rupee figures, the brief paragraph, the
stage stepper, a `₹6,42,000` answer block. Then change two variables in `globals.css`.

Candidates worth loading: Source Serif 4 (institutional, the default in the scaffold) ·
Fraunces (warm, editorial) · Instrument Serif (sharp, modern) — each against Inter, Geist,
or Public Sans.

## 6 — Scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b --noEmit && vite build",
    "preview": "vite preview",
    "check": "biome check --write . && tsc -b --noEmit",
    "lint": "biome check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "dead": "knip",
    "prepare": "husky"
  }
}
```

```bash
pnpm exec husky init   # then paste in the scaffold's .husky/pre-commit
```

## 7 — Claude Code

Copy `.claude/` and `.mcp.json` in, then:

```bash
claude          # it will prompt to approve the two MCP servers
/mcp            # confirm shadcn and playwright are connected
```

**Copy the spec in too** — `docs/spec/` with the section markdown and
`docs/spec/wireframes/*.png`. The slash commands reference these paths directly, and the
Playwright MCP screenshot comparison is worth little without the wireframes to compare to.

Three things this configuration does:

- **`pnpm add` is denied.** Scope creep in an agent build usually arrives as a dependency.
- **PostToolUse formats** after every write, so you never review a diff full of whitespace.
- **Stop runs `tsc`.** Every turn ends with a typecheck. This is the single highest-value
  hook here — it turns "looks right" into "compiles", automatically.

### On 21st.dev

I'd skip the Magic MCP for this build. It needs a key, adds a network dependency, and its
components arrive with their own spacing and motion opinions that will fight the token
system. Paste from 21st.dev by hand when you want a specific motion effect, and port it onto
your tokens as you paste. **shadcn for primitives, 21st.dev for motion only, the ten blocks
hand-built** — the blocks are the product, they shouldn't come from a library.

## 8 — Verify the setup

```bash
pnpm dev
```

Check: `/?s=live` loads · `/lab` routes · `pnpm check` passes clean · a deliberate `any`
fails lint · a deliberate `const x: Paise = 5` fails typecheck.

That last one is the real test. If `5` is assignable to `Paise`, the branding isn't working
and every guarantee below it is theatre.

---

## The four contracts

These do more for code quality than any linter, because they make wrong code fail to compile
rather than fail in review.

**1. Money is `Paise`.** A branded integer. `const total = price * 1.18` won't compile. Every
figure formats through `formatINR()`.

**2. Only `Confirmed<T>` counts.** `sumMoney()` accepts `Confirmed<Paise>[]`. Passing a
`FieldValue<Paise>[]` is a compile error. `totalMoney()` returns the total *plus its own
caveat string*, so a total can always state what it excluded — spec §5.5 and principle P4,
enforced by the type system.

**3. All writes are `ChangeSet`s.** One function, `applyChange`. Audit and undo fall out of it
for free. There is no `delete` op in the union — only `archive` — so no-AI rule #4 can't be
violated even by accident.

**4. Plans carry refs, not values.** `CanvasPlan` has nowhere to put a number. The planner
says "money-timeline, these filters, 60-day window"; the resolver reads the store. A canned
planner and a real model emit the identical shape, so canned → live is one import swap.

That fourth one is why the canned build is still a genuine dummy run of the real product
rather than a facade. **The failure mode to watch for in review: Claude Code hardcoding block
trees inside screen components.** It's fast on day 3 and unpickable on day 9. It's rule #5 in
CLAUDE.md, and it's the thing to grep for when you review.

---

## Build order

Blocks before screens, always. A screen is a composition; composing things that don't exist
produces one-off inline versions you'll be unpicking on day 9.

| Days | Work | Done when |
|---|---|---|
| **1** | Scaffold, tokens, `/lab` shell, money + field types with tests | A `Paise` misuse fails to compile |
| **2** | Store, `applyChange`, audit, undo, fixtures for the two live projects, scenarios | All four scenarios boot |
| **2** | `/lab/type` and the theme decision | Fonts locked, two variables changed |
| **3–4** | Tier-1 blocks: record card, data grid, money timeline, ledger, change preview, gap, document viewer, chart | Every state visible in `/lab` |
| **5** | Chrome: rail, topbar, ask-bar picker, pinning | Pin creates a rail entry |
| **5–6** | Home, Money | Coverage gap detected from fixtures, not hardcoded |
| **6–7** | Canvas: plan schema, canned planner, resolver, layout law | 3 canned questions compose correctly |
| **7** | Onboarding | Drop → extract animation → interview → coverage |
| **8–9** | Tier 2 (Projects, Project workspace, Firm Memory), Tier 3 (People, Files, Calendar, Settings) | Navigable, populated, no dead ends |
| **10** | Polish, rehearse, freeze | Demo run three times without a surprise |

**Cut order if day 7 arrives with Tier 1 unfinished** — decided now, while calm:

1. Tier 3 screens become static screenshots
2. Project workspace drops from Tier 2
3. Onboarding's extraction animation becomes a progress bar
4. Projects loses map mode

## Working with Claude Code — what actually helps

- **One block or one screen per session.** Then `/clear`. Long sessions drift, and drift in a
  design-system build shows up as five slightly different card paddings.
- **Plan mode for anything touching the store or the canvas.** Let it write the plan, read the
  plan, then let it build. Cheaper than reviewing the diff.
- **Review the screenshot, not the diff, for UI work.** The diff tells you what it wrote; the
  screenshot tells you whether it's right.
- **Commit per block.** Small commits are how you find the moment a convention broke.
- **When it asks to install something, the answer is usually no.** Ask what it's for; the
  answer is often "a thing three lines of code would do".
- **Grep weekly** for the two smells: literal rupee figures outside `fixtures/`, and block
  trees inside `screens/`.

---

## Two things still open

**The type pairing** — decide on `/lab/type` on day 2.

**The ask-bar interaction.** The scaffold assumes a filtered picker: typing narrows the canned
question list, selection runs it, free text can never submit. That keeps the ⌘K feel of the
real product while making off-script input structurally impossible. If you'd rather it be
plain chips with no text input at all, say so before day 5 — it changes the chrome component
and the demo's second beat.
