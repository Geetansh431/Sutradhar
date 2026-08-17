/**
 * The task tree behind block 08 — spec §8.1, §6.3.
 *
 * "Nested tasks with assignee, deadline, status, linked payment."
 *
 * The store holds tasks flat, each carrying a `parentId`. Nesting is derived
 * here rather than stored, so re-parenting is one field write and the tree can
 * never disagree with itself about who owns whom.
 *
 * Assignee resolution lives here too: a task points at an id, and that id may
 * be a vendor, a person, or nothing at all. The block renders "unassigned" for
 * the last case — a name it does not hold is a gap, not a blank.
 */

import type { EntityId, Task, TaskStatus } from '@/domain/types';
import { hasValue } from '@/lib/field';
import type { EntityTable } from '@/store/store';

export type TasksState = { entities: EntityTable };

/** One node of the rendered tree. Children are nested, not flattened. */
export type TaskNode = {
  id: EntityId;
  title: string;
  /** The resolved assignee name, or null when nothing is assigned (§6.3). */
  assignee: string | null;
  deadline: Task['deadline'];
  status: TaskStatus;
  linkedPaymentId: EntityId | null;
  /** Depth from the root, so the block indents without walking back up. */
  depth: number;
  children: TaskNode[];
};

/**
 * What the right-hand column says when a task has no vendor doing it.
 *
 * w08 puts "pending price" against the change order rather than a name: an
 * unpriced task is not waiting on a person, it is waiting on a decision, and
 * naming the admin there would read as though the work were assigned.
 */
const columnFor = (status: TaskStatus, assignee: string | null): string | null =>
  status === 'needs-decision' ? 'pending price' : assignee;

const tasksOf = (state: TasksState, projectId: EntityId): Task[] =>
  Object.values(state.entities).filter(
    (entity): entity is Task =>
      entity.kind === 'task' && entity.projectId === projectId && entity.archivedAt === null,
  );

/**
 * A vendor, a person, or nothing. Clients are not assignable — work is not
 * given to the person paying for it.
 */
const assigneeName = (state: TasksState, id: EntityId | null): string | null => {
  if (id === null) return null;
  const entity = state.entities[id];
  if (!entity) return null;
  if (entity.kind === 'vendor') return entity.name;
  if (entity.kind === 'person') return `${entity.name} (internal)`;
  return null;
};

/**
 * The tree for one project, roots first, each level in fixture order.
 *
 * A task whose `parentId` points at something absent is treated as a root
 * rather than dropped — losing work because its parent was archived is the
 * worse failure.
 */
export function taskTree(state: TasksState, projectId: EntityId): TaskNode[] {
  const all = tasksOf(state, projectId);
  const byId = new Map(all.map((task) => [task.id, task]));

  const build = (task: Task, depth: number): TaskNode => ({
    id: task.id,
    title: task.title,
    assignee: columnFor(task.status, assigneeName(state, task.assigneeId)),
    deadline: task.deadline,
    status: task.status,
    linkedPaymentId: task.linkedPaymentId,
    depth,
    children: all
      .filter((child) => child.parentId === task.id)
      .map((child) => build(child, depth + 1)),
  });

  return all
    .filter((task) => task.parentId === null || !byId.has(task.parentId))
    .map((task) => build(task, 0));
}

/** Every node, depth-first — the order the block paints rows in. */
export const flattenTree = (nodes: TaskNode[]): TaskNode[] =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children)]);

/**
 * What the tree is worth saying out loud, for the workspace header.
 *
 * Counts only — the tree itself carries no money, so this is role-safe.
 */
export type TaskSummary = {
  total: number;
  done: number;
  slipping: number;
  unassigned: number;
  needsDecision: number;
  /** Tasks with no deadline at all — what blocks the handover countdown. */
  undated: number;
};

export function taskSummary(state: TasksState, projectId: EntityId): TaskSummary {
  const all = tasksOf(state, projectId);
  const count = (status: TaskStatus) => all.filter((task) => task.status === status).length;
  return {
    total: all.length,
    done: count('done'),
    slipping: count('slipping'),
    unassigned: count('unassigned'),
    needsDecision: count('needs-decision'),
    undated: all.filter((task) => task.deadline === null || !hasValue(task.deadline)).length,
  };
}
