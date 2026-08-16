/**
 * The payment grid's columns, exactly as w09_money.png draws them:
 * due · entity · project · direction · amount · status · gated on.
 *
 * This is configuration, not a block. It lives beside the grid so Money, the
 * Canvas, and the project workspace all render payments identically — the
 * spec's "gated on is the vacuum-prevention primitive made visible" only works
 * if that column looks the same everywhere it appears.
 */

import { FieldCell, type GridColumn } from '@/blocks/DataGrid';
import type { TimelinePayment } from '@/domain/selectors/money';
import type { EntityId } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatShortDate, isToday } from '@/lib/dates';
import { hasValue } from '@/lib/field';
import { formatINR, rupees } from '@/lib/money';
import type { Change } from '@/store/change';

/** Status wording and treatment, per w09. */
const statusLabel = (payment: TimelinePayment): string => {
  const due = hasValue(payment.due) ? payment.due.value : undefined;
  if (payment.status === 'due' && due && isToday(due)) return 'due today';
  return payment.status;
};

const statusTone = (payment: TimelinePayment): string =>
  payment.status === 'due' || payment.status === 'overdue' ? 'font-medium text-brand' : 'text-mute';

export type PaymentColumnOptions = {
  /** Resolves a gating payment's id to the label shown in "Gated on". */
  gateLabel?: (id: EntityId) => string;
  /** Omit the project column when the grid is already scoped to one. */
  includeProject?: boolean;
};

export function paymentColumns({
  gateLabel,
  includeProject = true,
}: PaymentColumnOptions = {}): GridColumn<TimelinePayment>[] {
  const columns: GridColumn<TimelinePayment>[] = [
    {
      id: 'due',
      header: 'Due',
      sortValue: (p) => (hasValue(p.due) ? p.due.value : ''),
      cell: (p) => (
        <FieldCell
          field={p.due}
          format={formatShortDate}
          className={cn(
            'whitespace-nowrap',
            hasValue(p.due) && isToday(p.due.value) ? 'font-medium text-brand' : '',
          )}
        />
      ),
      csv: (p) => (hasValue(p.due) ? p.due.value : ''),
    },
    {
      id: 'entity',
      header: 'Entity',
      sortValue: (p) => p.counterpartyName,
      cell: (p) => p.counterpartyName,
      csv: (p) => p.counterpartyName,
    },
  ];

  if (includeProject) {
    columns.push({
      id: 'project',
      header: 'Project',
      sortValue: (p) => p.projectName,
      cell: (p) => p.projectName,
      csv: (p) => p.projectName,
    });
  }

  columns.push(
    {
      id: 'direction',
      header: 'Direction',
      sortValue: (p) => p.direction,
      cell: (p) => (
        <span className={p.direction === 'in' ? 'text-ok' : 'text-mute'}>{p.direction}</span>
      ),
      csv: (p) => p.direction,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      tabular: true,
      sortValue: (p) => (hasValue(p.amount) ? p.amount.value : 0),
      cell: (p) => <FieldCell field={p.amount} format={formatINR} className="font-medium" />,
      csv: (p) => (hasValue(p.amount) ? String(p.amount.value / 100) : ''),
      editable: {
        read: (p) => (hasValue(p.amount) ? String(p.amount.value / 100) : ''),
        toChange: (p, next) => {
          const cleaned = next.replace(/[^0-9.-]/g, '');
          // `Number('')` is 0, so an empty or junk entry would otherwise
          // propose setting the amount to zero. A wrong number is worse than
          // no change at all — refuse it instead.
          if (cleaned === '') return null;
          const typed = Number(cleaned);
          if (!Number.isFinite(typed) || typed < 0) return null;

          const change: Change = {
            op: 'update',
            id: p.id,
            // Typed in rupees; `rupees()` converts at the edge so no float
            // arithmetic happens on money (rule 2).
            patch: { amount: rupees(typed) },
          };

          return {
            change,
            before: hasValue(p.amount) ? formatINR(p.amount.value) : null,
            after: formatINR(rupees(typed)),
            label: `${p.counterpartyName} amount`,
            confidence: 'high',
          };
        },
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (p) => p.status,
      cell: (p) => <span className={statusTone(p)}>{statusLabel(p)}</span>,
      csv: (p) => statusLabel(p),
    },
    {
      id: 'gatedOn',
      header: 'Gated on',
      sortValue: (p) => p.gatedOn ?? '',
      cell: (p) => {
        if (p.gatedOn) {
          return <span className="text-ink">{gateLabel?.(p.gatedOn) ?? p.gatedOn}</span>;
        }
        // Only an *uncovered* outflow says "not covered". An inflow, a paid
        // item or a recurring cost simply has nothing to gate on.
        if (p.uncovered) return <span className="font-medium text-brand">not covered</span>;
        return <span className="text-faint">—</span>;
      },
      csv: (p) =>
        p.gatedOn ? (gateLabel?.(p.gatedOn) ?? p.gatedOn) : p.uncovered ? 'not covered' : '',
    },
  );

  return columns;
}

/** Highlight set for the grid — the payments inside a coverage gap. */
export const uncoveredIds = (payments: TimelinePayment[]): ReadonlySet<EntityId> =>
  new Set(payments.filter((p) => p.uncovered).map((p) => p.id));

export { statusLabel, statusTone };
