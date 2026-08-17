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
  /** Days behind the plan, as recorded on site. Never derived from the clock. */
  slippedDays: Task['slippedDays'];
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
    slippedDays: task.slippedDays,
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

/**
 * Whether a project will hit its handover date — spec §7, the
 * `kormangala-handover` question.
 *
 * "Days behind, the blocking chain, and what would recover it."
 *
 * The chain is the longest run of dependent slipping-or-undated tasks from a
 * root downwards. It matters because a delay at the top is a delay at every
 * node under it: four days lost on the ceiling is four days lost on snagging.
 *
 * `handoverDate` may be missing, and on Kormangala it is. That is not a hole in
 * the answer — it *is* the answer: a date nobody holds cannot be hit or missed,
 * and saying so is more useful than computing against a guess.
 */
export type ScheduleView = {
  /** How far the worst-slipping task has drifted, in days. Null when nothing slips. */
  daysBehind: number | null;
  /** Root-to-leaf run of tasks each waiting on the one above. */
  chain: TaskNode[];
  /** Tasks with no date at all — what stops a countdown existing. */
  undated: TaskNode[];
  /** The task at the head of the chain: unblock this and the rest can move. */
  blocker: TaskNode | null;
};

const SLIPPING: ReadonlySet<TaskStatus> = new Set<TaskStatus>(['slipping', 'unassigned']);

/** The longest run of dependent held-up tasks from this node down. */
const longestChain = (node: TaskNode): TaskNode[] => {
  if (!SLIPPING.has(node.status)) return [];
  const best = node.children
    .map(longestChain)
    .reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), []);
  return [node, ...best];
};

export function scheduleView(state: TasksState, projectId: EntityId): ScheduleView {
  const roots = taskTree(state, projectId);
  const all = flattenTree(roots);

  const chain = roots
    .map(longestChain)
    .reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), []);

  // Read from what the site recorded, never computed against today: a task due
  // next week can already be four days behind where the plan put it, and
  // comparing its date to the clock would report that as "nothing overdue".
  const slips = all
    .map((task) => (task.slippedDays && hasValue(task.slippedDays) ? task.slippedDays.value : 0))
    .filter((days) => days > 0);

  return {
    daysBehind: slips.length === 0 ? null : Math.max(...slips),
    chain,
    undated: all.filter((task) => task.deadline === null || !hasValue(task.deadline)),
    blocker: chain[0] ?? null,
  };
}

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
