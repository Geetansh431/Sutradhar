/**
 * Home's reads — spec §6.1.
 *
 * The pulse figures and the action queue are derived here, never stored. The
 * brief is written rather than generated (spec §9.5 lists it as "pre-computed
 * or stubbed"), but its *figures* still come from the store, so a fixture
 * change moves the sentence rather than making it a lie.
 */

import { moneyWindow } from '@/domain/selectors/money';
import type { Entity, EntityId, EntityKind, Payment } from '@/domain/types';
import { daysFromToday, isWithinDays, TODAY } from '@/lib/dates';
import { type Confirmed, isConfirmed } from '@/lib/field';
import { addPaise, formatINR, type Paise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';

export type HomeState = { entities: EntityTable };

/** The six item types of §6.1, in the order the spec lists them. */
export type QueueKind = 'CONFIRM' | 'DECIDE' | 'SEND' | 'ANSWER' | 'APPROVE' | 'REVIEW';

export type QueueItem = {
  id: string;
  kind: QueueKind;
  /** The bold line — what needs doing. */
  title: string;
  /** The muted line above it — the figure, the age, the source. */
  detail: string;
  /** The one-tap primary action. */
  action: string;
  /**
   * Sorted by consequence, not by date (§6.1). Higher runs first: money that
   * has no cover outranks a leave request, whatever their dates.
   */
  consequence: number;
  entityId: EntityId | null;
};

/** Live entities of one kind. Archived rows never reach a queue or a total. */
const list = <K extends EntityKind>(state: HomeState, kind: K): Extract<Entity, { kind: K }>[] =>
  Object.values(state.entities).filter(
    (e): e is Extract<Entity, { kind: K }> => e.kind === kind && e.archivedAt === null,
  );

const confirmedAmounts = (payments: Payment[]): Confirmed<Paise>[] =>
  payments.map((p) => p.amount).filter(isConfirmed);

const sum = (amounts: Confirmed<Paise>[]): Paise =>
  amounts.reduce((total, a) => addPaise(total, a.value), ZERO);

/** Four figures maximum, numbers only — no sparklines, no deltas (§6.1). */
export type Pulse = {
  collectibleThisWeek: Paise;
  payableIn14Days: Paise;
  coverageGapsAhead: number;
  liveSites: number;
};

export function pulse(state: HomeState): Pulse {
  const payments = list(state, 'payment');
  const dueWithin = (days: number, direction: Payment['direction']) =>
    payments.filter((p) => {
      if (p.direction !== direction) return false;
      const due = isConfirmed(p.due) ? p.due.value : undefined;
      return due !== undefined && isWithinDays(due, days);
    });

  return {
    collectibleThisWeek: sum(confirmedAmounts(dueWithin(7, 'in'))),
    payableIn14Days: sum(confirmedAmounts(dueWithin(14, 'out'))),
    coverageGapsAhead: moneyWindow(state).gaps.length,
    liveSites: list(state, 'project').filter((p) => p.status === 'live').length,
  };
}

export type QueueOptions = {
  /** Scope to one team member's own work. Omit for the admin's full queue. */
  forPersonId?: EntityId;
};

/**
 * Everything that needs a human, in one list. Built from the store rather than
 * authored, so confirming a figure or pricing a change order really does empty
 * a row — "empty this = your day is done" has to be true.
 */
export function actionQueue(state: HomeState, opts: QueueOptions = {}): QueueItem[] {
  // A team member's queue holds only their items, and never a money figure
  // (§3.2). Filtered here rather than hidden in the view.
  if (opts.forPersonId) return teamQueue(state, opts.forPersonId);

  return [
    ...confirmItems(state),
    ...decideItems(state),
    ...sendItems(state),
    ...reviewItems(state),
    ...answerItems(state),
  ].sort((a, b) => b.consequence - a.consequence);
}

/** CONFIRM — extracted money, which never counts until a human says yes (§5.5). */
function confirmItems(state: HomeState): QueueItem[] {
  const extracted = list(state, 'payment').filter((p) => p.amount.state === 'extracted');
  if (extracted.length === 0) return [];

  const total = extracted.reduce(
    (acc, p) => (p.amount.state === 'extracted' ? addPaise(acc, p.amount.value) : acc),
    ZERO,
  );

  return [
    {
      id: 'queue-confirm-extracted',
      kind: 'CONFIRM',
      title:
        extracted.length === 1
          ? '1 payment extracted from a bill needs a yes'
          : `${extracted.length} payments extracted from bills need a yes`,
      detail: `${formatINR(total)} · source: ${extracted.length} ${extracted.length === 1 ? 'photo' : 'photos'}`,
      action: 'Review',
      consequence: 80,
      entityId: extracted[0]?.id ?? null,
    },
  ];
}

/** DECIDE — anything unpriced or unapproved. The margin leak made visible. */
function decideItems(state: HomeState): QueueItem[] {
  return list(state, 'task')
    .filter((task) => task.status === 'needs-decision')
    .map((task) => ({
      id: `queue-decide-${task.id}`,
      kind: 'DECIDE' as const,
      title: task.title,
      detail: 'unpriced · silent margin at risk',
      action: 'Price it',
      consequence: 90,
      entityId: task.id,
    }));
}

/** SEND — a reminder for money due today. Drafted, never sent (no-AI rule #3). */
function sendItems(state: HomeState): QueueItem[] {
  return list(state, 'payment')
    .filter((payment) => {
      const due = isConfirmed(payment.due) ? payment.due.value : undefined;
      return payment.direction === 'in' && due !== undefined && daysFromToday(due) === 0;
    })
    .map((payment) => ({
      id: `queue-send-${payment.id}`,
      kind: 'SEND' as const,
      title: `Instalment reminder — ${projectName(state, payment)}`,
      detail: `${isConfirmed(payment.amount) ? formatINR(payment.amount.value) : ''} · due today`,
      action: 'Send',
      consequence: 95,
      entityId: payment.id,
    }));
}

/** REVIEW — work that has slipped, and what it blocks downstream. */
function reviewItems(state: HomeState): QueueItem[] {
  const slipping = list(state, 'task').filter((task) => task.status === 'slipping');
  if (slipping.length === 0) return [];

  return [
    {
      id: 'queue-review-slippage',
      kind: 'REVIEW',
      title: `${slipping.length} ${slipping.length === 1 ? 'task has' : 'tasks have'} slipped — reschedule the chain?`,
      detail: `${slipping.length} dependent ${slipping.length === 1 ? 'task' : 'tasks'}`,
      action: 'Open',
      consequence: 60,
      entityId: slipping[0]?.id ?? null,
    },
  ];
}

/** ANSWER — the interview, which never finishes (§5.2). */
function answerItems(state: HomeState): QueueItem[] {
  const gaps = countGaps(state);
  if (gaps === 0) return [];

  return [
    {
      id: 'queue-answer-gaps',
      kind: 'ANSWER',
      title: `Sutradhar needs ${gaps} ${gaps === 1 ? 'fact' : 'facts'} to finish vendor ledgers`,
      detail: 'only you can answer these',
      action: 'Answer',
      consequence: 40,
      entityId: null,
    },
  ];
}

/**
 * A team member sees their own work and nothing about money (§3.2). Built as a
 * separate list rather than a filter over the admin's, so a money item cannot
 * reach it by accident.
 */
function teamQueue(state: HomeState, personId: EntityId): QueueItem[] {
  return list(state, 'task')
    .filter((task) => task.assigneeId === personId && task.status !== 'done')
    .map((task) => ({
      id: `queue-task-${task.id}`,
      kind: task.status === 'slipping' ? ('REVIEW' as const) : ('DECIDE' as const),
      title: task.title,
      detail: task.status === 'slipping' ? 'behind schedule' : 'assigned to you',
      action: task.status === 'slipping' ? 'Open' : 'Update',
      consequence: task.status === 'slipping' ? 70 : 50,
      entityId: task.id,
    }))
    .sort((a, b) => b.consequence - a.consequence);
}

/** Fields known to be absent, which is what an ANSWER item offers to fill. */
function countGaps(state: HomeState): number {
  let count = 0;
  for (const entity of Object.values(state.entities)) {
    for (const value of Object.values(entity)) {
      if (value && typeof value === 'object' && 'state' in value && value.state === 'missing') {
        count += 1;
      }
    }
  }
  return count;
}

/** Today only — deadlines, site visits and due payments (§6.1). */
export type TodayItem = { id: string; when: string; what: string };

export function today(state: HomeState): TodayItem[] {
  const items: TodayItem[] = [];

  for (const payment of list(state, 'payment')) {
    const due = isConfirmed(payment.due) ? payment.due.value : undefined;
    if (due !== TODAY) continue;
    items.push({ id: payment.id, when: 'Due', what: labelOf(state, payment) });
  }

  for (const task of list(state, 'task')) {
    const deadline = task.deadline && isConfirmed(task.deadline) ? task.deadline.value : undefined;
    if (deadline !== TODAY) continue;
    items.push({ id: task.id, when: 'Due', what: task.title });
  }

  return items;
}

/** The counterparty's plain name — "Sharma Electricals", not a ledger label. */
const counterpartyName = (state: HomeState, payment: Payment): string => {
  const entity = payment.counterpartyId ? state.entities[payment.counterpartyId] : undefined;
  return entity && 'name' in entity ? entity.name : (payment.label ?? 'the firm');
};

/** A project's name, never its id — an id in the UI is a bug. */
const projectName = (state: HomeState, payment: Payment): string => {
  const project = payment.projectId ? state.entities[payment.projectId] : undefined;
  return project && 'name' in project ? project.name : 'the firm';
};

const labelOf = (state: HomeState, payment: Payment): string => {
  if (payment.label) return payment.label;
  const counterparty = payment.counterpartyId ? state.entities[payment.counterpartyId] : undefined;
  const name = counterparty && 'name' in counterparty ? counterparty.name : 'payment';
  return `${name} instalment`;
};

/**
 * The morning brief — spec §6.1, and §9.5 lists it as written rather than
 * generated live. So the sentences are authored, but every figure in them is
 * read from the store: the brief can go out of date, it cannot become untrue.
 *
 * The tone rule is consequence, not status (CLAUDE.md): "the instalment due
 * today is what covers Thursday's vendor payment", never "payment due today".
 */
export type Brief = {
  /** Two to four sentences, as prose. Never bullets, never a chat message. */
  sentences: string[];
  /** Rendered as "generated 07:40 · not a chat". */
  generatedAt: string;
  /** Shown when coverage is low — the brief says what it cannot see (§6.1). */
  caveat: string | null;
};

export type BriefOptions = {
  /** Scope to one team member's sites, with no money in it (§3.2, §6.1). */
  forPersonId?: EntityId;
};

export function brief(state: HomeState, coverage: number, opts: BriefOptions = {}): Brief {
  if (opts.forPersonId) return teamBrief(state, opts.forPersonId);

  const sentences: string[] = [];
  const gaps = moneyWindow(state).gaps;
  const queue = actionQueue(state);

  const dueToday = list(state, 'payment').find((p) => {
    const due = isConfirmed(p.due) ? p.due.value : undefined;
    return p.direction === 'in' && due === TODAY;
  });

  // The gating relationship is the thing worth saying first — it is the whole
  // premise of the product (ideation §2.2, the payment vacuum).
  const gated = list(state, 'payment').find(
    (p) => p.gatedOn !== null && p.gatedOn === dueToday?.id,
  );

  if (dueToday && gated && isConfirmed(dueToday.amount) && isConfirmed(gated.amount)) {
    sentences.push(
      `${queue.length === 2 ? 'Two things' : `${queue.length} things`} need you today. ` +
        `The ${projectName(state, dueToday)} instalment (${formatINR(dueToday.amount.value)}) is due ` +
        `and covers ${formatINR(gated.amount.value)} to ${counterpartyName(state, gated)} — ` +
        'if it slips, that payment has no cover.',
    );
  }

  const slipping = list(state, 'task').filter((t) => t.status === 'slipping');
  const slippedProject = slipping[0] ? projectOfTask(state, slipping[0]) : undefined;
  if (slippedProject) {
    sentences.push(
      `${slippedProject} is behind on ${slipping.length === 1 ? 'a task' : 'several tasks'}.`,
    );
  }

  if (gaps.length > 0 && gaps[0]) {
    sentences.push(`A coverage gap of ${formatINR(gaps[0].shortfall)} opens later this month.`);
  }

  return {
    sentences,
    generatedAt: '07:40',
    caveat: coverage < 0.5 ? 'I can only see the client side of the money so far.' : null,
  };
}

/**
 * A team member's brief: their sites and their work, and not one rupee. The
 * money line is a per-figure cut (§3.2), and a brief that mentioned the firm's
 * exposure would breach it in prose — which §9.2 rule #6 calls out specifically,
 * because the visual treatment is unavailable inside a sentence.
 */
function teamBrief(state: HomeState, personId: EntityId): Brief {
  const theirs = list(state, 'task').filter(
    (task) => task.assigneeId === personId && task.status !== 'done',
  );
  const slipping = theirs.filter((task) => task.status === 'slipping');
  const sites = [...new Set(theirs.map((task) => projectOfTask(state, task)).filter(Boolean))];

  const sentences: string[] = [];
  if (theirs.length === 0) {
    sentences.push('Nothing is assigned to you today.');
  } else {
    sentences.push(
      `You have ${theirs.length} ${theirs.length === 1 ? 'item' : 'items'} on ` +
        `${sites.length === 1 ? sites[0] : `${sites.length} sites`}.`,
    );
  }
  if (slipping.length > 0 && slipping[0]) {
    sentences.push(`${slipping[0].title} is behind — that is the one worth starting with.`);
  }

  return { sentences, generatedAt: '07:40', caveat: null };
}

const projectOfTask = (state: HomeState, task: { projectId: EntityId }): string | undefined => {
  const project = state.entities[task.projectId];
  return project && 'name' in project ? project.name : undefined;
};
