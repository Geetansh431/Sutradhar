/**
 * Block 07 — Chart block.
 *
 * "Bar, horizontal bar, timeline, stacked bar. Nothing else." (§8.1) The type
 * set is closed, so it is a union rather than a string: an invented encoding
 * cannot be passed in. §7.4 repeats the rule — "no pies, no scatter, no
 * invented visual encodings".
 *
 * Editing: none. "Click-through to the underlying grid" is the only
 * interaction, so the block takes `onDrillDown` and nothing else.
 *
 * Not built on recharts, though SETUP.md budgets it here. w11's chart is
 * labelled horizontal bars with a percentage — no axes, no ticks, no legend.
 * A charting library would add its own spacing and motion opinions to
 * something that is four divs, and the tokens would end up fighting it.
 * Revisit if a timeline or stacked bar needs real axis work.
 */

import { cn } from '@/lib/cn';
import { type FieldValue, hasValue } from '@/lib/field';
import { formatShortINR, type Paise } from '@/lib/money';

/** The closed type set of §8.1. */
export type ChartType = 'bar' | 'hbar' | 'timeline' | 'stacked';

export type ChartDatum = {
  label: string;
  /** 0..1 for a share, or an absolute figure the block scales itself. */
  value: number;
  /** Shown at the end of the bar. Money must arrive pre-formatted. */
  display?: string;
  /** Draws the bar in `--chart-1` — the one worth noticing (§8.1). */
  emphasis?: boolean;
  /** Carries the field state so an unconfirmed figure stays dotted here too. */
  field?: FieldValue<Paise>;
};

export type ChartProps = {
  type: ChartType;
  data: ChartDatum[];
  /** "Click-through to the underlying grid" (§8.1) — the only interaction. */
  onDrillDown?: (label: string) => void;
  /** Values are shares of a whole, so the axis runs 0..100%. */
  asShare?: boolean;
  caption?: string;
  restricted?: boolean;
};

const fieldStateClass = (field: FieldValue<Paise> | undefined): string => {
  if (!field) return '';
  return field.state === 'extracted'
    ? 'fv-extracted'
    : field.state === 'inferred'
      ? 'fv-inferred'
      : field.state === 'conflicting'
        ? 'fv-conflicting'
        : field.state === 'missing'
          ? 'fv-missing'
          : '';
};

function HorizontalBars({
  data,
  asShare,
  onDrillDown,
}: {
  data: ChartDatum[];
  asShare: boolean;
  onDrillDown?: ((label: string) => void) | undefined;
}) {
  const peak = Math.max(...data.map((d) => d.value), asShare ? 1 : 0);

  return (
    <ul className="space-y-2">
      {data.map((datum) => {
        const width = peak > 0 ? Math.max(2, Math.round((datum.value / peak) * 100)) : 0;
        const readout =
          datum.display ?? (asShare ? `${Math.round(datum.value * 100)}%` : String(datum.value));

        const row = (
          <>
            <span className="w-24 shrink-0 truncate text-mute text-sm">{datum.label}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-fill-2">
              <span
                className={cn(
                  'block h-full rounded-full',
                  datum.emphasis ? 'bg-chart-1' : 'bg-chart-3',
                )}
                style={{ width: `${width}%` }}
              />
            </span>
            <span
              className={cn(
                'tabular w-16 shrink-0 text-right text-mute text-sm',
                fieldStateClass(datum.field),
              )}
            >
              {readout}
            </span>
          </>
        );

        return (
          <li key={datum.label}>
            {onDrillDown ? (
              <button
                type="button"
                onClick={() => onDrillDown(datum.label)}
                title={`${datum.label} — open the rows behind this`}
                className="flex w-full cursor-pointer items-center gap-3 rounded px-1 py-0.5 text-left hover:bg-fill"
              >
                {row}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-1 py-0.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Vertical bars — the `bar` and `stacked` types. */
function VerticalBars({
  data,
  stacked,
  onDrillDown,
}: {
  data: ChartDatum[];
  stacked: boolean;
  onDrillDown?: ((label: string) => void) | undefined;
}) {
  const peak = Math.max(...data.map((d) => d.value), 0);

  if (stacked) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
      <div>
        <div className="flex h-8 overflow-hidden rounded-md">
          {data.map((datum) => (
            <span
              key={datum.label}
              title={`${datum.label} · ${datum.display ?? datum.value}`}
              className={cn('h-full', datum.emphasis ? 'bg-chart-1' : 'bg-chart-3')}
              style={{
                width: total > 0 ? `${(datum.value / total) * 100}%` : '0%',
                opacity: datum.emphasis ? 1 : 0.35 + 0.5 * (datum.value / (peak || 1)),
              }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {data.map((datum) => (
            <li key={datum.label} className="text-mute">
              {datum.label} <span className="tabular text-ink">{datum.display ?? datum.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className="flex items-end gap-3" style={{ height: 120 }}>
      {data.map((datum) => (
        <li key={datum.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
          <span className="tabular mb-1 text-[0.6875rem] text-mute">
            {datum.display ?? datum.value}
          </span>
          <button
            type="button"
            onClick={onDrillDown ? () => onDrillDown(datum.label) : undefined}
            title={datum.label}
            className={cn(
              'w-full rounded-t-sm',
              datum.emphasis ? 'bg-chart-1' : 'bg-chart-4',
              onDrillDown && 'cursor-pointer hover:opacity-80',
            )}
            style={{ height: peak > 0 ? `${Math.max(4, (datum.value / peak) * 90)}px` : 4 }}
          />
          <span className="mt-1 w-full truncate text-center text-[0.6875rem] text-faint">
            {datum.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
      <p className="text-mute text-sm">Nothing to chart yet.</p>
      <p className="text-faint text-xs">A figure appears here once there is one to compare.</p>
    </div>
  );
}

function LoadingState() {
  const rows = ['a', 'b', 'c'];
  return (
    <output aria-label="Loading chart" className="block space-y-2 py-2">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-fill-2" />
          <div className="h-2.5 flex-1 animate-pulse rounded-full bg-fill-2" />
        </div>
      ))}
    </output>
  );
}

export function Chart({
  type,
  data,
  onDrillDown,
  asShare = false,
  caption,
  restricted = false,
}: ChartProps) {
  if (restricted) {
    return (
      <div className="py-8 text-center">
        <p className="text-mute text-sm">This figure is admin-only.</p>
      </div>
    );
  }

  if (data.length === 0) return <EmptyState />;

  // `timeline` is the money timeline's shape; block 03 owns that rendering, so
  // the chart block draws it as bars rather than duplicating the axis.
  const horizontal = type === 'hbar' || type === 'timeline';

  return (
    <figure className="m-0">
      {caption ? (
        <figcaption className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
          {caption}
        </figcaption>
      ) : null}

      {horizontal ? (
        <HorizontalBars data={data} asShare={asShare} onDrillDown={onDrillDown} />
      ) : (
        <VerticalBars data={data} stacked={type === 'stacked'} onDrillDown={onDrillDown} />
      )}
    </figure>
  );
}

/** Money data for a chart, formatted once so the block never touches Paise. */
export const moneyDatum = (
  label: string,
  field: FieldValue<Paise>,
  opts: { emphasis?: boolean } = {},
): ChartDatum => ({
  label,
  value: hasValue(field) ? field.value : 0,
  display: hasValue(field) ? formatShortINR(field.value) : '—',
  field,
  ...(opts.emphasis === undefined ? {} : { emphasis: opts.emphasis }),
});

export { LoadingState as ChartLoading };
