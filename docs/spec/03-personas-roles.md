# 3 — Personas & Role Visibility

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
