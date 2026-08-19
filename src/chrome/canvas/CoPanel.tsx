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

import { useState } from 'react';
import { ChangePreview } from '@/blocks/ChangePreview';
import { Chart } from '@/blocks/Chart';
import { DataGrid, FieldCell, type GridColumn } from '@/blocks/DataGrid';
import { DocumentViewer } from '@/blocks/DocumentViewer';
import { Gap } from '@/blocks/Gap';
import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import { paymentColumns, uncoveredIds } from '@/blocks/paymentColumns';
import { fieldRow, plainRow, RecordCard } from '@/blocks/RecordCard';
import { Report } from '@/blocks/Report';
import { TaskTree } from '@/blocks/TaskTree';
import type { BlockRef } from '@/canvas/plan';
import type { EvidenceCard, ResolvedAnswer } from '@/canvas/resolver';
import { documentView } from '@/domain/selectors/documents';
import { type GapsState, gapsInArea, isCoverageArea } from '@/domain/selectors/gaps';
import { moneyWindow } from '@/domain/selectors/money';
import { buildReport } from '@/domain/selectors/report';
import { taskTree } from '@/domain/selectors/tasks';
import type { VendorExposure } from '@/domain/selectors/vendors';
import { exposureShares, vendorExposure } from '@/domain/selectors/vendors';
import { projectMoneyFor } from '@/domain/selectors/workspace';
import type { Document } from '@/domain/types';
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
  if (block.block === 'task-tree') return `task-tree-${block.projectId}`;
  if (block.block === 'report') return `report-${block.template}`;
  if (block.block === 'record-card') return `record-card-${block.entity.id}`;
  return block.block;
};

/**
 * A project as a record card — value, what has gone out, and the margin.
 *
 * Only projects: another entity kind would want its own field list, and a
 * generic one would show the wrong things for all of them.
 */
function ProjectCard({ entityId, entities }: { entityId: string; entities: EntityTable }) {
  const entity = entities[entityId];
  if (entity?.kind !== 'project') {
    return (
      <p className="py-6 text-center text-faint text-sm">
        No card for “{entityId}” in this scenario.
      </p>
    );
  }

  const money = projectMoneyFor({ entities }, entity.id);
  const fields = [
    fieldRow('value', 'Contract value', entity.value, formatINR),
    ...(money
      ? [
          plainRow('spent', 'Paid out', formatINR(money.spent.value)),
          plainRow('committed', 'Ordered, not yet paid', formatINR(money.committed.value)),
          plainRow(
            'margin',
            'Margin now',
            `${formatINR(money.margin)} · ${((money.marginPct ?? 0) * 100).toFixed(1)}%`,
          ),
          // The leak, stated beside the margin rather than inside it —
          // rule 3 keeps an unconfirmed estimate out of every total.
          ...(money.atRisk > 0
            ? [
                plainRow(
                  'at-risk',
                  'Unpriced, at risk',
                  `${formatINR(money.atRisk)} · ${((money.marginPctIfPriced ?? 0) * 100).toFixed(1)}% if it holds`,
                ),
              ]
            : []),
        ]
      : []),
  ];

  return <RecordCard title={entity.name} subtitle="Margin" fields={fields} entityId={entity.id} />;
}

/** Renders one block of a plan. The plan names the type; this maps it. */
function PlannedBlock({
  block,
  entities,
  gapState,
}: {
  block: BlockRef;
  entities: EntityTable;
  /** Coverage and interview history — only the gap block reads these. */
  gapState: Omit<GapsState, 'entities'>;
}) {
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

    case 'money-timeline': {
      // A `due between` filter scopes the window to a period, so a timeline
      // under a report about July shows July rather than the default 60 days
      // from today. Dates only — the schema forbids a figure here.
      const between = block.query.where.find(
        (clause) => clause.field === 'due' && clause.op === 'between',
      );
      const from = Array.isArray(between?.value) ? between.value[0] : undefined;

      return (
        <MoneyTimeline
          days={block.window}
          {...(from ? { from } : {})}
          stateOverride={{ entities }}
        />
      );
    }

    case 'record-card':
      return <ProjectCard entityId={block.entity.id} entities={entities} />;

    case 'report':
      // Read-only here: the Canvas is answering one question, and changing the
      // template would be asking a different one. `buildReport` because the
      // Canvas already applied the role cut before resolving.
      return (
        <Report
          report={buildReport({ entities }, block.template, {
            ...(block.period ? { period: block.period } : {}),
            ...(block.scope?.kind === 'project' ? { projectId: block.scope.id } : {}),
          })}
        />
      );

    case 'task-tree': {
      const project = entities[block.projectId];
      const name = project && 'name' in project ? project.name : block.projectId;
      // Read-only in the co-panel: the Canvas answers questions, and editing
      // the tree belongs on the project's own screen.
      return (
        <TaskTree
          nodes={taskTree({ entities }, block.projectId)}
          subject={name}
          highlightIds={block.highlight}
        />
      );
    }

    case 'gap':
      // Read-only in the co-panel: answering here would write from inside an
      // answer, and the Canvas's whole contract is that it proposes. The gaps
      // are answerable on Firm Memory, which owns them.
      // The plan's `area` is a string by schema, so it is checked rather than
      // cast (rule 8). A plan naming an area the firm does not track is a bug
      // worth seeing, not one worth coercing into a valid-looking answer.
      return isCoverageArea(block.area) ? (
        <Gap view={gapsInArea({ entities, ...gapState }, block.area)} />
      ) : (
        <p className="py-6 text-center text-faint text-sm">
          This answer asks for an area the firm does not track: “{block.area}”.
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

/**
 * The evidence zone — §7.3, and block 05's home (§8.1).
 *
 * "Every figure links back to a source" is a claim the column makes about
 * itself, so a card that cannot be opened makes the claim false. Selecting one
 * opens it in the viewer, at the passage if the figure named one.
 */
function EvidenceColumn({
  cards,
  documents,
  openId,
  onOpen,
}: {
  cards: EvidenceCard[];
  documents: Document[];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const open = openId ? documentView({ documents }, openId) : null;

  return (
    <aside className="rounded-md border border-line bg-panel p-3">
      <h3 className="mb-2 font-medium text-faint text-xs uppercase tracking-wide">Evidence</h3>
      <ul className="space-y-2">
        {cards.map((card) => {
          // A human answer is a source too, but there is no file to open.
          const openable = documents.some((document) => document.id === card.id);
          const selected = card.id === openId;

          return (
            <li key={card.id}>
              <button
                type="button"
                disabled={!openable}
                onClick={() => onOpen(selected ? null : card.id)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left',
                  card.unreadable ? 'border-warn/50 bg-warn-soft/30' : 'border-line bg-paper',
                  selected && 'border-brand ring-1 ring-brand/30',
                  openable ? 'cursor-pointer hover:border-brand' : 'cursor-default',
                )}
              >
                <p className="truncate font-medium text-ink text-sm">{card.label}</p>
                <p className="text-faint text-xs">
                  {card.detail}
                  {openable ? (selected ? ' · close' : ' · open') : ''}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <div className="mt-3 border-line border-t pt-3">
          <DocumentViewer view={open} compact />
        </div>
      ) : (
        <p className="mt-3 text-brand text-xs">Every figure links back to a source.</p>
      )}
    </aside>
  );
}

export function CoPanel({
  answer,
  entities,
  documents,
  gapState,
  pending,
  pinned,
  onPropose,
  onConfirm,
  onDiscard,
  onPin,
}: {
  answer: ResolvedAnswer;
  entities: EntityTable;
  /** The firm's files, so an evidence card can be opened (block 05). */
  documents: Document[];
  /** Coverage and interview history, for the gap block. */
  gapState: Omit<GapsState, 'entities'>;
  pending: ChangeSet | null;
  pinned: boolean;
  onPropose: (changeSet: ChangeSet) => void;
  onConfirm: (changeSet: ChangeSet) => void;
  onDiscard: () => void;
  onPin: () => void;
}) {
  // Which source is open in the evidence column. Local because it is a way of
  // looking at the answer, not a change to it.
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);

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
              <PlannedBlock block={block} entities={entities} gapState={gapState} />
            </div>
          ))}
        </div>

        {/* EVIDENCE — right column, full height. */}
        <EvidenceColumn
          cards={answer.evidence}
          documents={documents}
          openId={openSourceId}
          onOpen={setOpenSourceId}
        />
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
