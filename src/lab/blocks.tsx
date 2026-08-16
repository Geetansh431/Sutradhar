/**
 * The lab's case list — every block, in every state.
 *
 * Adding a block means adding its seven cases here. States the live scenario
 * does not contain get a scoped entity table built in place and handed to the
 * block via `stateOverride`: the lab is the one place a hand-made table is
 * correct, because the point is to see the state, not to model the firm.
 */

import { ChangePreview, ChangePreviewLoading } from '@/blocks/ChangePreview';
import { Chart, ChartLoading, moneyDatum } from '@/blocks/Chart';
import { DataGrid, DataGridLoading } from '@/blocks/DataGrid';
import { MoneyTimeline, MoneyTimelineLoading } from '@/blocks/MoneyTimeline';
import { paymentColumns, uncoveredIds } from '@/blocks/paymentColumns';
import { type MoneyState, moneyWindow } from '@/domain/selectors/money';
import { exposureShares, vendorExposure } from '@/domain/selectors/vendors';
import type { Payment } from '@/domain/types';
import { buildState } from '@/fixtures/scenarios';
import type { LabCase } from '@/lab/registry';
import type { FieldValue, SourceRef } from '@/lib/field';
import { type Paise, rupees } from '@/lib/money';
import { proposeChangeSet } from '@/store/change';

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

// ── Block 02 · data grid ────────────────────────────────────────────────
// Shown over payments, because that is the configuration w09 specifies and the
// one the Money screen will compose.

const gridRows = (state: MoneyState) => moneyWindow(state).payments;

/** Resolves a gate id to the short label w09 prints ("Iyer inst. 3"). */
const gateLabel = (id: string) =>
  id === 'payment-iyer-instalment-3' ? 'Iyer inst. 3' : id.replace('payment-', '');

const gridColumns = paymentColumns({ gateLabel });

export const DATA_GRID_CASES: LabCase[] = [
  {
    block: '02-data-grid',
    state: 'loading',
    note: 'skeleton rows — no data read',
    render: () => <DataGridLoading />,
  },
  {
    block: '02-data-grid',
    state: 'empty',
    note: 'never a blank panel — says what will appear',
    render: () => (
      <DataGrid
        rows={gridRows({ entities: {} })}
        columns={gridColumns}
        rowId={(p) => p.id}
        emptyMessage="No payments scheduled in this window."
        emptyHint="Capture one with ⌘K, or drop a bill in."
      />
    ),
  },
  {
    block: '02-data-grid',
    state: 'populated',
    note: 'the live scenario — the six rows of w09, sortable',
    render: () => {
      const rows = gridRows(LIVE);
      return (
        <DataGrid
          rows={rows}
          columns={gridColumns}
          rowId={(p) => p.id}
          highlightIds={uncoveredIds(rows)}
          caption="Payments"
          onPropose={() => {}}
          bulkActions={[{ label: 'Re-gate', onRun: () => {} }]}
        />
      );
    },
  },
  {
    block: '02-data-grid',
    state: 'unconfirmed',
    note: 'extracted amount — dotted, hover for the source',
    render: () => (
      <DataGrid
        rows={gridRows(
          stateWith([
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
          ]),
        )}
        columns={gridColumns}
        rowId={(p) => p.id}
        onPropose={() => {}}
      />
    ),
  },
  {
    block: '02-data-grid',
    state: 'conflicting',
    note: 'both values shown, amber — never silently picks one',
    render: () => (
      <DataGrid
        rows={gridRows(
          stateWith([
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
                  {
                    value: rupees(95000),
                    source: { kind: 'message', id: 'm1', label: 'WhatsApp' },
                  },
                ],
              },
            }),
          ]),
        )}
        columns={gridColumns}
        rowId={(p) => p.id}
      />
    ),
  },
  {
    block: '02-data-grid',
    state: 'missing',
    note: '"— add" is an affordance, never a zero',
    render: () => (
      <DataGrid
        rows={gridRows(
          stateWith([
            anchorInflow,
            pay({
              id: 'lab-out',
              direction: 'out',
              due: '2026-08-22',
              amountField: { state: 'missing', blocks: ['payment grid', 'coverage warnings'] },
            }),
          ]),
        )}
        columns={gridColumns}
        rowId={(p) => p.id}
        onPropose={() => {}}
      />
    ),
  },
  {
    block: '02-data-grid',
    state: 'restricted',
    note: 'Team role — the rows are never fetched',
    render: () => (
      <DataGrid
        rows={gridRows(LIVE)}
        columns={gridColumns}
        rowId={(p) => p.id}
        restricted
        restrictedMessage="Firm money is admin-only."
      />
    ),
  },
];

// ── Block 09 · change preview ───────────────────────────────────────────
// The w14 scenario verbatim: a bill photo captured by voice, producing three
// changes of which one is a guess.

const billSource: SourceRef = {
  kind: 'document',
  id: 'doc-img-2231',
  label: 'photo of a bill',
  locator: 'Sharma ka bill aa gaya, 80 hazaar, Iyer site" + IMG_2231.jpg',
};

const w14ChangeSet = () =>
  proposeChangeSet({
    proposedBy: 'ai',
    source: billSource,
    changes: [
      {
        change: {
          op: 'create',
          entity: pay({
            id: 'new-sharma-bill',
            direction: 'out',
            due: '2026-08-14',
            amount: 80000,
          }),
        },
        before: null,
        after: 'Sharma Electricals · ₹80,000 · out · due 14 Aug',
        label: 'Payment record',
        confidence: 'high',
      },
      {
        change: { op: 'update', id: 'vendor-sharma', patch: { balance: rupees(280000) } },
        before: '₹2,00,000',
        after: '₹2,80,000',
        label: 'Vendor balance',
        confidence: 'high',
      },
      {
        change: {
          op: 'link',
          from: 'task-iyer-wiring',
          to: 'new-sharma-bill',
          relation: 'gated-on',
        },
        before: null,
        after: 'linked to this payment · I guessed this one',
        label: 'Task "Wiring"',
        confidence: 'low',
      },
    ],
  });

const noop = () => {};

export const CHANGE_PREVIEW_CASES: LabCase[] = [
  {
    block: '09-change-preview',
    state: 'loading',
    note: 'extraction still running',
    render: () => <ChangePreviewLoading />,
  },
  {
    block: '09-change-preview',
    state: 'empty',
    note: 'nothing proposed — not an error state',
    render: () => (
      <ChangePreview
        changeSet={proposeChangeSet({ proposedBy: 'ai', source: null, changes: [] })}
        onConfirm={noop}
      />
    ),
  },
  {
    block: '09-change-preview',
    state: 'populated',
    note: 'w14 exactly — 3 changes, one marked unsure',
    render: () => (
      <ChangePreview
        changeSet={w14ChangeSet()}
        onConfirm={noop}
        onDiscard={noop}
        onOpenSource={noop}
        onEditRow={noop}
      />
    ),
  },
  {
    block: '09-change-preview',
    state: 'unconfirmed',
    note: 'a user edit from the grid — one line, high confidence',
    render: () => (
      <ChangePreview
        changeSet={proposeChangeSet({
          proposedBy: 'user',
          source: null,
          changes: [
            {
              change: {
                op: 'update',
                id: 'payment-godrej-iyer',
                patch: { amount: rupees(200000) },
              },
              before: '₹1,70,000',
              after: '₹2,00,000',
              label: 'Godrej dealer amount',
              confidence: 'high',
            },
          ],
        })}
        onConfirm={noop}
        onDiscard={noop}
      />
    ),
  },
  {
    block: '09-change-preview',
    state: 'conflicting',
    note: 'every row a guess — marked, never hidden',
    render: () => (
      <ChangePreview
        changeSet={proposeChangeSet({
          proposedBy: 'ai',
          source: { kind: 'message', id: 'm1', label: 'WhatsApp export', locator: 'msg 1,204' },
          changes: [
            {
              change: { op: 'update', id: 'payment-kumar-kormangala', patch: {} },
              before: '₹90,000',
              after: '₹95,000',
              label: 'Kumar Carpentry amount',
              confidence: 'low',
            },
            {
              change: {
                op: 'link',
                from: 'payment-kumar-kormangala',
                to: 'payment-iyer-instalment-3',
                relation: 'gated-on',
              },
              before: null,
              after: 'gated on Iyer instalment 3 · I guessed this one',
              label: 'Kumar payment',
              confidence: 'low',
            },
          ],
        })}
        onConfirm={noop}
        onDiscard={noop}
      />
    ),
  },
  {
    block: '09-change-preview',
    state: 'missing',
    note: 'archive, never delete — no-AI rule #4',
    render: () => (
      <ChangePreview
        changeSet={proposeChangeSet({
          proposedBy: 'ai',
          source: { kind: 'human', id: 'h', label: 'gap question' },
          changes: [
            {
              change: {
                op: 'archive',
                id: 'project-hsr-duplex',
                reason: 'lost — client went elsewhere',
              },
              before: 'in pipeline',
              after: 'archived · lost',
              label: 'HSR duplex',
              confidence: 'high',
            },
          ],
        })}
        onConfirm={noop}
        onDiscard={noop}
      />
    ),
  },
  {
    block: '09-change-preview',
    state: 'restricted',
    note: 'a money change always names its human confirmer — no-AI rule #2',
    render: () => (
      <ChangePreview
        changeSet={proposeChangeSet({
          proposedBy: 'ai',
          source: billSource,
          changes: [
            {
              change: {
                op: 'settle',
                id: 'payment-sharma-running-bill',
                amount: rupees(80000),
                on: '2026-08-14',
              },
              before: 'due',
              after: 'paid · needs a human',
              label: 'Sharma running bill',
              confidence: 'low',
            },
          ],
        })}
        onConfirm={noop}
        onDiscard={noop}
        confirmedBy="person-anil"
      />
    ),
  },
];

// ── Block 07 · chart ────────────────────────────────────────────────────
// Shown as vendor-exposure shares, which is the configuration w11 specifies.

const exposure = () => vendorExposure(LIVE);

export const CHART_CASES: LabCase[] = [
  {
    block: '07-chart',
    state: 'loading',
    note: 'skeleton bars — no data read',
    render: () => <ChartLoading />,
  },
  {
    block: '07-chart',
    state: 'empty',
    note: 'nothing to compare yet',
    render: () => <Chart type="hbar" data={[]} />,
  },
  {
    block: '07-chart',
    state: 'populated',
    note: 'w11 — share of vendor exposure, largest first',
    render: () => (
      <Chart
        type="hbar"
        asShare
        caption="Chart block · fixed type set"
        data={exposureShares(exposure()).map((row, index) => ({
          ...row,
          emphasis: index === 0,
        }))}
        onDrillDown={() => {}}
      />
    ),
  },
  {
    block: '07-chart',
    state: 'unconfirmed',
    note: 'extracted figure stays dotted in the chart too',
    render: () => (
      <Chart
        type="hbar"
        data={exposure().vendors.map((vendor) =>
          moneyDatum(
            vendor.name,
            vendor.openUnconfirmed
              ? {
                  state: 'extracted',
                  value: vendor.open,
                  source: { kind: 'document', id: 'd', label: 'Vendor bill photo' },
                  confidence: 0.58,
                }
              : {
                  state: 'confirmed',
                  value: vendor.open,
                  source: { kind: 'human', id: 'h', label: 'confirmed' },
                  confirmedBy: 'person-anil',
                  confirmedAt: '2026-08-09T00:00:00.000Z',
                },
          ),
        )}
      />
    ),
  },
  {
    block: '07-chart',
    state: 'conflicting',
    note: 'amber, and no value silently chosen',
    render: () => (
      <Chart
        type="hbar"
        data={[
          moneyDatum('Sharma Electricals', {
            state: 'conflicting',
            candidates: [
              { value: rupees(280000), source: { kind: 'document', id: 'd', label: 'Ledger' } },
              { value: rupees(265000), source: { kind: 'message', id: 'm', label: 'WhatsApp' } },
            ],
          }),
          moneyDatum('Kumar Carpentry', {
            state: 'confirmed',
            value: rupees(212000),
            source: { kind: 'human', id: 'h', label: 'confirmed' },
            confirmedBy: 'person-anil',
            confirmedAt: '2026-08-09T00:00:00.000Z',
          }),
        ]}
      />
    ),
  },
  {
    block: '07-chart',
    state: 'missing',
    note: 'a figure we do not hold is an em dash, never a zero bar',
    render: () => (
      <Chart
        type="hbar"
        data={[
          moneyDatum('Godrej dealer', { state: 'missing', blocks: ['vendor ledger'] }),
          moneyDatum('Sharma Electricals', {
            state: 'confirmed',
            value: rupees(280000),
            source: { kind: 'human', id: 'h', label: 'confirmed' },
            confirmedBy: 'person-anil',
            confirmedAt: '2026-08-09T00:00:00.000Z',
          }),
        ]}
      />
    ),
  },
  {
    block: '07-chart',
    state: 'restricted',
    note: 'Team role — the figure is never fetched',
    render: () => <Chart type="hbar" data={exposureShares(exposure())} restricted />,
  },
];

export const ALL_CASES: LabCase[] = [
  ...MONEY_TIMELINE_CASES,
  ...DATA_GRID_CASES,
  ...CHANGE_PREVIEW_CASES,
  ...CHART_CASES,
];
