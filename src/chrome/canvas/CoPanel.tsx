/**
 * The co-panel — spec §7.3, the layout law.
 *
 *   Answer   top-left, one line, never a table or a chart
 *   Evidence right column, full height, source cards only
 *   Working  centre-left below the answer, one to three blocks
 *   Actions  bottom strip, full width
 *
 * "Composition varies, position never does." The four zones are a fixed grid
 * here; a plan can change what goes *in* them and nothing else. That is why the
 * zone components take content but not placement.
 */

import { ChangePreview } from '@/blocks/ChangePreview';
import { Chart } from '@/blocks/Chart';
import { DataGrid, FieldCell, type GridColumn } from '@/blocks/DataGrid';
import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import { paymentColumns, uncoveredIds } from '@/blocks/paymentColumns';
import type { BlockRef } from '@/canvas/plan';
import type { EvidenceCard, ResolvedAnswer } from '@/canvas/resolver';
import { moneyWindow } from '@/domain/selectors/money';
import type { VendorExposure } from '@/domain/selectors/vendors';
import { exposureShares, vendorExposure } from '@/domain/selectors/vendors';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/money';
import type { ChangeSet } from '@/store/change';
import type { EntityTable } from '@/store/store';

/** Vendor columns, as w11's grid draws them. */
const vendorColumns: GridColumn<VendorExposure>[] = [
  { id: 'vendor', header: 'Vendor', cell: (v) => v.name, sortValue: (v) => v.name },
  {
    id: 'open',
    header: 'Open',
    align: 'right',
    tabular: true,
    sortValue: (v) => v.open,
    cell: (v) => (
      <span className={v.openUnconfirmed ? 'fv-extracted font-medium' : 'font-medium'}>
        {formatINR(v.open)}
      </span>
    ),
  },
  {
    id: 'gated',
    header: 'Gated',
    align: 'right',
    tabular: true,
    sortValue: (v) => v.gated,
    cell: (v) => (v.gated > 0 ? formatINR(v.gated) : <span className="text-faint">—</span>),
  },
  {
    id: 'terms',
    header: 'Terms',
    // w11 words a missing value here as "unknown" rather than the generic
    // "— add": on this grid the gap is the finding, not an empty slot to fill.
    cell: (v) =>
      v.terms.state === 'missing' ? (
        <span className="fv-missing" title={`Missing · blocks ${v.terms.blocks.join(', ')}`}>
          unknown
        </span>
      ) : (
        <FieldCell field={v.terms} format={(term) => term} />
      ),
  },
];

/** A block's identity: its type plus what it draws, so keys survive a reorder. */
const blockKey = (block: BlockRef): string => {
  if (block.block === 'data-grid') return `data-grid-${block.query.from}`;
  if (block.block === 'chart') return `chart-${block.type}-${block.by}`;
  if (block.block === 'money-timeline') return `money-timeline-${block.window}`;
  if (block.block === 'gap') return `gap-${block.area}`;
  return block.block;
};

/** Renders one block of a plan. The plan names the type; this maps it. */
function PlannedBlock({ block, entities }: { block: BlockRef; entities: EntityTable }) {
  switch (block.block) {
    case 'data-grid': {
      if (block.query.from === 'vendors') {
        const view = vendorExposure({ entities });
        return (
          <DataGrid
            rows={view.vendors}
            columns={vendorColumns}
            rowId={(vendor) => vendor.id}
            caption="Vendor exposure"
            askHint={false}
          />
        );
      }
      const window = moneyWindow({ entities });
      return (
        <DataGrid
          rows={window.payments}
          columns={paymentColumns()}
          rowId={(payment) => payment.id}
          highlightIds={uncoveredIds(window.payments)}
          caption="Payments"
          askHint={false}
        />
      );
    }

    case 'chart': {
      const view = vendorExposure({ entities });
      return (
        <Chart
          type={block.type}
          asShare
          data={exposureShares(view).map((row, index) => ({ ...row, emphasis: index === 0 }))}
        />
      );
    }

    case 'money-timeline':
      return <MoneyTimeline days={block.window} stateOverride={{ entities }} />;

    case 'gap':
      // Block 10 is not built yet. Saying so is better than rendering nothing.
      return (
        <p className="py-6 text-center text-faint text-sm">
          Gap block (10) is not built yet — this answer needs it.
        </p>
      );

    default:
      return (
        <p className="py-6 text-center text-faint text-sm">
          Block “{block.block}” is not built yet.
        </p>
      );
  }
}

function EvidenceColumn({ cards }: { cards: EvidenceCard[] }) {
  return (
    <aside className="rounded-md border border-line bg-panel p-3">
      <h3 className="mb-2 font-medium text-faint text-xs uppercase tracking-wide">Evidence</h3>
      <ul className="space-y-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className={cn(
              'rounded-md border px-3 py-2',
              card.unreadable ? 'border-warn/50 bg-warn-soft/30' : 'border-line bg-paper',
            )}
          >
            <p className="truncate font-medium text-ink text-sm">{card.label}</p>
            <p className="text-faint text-xs">{card.detail}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-brand text-xs">Every figure links back to a source.</p>
    </aside>
  );
}

export function CoPanel({
  answer,
  entities,
  pending,
  pinned,
  onPropose,
  onConfirm,
  onDiscard,
  onPin,
}: {
  answer: ResolvedAnswer;
  entities: EntityTable;
  pending: ChangeSet | null;
  pinned: boolean;
  onPropose: (changeSet: ChangeSet) => void;
  onConfirm: (changeSet: ChangeSet) => void;
  onDiscard: () => void;
  onPin: () => void;
}) {
  return (
    <section className="rounded-md border border-brand">
      <header className="flex flex-wrap items-baseline justify-between gap-2 bg-brand-soft px-4 py-3">
        <h2 className="font-medium text-brand text-sm uppercase tracking-wide">
          Co-panel · {answer.blocks.length} blocks composed
        </h2>
        <button
          type="button"
          onClick={onPin}
          disabled={pinned}
          className="cursor-pointer font-medium text-brand text-sm hover:underline disabled:cursor-default disabled:text-faint disabled:no-underline"
        >
          {pinned ? 'Pinned to your rail ✓' : 'Pin as screen ⊕'}
        </button>
      </header>

      {/* The layout law. These three columns never move. */}
      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0 space-y-3">
          {/* ANSWER — top-left, one line. Never a table, never a chart. */}
          <div className="rounded-md border border-line bg-panel px-4 py-3">
            <p className="font-medium text-faint text-xs uppercase tracking-wide">Answer</p>
            {/* One line (§7.3): the figure large, the rest as a subtitle, so a
                long description can never turn the answer into a paragraph. */}
            <p className="tabular mt-1 truncate font-display text-3xl text-ink">
              {answer.metric?.display ?? answer.headline}
            </p>
            {answer.metric ? (
              <p className="mt-0.5 truncate text-mute text-sm">
                {answer.headline.replace(answer.metric.display, '').trim()}
              </p>
            ) : null}
          </div>

          {/* WORKING AREA — centre-left, below the answer. One to three blocks. */}
          {answer.blocks.map((block) => (
            <div key={blockKey(block)} className="rounded-md border border-line bg-paper p-3">
              <PlannedBlock block={block} entities={entities} />
            </div>
          ))}
        </div>

        {/* EVIDENCE — right column, full height. */}
        <EvidenceColumn cards={answer.evidence} />
      </div>

      {pending ? (
        <div className="px-4 pb-4">
          <ChangePreview changeSet={pending} onConfirm={onConfirm} onDiscard={onDiscard} />
        </div>
      ) : null}

      {/* ACTIONS — bottom strip, full width. */}
      <footer className="border-brand/30 border-t bg-brand-soft/40 px-4 py-3">
        <p className="mb-2 font-medium text-brand text-xs uppercase tracking-wide">Actions</p>
        <div className="flex flex-wrap gap-2">
          {answer.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onPropose(actionProposal(action.label))}
              className="cursor-pointer rounded-full border border-brand px-3 py-1 font-medium text-brand text-sm hover:bg-brand hover:text-paper"
            >
              {action.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-faint text-xs">
          No action here writes anything until a change preview is confirmed.
        </p>
      </footer>
    </section>
  );
}

/** Every action opens a preview; none writes (§7.3, "never holds"). */
function actionProposal(label: string): ChangeSet {
  return {
    id: `canvas-${label.toLowerCase().replace(/\s+/g, '-')}`,
    proposedBy: 'ai',
    source: null,
    createdAt: '2026-08-12T07:40:00.000Z',
    confirmedAt: null,
    confirmedBy: null,
    changes: [
      {
        change: { op: 'update', id: 'vendor-godrej-dealer', patch: {} },
        before: null,
        after: `${label} — review the diff before anything is written`,
        label,
        confidence: 'low',
      },
    ],
  };
}
