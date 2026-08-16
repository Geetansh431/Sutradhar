/**
 * What `/lab` renders. One entry per block, one case per state.
 *
 * `.claude/commands/block.md` requires every block to appear here in **every**
 * state before a screen may compose it: loading, empty, populated, one
 * unconfirmed field, one conflicting field, one missing field, and the
 * role-restricted view. The `cases` list is that checklist, and `Lab` renders
 * the gaps as explicit "not built" tiles rather than quietly omitting them.
 */

import type { ReactNode } from 'react';

/** The ten blocks of spec §8.1. This list is closed — see CLAUDE.md rule 7. */
export const BLOCKS = [
  { id: '01-record-card', name: 'Record card', holds: 'One entity: fields, status, provenance' },
  { id: '02-data-grid', name: 'Data grid', holds: 'Any list of records. Filter, sort, group' },
  { id: '03-money-timeline', name: 'Money timeline', holds: 'In above, out below, gaps shaded' },
  { id: '04-ledger', name: 'Ledger', holds: 'Running balance for one entity' },
  { id: '05-document-viewer', name: 'Document viewer', holds: 'The source, passage highlighted' },
  { id: '06-report', name: 'Report block', holds: 'Fixed templates only' },
  { id: '07-chart', name: 'Chart block', holds: 'Bar, horizontal bar, timeline, stacked' },
  { id: '08-task-tree', name: 'Task tree', holds: 'Nested tasks, assignee, deadline, status' },
  { id: '09-change-preview', name: 'Change preview', holds: 'A proposed set of writes, as a diff' },
  { id: '10-gap', name: 'Gap block', holds: 'What is missing here, and what it blocks' },
] as const;

export type BlockId = (typeof BLOCKS)[number]['id'];

/**
 * The seven states every block must demonstrate. Ordered as `block.md` lists
 * them, so the lab reads top-to-bottom like the checklist it is.
 */
export const STATES = [
  { id: 'loading', label: 'Loading' },
  { id: 'empty', label: 'Empty' },
  { id: 'populated', label: 'Populated' },
  { id: 'unconfirmed', label: 'One unconfirmed field' },
  { id: 'conflicting', label: 'One conflicting field' },
  { id: 'missing', label: 'One missing field' },
  { id: 'restricted', label: 'Role-restricted (Team)' },
] as const;

export type StateId = (typeof STATES)[number]['id'];

/** A single rendered case: one block in one state. */
export type LabCase = {
  block: BlockId;
  state: StateId;
  render: () => ReactNode;
  /** Anything a reviewer should look for that the render alone doesn't say. */
  note?: string;
};

/**
 * Cases live in `blocks.tsx` — which imports `LabCase` from here, so this file
 * must not import back. `Lab` reads them from there and passes them down.
 */
export const casesFor = (cases: LabCase[], block: BlockId): Map<StateId, LabCase> =>
  new Map(cases.filter((c) => c.block === block).map((c) => [c.state, c]));

export const builtCount = (cases: LabCase[]): number => new Set(cases.map((c) => c.block)).size;
