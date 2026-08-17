/**
 * Block 06 — Report block.
 *
 * "Fixed templates only: project P&L, vendor exposure, ageing, salary sheet.
 * Editing: parameters only (period, project, entity)." (§8.1)
 *
 * The constraint is the feature. This block cannot be pointed at arbitrary
 * data — the template decides what it computes, and the only thing a reader
 * can change is which period or entity it runs over. That is what keeps it a
 * document rather than a query builder competing with the Canvas (§4.2).
 *
 * A report is where a quietly-included unconfirmed figure would do the most
 * damage, because a report *looks* settled. So the total states its exclusions
 * in the same breath as the number, not in a footnote.
 */

import type { ReportTemplate, Report as ReportView } from '@/domain/selectors/report';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/money';

export type ReportProps = {
  report: ReportView | null;
  /** Offered as parameter controls. Omitted makes the block read-only (§8.1). */
  onChangeTemplate?: (template: ReportTemplate) => void;
  templates?: readonly { id: ReportTemplate; label: string }[];
  loading?: boolean;
  restricted?: boolean;
};

function LoadingState() {
  const rows = ['a', 'b', 'c', 'd'];
  return (
    <output aria-label="Loading report" className="block space-y-2 py-2">
      <div className="h-4 w-40 animate-pulse rounded bg-fill-2" />
      {rows.map((row) => (
        <div key={row} className="h-5 animate-pulse rounded bg-fill-2" />
      ))}
    </output>
  );
}

export function Report({
  report,
  onChangeTemplate,
  templates,
  loading = false,
  restricted = false,
}: ReportProps) {
  if (restricted || report === null) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">These reports are admin-only.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  return (
    <figure className="m-0">
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium text-ink text-xs uppercase tracking-wide">{report.title}</span>
        <span className="text-faint text-xs">{report.subtitle}</span>
      </figcaption>

      {report.rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-mute text-sm">Nothing falls in this period.</p>
      ) : (
        <table className="w-full border-collapse text-[0.8125rem]">
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.id} className="border-line/60 border-b last:border-0">
                <td className="py-1.5 pr-3">
                  <span className={cn('text-ink', row.emphasis && 'font-medium text-brand')}>
                    {row.label}
                  </span>
                  {row.detail ? (
                    <span className="block text-faint text-xs">{row.detail}</span>
                  ) : null}
                </td>
                <td
                  className={cn(
                    'tabular whitespace-nowrap py-1.5 text-right',
                    row.emphasis ? 'font-medium text-brand' : 'text-ink',
                  )}
                >
                  {row.value ?? <span className="fv-missing">— add</span>}
                </td>
              </tr>
            ))}
          </tbody>

          {report.total ? (
            <tfoot>
              <tr className="border-line border-t-2">
                <td className="py-2 pr-3 font-medium text-ink">Total</td>
                <td className="tabular whitespace-nowrap py-2 text-right font-medium text-ink">
                  {formatINR(report.total.value)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      )}

      {/* The total's exclusions sit with the total, never as a footnote (§5.5). */}
      {report.total?.caveat ? (
        <p className="mt-1 text-faint text-xs">{report.total.caveat}</p>
      ) : null}

      {report.caveats.map((caveat) => (
        <p key={caveat} className="mt-1 text-faint text-xs">
          {caveat}
        </p>
      ))}

      {/* Parameters only — there is no way to change what a template computes. */}
      {onChangeTemplate && templates ? (
        <div className="mt-3 flex flex-wrap gap-1 border-line/60 border-t pt-2">
          {templates.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChangeTemplate(option.id)}
              className={
                report.template === option.id
                  ? 'cursor-pointer rounded-full border border-brand bg-brand-soft px-3 py-1 font-medium text-brand text-xs'
                  : 'cursor-pointer rounded-full border border-line px-3 py-1 text-mute text-xs hover:border-line-strong'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

export { LoadingState as ReportLoading };
