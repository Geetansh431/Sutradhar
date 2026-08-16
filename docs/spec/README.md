# Sutradhar — prototype specification

UI/UX specification v1.0, split by section. The slash commands in `.claude/commands/`
reference these paths directly.

| File | Section |
|---|---|
| [00-front-matter.md](00-front-matter.md) | Document metadata and contents |
| [01-purpose-scope.md](01-purpose-scope.md) | What the prototype must prove · the premise · USP as build constraints |
| [02-principles.md](02-principles.md) | The eight principles · the capture pipeline |
| [03-personas-roles.md](03-personas-roles.md) | The two roles · the money line |
| [04-information-architecture.md](04-information-architecture.md) | Destinations · navigation rules · the global bar |
| [05-onboarding.md](05-onboarding.md) | Three rules · four movements · the interview · field states (§5.5) |
| [06-screens.md](06-screens.md) | Home · Projects · Project workspace · Money · People · Files · Calendar · Firm Memory · Settings |
| [07-canvas.md](07-canvas.md) | The two panels · the layout law · composition rules · pinning |
| [08-components.md](08-components.md) | The ten blocks · the universal contract · the change preview |
| [09-ai-behaviour.md](09-ai-behaviour.md) | What it may do · the no-AI list · proactivity |
| [10-demo.md](10-demo.md) | Five minutes, beat by beat |
| [11-deferred-open.md](11-deferred-open.md) | Deferred with reasons · four open decisions |
| [A-decision-log.md](A-decision-log.md) | Every decision the specification rests on |

Also here: [ideation-v0.1.md](ideation-v0.1.md), the prior product ideation document
this specification extends.

## Wireframes

Fourteen, in [wireframes/](wireframes/). Each is referenced from the section it belongs to.

| # | File | Shows |
|---|---|---|
| 1 | `w01_capture_pipeline.png` | Freedom at capture, structure at commit |
| 2 | `w02_screen_map.png` | Fixed screens vs the composed Canvas |
| 3 | `w03_onboarding_movements.png` | Seed → Extract → Interview → Confirm |
| 4 | `w04_onboarding.png` | Ingestion left, elicitation right, coverage bottom |
| 5 | `w05_field_states.png` | The five field states and their treatments |
| 6 | `w06_home.png` | Brief, pulse cards, action queue |
| 7 | `w07_projects_pipeline.png` | Pipeline board and "Sutradhar noticed" |
| 8 | `w08_project_workspace.png` | Stage stepper, fact row, task tree |
| 9 | `w09_money.png` | Money timeline with the coverage gap |
| 10 | `w10_firm_memory.png` | Coverage, gaps, sources, what changed |
| 11 | `w11_canvas.png` | AI panel, co-panel, the vendor-exposure answer |
| 12 | `w12_layout_law.png` | Three questions, one invariant zone map |
| 13 | `w13_components.png` | The ten blocks |
| 14 | `w14_change_preview.png` | Change preview anatomy |

**The wireframes carry the demo's canonical figures.** Where the prose and a wireframe
disagree on a number, the wireframe wins — `src/fixtures/firm.ts` is authored from them.
