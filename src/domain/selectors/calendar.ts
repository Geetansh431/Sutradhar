/**
 * Calendar — spec §6.7.
 *
 * "One axis for every deadline in the firm: task deadlines, payment due dates,
 * stage gates, site visits, leave. Read-mostly — items are created where they
 * live, not here."
 *
 * The value is the single axis. A firm running on six WhatsApp groups has its
 * deadlines scattered across all of them; the point of this screen is that
 * there is one place where a task deadline and a payment due date are visibly
 * the same kind of thing — a date something is expected to happen.
 *
 * Money is filtered here, not in the component: §3.2 gives Team no money, so a
 * team member's calendar never contains a payment at all.
 */

import type { EntityId, Payment, Project, Task } from '@/domain/types';
import { hasValue } from '@/lib/field';
import { formatINR } from '@/lib/money';
import type { EntityTable } from '@/store/store';
import { canSeeMoney, type RoleState } from './role';

export type CalendarState = { entities: EntityTable; currentUserId: EntityId | null };

export type CalendarKind = 'task' | 'payment' | 'handover' | 'follow-up';

export type CalendarItem = {
  id: EntityId;
  /** `YYYY-MM-DD`. Every item on the axis has one — that is what puts it here. */
  date: string;
  kind: CalendarKind;
  title: string;
  /** Which project it belongs to, resolved. Null for firm-level items. */
  projectName: string | null;
  /** A figure, already formatted, for the items that carry one. */
  detail: string | null;
  /** True when the date itself is not confirmed — shown dotted, never as fact. */
  uncertain: boolean;
};

export const KIND_LABEL: Record<CalendarKind, string> = {
  task: 'Task',
  payment: 'Payment',
  handover: 'Handover',
  'follow-up': 'Follow-up',
};

const nameOf = (state: CalendarState, id: EntityId | null): string | null => {
  if (id === null) return null;
  const entity = state.entities[id];
  return entity && 'name' in entity ? entity.name : null;
};

const listOf = <K extends 'task' | 'payment' | 'project'>(
  state: CalendarState,
  kind: K,
): Extract<Task | Payment | Project, { kind: K }>[] =>
  Object.values(state.entities).filter(
    (entity): entity is Extract<Task | Payment | Project, { kind: K }> =>
      entity.kind === kind && entity.archivedAt === null,
  );

/**
 * Every dated thing in the firm, earliest first.
 *
 * A date we do not hold keeps its item off the axis rather than placing it at a
 * guessed position — the calendar would otherwise assert something nobody said.
 */
/** Task deadlines. An undated task is simply not on the axis. */
const taskItems = (state: CalendarState): CalendarItem[] =>
  listOf(state, 'task')
    .filter((task) => task.deadline !== null && hasValue(task.deadline))
    .map((task) => ({
      id: `cal-${task.id}`,
      date: task.deadline && hasValue(task.deadline) ? task.deadline.value : '',
      kind: 'task' as const,
      title: task.title,
      projectName: nameOf(state, task.projectId),
      detail: null,
      uncertain: task.deadline?.state !== 'confirmed',
    }));

/** Payment due dates. Never built for a team member (§3.2). */
const paymentItems = (state: CalendarState): CalendarItem[] =>
  listOf(state, 'payment')
    .filter((payment) => hasValue(payment.due))
    .map((payment) => {
      const counterparty = nameOf(state, payment.counterpartyId);
      return {
        id: `cal-${payment.id}`,
        date: hasValue(payment.due) ? payment.due.value : '',
        kind: 'payment' as const,
        // A firm-level payment has no counterparty — salaries are owed to the
        // team, not to a vendor — so it carries its own label instead.
        title: counterparty
          ? `${payment.direction === 'in' ? 'From' : 'To'} ${counterparty}`
          : (payment.label ?? 'Firm-level payment'),
        projectName: nameOf(state, payment.projectId),
        detail: hasValue(payment.amount) ? formatINR(payment.amount.value) : null,
        uncertain: payment.due.state !== 'confirmed' || !hasValue(payment.amount),
      };
    });

/** Handover dates and booked follow-ups — the project's own two dated things. */
const projectItems = (state: CalendarState): CalendarItem[] =>
  listOf(state, 'project').flatMap((project) => {
    const found: CalendarItem[] = [];

    if (project.handoverDate && hasValue(project.handoverDate)) {
      found.push({
        id: `cal-handover-${project.id}`,
        date: project.handoverDate.value,
        kind: 'handover',
        title: `${project.name} handover`,
        projectName: project.name,
        detail: null,
        uncertain: project.handoverDate.state !== 'confirmed',
      });
    }

    if (project.nextFollowUp) {
      found.push({
        id: `cal-followup-${project.id}`,
        date: project.nextFollowUp,
        kind: 'follow-up',
        title: `Follow up — ${project.name}`,
        projectName: project.name,
        detail: null,
        uncertain: false,
      });
    }

    return found;
  });

export function calendarItems(state: CalendarState): CalendarItem[] {
  const seesMoney = canSeeMoney({
    entities: state.entities,
    currentUserId: state.currentUserId,
  } satisfies RoleState);

  return [
    ...taskItems(state),
    // §3.2: a team member's calendar holds no money, so these are never built.
    ...(seesMoney ? paymentItems(state) : []),
    ...projectItems(state),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export type CalendarDay = { date: string; items: CalendarItem[] };

/** The axis, grouped by day — what the month and week views both render from. */
export function calendarDays(
  state: CalendarState,
  opts: { from: string; to: string },
): CalendarDay[] {
  const byDate = new Map<string, CalendarItem[]>();
  for (const item of calendarItems(state)) {
    if (item.date < opts.from || item.date > opts.to) continue;
    byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
  }
  return [...byDate.entries()]
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
