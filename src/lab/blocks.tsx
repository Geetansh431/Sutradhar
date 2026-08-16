/**
 * The lab's case list — every block, in every state.
 *
 * Adding a block means adding its seven cases here. States the live scenario
 * does not contain get a scoped entity table built in place and handed to the
 * block via `stateOverride`: the lab is the one place a hand-made table is
 * correct, because the point is to see the state, not to model the firm.
 */

import { MoneyTimeline, MoneyTimelineLoading } from '@/blocks/MoneyTimeline';
import type { MoneyState } from '@/domain/selectors/money';
import type { Payment } from '@/domain/types';
import { buildState } from '@/fixtures/scenarios';
import type { LabCase } from '@/lab/registry';
import type { FieldValue, SourceRef } from '@/lib/field';
import { type Paise, rupees } from '@/lib/money';

const SOURCE: SourceRef = { kind: 'human', id: 'lab', label: 'lab fixture' };

const confirmed = <T,>(value: T) =>
  ({
    state: 'confirmed',
    value,
    source: SOURCE,
    confirmedBy: 'person-anil',
    confirmedAt: '2026-08-09T00:00:00.000Z',
  }) as const;

const pay = (over: {
  id: string;
  direction: Payment['direction'];
  due: string;
  amount?: number;
  amountField?: FieldValue<Paise>;
  gatedOn?: string | null;
  status?: Payment['status'];
}): Payment => ({
  kind: 'payment',
  id: over.id,
  direction: over.direction,
  projectId: 'project-iyer',
  counterpartyId: over.direction === 'in' ? 'client-iyer' : 'vendor-sharma',
  amount: over.amountField ?? confirmed(rupees(over.amount ?? 100000)),
  due: confirmed(over.due),
  status: over.status ?? 'planned',
  gatedOn: over.gatedOn ?? null,
  archivedAt: null,
});

/**
 * The live firm's people and projects — so names resolve — with every payment
 * replaced by the ones a case wants to show.
 */
const stateWith = (payments: Payment[]): MoneyState => {
  const entities = { ...buildState('live').entities };
  for (const [id, entity] of Object.entries(entities)) {
    if (entity.kind === 'payment') delete entities[id];
  }
  for (const p of payments) entities[p.id] = p;
  return { entities };
};

/** The seeded firm, for the case that shows the demo as it really is. */
const LIVE: MoneyState = { entities: buildState('live').entities };

/** An inflow to pair with, so every case has both halves of the axis. */
const anchorInflow = pay({ id: 'lab-in', direction: 'in', due: '2026-08-14', amount: 250000 });

export const MONEY_TIMELINE_CASES: LabCase[] = [
  {
    block: '03-money-timeline',
    state: 'loading',
    note: 'skeleton — no data read',
    render: () => <MoneyTimelineLoading compact={false} />,
  },
  {
    block: '03-money-timeline',
    state: 'empty',
    note: 'never a blank panel — says what will appear',
    render: () => <MoneyTimeline stateOverride={stateWith([])} />,
  },
  {
    block: '03-money-timeline',
    state: 'populated',
    note: 'the live scenario — w09, gap of ₹1,70,000',
    // Passed explicitly rather than read from the store: the lab must render
    // the same whether or not a scenario has been seeded into it.
    render: () => <MoneyTimeline stateOverride={LIVE} />,
  },
  {
    block: '03-money-timeline',
    state: 'unconfirmed',
    note: 'extracted — dotted, and excluded from the total',
    render: () => (
      <MoneyTimeline
        stateOverride={stateWith([
          anchorInflow,
          pay({
            id: 'lab-out',
            direction: 'out',
            due: '2026-08-20',
            amountField: {
              state: 'extracted',
              value: rupees(110000),
              source: { kind: 'document', id: 'd', label: 'Vendor bill photo' },
              confidence: 0.61,
            },
          }),
        ])}
      />
    ),
  },
  {
    block: '03-money-timeline',
    state: 'conflicting',
    note: 'two sources disagree — never silently picks one',
    render: () => (
      <MoneyTimeline
        stateOverride={stateWith([
          anchorInflow,
          pay({
            id: 'lab-out',
            direction: 'out',
            due: '2026-08-20',
            amountField: {
              state: 'conflicting',
              candidates: [
                {
                  value: rupees(90000),
                  source: { kind: 'document', id: 'd1', label: 'Bill photo' },
                },
                { value: rupees(95000), source: { kind: 'message', id: 'm1', label: 'WhatsApp' } },
              ],
            },
          }),
        ])}
      />
    ),
  },
  {
    block: '03-money-timeline',
    state: 'missing',
    note: 'known to be absent — an affordance, never a zero',
    render: () => (
      <MoneyTimeline
        stateOverride={stateWith([
          anchorInflow,
          pay({
            id: 'lab-out',
            direction: 'out',
            due: '2026-08-22',
            amountField: { state: 'missing', blocks: ['payment grid', 'coverage warnings'] },
          }),
        ])}
      />
    ),
  },
  {
    block: '03-money-timeline',
    state: 'restricted',
    note: 'Team role — the figure is never fetched, not hidden',
    render: () => <MoneyTimeline restricted stateOverride={LIVE} />,
  },
];

export const ALL_CASES: LabCase[] = [...MONEY_TIMELINE_CASES];
