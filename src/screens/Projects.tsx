/**
 * Projects — spec §6.2, wireframe w07.
 *
 * "One destination, three modes: list, pipeline board, map. The pipeline
 * matters disproportionately because every field in it currently exists only in
 * the founder's memory. It is the purest demonstration of the product's
 * premise."
 *
 * List mode composes the data grid (block 02). The board and its cards are
 * screen-level composition rather than a block — the vocabulary is closed at
 * ten (rule 7), and a pipeline card is not one of them.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChangePreview } from '@/blocks/ChangePreview';
import { DataGrid, FieldCell, type GridColumn } from '@/blocks/DataGrid';
import { type ModeOption, ModeSwitch } from '@/chrome/ModeSwitch';
import { NoticedPanel } from '@/chrome/projects/NoticedPanel';
import { PipelineBoard } from '@/chrome/projects/PipelineBoard';
import {
  type Observation,
  observations,
  type PipelineCard,
  type ProjectRow,
  pipelineBoard,
  projectCounts,
  projectRows,
} from '@/domain/selectors/projects';
import { canSeeMoney } from '@/domain/selectors/role';
import type { EntityId, PipelineStage } from '@/domain/types';
import { formatINR } from '@/lib/money';
import { useScenarioPath } from '@/lib/scenarioLink';
import { applyChange, type ChangeSet, proposeChangeSet } from '@/store/change';
import { type EntityTable, useStore } from '@/store/store';

type Mode = 'list' | 'board' | 'map';

/** What a team member's board is: nothing, because they never see one. */
const EMPTY_BOARD: Record<PipelineStage, PipelineCard[]> = {
  enquiry: [],
  feasibility: [],
  quoted: [],
  negotiating: [],
};

const ALL_MODES: ModeOption<Mode>[] = [
  { id: 'list', label: 'List' },
  { id: 'board', label: 'Pipeline board' },
  { id: 'map', label: 'Map' },
];

/**
 * §3.2 gives Team "projects they are on — no deal values, no pipeline". The
 * board is the pipeline, and every card on it carries a value, so the mode is
 * absent for them rather than emptied out.
 */
const modesFor = (seesMoney: boolean): ModeOption<Mode>[] =>
  seesMoney ? ALL_MODES : ALL_MODES.filter((mode) => mode.id !== 'board');

/** List mode's columns (§6.2). Money is dropped for a team member (§3.2). */
const columnsFor = (
  seesMoney: boolean,
  /** Keeps `?s=` on the way into a workspace. */
  link: (path: string) => string,
): GridColumn<ProjectRow>[] => {
  const columns: GridColumn<ProjectRow>[] = [
    {
      id: 'name',
      header: 'Project',
      // The way into the workspace (§6.3). A pipeline card is an enquiry and
      // has no workspace yet, so the link lives here rather than on the board.
      cell: (row) => (
        <Link to={link(`/projects/${row.id}`)} className="text-ink hover:underline">
          {row.name}
        </Link>
      ),
      sortValue: (row) => row.name,
    },
    { id: 'stage', header: 'Stage', cell: (row) => row.stage, sortValue: (row) => row.stage },
    {
      id: 'client',
      header: 'Client',
      cell: (row) => row.clientName,
      sortValue: (row) => row.clientName,
    },
  ];

  if (seesMoney) {
    columns.push({
      id: 'value',
      header: 'Value',
      align: 'right',
      tabular: true,
      sortValue: (row) => ('value' in row.value ? row.value.value : 0),
      cell: (row) => <FieldCell field={row.value} format={formatINR} />,
    });
  }

  columns.push({
    id: 'status',
    header: 'Health',
    cell: (row) => <span className="text-mute">{row.note ?? row.status}</span>,
    sortValue: (row) => row.status,
  });

  return columns;
};

export type ProjectsProps = {
  /** See `MoneyProps` — a static render never sees a store reset. */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null };
};

export function Projects({ stateOverride }: ProjectsProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const [mode, setMode] = useState<Mode>('board');
  const [pending, setPending] = useState<ChangeSet | null>(null);
  // §9.3: "a dismissed observation does not return unless its underlying facts
  // change" — the id encodes the facts, so a changed fact yields a new id.
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  const seesMoney = canSeeMoney({ entities, currentUserId });
  const link = useScenarioPath();
  // A team member never lands on the board, even by default.
  const activeMode: Mode = !seesMoney && mode === 'board' ? 'list' : mode;

  const view = useMemo(
    () => ({
      counts: projectCounts({ entities }),
      board: seesMoney ? pipelineBoard({ entities }) : EMPTY_BOARD,
      rows: projectRows({ entities }),
      // Team members get no firm-level observations (§9.3).
      noticed: seesMoney ? observations({ entities }) : [],
    }),
    [entities, seesMoney],
  );

  const act = (observation: Observation) =>
    setPending(
      proposeChangeSet({
        proposedBy: 'ai',
        source: null,
        changes: [
          {
            change: { op: 'update', id: observation.targetId, patch: {} },
            before: null,
            after: `${observation.action} — review the diff before anything is written`,
            label: observation.action,
            confidence: 'low',
          },
        ],
      }),
    );

  const confirm = (confirmed: ChangeSet) => {
    applyChange(useStore.getState(), confirmed, currentUserId ?? 'person-anil');
    setPending(null);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Projects</h1>
        <p className="text-mute text-sm">
          {view.counts.total} total · {view.counts.live} live · {view.counts.pipeline} in pipeline ·{' '}
          {view.counts.closed} closed
        </p>
      </header>

      <ModeSwitch
        modes={modesFor(seesMoney)}
        active={activeMode}
        onChange={setMode}
        label="Projects view"
      />

      {activeMode === 'board' ? <PipelineBoard board={view.board} /> : null}

      {activeMode === 'list' ? (
        <section className="rounded-md border border-line bg-paper p-4">
          <DataGrid
            rows={view.rows}
            columns={columnsFor(seesMoney, link)}
            rowId={(row) => row.id}
            caption="Projects"
            emptyMessage="No projects yet."
            emptyHint="Drop a folder in and Sutradhar will find them."
          />
        </section>
      ) : null}

      {activeMode === 'map' ? (
        <section className="rounded-md border border-line bg-panel px-4 py-10 text-center">
          <p className="text-mute text-sm">Map mode is not built yet.</p>
          <p className="mt-1 text-faint text-xs">
            It is the first thing cut if the schedule tightens — SETUP.md's cut order.
          </p>
        </section>
      ) : null}

      {pending ? (
        <ChangePreview changeSet={pending} onConfirm={confirm} onDiscard={() => setPending(null)} />
      ) : null}

      <NoticedPanel
        observations={view.noticed}
        dismissed={dismissed}
        onAct={act}
        onDismiss={(id) => setDismissed((current) => new Set(current).add(id))}
      />
    </main>
  );
}
