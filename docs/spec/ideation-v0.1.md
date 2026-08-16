# Sutradhar
## The Operating System for Interior Design Firms
### Product Ideation Document — v0.1

| | |
|---|---|
| **Status** | Ideation — pre-build, pre-commitment |
| **Audience** | Founding team only |
| **Date** | July 2026 |
| **Working name** | "Sutradhar" — in Indian theatre, the sutradhar is the one who holds every thread of the performance. That is exactly what a design firm's admin does today, badly, with WhatsApp and Excel. (Placeholder — naming is a later decision. Alternatives parked: Neev, Aangan, StudioOS.) |

**Decisions already locked for this document:**

1. **One firm first, productize later.** We build hand-in-glove with a single design-partner firm, run their real projects on it, then generalize. This document is written for that path.
2. **India-first.** Pricing in INR, workflows built around advances, daily wagers, running bills, GST, Tally, and WhatsApp culture.
3. **Audience: us.** This is a thinking document, not a pitch. It should be honest about risks, not persuasive.

**Working assumptions (correct these if wrong):** target firm is a founder-led interior design/design-build firm of roughly 5–50 people, running 3–20 active projects, where one admin (usually the founder) personally holds operations together. Product is web-first with a mobile-usable experience for on-site work.

---

## 1. The One-Line Pitch

> **Every project, payment, person, and paisa of an interior design firm — in one place, visible in one glance.**

The longer version: Sutradhar is the operations backbone for Indian interior design firms. It tracks the full life of a project from first client call to handover, and — most importantly — keeps the firm's money flow honest: what the client owes, what vendors are owed, and when, so that no payment ever falls into a vacuum.

---

## 2. The Problem We Are Solving

### 2.1 The admin's life today

Picture the admin of a mid-size design firm running six live sites. Their "system" is:

- **6–10 WhatsApp groups per project** — client group, vendor groups, internal team group. Decisions, approvals, and site photos are buried in scroll.
- **One Excel sheet for payments**, last updated whenever someone remembered. It disagrees with Tally, which lives with the accountant.
- **A diary** for site visit notes and verbal commitments.
- **Drawings scattered** across Google Drive, email attachments, pen drives, and the 3D artist's laptop. Nobody is sure which version the carpenter is actually working from.
- **Their own memory** as the real database. Every status question — "has the electrician's advance gone?", "when is the client's second instalment due?", "did we ever price that extra wardrobe?" — routes through one human brain.

The admin is not disorganized. They are running a genuinely complex operation — multiple concurrent projects, each with its own client, timeline, vendor set, payment schedule, and daily-wage labour — on tools built for none of it.

### 2.2 The named pains

1. **No single source of truth.** Project status lives in five places and in nobody's head completely. Answering "where does project X stand?" takes phone calls, not seconds.
2. **The payment vacuum.** This is the killer. Vendor payments (advances, running bills, labour wages) must be funded by client instalments. When a client payment slips and nobody saw it coming, the firm either delays vendors — labour walks off site, deadlines slip, the client withholds the *next* instalment too — or the founder bridges from personal funds. One missed link starts a death spiral.
3. **Invisible site progress.** The admin can't be at six sites. Progress reporting is "sab theek hai" on a call until suddenly it isn't. Delays surface late, when they're expensive.
4. **Vendor leakage.** Contracts are verbal or on WhatsApp. Advances are paid and half-forgotten. Extra work gets done without a price agreed. Reconciling a vendor's final bill against what was actually agreed and delivered is guesswork — and guesswork always costs the firm.
5. **Change orders eaten as margin.** Mid-execution, the client says "actually, let's also do the pooja room." It gets done on goodwill, the cost/time impact is never formally priced or approved, and the firm silently absorbs it. Over a project, these leaks routinely eat a meaningful slice of the margin.
6. **Salary and attendance friction.** Leaves are tracked loosely; month-end salary calculation is a manual negotiation with everyone's memory. Site supervisors and daily wagers make it messier.
7. **No way to query the business.** "Show me every pending payment above ₹50,000 across all projects, oldest first" is a completely reasonable question the admin cannot ask anything today.

### 2.3 The cost of the status quo

Even conservatively: the admin loses **10–15 hours a week** to status-chasing and reconciliation; the firm leaks money through unpriced change orders, disputed vendor bills, and late-fee/goodwill damage from payment slips; and the business **cannot scale past the admin's personal memory** — which is the real ceiling on the firm's growth. That last point is the deepest one: today, adding a seventh project doesn't add linear work, it adds risk.

---

## 3. Who We're Building For

### 3.1 Primary persona — The Admin

The founder or operations head. Buys the product, uses it daily, and is our single point of adoption success or failure. They think in **projects and payments**, not in software. Their bar: *"Does this answer my questions faster than my current chaos, and does it pay for itself the first time it saves one payment slip?"*

### 3.2 Secondary personas

- **Site supervisor (employee).** On site all day, on a phone. Needs: today's tasks, mark done, upload photos, flag problems, request material/payment. Will only use it if it's lighter than WhatsApp.
- **Accountant (often part-time/external).** Needs clean payment records they can reconcile with Tally. We are not their accounting system; we are their source of operational truth.
- **Vendors.** Not users in v1. They *feel* the product through predictable payments and written work orders. (A vendor-facing view is a later bet — see §10.)
- **Client.** Not a user in v1. A read-only progress/payment portal is a powerful later feature — visibility builds trust, and trust builds referrals.

### 3.3 Firm #1 — the design partner

Everything in this document gets pressure-tested against one real firm first. Their live projects become our test data; their admin's Tuesday becomes our spec. The discipline we must hold: **build what generalizes, configure what doesn't** (see Risks, §16).

---

## 4. Why Now, Why India-First

**The market is large and professionalizing.** Industry estimates put India's interior design market at roughly **USD 30–37 billion in 2025**, growing at ~8–13% annually (ranges across Mordor Intelligence, IMARC, TechSci and others — exact figures vary by methodology, direction doesn't). Growth is driven by urbanization, the residential real-estate boom, and commercial fit-outs. Critically for us, the market is shifting from unorganized contractor-led work toward **organized, accountable firms** — and organized firms need operating systems.

**The long tail is our market.** Livspace and HomeLane get the headlines, but beneath them are tens of thousands of independent design and design-build firms — exactly the 5–50-person, founder-run firms we describe — with essentially zero purpose-built software.

**The rails now exist.** UPI made payments instant and trackable. GST forced even small firms into digital record-keeping. Smartphone-first supervisors are the norm. And WhatsApp proved that this industry *will* adopt digital tools daily — it just adopted the wrong one for running a business.

**The gap is specific.** India has produced good *construction-site* apps (Powerplay, Onsite — see §11), and the West has *interior-designer* tools (Houzz Pro, Studio Designer) built around sourcing furniture for clients in dollars. Nobody owns the **Indian design-build firm's full operating loop**: concept → CAD → 3D → client approval → contract → vendor execution → change orders → handover, with the money flow stitched through all of it. That loop is this document.

---

## 5. What We Solve — Problem to Capability, Precisely

| # | Today's pain | What Sutradhar does about it |
|---|---|---|
| 1 | Truth scattered across WhatsApp/Excel/diary/memory | One project workspace: status, tasks, payments, files, people — per project and across all projects |
| 2 | Payment vacuums between client inflows and vendor outflows | A **Money Timeline** that schedules every inflow and outflow on one axis and flags any outflow not covered by a cleared/scheduled inflow — *before* it becomes a crisis |
| 3 | Invisible site progress | Task trees per project + supervisor's daily mobile updates (done/blocked/photo), rolled up into a live progress view |
| 4 | Vendor leakage | Vendor records with contracts, work orders, advance/running-bill/balance tracking, and an activity log — every rupee and every commitment written down |
| 5 | Change orders eaten silently | A formal change-order flow: capture on site → price cost/time/effort → client approves → project budget, timeline, and payment schedule update automatically |
| 6 | Salary/attendance friction | Attendance and leave records that flow directly into an auto-drafted monthly salary sheet |
| 7 | Can't query the business | A query layer over everything: filter, sort, save views, export — "SQL power, no SQL required" |

---

## 6. The Product — Module by Module

Six modules, one spine. The spine is the **project**; money, people, files, and time all hang off it.

### 6.1 Projects & Sites

Every project moves through the firm's real lifecycle. We digitize the workflow the firm already runs — not an abstract "kanban":

| Stage (the firm's own timeline) | What the product does at this stage |
|---|---|
| 1. Enquiry — client reaches out | Create project as *Lead*; log requirements, scope, budget range, time expectations (the "basic FAQs") |
| 2–3. Feasibility & site visit | Site visit notes, photos, measurements attached to the project; go/no-go decision recorded |
| 4. CAD drawing | Task assigned to employee with deadline; file uploaded and versioned on completion |
| 5. Concept + budget presentation | Budget draft attached; client approval recorded with date — the first formal gate |
| 6. 3D working drawings → contract | 3D files versioned; contract uploaded; **payment schedule created here** — client instalments and expected vendor outflows planned together so there is no vacuum by design |
| 7. Vendor mobilization | Vendors attached to the project with roles (furniture, electrical, paint, labour…), work orders, and their own payment lines |
| 8. Execution & supervision | Task tree drives daily work; supervisor updates from mobile; admin's dashboard rolls it all up |
| 9. Handover & closure | Final payment cleared, closure signed, project archived with its full history — a permanent record for disputes and for learning |

Core mechanics:

- **Task trees.** Tasks nest (False ceiling → Wiring → Framing → Boards → Finishing). Each node has an assignee (employee or vendor), a deadline, a status, and optional linked payments. Add/remove/modify at any depth.
- **Entities on projects.** Attach or detach any client, employee, or vendor to a project with a defined role; the relation carries its own payments and tasks.
- **Deadlines everywhere roll up.** Task deadlines, payment deadlines, and stage gates from all projects feed one firm-level calendar.

### 6.2 Payments & Money Flow — the flagship

This module is why the admin will pay us. Principles: **every rupee is planned before it is spent, and every planned rupee has a date and a status.**

- **Entity ledgers.** Every client, vendor, and employee has a ledger: planned payments, completed payments, balances. Direction-aware (client = inflow; vendor/employee = outflow).
- **Payment objects.** Amount, direction, entity, project, due date, status (*planned → due → overdue → partially paid → paid*), mode (UPI/bank/cash/cheque), attachments (invoice, receipt), and notes. Supports the industry's real shapes: advances, running bills (percentage-of-work), retention amounts, and milestone-linked instalments.
- **The Money Timeline.** One horizontal view per project (and one firm-wide): client inflows above the line, vendor/salary outflows below it, by date. The system continuously checks coverage and raises a **vacuum warning**: "₹3.2L due to vendors in the next 14 days; only ₹1.5L of client inflows scheduled/cleared. Gap: ₹1.7L." This turns the firm's most dangerous surprise into a two-week early warning.
- **Milestone-gated outflows.** A vendor payment can be linked to a client instalment ("release electrician's 2nd payment only after client instalment #3 clears") — encoding the rule the admin already runs in their head.
- **Actions in one tap.** Mark paid (full/partial), push a deadline (with reason logged), send a reminder.
- **Query it like a database.** "All overdue inflows", "everything payable this week across projects", "total paid to vendor X this year", "client Y's outstanding" — filters, sorts, saved views, CSV export. This is the user's requested "SQL-type feature", delivered as a visual query builder.

### 6.3 Vendor Management

- **Vendor master.** Add/remove/modify vendors with category (furniture, electrical, paint, labour supply, plumbing…), contacts, bank/UPI details, rate notes, and documents.
- **Contracts & work orders.** Per project: scope, agreed amount, payment terms, deadlines. Extra work requires a new work order line — nothing rides on memory.
- **Activity log.** Timestamped record of everything about a vendor on a project: work updates, deliveries, issues, payments, calls. When the final-bill argument comes — and it always comes — the firm has the paper trail.
- **Performance memory.** Simple ratings/notes after each project (on time? on budget? quality?). Compounds into a private vendor intelligence asset — and seeds a much bigger future (§10).

### 6.4 Employee Management

- **Employee master.** Add/remove/modify employees with role, salary structure, joining date, documents, emergency contacts.
- **Assignment & load.** Assign/dismiss tasks; a per-person view shows current load across projects, so the admin stops assigning by gut feel.
- **Attendance & leaves.** Mark leaves (or supervisor check-ins from site); leave balances tracked.
- **Salary engine.** Month-end salary sheet auto-drafted from salary structure + attendance/leaves + recorded advances or deductions. The admin reviews and approves; each payout lands in the payments ledger like any other outflow. (Statutory payroll — PF/ESI/TDS filings — is explicitly out of scope in v1; we export clean numbers for the accountant.)

### 6.5 Change Orders — the margin protector

Mid-execution change is not an exception in this industry; it is the norm. So it gets first-class treatment:

1. Anyone (usually the supervisor or admin, on site) logs a requested change against the project.
2. It is priced: **cost impact, time impact, effort impact** — the three attachments the user's brief names.
3. It goes to the client for approval (v1: recorded manually; later: via client portal).
4. On approval, the project's budget, timeline, task tree, and payment schedule update — automatically and visibly.
5. Declined or parked changes stay on record. Nothing agreed verbally on a Tuesday at site ever silently vanishes into the firm's margin again.

### 6.6 Files, Drawings & Contacts

- **Folder tree per project.** Organize drawings, CAD files, 3D renders, site photos, contracts, invoices in a hierarchy the firm defines. Add/remove/move/rename freely.
- **Versioning where it matters.** Drawings get versions with an explicit "current for execution" marker — ending the "carpenter built from the old PDF" class of disaster.
- **Approval stamps.** Mark a drawing as client-approved with date; approvals are project history, not chat history.
- **Contacts.** Add/remove/modify contacts per project and firm-wide (client-side people, site contacts, authorities), so numbers stop living only in the admin's phone.

### 6.7 Queries, Reports & Dashboards

- **The dashboard** (detailed as a narrative in §7): today's collectibles, payables, overdue items, site alerts, pending approvals.
- **Saved views.** Any filtered query on payments, tasks, or entities can be saved and pinned ("This week's payables", "All stalled tasks > 3 days").
- **Project P&L.** Budget vs. actuals per project, live — most firms today learn a project's real profitability months after handover, if ever.
- **Later:** ask questions in plain language ("kitne payments pending hain is month?") and get the filtered view — the natural evolution of the query layer (§10).

### 6.8 ERP hygiene (the boring, essential layer)

Roles and permissions (admin / employee / accountant-read), a full audit log of who changed what and when, notifications (in-app first; WhatsApp/email reminders later), global search, and CSV/Excel export from every list. This is the "basic ERP features" line from the brief, made concrete. Trust in the numbers is the product; hygiene is what earns it.

---

## 7. A Day With the Product

How the admin sees, uses, and optimizes their day — the honest test of everything above.

**8:30 AM — the two-minute scan (was: an hour of calls).**
Dashboard on first chai: ₹2.5L instalment due today from the Iyer project (one tap → reminder sent). Electrician's ₹80K advance due Thursday — flagged amber because it's gated on that same instalment; the vacuum warning already did the math. Supervisor at the Kormangala site uploaded photos at 8:10 and flagged the false-ceiling material as delayed. One change order (extra wardrobe, ₹45K, +4 days) awaiting client approval for two days — nudge sent.

**11:00 AM — at site, on the phone.**
Walks the site with the checklist open instead of a diary. Marks three tasks done, attaches photos. Client, on the spot: "can we also panel this wall?" Instead of a nod that costs ₹30K of silent margin, the admin logs a change order draft in forty seconds — pricing to follow from office. The commitment is captured at the moment it is born.

**6:00 PM — planning, not archaeology.**
Week view across all projects: one carpenter-dependent task chain is slipping; reassigns a task to balance load using the per-person view. Approves a leave request — the salary preview for the month adjusts itself in the background.

**Month-end — an hour, not a weekend.**
Salary sheet is already drafted from attendance. Review, adjust one advance deduction, approve; payouts drop into the ledger. The project P&L view shows the Iyer project running 4% over budget — visible *now*, with two months left to correct it, not at handover.

**Anytime — answers in seconds.**
"What's our total exposure to vendor Sharma?" "Which projects have overdue client payments?" "What did we approve for the HSR project's bedroom in March?" Each was a phone-call-and-pray question. Each is now a saved view or a search.

The through-line: the admin's day shifts from **chasing information to making decisions** — and their evenings and Sundays come back.

---

## 8. How the Firm's Resources Get Managed Here

Every business runs on five resources. Here is where each one lives in the product:

- **Money** → Payments module. Planned before spent, dated, statused, queryable; the Money Timeline governs flow; ledgers govern relationships; project P&L governs profitability.
- **People** → Employee module for the team (assignment load, attendance, salary) and Vendor module for the extended workforce (contracts, work orders, activity logs).
- **Time** → Deadlines on tasks, payments, and stages roll into one calendar; change orders formally reprice time; slippage is visible the day it starts, not the week it explodes.
- **Materials & execution capacity** → Managed through vendors and work orders in v1 (who is contracted to deliver what, by when, for how much); direct material/BOQ inventory is a deliberate later bet (§10).
- **Information** → Files with versioning and approvals, contacts, activity logs, and the audit trail. The firm's institutional memory finally lives in the firm, not in one person's head.

The compounding effect: because every module writes into the same spine, each resource view *explains* the others — a slipped task shows the payment it endangers; a change order shows the deadline it moves.

---

## 9. Where We Make Life Better — Outcomes, Not Features

**For the admin/founder:** 10+ hours a week returned; cash-flow surprises replaced by two-week warnings; the confidence to take on project #7 and #8 because the ceiling is no longer their own memory.

**For employees/supervisors:** an unambiguous "what's mine today" list; credit for work is visible (photos, timestamps), so blame games die; salary is transparent and on time.

**For vendors:** written scope, predictable payments, faster dispute resolution. Good vendors prefer working with organized firms — over time, the firm gets *better vendors at better terms* because it is a better counterparty.

**For clients:** fewer "just checking in" calls, faster answers, formal approvals. Trust compounds into the only marketing that matters in this industry: referrals.

**For the accountant:** clean, exportable, reconciled operational records instead of a shoebox of screenshots.

**For the firm as a business:** margins stop leaking (priced change orders, reconciled vendor bills), projects have known profitability, and the operation becomes *transferable* — the firm can eventually run without the founder holding every thread, which is the difference between a job and a company.

---

## 10. Good to Have — the v2+ Bets (deliberately not in v1)

Parked, in rough priority order. Each earns its place only after the core loop is loved:

1. **WhatsApp layer.** Reminders to clients/vendors via WhatsApp; later, *capture* via WhatsApp (forward a bill or site photo to a bot, it files itself). This meets the industry exactly where it lives and may be the single biggest adoption unlock.
2. **Client portal (read-only).** Live progress, photos, payment schedule, and one-tap change-order approvals. Turns transparency into a sales weapon for the firm.
3. **Tally / GST export.** One-click export the accountant can ingest. We never try to *be* the accounting system; we feed it.
4. **BOQ & materials.** Bill-of-quantities per project, material requests from site, delivery tracking — the natural deepening of the vendor module.
5. **AI, in service of the loop.** Natural-language querying ("show me sab pending payments for July"); site-photo-to-progress suggestions; cash-flow forecasting from payment history; draft-BOQ-from-CAD as the moonshot.
6. **Vendor network effects.** Firms privately rate vendors today (§6.3); aggregated (with consent) across firms tomorrow, this becomes a trusted vendor directory — and eventually a marketplace. This is the long-game reason vendor data hygiene matters from day one.
7. **Templates.** Standard task trees and payment structures ("3BHK full interior", "modular kitchen") so new projects start 80% pre-built.
8. **Multi-branch / multi-city** for firms that outgrow one office — a productization-phase concern, noted so v1 data models don't paint us into a corner.

---

## 11. Why Anyone Should Buy This — Positioning Against the Alternatives

The honest competitive map. Our buyer's real alternatives today:

| Alternative | What it's good at | Why it loses for our buyer |
|---|---|---|
| **Status quo** (WhatsApp + Excel + diary + Tally) | Free, zero learning curve, universally adopted | Costs 10–15 hrs/week, leaks margin invisibly, caps the firm at the admin's memory. It isn't free; it's the most expensive option in the room |
| **Generic ERP** (Zoho, Odoo, Vyapar-class tools) | Powerful, mature, cheap-ish | Weeks of consultant-led setup; speaks "inventory & invoices", not "site, stage, running bill, daily wager, change order". Small firms bounce off it |
| **Global designer tools** (Houzz Pro, Studio Designer, Programa) | Beautiful sourcing/spec workflows for Western designers | Built for firms that *specify and bill for furniture*, not Indian design-*build* firms that run labour and vendors on site. USD pricing, no GST/Tally/UPI reality, no daily-wage concept |
| **Indian construction apps** (Powerplay, Onsite) | Genuinely strong at site execution — tasks, attendance, material, DPRs; Powerplay even markets to interior projects. Our closest and most credible neighbours | Site-execution first, firm-operations second. The design firm's *front half* — enquiry → CAD → 3D → client approval → contract → payment scheduling — and its *money spine* (client-instalment-to-vendor-payment gating, change-order pricing, salary engine) are not their center of gravity |

**Our wedge, stated plainly:** we are the only product built around the **interior design firm's full loop** — design lifecycle *and* execution *and* the money flow that binds them — in Indian units, on Indian rails, at Indian small-firm prices. Powerplay starts from the site and works up; we start from the firm's money and design workflow and reach down to the site. For our buyer, the money is the business.

**And the one-sentence sales pitch to a firm owner:** *"The first time this warns you two weeks early about a payment gap, or catches one unpriced change order, it has paid for a year of itself."* The product is priced against leaked lakhs, not against software budgets — our buyer doesn't have a software budget, but they absolutely have a leakage problem.

**Why we can win it:** (a) a design partner giving us ground-truth workflow access competitors approximate from outside; (b) a wedge (money flow) that is the buyer's top pain, not a feature checkbox; (c) speed and focus — we serve one persona in one industry in one country, and refuse everything else until this is loved.

---

## 12. Business Model — Sketch (hypotheses, not decisions)

**Phase 1 (design partner):** paid pilot at a nominal ₹5–10K/month. Not for revenue — for skin in the game on both sides. In exchange: deep access, weekly working sessions, a public case study at the end, and a locked founder price for life.

**Phase 2 (productized SaaS):** price on **active projects**, because that is the unit our buyer thinks in and the unit our value scales with. Placeholder tiers to test, not to defend:

- *Studio* — up to 5 active projects, 5 users — ~₹2,999/month
- *Firm* — up to 15 active projects, 15 users — ~₹7,499/month
- *Scale* — unlimited projects, roles/permissions depth, priority support — ~₹14,999/month

Sanity check: a firm running 8 projects at even ₹15L average value is handling crores of throughput; ₹7,499/month is noise against one avoided payment slip. Annual-plan discounts likely (this segment rewards commitment pricing). Open pricing questions live in §18.

**What we will not monetize early:** vendor-side fees or marketplace take-rates. That only works after the network exists (§10.6), and trying early poisons vendor data quality.

---

## 13. Go-To-Market — Sketch

1. **Design partner** (now): one firm, run deep, produce an undeniable before/after story with real numbers (hours saved, slips caught, margin recovered).
2. **First ten** (post-MVP): referrals from the design partner and their vendor/client network; local firm communities and associations (IIID chapters, design colleges' alumni circles); founder-led onboarding for every single one. Target: ten firms in one city — density matters because this industry talks.
3. **First hundred** (productization): case-study-led content in the vocabulary of the trade ("how X firm stopped payment vacuums"), WhatsApp-community presence, and possibly channel partners (CA firms and design consultants who already advise these businesses).
4. **What we don't do:** paid ads to cold audiences, horizontal "ERP for SMEs" positioning, or any second industry vertical. Focus is the strategy.

---

## 14. Roadmap — One Firm to Product

**Phase 0 — Discovery (weeks 0–4).** Shadow the design partner's admin for real days. Map every artifact they touch (sheets, groups, diary pages). Migrate two live projects' data by hand into a clickable prototype. Exit criteria: we can name the admin's top five daily questions and answer each faster than their current method.

**Phase 1 — MVP (weeks 4–14).** The smallest product the admin uses *every working day*:
- Projects with stages, task trees, deadlines
- Payments in full (entities, ledgers, planned/actual, statuses, deadlines, Money Timeline with vacuum warnings, query/filter/export)
- Vendors: master, contracts/work orders, activity log
- Files: upload, folder tree, versions
- Mobile-responsive web (native apps later); notifications in-app
- Exit criteria: both migrated projects run live on Sutradhar; the payments Excel is retired.

**Phase 2 — Operations depth (weeks 14–24).** Employees (attendance, leaves, salary engine), change orders end-to-end, dashboard + saved views + project P&L, WhatsApp/email reminders.

**Phase 3 — Trust surface (months 6–9).** Client read-only portal, Tally/CSV accounting export, richer reports, supervisor mobile experience polish.

**Phase 4 — Productization (months 9–15).** Multi-tenancy, self-serve onboarding with templates, roles/permissions depth, billing, data import tools, security hardening. Begin "first ten" GTM.

**Explicit non-goals for v1** (written down so we can say no fast): accounting/GST filing, statutory payroll compliance, inventory/warehouse management, CAD/3D authoring or viewing beyond file storage, vendor marketplace, client-side apps, anything multi-industry.

---

## 15. Data Model — First Sketch

Enough to check that features hang together; not a schema review.

- **Firm** → has Users (role: admin / employee / accountant-read)
- **Entity** — Client | Vendor | Employee (shared identity core + type-specific profiles: vendor category & bank details; employee salary structure & leave balance)
- **Project** → belongs to Client; has Stage; has many ProjectMembers (Entity + role on this project)
- **Task** → belongs to Project; **parent_task_id enables the tree**; assignee (Entity), deadline, status; optional links to Payments
- **Payment** → Entity + Project (nullable for firm-level like salaries); direction, amount, due date, status, mode, attachments; optional **gated_on** → another Payment (the vacuum-prevention primitive)
- **Contract / WorkOrder** → Vendor + Project; scope, amount, terms; lines link to Payments
- **ChangeOrder** → Project; description, cost/time/effort impact, status (draft → priced → sent → approved/declined); on approval spawns Tasks and Payments and adjusts deadlines
- **File / Folder** → Project; parent_folder_id for the tree; File has versions and an approval stamp
- **Attendance / Leave** → Employee + date; feeds **SalaryRun** (month, computed lines, approved payouts → Payments)
- **ActivityLog** → polymorphic (who, what, when, on which object) — powers vendor logs and the audit trail with one mechanism

Two deliberate choices: payments reference entities *and* projects so both ledger views are cheap; and the task tree + folder tree + payment gating are plain self-references — boring, proven patterns. Boring is correct here.

---

## 16. Risks — and How We De-Risk

1. **Overfitting to firm #1.** The design-partner path's classic trap: we build their quirks, not the industry's. → Mitigation: before building any major feature deep, sanity-check it with 3 outside firms (we can buy this insight with demos and chai); keep a visible "generalizes vs. firm-specific config" tag on every feature decision.
2. **Data-entry death.** ERPs die when entering data costs more than it returns — and our admin is busy. → Mitigation: ruthless capture cost budget (every frequent action ≤ 3 taps), mobile-first for site events, week-one value concentrated in *payments only* so the habit forms around the highest-pain loop, WhatsApp ingestion as the eventual killer convenience.
3. **Single-user fragility.** If only the admin uses it, it's a nicer Excel; the compounding value needs supervisors updating from site. → Mitigation: the supervisor experience must be *lighter than WhatsApp* for its three core actions (see task, mark done, add photo); measure supervisor DAU as a first-class metric from day one.
4. **Credible neighbours moving over.** Powerplay already says "construction *and interior*"; Zoho verticalizes relentlessly. → Mitigation: our moat is depth-in-workflow (money spine, change orders, design lifecycle) plus segment intimacy; we win by being unmistakably *for* this buyer. Speed matters; so does not being a feature checklist.
5. **Willingness to pay in fragmented SMB India.** → Mitigation: price against leakage not software budgets (§12); paid pilot from day one to test this early, not after a year of free users.
6. **Founder bandwidth & scope creep from the design partner.** They will ask for everything. → Mitigation: the non-goals list (§14) is a contract with ourselves; monthly roadmap review where firm-#1 requests are explicitly sorted into build / configure / decline.
7. **Trust and data sensitivity.** We hold a firm's entire financial nervous system. → Mitigation: audit log from v1, daily backups, clear data-export path (no lock-in fear), and honest security basics before the first outside customer.

---

## 17. What Success Looks Like — Pilot Metrics (90 days on MVP)

- **≥ 90% of project payments** recorded in Sutradhar within 24h of occurring (the "Excel is dead" metric)
- **Admin active ≥ 5 days/week**; supervisor active ≥ 4 days/week
- **Time-to-answer** any status question ("what's pending?", "where does X stand?") **< 30 seconds**, measured live in working sessions
- **≥ 1 payment vacuum caught** by the warning before it became a crisis, and **≥ 2 change orders priced** that would previously have been absorbed — the two "it paid for itself" stories
- **Overdue-payment ageing down 50%** vs. the pre-Sutradhar baseline we capture in Phase 0
- **Three outside firms**, shown the live system, say some version of *"I would pay for this"* — the go/no-go signal for productization

If we hit these, we productize. If we can't get these with a motivated design partner and founder-led support, the honest conclusion is that the product isn't earning its place — better to learn that in 90 days than in two years.

---

## 18. Open Questions for the Founding Team

1. **Design partner terms.** Nominal payment amount? Case-study rights? Any exclusivity ask from them (resist), any advisory equity (probably no — keep it clean)?
2. **Pricing unit.** Per active project (current lean) vs. per user vs. flat tiers — what does firm #1's admin *instinctively* find fair?
3. **Mobile strategy.** Responsive web through Phase 2, or is a lightweight Android app for supervisors necessary earlier? (Supervisor adoption risk in §16.3 may force this.)
4. **Tech stack.** Recommendation: aggressively boring — Postgres, a mainstream web framework, one repo, zero microservices. Decide and stop discussing.
5. **Offline tolerance.** Sites have patchy connectivity. How much offline capability does the supervisor flow genuinely need in v1?
6. **Language.** English UI with Hinglish-tolerant inputs at launch — when do vernacular UI options matter for supervisors?
7. **Name.** Does *Sutradhar* survive contact with real users, and is the domain/trademark path clean?
8. **The line we won't cross.** Confirm as a team: no accounting, no statutory payroll, no marketplace, no second vertical until productization succeeds. Sign it.

---

## 19. Next Steps — the Two-Week Checklist

1. Confirm the design partner and agree pilot terms in writing (§18.1).
2. Book three full shadow days with their admin; collect every artifact (sheets, group exports, diary photos) into a shared vault.
3. Write the Phase 0 findings memo: the admin's top five daily questions, current time-cost of each, and the payment-flow map of one live project end-to-end.
4. Hand-migrate two live projects into a clickable prototype (even Figma + a spreadsheet behind it) and watch the admin try to *live* in it for a week.
5. Decide stack (§18.4) and set up the boring foundations: repo, environments, backups.
6. Recruit the three "outside sanity check" firms now, before we need them, so §16.1's mitigation is real.
7. Reconvene on this document — v0.2 gets written by what firm #1's Tuesday teaches us.

---

*End of v0.1. This document is meant to be argued with — every section above is a hypothesis until the design partner's real projects confirm or kill it.*
