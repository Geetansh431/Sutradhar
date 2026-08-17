/**
 * Block 08 — Task tree.
 *
 * "Nested tasks with assignee, deadline, status, linked payment. Editing: add,
 * re-parent by drag, mark done, reassign." (§8.1)
 *
 * Status dots follow §6.3 exactly: green on track, amber slipping, grey
 * unassigned, accent needs a decision. The accent dot is the margin-leak story
 * on w08 — the unpriced change order — so it is the one status that reads as a
 * demand rather than a colour.
 *
 * Every edit raises a ChangeSet and writes nothing (§8.2). Re-parenting by drag
 * is a structural write like any other: the drop proposes, it does not move.
 */

import { useState } from 'react';
import { FieldCell } from '@/blocks/DataGrid';
import { flattenTree, type TaskNode } from '@/domain/selectors/tasks';
import type { EntityId, TaskStatus } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/dates';
import { hasValue } from '@/lib/field';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

export type TaskTreeProps = {
  nodes: TaskNode[];
  /** The project these tasks belong to, for change labels. */
  subject: string;
  /** Where an added task lands. Without it the block is read-only about adding. */
  projectId?: EntityId;
  /**
   * Task ids the answer is about — the Canvas passes the chain it is explaining
   * so the reader can see which rows the sentence refers to (§7.3).
   */
  highlightIds?: readonly EntityId[];
  onPropose?: (changeSet: ChangeSet) => void;
  loading?: boolean;
  restricted?: boolean;
};

/** §6.3: green on track, amber slipping, grey unassigned, accent needs a decision. */
const STATUS_DOT: Record<TaskStatus, string> = {
  'on-track': 'bg-ok',
  slipping: 'bg-warn',
  unassigned: 'bg-line',
  'needs-decision': 'bg-brand',
  done: 'bg-ok/40',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  'on-track': 'On track',
  slipping: 'Slipping',
  unassigned: 'Unassigned',
  'needs-decision': 'Needs a decision',
  done: 'Done',
};

const markDoneChange = (node: TaskNode, subject: string): ChangeSet['changes'][number] => ({
  change: { op: 'update', id: node.id, patch: { status: 'done' } },
  before: STATUS_LABEL[node.status],
  after: STATUS_LABEL.done,
  label: `${subject} — ${node.title}`,
  confidence: 'high',
});

const reparentChange = (
  node: TaskNode,
  parentId: EntityId | null,
  parentTitle: string,
  subject: string,
): ChangeSet['changes'][number] => ({
  change: { op: 'update', id: node.id, patch: { parentId } },
  before: null,
  after: parentId === null ? 'a top-level task' : `under ${parentTitle}`,
  label: `${subject} — ${node.title}`,
  confidence: 'high',
});

const reassignChange = (
  node: TaskNode,
  next: string,
  subject: string,
): ChangeSet['changes'][number] => ({
  // The name is what the user typed; resolving it to an id is the confirm step's
  // job, so the proposal carries the words rather than inventing a link.
  change: { op: 'update', id: node.id, patch: { assigneeName: next } },
  before: node.assignee ?? 'unassigned',
  after: next,
  label: `${subject} — ${node.title}`,
  confidence: 'high',
});

function LoadingState() {
  const rows = ['a', 'b', 'c', 'd'];
  return (
    <output aria-label="Loading task tree" className="block space-y-2 py-2">
      {rows.map((row, index) => (
        <div
          key={row}
          className={cn('h-6 animate-pulse rounded bg-fill-2', index % 2 === 1 && 'ml-6')}
        />
      ))}
    </output>
  );
}

/** The assignee cell, which becomes a text input while it is being reassigned. */
function Assignee({
  node,
  editing,
  onStart,
  onCommit,
  onCancel,
}: {
  node: TaskNode;
  editing: boolean;
  onStart: () => void;
  onCommit: (next: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(node.assignee ?? '');

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: the click that opened it was the intent
        autoFocus
        aria-label={`Assignee for ${node.title}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onCommit(draft);
          if (event.key === 'Escape') onCancel();
        }}
        className="w-40 rounded border border-brand bg-bg px-1 py-0.5 text-right text-[0.8125rem] text-ink outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      className={cn(
        'cursor-pointer text-right text-[0.8125rem] hover:underline',
        node.assignee ? 'text-mute' : 'fv-missing',
      )}
    >
      {node.assignee ?? 'unassigned'}
    </button>
  );
}

/**
 * One row of the tree, and the drop target for a re-parent.
 *
 * It is its own component so the tree's own body stays readable — and so the
 * `treeitem` role, the drag handlers and the indent all live on one element
 * rather than a div nested inside a list item.
 */
function Row({
  node,
  subject,
  first,
  highlighted,
  editing,
  dragging,
  over,
  onPropose,
  onEditStart,
  onEditEnd,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDragLeaveRow,
  onDropRow,
}: {
  node: TaskNode;
  subject: string;
  /** The tree's single tab stop lands on the first row. */
  first: boolean;
  /** This row is part of what the answer is explaining. */
  highlighted: boolean;
  editing: boolean;
  dragging: boolean;
  over: boolean;
  onPropose?: (change: ChangeSet['changes'][number]) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  /** Returns whether this row is a legal drop target, so the caller can preventDefault. */
  onDragOverRow: () => boolean;
  onDragLeaveRow: () => void;
  onDropRow: () => void;
}) {
  return (
    <div
      role="treeitem"
      // Roving tabindex: the tree takes one tab stop, and the first row is it.
      // Every verb inside a row is a button and reachable on its own.
      tabIndex={node.depth === 0 && first ? 0 : -1}
      aria-level={node.depth + 1}
      aria-expanded={node.children.length > 0 ? true : undefined}
      draggable={onPropose !== undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (onDragOverRow()) event.preventDefault();
      }}
      onDragLeave={onDragLeaveRow}
      onDrop={onDropRow}
      style={{ paddingLeft: `${node.depth * 1.5}rem` }}
      className={cn(
        'group flex items-baseline gap-2 rounded py-1 pr-2',
        highlighted && 'bg-brand-soft/40',
        onPropose && 'cursor-grab',
        dragging && 'opacity-40',
        over && 'bg-fill-2 ring-1 ring-brand',
      )}
    >
      <span
        aria-hidden
        title={STATUS_LABEL[node.status]}
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          STATUS_DOT[node.status],
          node.status === 'needs-decision' && 'ring-2 ring-brand/25',
        )}
      />

      <span
        className={cn(
          'truncate text-[0.8125rem]',
          node.depth === 0 ? 'font-medium text-ink' : 'text-ink',
          node.status === 'done' && 'text-mute line-through',
        )}
      >
        {node.title}
      </span>
      <span className="sr-only">{STATUS_LABEL[node.status]}</span>

      {node.deadline ? (
        <FieldCell field={node.deadline} format={formatShortDate} className="shrink-0 text-xs" />
      ) : null}

      {/* Slippage is against the plan, not the clock — so it is stated, not
          inferred from the date sitting next to it. */}
      {node.slippedDays && hasValue(node.slippedDays) && node.slippedDays.value > 0 ? (
        <FieldCell
          field={node.slippedDays}
          format={(days) => `${days}d behind`}
          className="shrink-0 text-xs"
        />
      ) : null}

      {node.linkedPaymentId ? (
        <span className="shrink-0 text-faint text-xs" title="A payment is linked to this">
          · linked
        </span>
      ) : null}

      <span className="ml-auto flex shrink-0 items-baseline gap-3">
        {onPropose ? (
          <Assignee
            node={node}
            editing={editing}
            onStart={onEditStart}
            onCancel={onEditEnd}
            onCommit={(next) => {
              onEditEnd();
              const trimmed = next.trim();
              if (trimmed === '' || trimmed === node.assignee) return;
              onPropose(reassignChange(node, trimmed, subject));
            }}
          />
        ) : (
          <span className={cn('text-[0.8125rem]', node.assignee ? 'text-mute' : 'fv-missing')}>
            {node.assignee ?? 'unassigned'}
          </span>
        )}

        {/* w08 carries no per-row action: nine "Mark done" links down the right
            edge read as the loudest thing on the screen, which the assignee
            column should be. It appears on hover and on keyboard focus. */}
        {onPropose && node.status !== 'done' ? (
          <button
            type="button"
            onClick={() => onPropose(markDoneChange(node, subject))}
            className="cursor-pointer whitespace-nowrap text-brand text-xs opacity-0 transition-opacity hover:underline focus-visible:opacity-100 group-hover:opacity-100"
          >
            Mark done
          </button>
        ) : null}
      </span>
    </div>
  );
}

export function TaskTree({
  nodes,
  subject,
  projectId,
  highlightIds,
  onPropose,
  loading = false,
  restricted = false,
}: TaskTreeProps) {
  const [editingId, setEditingId] = useState<EntityId | null>(null);
  const [draggingId, setDraggingId] = useState<EntityId | null>(null);
  const [overId, setOverId] = useState<EntityId | null>(null);

  if (restricted) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">This project's tasks are not yours to see.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  if (nodes.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">No tasks on {subject} yet.</p>
        <p className="mt-1 text-faint text-xs">
          A site note or a work order puts the first one here.
        </p>
      </div>
    );
  }

  const propose = (change: ChangeSet['changes'][number]) => {
    onPropose?.(proposeChangeSet({ proposedBy: 'user', source: null, changes: [change] }));
  };

  const drop = (target: TaskNode) => {
    setOverId(null);
    const dragged = draggingId;
    setDraggingId(null);
    if (dragged === null || dragged === target.id) return;
    const node = flattenTree(nodes).find((candidate) => candidate.id === dragged);
    // A task cannot become its own descendant's child — the tree would detach.
    if (!node || flattenTree([node]).some((descendant) => descendant.id === target.id)) return;
    propose(reparentChange(node, target.id, target.title, subject));
  };

  const rows = flattenTree(nodes);

  return (
    <figure className="m-0">
      <figcaption className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
        Task tree · {subject}
      </figcaption>

      {/* A tree is what this is, so it says so: the nesting is announced rather
          than left to the indent, which a screen reader cannot see. */}
      <div role="tree" aria-label={`Tasks on ${subject}`} className="space-y-0.5">
        {rows.map((node, index) => (
          <Row
            key={node.id}
            node={node}
            subject={subject}
            first={index === 0}
            highlighted={highlightIds?.includes(node.id) ?? false}
            editing={editingId === node.id}
            dragging={draggingId === node.id}
            over={overId === node.id}
            {...(onPropose ? { onPropose: propose } : {})}
            onEditStart={() => setEditingId(node.id)}
            onEditEnd={() => setEditingId(null)}
            onDragStart={() => setDraggingId(node.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            onDragOverRow={() => {
              if (draggingId === null || draggingId === node.id) return false;
              setOverId(node.id);
              return true;
            }}
            onDragLeaveRow={() => setOverId((current) => (current === node.id ? null : current))}
            onDropRow={() => drop(node)}
          />
        ))}
      </div>

      {onPropose && projectId ? (
        <div className="mt-2 flex items-baseline gap-3 border-line/60 border-t pt-2">
          <button
            type="button"
            onClick={() =>
              propose({
                change: {
                  op: 'create',
                  entity: {
                    kind: 'task',
                    id: `task-new-${rows.length + 1}`,
                    projectId,
                    parentId: null,
                    title: 'New task',
                    assigneeId: null,
                    deadline: { state: 'missing', blocks: ['handover countdown'] },
                    status: 'unassigned',
                    // A brand-new task has not slipped against anything yet.
                    slippedDays: null,
                    linkedPaymentId: null,
                    archivedAt: null,
                  },
                },
                before: null,
                after: 'New task · unassigned',
                label: `${subject} — new task`,
                confidence: 'high',
              })
            }
            className="cursor-pointer text-brand text-xs hover:underline"
          >
            + add task
          </button>
          <span className="text-faint text-xs">· drag to re-parent</span>
        </div>
      ) : null}
    </figure>
  );
}

export { LoadingState as TaskTreeLoading };
