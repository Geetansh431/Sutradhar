PROTOTYPE SPECIFICATION
Sutradhar
The interface for an interior design firm that has never used software

UI and UX specification for the proof-of-concept prototype. Screens, components, interaction rules and AI behaviour, written to be built from directly.
Field
Value
Document
Prototype UI / UX specification
Version
v1.0 — approved for build
Date
August 2026
Primary audience
The developer building the prototype
Secondary audience
The design-partner firm, advisors, and anyone who asks what we are building
Relationship to prior work
Extends Product Ideation Document v0.1. Supersedes v0.1 §10.5 only: AI moves from a v2 bet to the core of the interface.
Grounded in
“Information the firm holds” — the data audit of the design-partner firm
Data in the prototype
Synthetic, modelled on the design partner’s real shapes
Decided by
Founding team, through the decision log in Appendix A

Contents
1   Purpose & Scope
What the prototype must prove · the premise · the USP as build constraints · out of scope
2   Design Principles
The eight principles · the capture pipeline in detail
3   Personas & Role Visibility
The two roles · the money line · deferred personas
4   Information Architecture
The destinations · navigation rules · the global bar
5   Onboarding
Three rules · four movements · the screen · the interview · confidence and provenance · past versus live · prototype note
6   The Fixed Screens
Home · Projects · Project workspace · Money · People · Files · Calendar · Firm Memory · Settings
7   The Canvas
Concept · the two panels · the layout law · composition rules · pinning · worked examples · failure
8   Component Vocabulary
The ten blocks · the universal contract · the change preview in detail
9   AI Behaviour Specification
What it may do · the no-AI list · proactivity · data sensitivity · live versus stubbed
10   The Demo
Five minutes, beat by beat
11   Deferred and Open
Deferred with reasons · four open decisions
A   Appendix — Decision Log
Every decision this specification rests on
Fourteen wireframes are embedded through Sections 2 to 8.

1   Purpose & Scope

1.1  What the prototype must prove
One thing, and it should be visible in under five minutes: a firm can hand over its mess and get its business back as something it can ask questions of.
THE MONEY MOMENT
Upload chaos  →  see the firm  →  ask a question nobody could answer before  →  act on the answer without leaving the screen.
Everything in this document exists to make that sequence land. Anything that does not serve it is deferred to Section 11.

It succeeds if a firm owner watching says “when can I have this”, and an advisor can restate the wedge back to us unprompted.
1.2  The premise that drives every decision here
The design partner’s data audit is the foundation of this specification. It found roughly 57 distinct information types the firm holds, and where each one actually lives.
Where the firm’s information lives today
Count
Consequence for the interface
Only in someone’s head or in a conversation Marked ORAL or MEMORY
≈ 45
Cannot be uploaded. Must be asked for. This is why onboarding is an interview, not an import.
Cleanly in documents Drawings, renders, site photos
5
Easy to ingest — and the least operationally valuable fifth of the firm.
Partly in Excel or loose files Usually alongside oral memory
≈ 7
Ingestible but untrustworthy. Everything extracted needs a confirmation path.

THE CONSEQUENCE, STATED PLAINLY
A product whose pitch is “we read your files” would capture the least valuable fifth of this firm.
The differentiator has to be the opposite: getting what is in the founder’s head out of it, showing what is still missing, and never pretending to know something it does not.
1.3  The USP, restated as build constraints
Ease of use and freedom is the product’s differentiator. Existing tools in this category lose on learning curve — the buyer bounces off setup before value arrives. That converts into four non-negotiable constraints:
	•	Nothing may require training. If a screen needs an explanation before a firm owner can use it, the screen is wrong.
	•	No empty state may be a blank form. Every empty state offers either a question, a suggestion, or a way to dump something in.
	•	Anything askable of a human is askable here. If the admin could phone someone in the firm and get an answer, the Canvas must reach it.
	•	Structure we did not anticipate, the user can make. Custom fields, own hierarchy, own saved screens — without visiting a settings page.
1.4  Out of scope for the prototype
Accounting or GST filing · statutory payroll · inventory and BOQ · CAD or 3D viewing beyond file storage · vendor marketplace · client-facing portal · billing and multi-tenancy · native mobile apps · a second industry. The v0.1 non-goals list stands unchanged.
2   Design Principles

Eight rules. Each one has a test, so a reviewer can fail a screen against it without debate.
2.1  The eight principles
#
Principle
The rule
Fails if
P1
Freedom at capture, structure at commit
The user may dump anything in any shape. The system proposes the filing. The user accepts or corrects.
The fastest way to record something is a form.
P2
No silent writes
AI never modifies data directly. It composes a change preview; a human confirms.
Any data changed without a diff the user saw.
P3
The layout law
Composed answers vary in content, never in position. Answer top-left, evidence right, working area centre, actions bottom.
Two Canvas answers put the same kind of thing in different places.
P4
Show what we don’t know
Gaps are displayed, counted and fillable — never hidden behind a plausible-looking screen.
A total is shown that quietly excludes unknowns.
P5
Every number carries its source
Any figure can be traced to a document, a message, or a person who said so, in one click.
A figure exists that cannot be traced.
P6
Pin what works
Personalisation happens by keeping things, not by configuring things.
A useful arrangement can only be recreated by asking again.
P7
The system speaks first
The product opens with what changed and what needs the user, not with a blank search box.
The user has to know what to ask to get value.
P8
Three taps
Any action performed more than once a week costs at most three taps from anywhere.
A frequent action requires navigating to find it.
2.2  P1 in detail — the capture pipeline
This is the principle the entire product hangs from, and the one that resolves the tension between freedom and minimal cognitive load. Total freedom at the point of capture; strict structure at the point of commit. The user never fills a form to record reality; they hand reality over and approve the filing.

Figure 1 — The capture pipeline. Four stages, one confirmation gate.
WHY THIS RESOLVES THE TENSION
A blank canvas is maximum freedom and maximum cognitive load. A rigid form is minimum freedom and minimum thought. Splitting them puts the freedom where the user is busy (capture) and the structure where the risk is (commit) — and the confirmation step is the only moment that costs attention.
3   Personas & Role Visibility

One web application. Two roles. The information shown differs; the interface does not.
3.1  The two roles in the prototype

Admin
Team
Who
Founder or operations head. Buys it, uses it daily, is the single point of adoption success.
Designer, site supervisor, or junior. Works on assigned projects.
Thinks in
Projects and money.
Today’s work and this site.
Opens the product to
Find out what changed overnight and what needs a decision.
Find out what is theirs today and record what happened.
Bar to clear
“Does this answer my questions faster than my chaos?”
“Is this lighter than WhatsApp?”
Sees
Everything.
Everything except the money line (see 3.2).
3.2  The visibility cut — the money line
The cut is not per-screen, it is per-figure. A team member sees the work; they do not see what the firm makes on it or what anyone is paid.
Surface
Admin sees
Team sees
Home
Full brief, full action queue, firm money pulse
Their tasks, their sites, items assigned to them
Projects / Pipeline
All projects, all values, likelihood, expected profit
Projects they are on. No deal values, no pipeline
Project workspace
All tabs including Money and margin
Overview, Tasks, Files, Site feed. Money tab hidden
Money
Full access
Not in navigation
People
Clients, vendors, team, salaries, vendor terms
Contacts only. No salaries, no vendor rates
Files / Calendar
Everything
Their projects only
Canvas
Unrestricted
Restricted to the same data cut — the AI refuses out-of-scope questions plainly, without hinting at the figure
Firm Memory
Full coverage view, gap queue
Only gaps they can personally fill

IMPLEMENTATION RULE
The role filter is applied at the data layer, not the view layer. A team member’s Canvas query must never retrieve a restricted figure and then hide it — the figure must never be fetched. Prototype: two seeded logins, Admin and Team, with a visible switcher for demo purposes.
3.3  Deferred personas
Accountant (read-only export role), vendor, and client are all deferred. Their needs are met in the prototype through exports and screenshots, not through logins. Rationale in Section 11.

4   Information Architecture

Eight destinations, one global bar, one composed surface. Seven of the eight are hand-designed and stable. The eighth — Canvas — is assembled at query time from a fixed component vocabulary.

Figure 2 — Screen map. Fixed screens carry trust and spatial memory; the Canvas carries freedom.
4.1  The destinations
Destination
Purpose
Primary object
Default view
Home
What changed, and what needs you today
The brief + action queue
Merged brief above queue
Projects
Every project, live and in pipeline
Project
List; toggles to pipeline board
Money
The firm’s money on one axis
Payment
Money timeline
People
Clients, vendors, team
Entity
Segmented list
Files
Documents, drawings, versions
File / folder
Tree per project
Calendar
Every deadline in the firm on one axis
Deadline
Month, with week toggle
Canvas
Any question the fixed screens do not answer
The composed answer
Empty, with three suggested questions
Firm Memory
What we know, what we don’t, where it came from
Coverage
Coverage by area
Settings
Schema, roles, users
—
Tucked in the rail footer
4.2  Navigation rules
	•	Home and the Action Queue are one screen. The brief sits on top, the queue below it. Fewer places to learn, and the first screen both tells the user what happened and hands them the work.
	•	Records open as overlay panels, not new pages. Clicking a vendor from a payment grid slides a panel over the current context; closing it returns the user exactly where they were. Nothing loses its place.
	•	The Pipeline is a mode of Projects, not a destination. Same objects, different lens. A lead becomes a project by moving stage, never by being re-created.
	•	Reports are not a destination. They are report blocks composed on the Canvas and pinned. A separate Reports section would compete with the Canvas and split the mental model.
	•	Search is an overlay, invoked from the global bar. It never becomes a page.
	•	Pinned Canvases appear in the rail below Firm Memory. The user’s own screens sit alongside ours, visually identical.
4.3  The global bar
One bar, present on every screen, invoked by ⌘K or by clicking. It is both the question box and the capture box — the user does not have to know which they are doing.
Input
Behaviour
A question
Opens the Canvas with that question already running.
A statement of fact
Treated as capture. Produces a change preview. “Sharma bill 80k Iyer site” never becomes a search.
A file, photo or paste
Treated as capture. Extraction runs, change preview follows.
An object name
Jump-to. “Iyer” navigates to the project.
Ambiguous input
The bar offers both interpretations as two buttons rather than guessing. One extra tap is cheaper than a wrong write.

THREE-TAP CHECK (P8)
Record a payment from anywhere: ⌘K → speak or paste → Confirm. Three. This is the single most frequent action in the product and it must never require navigating to Money first.

5   Onboarding

The first ten minutes decide whether this product is ever opened again. Because roughly four in five of the firm’s information types live only in a head or a conversation (§1.2), onboarding is primarily an act of elicitation — the document upload is the easy half.
5.1  The three rules
	•	It never blocks. The product is usable after the first document. There is a visible “skip all of this” route on every onboarding screen.
	•	It never finishes. When it is complete enough to work, the onboarding surface dissolves into Firm Memory (§6.8) and continues there permanently.
	•	It never pretends. Coverage is shown as a number from the first minute. A 34% firm looks like a 34% firm.
5.2  The four movements

Figure 3 — Onboarding as four overlapping movements, not four sequential steps.
Movement
User does
System does
Exit
1  Seed
Drops folders, sheets, PDFs, photos, WhatsApp exports. Names which projects are live.
Accepts anything. No file-type gate, no naming convention, no sorting.
First file accepted
2  Extract
Nothing. Can leave.
Parses in the background. Every extracted fact tagged with source and confidence. Unreadable files listed honestly rather than dropped.
First entity written
3  Interview
Answers short bursts of questions.
Generates questions from what the documents could not answer. Five at a time, tappable answers wherever possible.
User stops; resumes later
4  Confirm
Says yes, corrects, or skips.
Queues every money figure and date for confirmation. Soft fields pass without asking.
Never — it becomes the Action Queue
5.3  The onboarding screen

Figure 4 — Onboarding. Ingestion left, elicitation right, honesty along the bottom.
Region
Specification
Drop zone
Dominant, always visible, accepts folders and multi-select. Also offers Drive connection. Copy names real artefacts (“WhatsApp exports, site photos, quotations”) so the user recognises their own mess.
Ingested list
One row per file or batch. Shows what was found, not just that it succeeded — “412 rows → 3 projects, 19 vendors”. Failures are stated: “5 unreadable, needs a human”.
Question panel
Maximum five questions visible. Each has tappable answers and a skip. Never a text field where a choice would do. Skipping is recorded, and re-asked later at most twice.
Coverage panel
Six areas with percentage bars. Deliberately shows the low numbers. Copy: “gaps are the product working”.
Skip affordance
Persistent, top-right, phrased as reassurance rather than escape: “You can skip all of this — Sutradhar already works”.
5.4  The interview
Roughly thirty questions, generated rather than scripted. A question earns its place only if it meets all three tests:
	•	Only a human in the firm can answer it — no document contains it.
	•	Answering it unblocks something concrete (a ledger, a warning, a total).
	•	It can be answered in under ten seconds, ideally by tapping.

Question shapes, in priority order:
Priority
Shape
Example
1
Live-or-not
“Kormangala flat — live, closed, or lost?”
2
Money truth
“Iyer instalment 3 — has it actually come in?”
3
Terms
“Sharma’s running bill — 30 or 45 days?”
4
Ownership
“Who is responsible for the café fitout enquiry?”
5
Judgement
“How likely is the HSR duplex to convert?”
6
History
“Would you work with Kumar Carpentry again?”

INTERVIEW PLACEMENT
The interview is not confined to onboarding. Questions surface in three places forever: the Action Queue (batched), Firm Memory (browsable), and contextually — when the admin opens a vendor with no recorded terms, the question is right there. Answering in context is where most of them will actually get answered.
5.5  Confidence and provenance
Every fact in the system has a state. The state is visible in the interface, not buried in metadata — this is what makes the product trustworthy enough to replace an Excel sheet the founder wrote themselves.

Figure 5 — The five field states and their visual treatment.
State
Meaning
Counts in totals?
Visual
Confirmed
A human said yes, or typed it directly.
Yes
Plain
Extracted
Read from a document by AI. Usable, not yet trusted.
Money and dates: no. Soft fields: yes.
Dotted underline
Inferred
Derived, not stated in any source.
No
Dotted + ≈ prefix
Conflicting
Two sources disagree.
No
Amber, both values shown
Missing
Known to be absent.
Excluded, and the exclusion is stated
Empty affordance, never a zero

THE CONFIRMATION RULE — WHERE FRICTION IS ALLOWED TO EXIST
Money and dates must reach Confirmed before they count in any total, warning or export.
Soft fields — descriptions, categories, notes, tags — never require confirmation. This is the whole friction budget of the product, and it is spent only where a wrong number does damage.
5.6  Past projects versus live projects
Two different bars, and conflating them is the fastest way to make the product feel wrong.

Past projects
Live projects
What it is for
Searchable memory, vendor track record, profitability hindsight.
Operational state that drives warnings and decisions.
Accuracy bar
Lossy is fine. A 70%-complete archive is useful.
Must be correct. A wrong live figure produces a wrong warning.
Flow
Bulk, unattended, no confirmation queue.
Guided per project. Money confirmed line by line.
Interface
Progress bar and a count. No questions asked.
A per-project checklist that shows exactly what is still unverified.
In the demo
Three archived projects, referenced once to show vendor history.
Two live projects, fully specified — Iyer Residence and Kormangala.
5.7  Prototype implementation note
BUILD THIS DELIBERATELY
Extraction is pre-computed for the demo bundle. The prepared synthetic documents map to a known result set. Ingestion animates at a realistic pace and can be walked through live, but it does not depend on a model call succeeding in front of an advisor.
Genuinely live: the Canvas, the change preview, and any document dropped in ad hoc during the demo (with a visible “this one is running live” state, because that moment is worth showing).

6   The Fixed Screens

Seven destinations plus Settings. Each is specified as: purpose, layout, blocks used, states, actions, and role differences. Blocks referenced here are defined in Section 8.
6.1  Home — the brief and the queue
The most important screen in the product, because it is the one that makes it a habit. It answers two questions before the user asks anything: what changed, and what needs me.

Figure 6 — Home. Brief on top, action queue below, money and today on the right.
Region
Specification
The Brief
Two to four sentences, regenerated each morning and after any material change. Written as prose, not bullets, and never as a chat message — it is a report, not a conversation. It states consequence, not just fact: not “instalment due today” but “the instalment due today is what covers Thursday’s vendor payment”. Timestamped, with a visible “generated 07:40” so it is never mistaken for live chat.
Pulse cards
Four figures maximum: collectible this week, payable in 14 days, coverage gaps ahead, live sites. Each is a link into a pre-filtered view. Numbers only — no sparklines, no deltas, no decoration.
Action Queue
Every item that needs a human, in one list, each with a one-tap primary action. Item types: CONFIRM (extracted data), DECIDE (change orders, approvals), SEND (reminders), ANSWER (gap questions), APPROVE (leave, salary), REVIEW (slippage, conflicts). Sorted by consequence, not by date. Copy under the header: “empty this = your day is done”.
Money, next 14 days
A miniature money timeline. Coverage gaps rendered in accent. Clicking opens Money with the same window pre-selected.
Today
Deadlines, site visits and due payments for the current day only. Links into Calendar.

State
Behaviour
Queue empty
Celebratory, not blank. States what is coming tomorrow and offers one optional gap question.
First run
Brief explains what it will do tomorrow. Pulse cards show what coverage they need to become real.
Low coverage
Brief openly caveats: “I can only see the client side of the money so far.”
Team role
Brief is scoped to their sites. Queue shows only their items. No pulse cards, no money panel.
6.2  Projects and the pipeline
One destination, three modes: list, pipeline board, map. The pipeline matters disproportionately because every field in it — feasibility, likelihood, expected profit, follow-up state — currently exists only in the founder’s memory. It is the purest demonstration of the product’s premise.

Figure 7 — Projects in pipeline mode, with proactive observations below.
Region
Specification
Mode switch
List (default), Pipeline board, Map. Mode is remembered per user.
Board columns
Enquiry → Feasibility → Quoted → Negotiating. Drag to move stage; converting to a live project is a stage move, never a re-entry.
Card
Name, estimated value, likelihood, and one line of state. Ageing is shown in accent when it exceeds the firm’s own historical pattern.
“Sutradhar noticed”
Two to four proactive observations below the board, each with an action chip. This is the clearest place in the product to show that the system is watching, because these are exactly the things that fall through today.
List mode
A data grid (Block 02) over all projects: stage, client, value, received, spent, margin, next deadline, health. Fully sortable, filterable, saveable as a view.
6.3  Project workspace
One project, everything about it. The stage stepper across the top is the firm’s own lifecycle — the one already documented in v0.1 §6.1 — not an abstract kanban.

Figure 8 — Project workspace, Overview tab.
Region
Specification
Stage stepper
Eight stages: Enquiry, Feasibility, CAD, Concept, Contract, Vendors, Execution, Handover. Current stage in accent, completed in green. Clicking a stage shows what happened in it and what it produced.
Fact row
Client, value, received, spent, margin now, handover date. Margin is live and admin-only.
Tabs
Overview, Tasks, Money, Files, People, Activity. Money tab hidden for Team role.
Task tree
Block 08. Nests to any depth, drag to re-parent, each node carries assignee, deadline, status and optional linked payment. Status dots: green on track, amber slipping, grey unassigned, accent needs a decision.
Money panel
Project-scoped money timeline plus next-in / next-out in one line.
Site feed
Latest photos and supervisor notes, newest first, with author and time.
Needs a decision
A persistent accent panel for anything unpriced or unapproved on this project. In the demo this holds the unpriced change order — the margin-leak story made visible.
6.4  Money
The flagship screen from v0.1, unchanged in ambition: every rupee planned before it is spent, every planned rupee with a date and a status. The interface addition here is that coverage gaps are computed and displayed continuously rather than discovered.

Figure 9 — Money in timeline mode, with a coverage gap detected and the grid below.
Region
Specification
Mode switch
Timeline (default), Ledgers, All payments.
Money timeline
Block 03. Inflows above the axis, outflows below, by date. Scrollable horizontally, default window 60 days. Firm-wide by default, filterable to one project.
Coverage gap
A shaded band wherever scheduled outflow exceeds cleared-plus-scheduled inflow. Labelled with the shortfall in rupees. This is the single most valuable pixel in the product and it should look like it.
Warning strip
One sentence stating the gap in plain language, with two actions: chase the inflow, or re-gate the outflow. Both open a change preview — neither writes directly.
Payment grid
Block 02. Columns: due, entity, project, direction, amount, status, gated on. Inline editable. “Gated on” is the vacuum-prevention primitive made visible — a vendor payment can be linked to the client instalment that funds it.
Save as view
Any filter combination becomes a named view in the rail. This is P6 applied to the most-queried data in the firm.
6.5  People
Three segments of one entity model: clients, vendors, team. Segmented control at the top, shared record structure underneath.
Segment
Record contains
Notable
Clients
Contacts, projects (current and historical), instalment ledger, approvals given, items pending with them.
The cross-project history is new — no client-level record exists in the firm today.
Vendors
Category, contacts, payment terms, contracts and work orders, running ledger, activity log, performance notes.
Missing terms are shown as gaps, not blanks. The activity log is the dispute-resolution asset.
Team
Role, assigned work across projects, load view, leave, salary structure.
Salary is admin-only. Load view exists so the admin stops assigning by gut feel.
6.6  Files
	•	Folder tree per project, plus a firm-level tree. The firm defines the hierarchy; we do not impose one.
	•	Versions with an explicit “current for execution” marker. This ends the “carpenter built from the old PDF” failure. The marker is visually loud.
	•	Approval stamps. A drawing can be marked client-approved with a date. Approvals are project history, not chat history.
	•	Every file is a source. Any figure extracted from a file links back to it, opening in the document viewer (Block 05) at the relevant passage.
6.7  Calendar
One axis for every deadline in the firm: task deadlines, payment due dates, stage gates, site visits, leave. Month view default, week toggle. Filterable by project, person and type. Read-mostly — items are created where they live, not here.
6.8  Firm Memory
Where onboarding goes to live permanently, and the screen that most directly expresses the product’s honesty. It is also the engine that keeps data flowing in after week one — the point at which comparable products go stale.

Figure 10 — Firm Memory. Coverage, gaps, sources, and what changed.
Region
Specification
Coverage header
One headline percentage, the delta since onboarding, and a target. Framed as progress, never as failure.
Coverage by area
Six areas with bars and a one-line reason for each shortfall (“6 vendors, no terms”). Clicking an area opens the gaps behind it.
Fill a gap
The interview, permanently available. Each question states what it unblocks — “blocks: vendor ledger, coverage warnings”. Motivation is the point.
Sources
Counts of documents, exports and human answers. Unreadable files listed honestly, with the reason.
What changed
A weekly log of coverage movement, including the uncomfortable line — “asked twice, skipped twice”.
6.9  Settings
Deliberately thin, and the only place in the product that looks like configuration. It exists because the schema-freedom promise in §7.5 has to be true somewhere.
Editable
Not editable
Stage names and order Vendor and cost categories Custom fields on any entity Folder tree conventions Users and roles Notification and quiet hours
Entity types themselves What a payment means The direction model (in / out) The field-state model The audit log

7   The Canvas

The screen the product is bought for. Everywhere else answers questions we anticipated; the Canvas answers the ones we did not — which, in a firm where four fifths of the information used to live in one person’s head, is most of them.
7.1  The concept
Two panels. An AI panel on the left holds the conversation and the reasoning. A co-panel on the right assembles the answer from pre-built components. The AI chooses which blocks and what data goes in them. It never invents a block, a layout, or a chart type.

Figure 11 — The Canvas. Conversation left, composed answer right, actions along the bottom.
7.2  The two panels
Panel
Contains
Rules
AI panel
The question, the answer in prose, caveats, and suggested follow-ups.
Prose is bounded — roughly 120 words. If the answer needs more, it belongs in a block, not a paragraph. Caveats are mandatory when any figure is unconfirmed, and they name which figure. Follow-up suggestions are three, generated from the data actually retrieved, never generic.
Co-panel
Two to five composed blocks under the layout law.
Every block is live: editable in place, exportable, pinnable. Unconfirmed figures carry the dotted treatment here too, and can be confirmed inline without leaving the Canvas. If the answer is a single number, the co-panel still renders — an answer block plus its evidence. It never collapses to chat alone.
7.3  The layout law
The risk with a composed surface is that it varies enough that users lose spatial memory — which would reintroduce the learning curve through the side door, defeating the USP. The layout law is the mitigation: composition varies, position never does.

Figure 12 — Three different questions, three different compositions, one invariant zone map.
Zone
Position
Always holds
Never holds
Answer
Top-left
The headline figure or finding, in one line.
A table, a chart, or more than two sentences.
Evidence
Right column, full height
Source cards — documents, messages, human answers, with what each contributed.
Data the user is meant to act on.
Working area
Centre-left, below the answer
Grids, ledgers, trees, timelines, charts. One to three blocks.
The primary answer, or the actions.
Actions
Bottom strip, full width
Chips for every action the answer implies, plus export and pin.
Anything that writes without a change preview.
7.4  Composition rules
	•	Two to five blocks. Fewer than two is a chat reply, not an answer. More than five is a dashboard nobody reads.
	•	Block selection is deterministic per answer shape. A “how much” question produces answer + ledger or grid. A “will it slip” question produces answer + task tree + evidence. A “compare” question produces answer + grid + chart. The mapping is a lookup table in the build, not a free choice — it must be reproducible across demo runs.
	•	The chart type is chosen from a fixed set. Bar, horizontal bar, timeline, stacked bar. No pies, no scatter, no invented visual encodings.
	•	Nothing renders that cannot be traced. If a figure has no source, it does not appear in the co-panel — it appears in the AI panel as a caveat.
7.5  Pinning — where freedom becomes personalisation
THE RESOLUTION OF “FREEDOM” VERSUS “MINIMAL COGNITIVE LOAD”
Any composition the user keeps becomes a permanent screen in their rail. They designed it by asking a question, not by configuring anything.
A pinned Canvas re-runs its query on open, keeps its blocks and arrangement, can be renamed, and sits visually identical to the screens we shipped. Over a month, each firm ends up with a product shaped to how it actually thinks — with zero setup burden and no settings page involved.

Pinned screens are per-user by default, with a “share with the firm” option. Admin-pinned screens containing money data are never visible to Team.
7.6  Worked examples
Question
AI panel
Co-panel composition
“Which vendors are we most exposed to right now?”
Total exposure, largest vendor named, the gating relationship called out, two caveats naming the unconfirmed figures.
Answer (₹6.42L) · Grid (vendor, open, gated, terms) · Chart (share of exposure) · Evidence (4 sources) · Actions (confirm, set terms, re-gate, export)
“Will Kormangala hit its handover date?”
Days behind, the blocking chain, what would recover it, what the last comparable slip cost.
Answer (4 days behind) · Task tree (blocked chain highlighted) · Timeline (revised dates) · Evidence (site photos, supervisor notes) · Actions (reschedule, notify client, pin)
“Show me July across all projects”
In, out, net, and the one anomaly worth noticing.
Answer (₹11.2L in / ₹9.8L out) · Grid (by project) · Chart (in vs out) · Evidence (ledger, bills) · Actions (save view, export)
“Sharma ka bill aa gaya, 80 hazaar, Iyer site”
Recognised as capture, not a question. No prose answer.
Change preview only (Block 09), with the source attached
7.7  When the Canvas cannot answer
Three distinct failures, three distinct responses. Never a generic apology, and never a fabricated answer.
Failure
Response
We don’t hold the data
Say so, name what is missing, and offer the gap question inline. “I have no payment terms for Godrej dealer. Want to add them now?” The failure becomes a data-entry moment.
The question is ambiguous
Offer two or three readings as buttons. Never guess, never ask an open-ended clarifying question — tapping is cheaper than typing.
Out of role scope
State plainly that this is admin-only. Never hint at the figure, never say “approximately”.

The detailed failure-state design — retry behaviour, partial answers, timeout handling — is deferred (§11.2, open decision O2). The three responses above are the minimum the prototype must implement.

8   Component Vocabulary

Ten blocks. This list is closed for the prototype: the AI composes from it and may not exceed it. Adding an eleventh block is a product decision, not a runtime one.

Figure 13 — The ten blocks the AI may compose with.
8.1  The blocks
#
Block
Holds
Editing
Appears in
01
Record card
One entity: canonical fields, status, provenance per field.
Inline, field by field.
Overlay panels, Canvas, People
02
Data grid
Any list of records. Filter, sort, group, column pick.
Cell-level inline edit; multi-select bulk actions.
Money, Projects list, Canvas
03
Money timeline
Inflows above axis, outflows below, coverage gaps shaded.
Drag a payment to reschedule → change preview.
Money, Home, Project workspace
04
Ledger
Running balance for one entity: planned, due, paid, outstanding.
Mark paid (full or partial), add a line.
People, Canvas
05
Document viewer
The source file with the relevant passage highlighted.
Read-only; “correct this extraction” opens a preview.
Evidence zone, Files, provenance clicks
06
Report block
Fixed templates only: project P&L, vendor exposure, ageing, salary sheet.
Parameters only (period, project, entity).
Canvas, pinned screens
07
Chart block
Bar, horizontal bar, timeline, stacked bar. Nothing else.
None. Click-through to the underlying grid.
Canvas, Firm Memory
08
Task tree
Nested tasks with assignee, deadline, status, linked payment.
Add, re-parent by drag, mark done, reassign.
Project workspace, Canvas
09
Change preview
A proposed set of writes, as a diff.
Edit any line before confirming.
Everywhere AI writes
10
Gap block
What is missing in this context, and what it blocks.
Answer inline.
Firm Memory, Canvas, empty states
8.2  The universal block contract
Every block, without exception, is:
	•	Editable in place. No block is a dead end that sends the user elsewhere to change something.
	•	Provenance-bearing. Hover or tap any figure to see its source and state.
	•	Exportable. CSV from any block holding rows; PNG or PDF from any block holding a visual.
	•	Pinnable. Individually, or as part of a Canvas.
	•	Write-gated. No block writes anything without a change preview.
8.3  Block 09 in detail — the change preview
The only door AI has into the firm’s data. Specified in full because getting it wrong invalidates the trust the whole product depends on.

Figure 14 — Change preview anatomy.
Element
Requirement
Header count
States how many objects will change before any of them do. “3 changes proposed”.
Source line
What produced this proposal — the voice note transcript, the file name, the message. One click opens it.
Per-object diff
Type tag (NEW / EDIT / LINK / DELETE), the object, and the change as before → after. Never a paragraph of prose describing changes.
Per-object confidence
Confident, or “unsure — check me”. Low-confidence rows are marked, never hidden, and never silently dropped.
Actions
Confirm all (primary), Edit, Discard. Keyboard: ⌘↵ confirms. The admin will do this twenty times a day.
Reversibility
Undo available for 24 hours on every confirmed change. Stated on the block itself, not buried in settings.
Audit
Every confirmed change writes an audit entry: who, what, when, from which source, with what confidence.

9   AI Behaviour Specification

This section is normative. It exists so the prototype does not make the class of mistake that would end a demo — or, later, a customer relationship.
9.1  What the AI may do
Capability
Where
Gate
Read and retrieve across all firm data
Canvas, global bar, all screens
Role filter applied at the data layer
Compose answers from the block vocabulary
Canvas co-panel
Layout law; closed block list
Extract structure from documents, photos, voice, pasted text
Onboarding, global bar
Confidence tagging mandatory
Propose writes
Anywhere
Change preview, always
Generate gap questions
Onboarding, Firm Memory, in context
Three tests in §5.4
Draft outbound messages
Action Queue, Money
Human reads and sends. Never auto-sent
Observe and raise
Home brief, “Sutradhar noticed”
Proactivity rules in §9.4
9.2  The no-AI list
HARD RULES — IMPLEMENT AS GUARDS, NOT AS PROMPT INSTRUCTIONS
1.  Never invent a number. If a figure is not in the data, it is a gap, not an estimate. Derived figures are always labelled Inferred and always show their working.
2.  Never mark a payment paid, received, or cleared. Money state changes are human-only, without exception.
3.  Never send anything outside the firm. No message to a client or vendor leaves without a human pressing send on the exact text.
4.  Never delete. AI may propose an archive or a supersede. Deletion is human-only.
5.  Never alter the audit log or a provenance record. Append-only, no exceptions.
6.  Never present an unconfirmed figure as confirmed. Including inside prose in the AI panel, where the visual treatment is unavailable — there, the caveat must be written out.
7.  Never cross the role boundary. Including in summaries, totals, and explanations of why something cannot be shown.

These are not implemented in the prototype as safety infrastructure — but they are written here so the prototype is built in their shape, and so no demo ever shows the product doing something the real product must never do.
9.3  Proactivity rules
The system speaks first (P7). Unmanaged, that becomes noise, and noise is how a product gets muted.
Rule
Detail
One scheduled moment a day
The morning brief. Everything non-urgent waits for it.
Interrupt only for consequence
A notification outside the brief requires a concrete, dated consequence — a coverage gap inside 14 days, a client payment that just cleared, a site flag. Not “a task is due”.
Say the consequence, not the fact
“Thursday’s ₹80,000 to Sharma has no cover if today’s instalment slips”, not “payment due Thursday”.
Never nag twice
A dismissed observation does not return unless its underlying facts change.
Quiet hours
Configurable, default 21:00–07:00. Site-critical flags are the only exception.
Team proactivity is different
Team members get one thing: what is theirs today, and what changed on their sites. No firm-level observations.
9.4  Data sensitivity — the position we state to firms
The product holds a firm’s entire financial nervous system. The position below should be stated plainly in the product and in the demo, because an evasive answer here loses a founder-buyer immediately.
	•	The firm’s data is the firm’s. Full export, any time, in open formats. No lock-in is a feature we advertise, not a concession.
	•	No cross-firm use. One firm’s data never informs another firm’s answers. The vendor-network ambition in v0.1 §10.6 is opt-in, aggregated, and explicitly out of scope here.
	•	Provenance is a privacy feature too. The firm can see exactly what the system read and what it derived.
	•	Audit log from day one. Who saw what, who changed what, when.
	•	Answer the model question directly. When asked “does this go to an AI company”, the demo answer must be specific and true, not deflected. Decide the exact wording with the design partner before the first demo.
9.5  Prototype — what is live and what is not
Live in the prototype
Pre-computed or stubbed
Canvas question → composed answer Change preview → confirm → data updates Any document dropped in during the demo Gap questions and coverage recalculation Inline editing across all blocks
Bulk extraction of the seeded document bundle The morning brief text (written, not generated live) Notifications and reminders (shown, not sent) Voice input Any model call whose failure would stop the demo

10   The Demo

Five minutes, one arc: chaos in, firm out, question asked, action taken. Rehearsed to the point where the developer knows exactly which states must be reachable.
Beat
Screen
What happens
The line
0:00 The before
A photograph, not the product
Show the design partner’s actual reality: six WhatsApp groups, one payments sheet, a diary.
“Four out of five things this firm knows exist only in one person’s head.”
0:30 Seed
Onboarding
Drag a messy folder in. Files land unsorted. Extraction runs visibly. Two files are honestly marked unreadable.
“No sorting, no naming convention, no setup call.”
1:15 Elicit
Onboarding
Answer three tapped questions. Watch coverage move.
“It asks only for what no document could tell it.”
1:45 The reveal
Home
The brief is already written. The queue already has nine items. Nothing was configured.
“This is ten minutes after handing over a folder.”
2:30 The question
Canvas
Ask the vendor-exposure question. Blocks compose. Two figures are dotted, and the AI says so unprompted.
“It tells you which numbers it isn’t sure about. Nothing else you’ve been sold does that.”
3:15 The act
Canvas → change preview
Confirm one figure inline. Re-gate a vendor payment. See the diff, confirm, watch Money update.
“Nothing changed until I said yes.”
4:00 The catch
Money
The coverage gap. Explain what it would have cost the firm this month.
“Two weeks of warning instead of a phone call from a vendor.”
4:30 The close
Canvas → pin
Pin the vendor exposure view. It appears in the rail as their own screen.
“They just designed a screen by asking a question.”

WHAT THE DEMO MUST NEVER DO
Show a form being filled in. Show a settings page. Show a loading state longer than two seconds. Show the AI being certain about something it inferred. Explain a screen before using it — if it needs explaining, the demo has found a bug in the design.

11   Deferred and Open

11.1  Deferred, with reasons
Deferred
Why
Revisit when
Voice and Hinglish input
Probably the largest adoption unlock for site supervisors, and genuinely differentiating. But it is a bonus, not a proof — the concept stands without it.
Everything else is built and stable. Low priority, high value.
Native mobile app
Responsive web is enough to demonstrate. Supervisor adoption may force this later.
Post-prototype, driven by supervisor usage data.
Accountant role
Export serves the accountant for now. A third role triples the permission surface for little demo value.
First real customer with an external accountant.
Client portal
Powerful, but it is a second audience — and this prototype must prove the first one.
After the core loop is loved. v0.1 §10.2.
WhatsApp ingestion
The capture pipeline is designed to accept it. Adding a channel adds no new interaction concept.
Post-prototype. It is a connector, not a redesign.
Tally / GST export
Not an interface problem.
Productization.
Real firm data
Synthetic data lets us stage the demo and avoid handling live financials before security work exists.
After the design partner agreement is signed.
11.2  Open decisions
#
Open decision
Why it is still open
Needed by
O1
Offline tolerance
Sites have patchy connectivity, and a supervisor whose update fails will stop using the product. Invisible in a laptop demo on synthetic data, so it does not block the prototype.
Before the first real site trial
O2
Failure UX in depth
The three minimum responses are specified in §7.7. Retry behaviour, partial answers, timeouts and degraded modes are not. This is roughly a third of real usage and almost always under-designed.
Before real users, not before the demo
O3
Naming
“Sutradhar” has not met a real user yet. Domain and trademark path unverified.
Before any external material
O4
The model-hosting answer
The exact wording of what we tell a firm about where their data goes (§9.4).
Before the first demo to a firm

A   Appendix — Decision Log

Every decision this specification rests on, and what was chosen. Recorded so that a later reader — or a later argument — can see what was considered and why.
Ref
Decision
Chosen
A1
Onboarding: blocking wizard or progressive
Progressive. Never blocks, never finishes, dissolves into Firm Memory.
A2
Ingestion only, or AI-led interview
Both. Interview is the larger half, given the data audit.
A3
Hide gaps or show them
Show them, loudly. Coverage is a headline number.
A4
Trust model for extracted data
Five field states. Money and dates require confirmation; soft fields do not.
A5
Past versus live projects
Separate flows, different accuracy bars.
A6
Schema flexibility
Fixed spine; firm-specific labels, categories, custom fields, own trees and saved screens.
B1
Interaction model
Fixed hand-designed screens + a composed Canvas built from a closed block vocabulary. Never generative UI.
B2
AI write access
None directly. Change preview and human confirmation, always.
B3
Freedom versus cognitive load
Freedom at capture, structure at commit. Pinning as personalisation.
B4
Proactivity
Yes. One scheduled brief; interrupts only for dated consequence.
C1
The no-AI list
Not enforced in the prototype, but documented so the prototype is built in its shape.
C2
Failure UX
Open — O2.
C3
Data sensitivity
Stated position in §9.4.
D1
One app or two
One web app; role-based information depth, cut at the money line.
D2
Voice and Hinglish
Deferred. Bonus if everything else is done.
D3
Offline
Open — O1.
E1
What the prototype proves
One money moment: upload chaos, see the firm, ask the unanswerable question.
E2
Data
Synthetic, modelled on the design partner’s real shapes.
E3
Deliverable
This document, with wireframes, written for a developer.
—
Home and Action Queue
Merged into one screen. Seven nav destinations plus Firm Memory and Settings.

End of v1.0. Every screen here is a hypothesis with a wireframe attached. The design partner’s first real week is what turns it into v1.1.
