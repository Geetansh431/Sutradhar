/**
 * The fact row — spec §6.3, w08.
 *
 * "Client, value, received, spent, margin now, handover date. Margin is live
 * and admin-only."
 *
 * The money cells are absent for Team rather than blanked, because the selector
 * never computed them (§3.2). Every total carries its own caveat, and a margin
 * resting on an unconfirmed figure says so instead of reading as fact.
 */

import { FieldCell } from '@/blocks/DataGrid';
import type { Workspace } from '@/domain/selectors/workspace';
import { formatShortDate } from '@/lib/dates';
import type { Total } from '@/lib/field';
import { formatINR } from '@/lib/money';

function Fact({
  label,
  children,
  caveat,
}: {
  label: string;
  children: React.ReactNode;
  caveat?: string | null;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2">
      <dt className="text-faint text-xs">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-base text-ink">{children}</dd>
      {caveat ? <p className="mt-0.5 truncate text-faint text-xs">{caveat}</p> : null}
    </div>
  );
}

const totalCell = (total: Total) => <span className="tabular">{formatINR(total.value)}</span>;

export function FactRow({ view }: { view: Workspace }) {
  const { money } = view;

  return (
    <dl className="flex flex-wrap gap-2">
      <Fact label="Client">{view.clientName}</Fact>

      {money ? (
        <>
          <Fact label="Value">
            <FieldCell field={money.value} format={formatINR} className="tabular" />
          </Fact>
          <Fact label="Received" caveat={money.received.caveat}>
            {totalCell(money.received)}
          </Fact>
          <Fact label="Spent" caveat={money.spent.caveat}>
            {totalCell(money.spent)}
          </Fact>
          <Fact label="Committed" caveat={money.committed.caveat}>
            {totalCell(money.committed)}
          </Fact>
          <Fact
            label="Margin now"
            caveat={money.restsOnUnconfirmed ? 'rests on an unconfirmed figure' : null}
          >
            <span className="tabular">
              {money.marginPct === null ? '—' : `${(money.marginPct * 100).toFixed(1)}%`}
            </span>
          </Fact>
        </>
      ) : null}

      <Fact label="Handover">
        {view.handoverDate ? (
          <FieldCell field={view.handoverDate} format={formatShortDate} />
        ) : (
          <span className="fv-missing">— add</span>
        )}
      </Fact>
    </dl>
  );
}
