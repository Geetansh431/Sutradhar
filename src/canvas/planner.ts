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
