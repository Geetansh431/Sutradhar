/**
 * The proposals a screen's actions raise.
 *
 * Spec §6.4: the warning strip's two actions "both open a change preview —
 * neither writes directly". Building the ChangeSet is data shaping, so it lives
 * here rather than in a screen: the screen decides *when* to propose, this
 * decides *what* is proposed.
 *
 * Nothing here writes. Everything returns an unconfirmed set.
 */

import type { CoverageGap, TimelinePayment } from '@/domain/selectors/money';
import { formatShortDate } from '@/lib/dates';
import { hasValue } from '@/lib/field';
import { formatINR } from '@/lib/money';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

/**
 * "Chase the inflow" — drafts a reminder for the client instalment that would
 * cover the gap. No-AI rule #3: nothing leaves the firm without a human
 * pressing send on the exact text, so this proposes a draft, not a send.
 */
export function chaseInflow(gap: CoverageGap, payments: TimelinePayment[]): ChangeSet {
  const uncovered = payments.filter((p) => gap.paymentIds.includes(p.id));
  const first = uncovered[0];

  return proposeChangeSet({
    proposedBy: 'user',
    source: null,
    changes: [
      {
        change: { op: 'update', id: first?.id ?? '', patch: { chaseDrafted: true } },
        before: `${formatINR(gap.shortfall)} uncovered`,
        after: 'reminder drafted — you read it and send it',
        label: first ? `Chase cover for ${first.counterpartyName}` : 'Chase the inflow',
        confidence: 'high',
      },
    ],
  });
}

/**
 * "Re-gate the outflow" — links the uncovered payment to an inflow that lands
 * before it. Marked low-confidence: which instalment should fund which vendor
 * is a judgement the admin makes, not one to assert.
 */
export function regateOutflow(gap: CoverageGap, payments: TimelinePayment[]): ChangeSet | null {
  const uncovered = payments.find((p) => gap.paymentIds.includes(p.id));
  if (!uncovered) return null;

  const dueOf = (p: TimelinePayment) => (hasValue(p.due) ? p.due.value : '');
  // The soonest confirmed inflow that is not already committed elsewhere.
  const candidate = payments
    .filter((p) => p.direction === 'in' && p.amount.state === 'confirmed')
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)))
    .find((p) => dueOf(p) >= dueOf(uncovered));

  if (!candidate) return null;

  return proposeChangeSet({
    proposedBy: 'user',
    source: null,
    changes: [
      {
        change: {
          op: 'link',
          from: uncovered.id,
          to: candidate.id,
          relation: 'gated-on',
        },
        before: 'not covered',
        after: `gated on ${candidate.counterpartyName} · ${formatShortDate(dueOf(candidate))}`,
        label: `Re-gate ${uncovered.counterpartyName}`,
        confidence: 'low',
      },
    ],
  });
}
