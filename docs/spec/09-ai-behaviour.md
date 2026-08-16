# 9 — AI Behaviour Specification

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
Canvas question → composed answer
Change preview → confirm → data updates
Any document dropped in during the demo
Gap questions and coverage recalculation
Inline editing across all blocks
Bulk extraction of the seeded document bundle
The morning brief text (written, not generated live)
Notifications and reminders (shown, not sent)
Voice input
Any model call whose failure would stop the demo
