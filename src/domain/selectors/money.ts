/**
 * Money reads. Blocks call these; they never touch the store's tables directly.
 *
 * The coverage gap (spec §6.4) is computed here, not stored: "a shaded band
 * wherever scheduled outflow exceeds cleared-plus-scheduled inflow". It is
 * described as the single most valuable pixel in the product, and it has to be
 * derived continuously — a stored gap would go stale the moment a payment moved.
 *
 * On what counts (spec §5.5, CLAUDE.md rule 3): only `Confirmed` money is
 * summed. An extracted figure is shown on the timeline — hiding it would be
 * worse — but it is excluded from every total, and the total says so.
 */

import type { Entity, EntityId, Payment, PaymentDirection } from '@/domain/types';
import { addDays, daysFromToday, formatShortDate, TODAY } from '@/lib/dates';
import {
  type Confirmed,
  type FieldValue,
  hasValue,
  isConfirmed,
  type Total,
  totalMoney,
} from '@/lib/field';
import { addPaise, comparePaise, formatINR, type Paise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';

/**
 * Everything these selectors read. Narrower than `AppState` on purpose: a block
 * subscribing to the store can pass just this slice and re-render only when the
 * entities actually change.
 */
export type MoneyState = { entities: EntityTable };

/** A payment resolved for display: the entity's own fields plus its counterparty's name. */
export type TimelinePayment = {
  id: EntityId;
  direction: PaymentDirection;
  /** Present whenever the amount has a value at all — extracted and inferred included. */
  amount: FieldValue<Paise>;
  due: FieldValue<string>;
  status: Payment['status'];
  counterpartyName: string;
  projectName: string;
  gatedOn: EntityId | null;
  /** True when this outflow falls inside a computed gap band. */
  uncovered: boolean;
};

export type CoverageGap = {
  /** Inclusive date range of the band, `YYYY-MM-DD`. */
  from: string;
  to: string;
  /** The shortfall: scheduled outflow minus the inflow available to cover it. */
  shortfall: Paise;
  outflow: Paise;
  inflow: Paise;
  /** The payments that fall inside the band. */
  paymentIds: EntityId[];
};

export type MoneyWindow = {
  from: string;
  to: string;
  payments: TimelinePayment[];
  gaps: CoverageGap[];
  /** Totals state their own exclusions — spec §5.5, principle P4. */
  inflowTotal: Total;
  outflowTotal: Total;
};

const nameOf = (state: MoneyState, id: EntityId): string => {
  const entity: Entity | undefined = state.entities[id];
  if (!entity) return 'Unknown';
  return 'name' in entity ? entity.name : id;
};

const dueDate = (p: Payment): string | undefined => (hasValue(p.due) ? p.due.value : undefined);

export const listPayments = (state: MoneyState): Payment[] =>
  Object.values(state.entities).filter(
    (e): e is Payment => e.kind === 'payment' && e.archivedAt === null,
  );

/**
 * Payments inside a window, sorted by due date.
 *
 * `projectId` narrows to one project — the spec's "firm-wide by default,
 * filterable to one project".
 */
export function paymentsInWindow(
  state: MoneyState,
  opts: { from?: string; days?: number; projectId?: EntityId } = {},
): Payment[] {
  const from = opts.from ?? TODAY;
  const to = addDays(from, opts.days ?? 60);

  return listPayments(state)
    .filter((p) => {
      if (opts.projectId && p.projectId !== opts.projectId) return false;
      const due = dueDate(p);
      if (!due) return false;
      return due >= from && due <= to;
    })
    .sort((a, b) => (dueDate(a) ?? '').localeCompare(dueDate(b) ?? ''));
}

/**
 * An outflow is covered when it is gated to an inflow that funds it — the
 * "vacuum-prevention primitive made visible" of spec §6.4, and the thing the
 * whole product exists to prevent (ideation §2.2: "flags any outflow not
 * covered by a cleared/scheduled inflow").
 *
 * Cover is a *link*, not a balance. A firm with ₹10L arriving next month and
 * ₹1L due on Thursday is not covered on Thursday; money that has not arrived
 * cannot pay a vendor. So an ungated outflow is uncovered no matter what the
 * running total says, and the gating relationship is what clears it.
 *
 * The gate must itself be real: an inflow that is only extracted, or already
 * overdue, does not cover anything (rule 3 — only `Confirmed` counts).
 */
export function isCovered(payment: Payment, byId: Map<EntityId, Payment>): boolean {
  if (payment.direction !== 'out') return true;
  if (payment.status === 'paid') return true;

  // Recurring firm-level costs — salaries, rent — are not a vacuum. They are
  // known, they repeat, and the firm plans them as a baseline rather than
  // gating them to a particular client instalment. w09 shows the salary row
  // with an em dash under "Gated on", not "not covered".
  if (payment.status === 'recurring') return true;

  // An amount we have not confirmed is not a number we will warn on (rule 3).
  // It shows on the timeline dotted, and the gap total names it as excluded.
  if (!isConfirmed(payment.amount)) return true;

  if (!payment.gatedOn) return false;

  const gate = byId.get(payment.gatedOn);
  if (gate?.direction !== 'in') return false;
  // A gate whose own amount is unconfirmed is not cover.
  if (!isConfirmed(gate.amount)) return false;

  const gateDue = dueDate(gate);
  const outDue = dueDate(payment);
  if (!gateDue || !outDue) return false;

  // The money has to arrive before it is spent.
  return gateDue <= outDue;
}

/**
 * Contiguous runs of uncovered outflow, each labelled with its shortfall.
 *
 * A run breaks when a covered payment intervenes, so two ungated outflows a
 * month apart are two separate warnings rather than one vague band.
 *
 * Inflow does **not** offset a gap. Money arriving for one project does not pay
 * another project's vendor, and unallocated cash is exactly the assumption that
 * produces the vacuum — cover comes from the gating link or not at all. The
 * `inflow` field records what is scheduled alongside the band, for the warning
 * strip's "only ₹X of inflow is scheduled against it" sentence.
 */
export function coverageGaps(payments: Payment[]): CoverageGap[] {
  const byId = new Map(payments.map((p) => [p.id, p]));
  const dated = payments
    .filter((p) => dueDate(p) !== undefined)
    .sort((a, b) => (dueDate(a) ?? '').localeCompare(dueDate(b) ?? ''));

  const gaps: CoverageGap[] = [];
  let open: { from: string; to: string; ids: EntityId[]; out: Paise } | null = null;

  const close = () => {
    if (!open) return;
    const band = open;
    let inflow = ZERO;
    for (const p of dated) {
      const due = dueDate(p);
      if (!due || p.direction !== 'in' || !isConfirmed(p.amount)) continue;
      if (due >= band.from && due <= band.to) inflow = addPaise(inflow, p.amount.value);
    }
    gaps.push({
      from: band.from,
      to: band.to,
      shortfall: band.out,
      outflow: band.out,
      inflow,
      paymentIds: band.ids,
    });
    open = null;
  };

  for (const p of dated) {
    const due = dueDate(p);
    if (!due) continue;
    if (p.direction !== 'out') continue;

    if (isCovered(p, byId)) {
      close();
      continue;
    }
    if (!open) open = { from: due, to: due, ids: [], out: ZERO };
    open.to = due;
    open.ids.push(p.id);
    if (isConfirmed(p.amount)) open.out = addPaise(open.out, p.amount.value);
  }
  close();

  return gaps;
}

/** Everything the money timeline needs for one window. */
export function moneyWindow(
  state: MoneyState,
  opts: { from?: string; days?: number; projectId?: EntityId } = {},
): MoneyWindow {
  const from = opts.from ?? TODAY;
  const to = addDays(from, opts.days ?? 60);
  const payments = paymentsInWindow(state, opts);
  const gaps = coverageGaps(payments);
  const uncovered = new Set(gaps.flatMap((g) => g.paymentIds));

  const resolved: TimelinePayment[] = payments.map((p) => ({
    id: p.id,
    direction: p.direction,
    amount: p.amount,
    due: p.due,
    status: p.status,
    // A firm-level cost has no counterparty entity, so it carries its own
    // label — "Team salaries" on w09 — and reads as "firm-level".
    counterpartyName: p.counterpartyId ? nameOf(state, p.counterpartyId) : (p.label ?? 'Firm'),
    projectName: p.projectId ? nameOf(state, p.projectId) : 'firm-level',
    gatedOn: p.gatedOn,
    uncovered: p.direction === 'out' && uncovered.has(p.id),
  }));

  const amounts = (direction: PaymentDirection): FieldValue<Paise>[] =>
    payments.filter((p) => p.direction === direction).map((p) => p.amount);

  return {
    from,
    to,
    payments: resolved,
    gaps,
    inflowTotal: totalMoney(amounts('in')),
    outflowTotal: totalMoney(amounts('out')),
  };
}

/** The largest amount in a set — the scale every bar is drawn against. */
export function peakAmount(payments: TimelinePayment[]): Paise {
  let peak = ZERO;
  for (const p of payments) {
    if (!hasValue(p.amount)) continue;
    if (comparePaise(p.amount.value, peak) > 0) peak = p.amount.value;
  }
  return peak;
}

/** Confirmed amounts only, for anything that must not include an unconfirmed figure. */
export const confirmedAmounts = (payments: TimelinePayment[]): Confirmed<Paise>[] =>
  payments.map((p) => p.amount).filter(isConfirmed);

/** "in 2 days", for the warning strip and tooltips. */
export const daysUntil = (iso: string): number => daysFromToday(iso);

/**
 * The warning strip's sentence (spec §6.4): "one sentence stating the gap in
 * plain language". w09 words it as a shortfall over a date range, and the
 * product's tone rule is to state consequence rather than status — so this
 * names what is not covered, not merely that a gap exists.
 */
export function gapSentence(gap: CoverageGap): string {
  const span =
    gap.from === gap.to
      ? formatShortDate(gap.from)
      : `${formatShortDate(gap.from)} – ${formatShortDate(gap.to)}`;
  const scheduled =
    comparePaise(gap.inflow, ZERO) > 0
      ? `Only ${formatINR(gap.inflow)} of inflow is scheduled against it.`
      : 'No inflow is scheduled against it.';
  return `${formatINR(gap.outflow)} due to vendors, ${span}. ${scheduled}`;
}
