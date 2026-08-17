/**
 * The project-scoped money panel — spec §6.3, w08.
 *
 * "Project-scoped money timeline plus next-in / next-out in one line."
 *
 * The one line names only confirmed figures, because it carries no caveat of
 * its own: a figure read off a photograph does not get to be stated this
 * plainly. When neither side has a confirmed figure it says that, rather than
 * printing a dash and leaving the reader to guess which.
 */

import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import type { MoneyState, TimelinePayment } from '@/domain/selectors/money';
import type { EntityId } from '@/domain/types';
import { formatRelative } from '@/lib/dates';
import { hasValue, isConfirmed } from '@/lib/field';
import { formatINR } from '@/lib/money';

/** "Next in: ₹2,50,000 today · next out: ₹80,000 in 2 days" — w08's one-liner. */
export function nextInOut(payments: TimelinePayment[]): string {
  const part = (label: string, direction: 'in' | 'out'): string | null => {
    // `moneyWindow` returns the window in date order, so the first match is the
    // soonest one.
    const found = payments.find(
      (p) => p.direction === direction && isConfirmed(p.amount) && hasValue(p.due),
    );
    if (!found || !isConfirmed(found.amount) || !hasValue(found.due)) return null;
    return `${label}: ${formatINR(found.amount.value)} ${formatRelative(found.due.value)}`;
  };

  const line = [part('Next in', 'in'), part('next out', 'out')]
    .filter((s): s is string => s !== null)
    .join(' · ');

  return line === '' ? 'Nothing confirmed either way in this window.' : line;
}

export function MoneyPanel({
  projectId,
  payments,
  stateOverride,
}: {
  projectId: EntityId;
  payments: TimelinePayment[];
  stateOverride?: MoneyState;
}) {
  return (
    <section className="rounded-lg border border-line p-4">
      <h2 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
        Money on this project
      </h2>
      <MoneyTimeline projectId={projectId} compact {...(stateOverride ? { stateOverride } : {})} />
      <p className="mt-2 text-faint text-xs">{nextInOut(payments)}</p>
    </section>
  );
}
