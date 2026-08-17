/**
 * The canned planner.
 *
 * Returns a `CanvasPlan` — block types, entity refs and filters. Never a
 * number, never a string pulled from fixtures (CLAUDE.md rule 5). The schema
 * has nowhere to put a figure, so a plan that tried to carry one would not
 * validate.
 *
 * §7.4: "Block selection is deterministic per answer shape ... The mapping is a
 * lookup table in the build, not a free choice — it must be reproducible across
 * demo runs." Hence a literal table keyed by question id.
 *
 * A live model would emit this same shape. Swapping canned for real is a single
 * import change in whoever calls `planFor`.
 */

import { CanvasPlan } from '@/canvas/plan';
import { questionById } from '@/canvas/questions';

/**
 * The plans, one per canned question. Placeholders in `headline` are filled by
 * the resolver: `{metric}` becomes the figure it read from the store.
 */
const PLANS: Record<string, unknown> = {
  'vendor-exposure': {
    questionId: 'vendor-exposure',
    answer: {
      headline: '{metric} total open vendor exposure',
      metric: { metric: 'open-vendor-exposure', scope: null, period: null },
    },
    narrative: [
      'Three vendors hold unbilled or unpaid commitment. Sharma Electricals is the largest, across two projects, and part of that is gated on an instalment due today.',
    ],
    caveats: [],
    working: [
      {
        block: 'data-grid',
        query: { from: 'vendors', where: [], orderBy: 'open' },
        columns: ['vendor', 'open', 'gated', 'terms'],
      },
      {
        block: 'chart',
        type: 'hbar',
        query: { from: 'vendors', where: [] },
        by: 'share-of-exposure',
      },
    ],
    evidence: ['doc-payments-master', 'doc-iyer-contract', 'doc-img-2231', 'human-anil-kumar'],
    actions: [
      { label: 'Confirm figures', intent: 'confirm-fields', target: null },
      {
        label: 'Set Godrej terms',
        intent: 'set-terms',
        target: { kind: 'vendor', id: 'vendor-godrej-dealer' },
      },
      {
        label: 'Re-gate Sharma',
        intent: 're-gate',
        target: { kind: 'vendor', id: 'vendor-sharma' },
      },
      { label: 'Export CSV', intent: 'export', target: null },
    ],
    followUps: [
      'Same view, last financial year',
      'Only vendors with no contract on file',
      "What if Iyer's instalment slips 2 weeks?",
    ],
  },

  'uncovered-payments': {
    questionId: 'uncovered-payments',
    answer: {
      headline: '{metric} of outflow has no inflow gated against it',
      metric: { metric: 'coverage-gap', scope: null, period: null },
    },
    narrative: [
      'One payment in the window is not covered. Nothing is scheduled against it, so if it goes out as planned the firm funds it from working capital.',
    ],
    caveats: [],
    working: [
      {
        block: 'money-timeline',
        query: { from: 'payments', where: [] },
        window: 60,
      },
      {
        block: 'data-grid',
        query: { from: 'payments', where: [{ field: 'uncovered', op: 'eq', value: true }] },
        columns: ['due', 'entity', 'amount', 'gatedOn'],
      },
    ],
    evidence: ['doc-payments-master', 'human-anil-kumar'],
    actions: [
      { label: 'Re-gate outflow', intent: 're-gate', target: null },
      { label: 'Chase inflow', intent: 'notify', target: null },
      { label: 'Export CSV', intent: 'export', target: null },
    ],
    followUps: [
      'Same view, next 90 days',
      'Only vendors with no terms',
      'Which instalment would cover it?',
    ],
  },

  'owed-to-sharma': {
    questionId: 'owed-to-sharma',
    answer: {
      headline: '{metric} owed to Sharma Electricals',
      metric: {
        metric: 'open-vendor-exposure',
        scope: { kind: 'vendor', id: 'vendor-sharma' },
        period: null,
      },
    },
    narrative: [
      'Two bills are open. The nearer one is gated on the Iyer instalment due today; the older one has been outstanding since July.',
    ],
    caveats: [],
    working: [
      {
        block: 'data-grid',
        query: {
          from: 'payments',
          where: [{ field: 'counterpartyId', op: 'eq', value: 'vendor-sharma' }],
          orderBy: 'due',
        },
        columns: ['due', 'amount', 'status', 'gatedOn'],
      },
    ],
    evidence: ['doc-payments-master', 'doc-img-2231'],
    actions: [
      { label: 'Confirm figures', intent: 'confirm-fields', target: null },
      { label: 'Export CSV', intent: 'export', target: null },
    ],
    followUps: [
      'Same view for Kumar Carpentry',
      'What did we pay Sharma last year?',
      'Set a reminder for the older bill',
    ],
  },

  'vendors-without-terms': {
    questionId: 'vendors-without-terms',
    answer: {
      headline: 'Vendors with no payment terms on file',
      metric: null,
    },
    narrative: [
      'Terms decide when a bill becomes due, so a vendor without them cannot be scheduled — their payments sit outside every coverage warning.',
    ],
    caveats: [],
    working: [
      {
        block: 'gap',
        area: 'vendorsProfiles',
      },
    ],
    evidence: ['human-anil-kumar'],
    actions: [{ label: 'Set terms', intent: 'set-terms', target: null }],
    followUps: [
      'Which vendors have no contract on file?',
      'What does this block?',
      'Ask me the missing terms',
    ],
  },

  /**
   * "Will Kormangala hit its handover date?" — the §5.4 projects shape.
   *
   * The honest answer is that there is no handover date on file to hit, and the
   * chain below it is four deep with two of its four tasks undated. The
   * narrative states the consequence (§9.3) rather than reporting the status:
   * the ceiling is not merely late, it is holding three other tasks behind it.
   */
  'kormangala-handover': {
    questionId: 'kormangala-handover',
    answer: {
      headline: 'No handover date on file, and the chain is {metric} behind',
      metric: {
        metric: 'days-behind-schedule',
        scope: { kind: 'project', id: 'project-kormangala' },
        period: null,
      },
    },
    narrative: [
      'Kormangala has no handover date recorded, so nothing is counting down to it. The false ceiling is the blocker: electrical second fix cannot start until it closes, and painting and snagging sit behind that with no dates at all.',
      'Recovering the date means closing the ceiling first — every day it slips moves the three tasks under it by the same day.',
    ],
    caveats: [],
    working: [
      {
        block: 'task-tree',
        projectId: 'project-kormangala',
        highlight: [
          'task-kormangala-false-ceiling',
          'task-kormangala-electrical',
          'task-kormangala-painting',
          'task-kormangala-snagging',
        ],
      },
    ],
    evidence: ['doc-whatsapp-kormangala', 'human-anil-kumar'],
    actions: [
      {
        label: 'Set handover date',
        intent: 'reschedule',
        target: { kind: 'project', id: 'project-kormangala' },
      },
      {
        label: 'Chase the ceiling',
        intent: 'notify',
        target: { kind: 'task', id: 'task-kormangala-false-ceiling' },
      },
      { label: 'Pin this view', intent: 'pin', target: null },
    ],
    followUps: [
      'What would recover the two weeks?',
      'Who is free to take painting?',
      'Same view for Iyer Residence',
    ],
  },

  /**
   * "Show me July across all projects" — the §5.4 period shape.
   *
   * A closed month, so the figures are settled rather than planned. The
   * narrative carries what the question promises past in/out/net: the anomaly.
   * Per project July looks unremarkable; the salary run is what turns the month
   * negative, and it belongs to no project so it appears in no project's margin.
   */
  'july-across-projects': {
    questionId: 'july-across-projects',
    answer: {
      // The figure leads: the co-panel lifts `{metric}` into the large line and
      // renders the remainder as the subtitle, so a headline that buries it
      // mid-sentence leaves a gap where the number was.
      headline: '{metric} net across the firm in July',
      metric: {
        metric: 'period-in-out',
        scope: null,
        period: { from: '2026-07-01', to: '2026-07-31' },
      },
    },
    narrative: [
      'Both live projects took money in and paid vendors out, and each of them looks roughly level on its own. The month is negative because of a cost neither of them carries.',
      'The salary run belongs to no project, so it lands in no project’s margin — and it is the cost most often left out when quoting the next job.',
    ],
    caveats: [],
    working: [
      {
        block: 'report',
        template: 'project-pnl',
        scope: null,
        period: { from: '2026-07-01', to: '2026-07-31' },
      },
      {
        // Scoped to July by the query, not the default 60-day window — a
        // timeline of August under a report about July would be two answers.
        block: 'money-timeline',
        query: {
          from: 'payments',
          where: [{ field: 'due', op: 'between', value: ['2026-07-01', '2026-07-31'] }],
        },
        window: 31,
      },
    ],
    evidence: ['doc-payments-master', 'human-anil-kumar'],
    actions: [
      { label: 'Export CSV', intent: 'export', target: null },
      { label: 'Pin this view', intent: 'pin', target: null },
    ],
    followUps: [
      'Same view for August',
      'Which vendors did we pay most in July?',
      'What did each project actually earn?',
    ],
  },
};

/**
 * The plan for a question, validated against the schema.
 *
 * Returns `null` for a question we hold no plan for — §7.7's "we don't hold the
 * data" case, which the Canvas states plainly rather than improvising.
 */
export function planFor(questionId: string): CanvasPlan | null {
  const raw = PLANS[questionId];
  if (!raw) return null;

  // Parsed rather than cast: a plan carrying a figure fails here, loudly, in
  // the build rather than in front of an audience.
  const parsed = CanvasPlan.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Canvas plan for "${questionId}" does not validate: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.')} ${issue.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}

/** Question ids that have a plan — everything else is honestly unanswerable. */
export const plannedQuestionIds = (): string[] => Object.keys(PLANS);

/** True when the question exists but is a capture, not a question (§7.6). */
export const isCapture = (questionId: string): boolean =>
  questionById(questionId)?.group === 'capture';
