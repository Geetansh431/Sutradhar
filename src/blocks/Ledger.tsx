/**
 * Block 04 — Ledger.
 *
 * "Running balance for one entity: planned, due, paid, outstanding. Editing:
 * mark paid (full or partial), add a line." (§8.1)
 *
 * Marking paid is a money state change, and no-AI rule #2 makes those
 * human-only without exception — so it raises a ChangeSet like every other
 * write and cannot be triggered by anything but a person clicking it.
 *
 * The outstanding total obeys rule 3: only confirmed lines count, and the total
 * states what it left out.
 */

import { FieldCell } from '@/blocks/DataGrid';
import type { EntityId } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/dates';
import { type FieldValue, hasValue, isConfirmed, type Total } from '@/lib/field';
import { formatINR, type Paise } from '@/lib/money';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

export type LedgerLine = {
  id: EntityId;
  date: FieldValue<string>;
  description: string;
  amount: FieldValue<Paise>;
  status: 'planned' | 'due' | 'paid' | 'overdue' | 'recurring';
  /** Running balance after this line. Computed by the caller's selector. */
  balance: Paise;
};

export type LedgerProps = {
  lines: LedgerLine[];
  /** Totals state their own exclusions (§5.5, P4). */
  outstanding: Total;
  /** Who or what this ledger is for. */
  subject: string;
  onPropose?: (changeSet: ChangeSet) => void;
  loading?: boolean;
  restricted?: boolean;
};

const STATUS_TONE: Record<LedgerLine['status'], string> = {
  paid: 'text-ok',
  due: 'font-medium text-brand',
  overdue: 'font-medium text-brand',
  planned: 'text-mute',
  recurring: 'text-mute',
};

/** Marking paid is human-only (no-AI rule #2), so it proposes like any write. */
const markPaidChange = (line: LedgerLine, subject: string): ChangeSet['changes'][number] | null => {
  if (!isConfirmed(line.amount)) return null;
  return {
    change: {
      op: 'settle',
      id: line.id,
      amount: line.amount.value,
      on: hasValue(line.date) ? line.date.value : '',
    },
    before: line.status,
    after: `paid · ${formatINR(line.amount.value)}`,
    label: `${subject} — ${line.description}`,
    confidence: 'high',
  };
};

function LoadingState() {
  const rows = ['a', 'b', 'c'];
  return (
    <output aria-label="Loading ledger" className="block space-y-2 py-2">
      {rows.map((row) => (
        <div key={row} className="h-6 animate-pulse rounded bg-fill-2" />
      ))}
    </output>
  );
}

export function Ledger({
  lines,
  outstanding,
  subject,
  onPropose,
  loading = false,
  restricted = false,
}: LedgerProps) {
  if (restricted) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">This ledger is admin-only.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  if (lines.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">No entries for {subject} yet.</p>
        <p className="mt-1 text-faint text-xs">
          A bill or an instalment appears here as soon as it is captured.
        </p>
      </div>
    );
  }

  return (
    <figure className="m-0">
      <figcaption className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
        Ledger · {subject}
      </figcaption>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr className="border-line border-b text-faint text-xs uppercase tracking-wide">
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Entry</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Balance</th>
              {/* Reserved so "Mark paid" is never clipped by the table's
                  auto-layout, which gives an empty header no width. */}
              {onPropose ? <th className="w-24 px-3 py-2" /> : null}
            </tr>
          </thead>

          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-line/60 border-b last:border-0">
                <td className="whitespace-nowrap px-3 py-2">
                  <FieldCell field={line.date} format={formatShortDate} />
                </td>
                <td className="px-3 py-2 text-ink">{line.description}</td>
                <td className="tabular px-3 py-2 text-right">
                  <FieldCell field={line.amount} format={formatINR} className="font-medium" />
                </td>
                <td className={cn('px-3 py-2', STATUS_TONE[line.status])}>{line.status}</td>
                <td className="tabular px-3 py-2 text-right text-mute">
                  {formatINR(line.balance)}
                </td>
                {onPropose ? (
                  <td className="w-24 whitespace-nowrap px-3 py-2 text-right">
                    {line.status !== 'paid' && isConfirmed(line.amount) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const change = markPaidChange(line, subject);
                          if (!change) return;
                          onPropose(
                            proposeChangeSet({
                              proposedBy: 'user',
                              source: null,
                              changes: [change],
                            }),
                          );
                        }}
                        className="cursor-pointer whitespace-nowrap text-brand text-xs hover:underline"
                      >
                        Mark paid
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-3 text-sm">
        <span className="text-mute">Outstanding</span>
        <span className="tabular font-medium text-ink">{formatINR(outstanding.value)}</span>
        {outstanding.caveat ? (
          <span className="text-faint text-xs">· {outstanding.caveat}</span>
        ) : null}
      </p>

      {onPropose ? (
        <p className="mt-1 text-faint text-xs">
          Marking paid is a money change — it opens a preview, and only you can confirm it.
        </p>
      ) : null}
    </figure>
  );
}

export { LoadingState as LedgerLoading };
