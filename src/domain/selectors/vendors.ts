/**
 * Vendor exposure — the demo's 2:30 question, "which vendors are we most
 * exposed to right now?"
 *
 * Exposure is what the firm has committed and not yet paid. w11 totals it at
 * ₹6,42,000 across three vendors, and names the gating relationship, because
 * a payment that is gated on an instalment due today is a different kind of
 * exposure from one with nothing behind it.
 */

import { isCovered, type MoneyState } from '@/domain/selectors/money';
import type { EntityId, Payment, Vendor } from '@/domain/types';
import { type FieldValue, hasValue, isConfirmed, type Total, totalMoney } from '@/lib/field';
import { addPaise, comparePaise, type Paise, ratioPaise, ZERO } from '@/lib/money';

export type VendorExposure = {
  id: EntityId;
  name: string;
  /** Committed and unpaid. Unconfirmed amounts are included but flagged. */
  open: Paise;
  /** True when any part of `open` rests on an unconfirmed figure (§5.5). */
  openUnconfirmed: boolean;
  /** How much of the open amount is gated on an inflow that funds it. */
  gated: Paise;
  /** The vendor's terms, or the gap where they should be. */
  terms: FieldValue<string>;
  /** Share of the firm's total exposure, 0..1 — what the chart plots. */
  share: number;
};

export type ExposureView = {
  vendors: VendorExposure[];
  /** Totals state their exclusions (§5.5, P4). */
  total: Total;
  projectCount: number;
};

const unpaid = (payment: Payment): boolean =>
  payment.direction === 'out' && payment.status !== 'paid' && payment.archivedAt === null;

/**
 * Every vendor with money outstanding, largest first.
 *
 * Unconfirmed amounts are *shown* — hiding Kumar's photographed bill would
 * understate the exposure, which is worse than showing it dotted — but the
 * total excludes them and says so.
 */
/** One vendor's outstanding position, from their unpaid payments. */
function exposureOf(
  vendor: Vendor,
  theirs: Payment[],
  byId: Map<EntityId, Payment>,
  projects: Set<EntityId>,
): VendorExposure {
  let open = ZERO;
  let gated = ZERO;
  let unconfirmed = false;

  for (const payment of theirs) {
    if (!hasValue(payment.amount)) continue;
    open = addPaise(open, payment.amount.value);
    if (!isConfirmed(payment.amount)) unconfirmed = true;
    if (payment.gatedOn && isCovered(payment, byId)) {
      gated = addPaise(gated, payment.amount.value);
    }
    if (payment.projectId) projects.add(payment.projectId);
  }

  return {
    id: vendor.id,
    name: vendor.name,
    open,
    openUnconfirmed: unconfirmed,
    gated,
    terms: vendor.paymentTerms ?? { state: 'missing', blocks: ['vendor ledger'] },
    share: 0,
  };
}

/**
 * Every vendor with money outstanding, largest first.
 *
 * Unconfirmed amounts are *shown* — hiding Kumar's photographed bill would
 * understate the exposure, which is worse than showing it dotted — but the
 * total excludes them and says so.
 */
export function vendorExposure(state: MoneyState): ExposureView {
  const entities = Object.values(state.entities);
  const allPayments = entities.filter((e): e is Payment => e.kind === 'payment');
  const payments = allPayments.filter(unpaid);
  const byId = new Map(allPayments.map((p) => [p.id, p]));
  const vendors = entities.filter((e): e is Vendor => e.kind === 'vendor' && e.archivedAt === null);

  const projects = new Set<EntityId>();
  const rows = vendors
    .map((vendor) => ({
      vendor,
      theirs: payments.filter((p) => p.counterpartyId === vendor.id),
    }))
    .filter(({ theirs }) => theirs.length > 0)
    .map(({ vendor, theirs }) => exposureOf(vendor, theirs, byId, projects));

  rows.sort((a, b) => comparePaise(b.open, a.open));

  const grandTotal = rows.reduce((acc, row) => addPaise(acc, row.open), ZERO);
  for (const row of rows) {
    row.share = ratioPaise(row.open, grandTotal);
  }

  // The total counts only confirmed money, and names what it left out.
  const amounts: FieldValue<Paise>[] = payments
    .filter((p) => vendors.some((v) => v.id === p.counterpartyId))
    .map((p) => p.amount);

  return { vendors: rows, total: totalMoney(amounts), projectCount: projects.size };
}

/** The chart's rows — name and share, nothing else. */
export const exposureShares = (view: ExposureView): { label: string; value: number }[] =>
  view.vendors.map((vendor) => ({ label: vendor.name, value: vendor.share }));
