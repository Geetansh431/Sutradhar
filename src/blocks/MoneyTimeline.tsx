/**
 * Block 03 — Money timeline.
 *
 * "Inflows above the axis, outflows below, by date. Scrollable horizontally,
 * default window 60 days. Firm-wide by default, filterable to one project."
 * (spec §6.4). The coverage gap is "the single most valuable pixel in the
 * product and it should look like it" — hence the band, the pill, and the fact
 * that an uncovered outflow is the only bar drawn filled.
 *
 * Props are ids and a window, never resolved data: the block calls the selector
 * itself (CLAUDE.md rule 1). Every figure renders through `formatINR` /
 * `formatShortINR`, and an unconfirmed amount keeps its `.fv-*` treatment here
 * exactly as it would anywhere else — a dotted underline is the whole point.
 */

import { useMemo } from 'react';
import {
  type MoneyState,
  moneyWindow,
  peakAmount,
  type TimelinePayment,
} from '@/domain/selectors/money';
import type { EntityId } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatShortDate, isToday } from '@/lib/dates';
import { hasValue } from '@/lib/field';
import { formatINR, formatShortINR, type Paise } from '@/lib/money';
import { useStore } from '@/store/store';

export type MoneyTimelineProps = {
  /** Narrow to one project. Omitted means firm-wide. */
  projectId?: EntityId;
  /** Window length in days. Spec default is 60. */
  days?: number;
  /** Window start. Defaults to the demo's fixed today. */
  from?: string;
  /** Home renders a miniature of this same block (spec §6.1). */
  compact?: boolean;
  /** Team members never see firm money — spec §3.2. */
  restricted?: boolean;
  onSelectPayment?: (id: EntityId) => void;
  /**
   * Read from this entity table instead of the store. Only `/lab` passes it, so
   * a state the demo does not contain can be shown without seeding it into the
   * demo. Screens always omit it and read the live store.
   */
  stateOverride?: MoneyState;
};

/** Bar heights as a share of the tallest bar, floored so a small bar stays visible. */
const MIN_BAR = 12;
const MAX_BAR = 84;
const COMPACT_MAX_BAR = 40;

const barHeight = (amount: Paise, peak: Paise, max: number): number => {
  if (peak <= 0) return MIN_BAR;
  return Math.max(MIN_BAR, Math.round((amount / peak) * max));
};

/** One column per payment. Must match the `width` each `Bar` renders at. */
const columnWidthFor = (compact: boolean) => (compact ? 34 : 72);
/** Half the plot: the axis sits at this offset, inflow above, outflow below. */
const halfHeightFor = (compact: boolean) =>
  (compact ? COMPACT_MAX_BAR : MAX_BAR) + (compact ? 16 : 18);

const inGap = (payment: TimelinePayment, gap: { from: string; to: string }): boolean => {
  const due = hasValue(payment.due) ? payment.due.value : undefined;
  return due !== undefined && due >= gap.from && due <= gap.to;
};

/** `Array.prototype.findLastIndex` needs a newer lib target than tsconfig sets. */
const findLastIndex = <T,>(items: T[], match: (item: T) => boolean): number => {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item !== undefined && match(item)) return i;
  }
  return -1;
};

/** The `.fv-*` class for a field state — defined once, in globals.css. */
const fieldStateClass = (state: string): string =>
  state === 'extracted'
    ? 'fv-extracted'
    : state === 'inferred'
      ? 'fv-inferred'
      : state === 'conflicting'
        ? 'fv-conflicting'
        : state === 'missing'
          ? 'fv-missing'
          : '';

/** What a bar needs to draw itself, resolved once by `Bar`. */
type BarView = {
  height: number;
  label: string;
  title: string;
  inflow: boolean;
  uncovered: boolean;
  amountState: string;
};

const barView = (payment: TimelinePayment, peak: Paise, compact: boolean): BarView => {
  const amount = hasValue(payment.amount) ? payment.amount.value : undefined;
  const covered = payment.uncovered ? ' · not covered' : '';
  return {
    height:
      amount === undefined ? MIN_BAR : barHeight(amount, peak, compact ? COMPACT_MAX_BAR : MAX_BAR),
    label: amount === undefined ? '—' : formatShortINR(amount),
    title:
      amount === undefined
        ? `${payment.counterpartyName} · amount missing`
        : `${payment.counterpartyName} · ${formatINR(amount)} · ${payment.projectName}${covered}`,
    inflow: payment.direction === 'in',
    uncovered: payment.uncovered,
    amountState: payment.amount.state,
  };
};

function BarValue({ view }: { view: BarView }) {
  return (
    <span
      className={cn(
        'tabular whitespace-nowrap text-[0.6875rem] leading-none',
        view.uncovered ? 'font-medium text-brand' : view.inflow ? 'text-ok' : 'text-mute',
        fieldStateClass(view.amountState),
      )}
    >
      {view.label}
    </span>
  );
}

function BarRect({ view, onSelect }: { view: BarView; onSelect?: (() => void) | undefined }) {
  return (
    <button
      type="button"
      title={view.title}
      aria-label={view.title}
      onClick={onSelect}
      className={cn(
        'w-full border transition-colors',
        view.inflow
          ? 'rounded-t-sm border-ok/70 bg-ok-soft hover:bg-ok/20'
          : view.uncovered
            ? 'rounded-b-sm border-brand bg-brand/25 hover:bg-brand/35'
            : 'rounded-b-sm border-line-strong/50 bg-fill-2 hover:bg-fill-2/80',
        onSelect && 'cursor-pointer',
      )}
      style={{ height: view.height }}
    />
  );
}

function Bar({
  payment,
  peak,
  compact,
  onSelect,
}: {
  payment: TimelinePayment;
  peak: Paise;
  compact: boolean;
  onSelect?: (id: EntityId) => void;
}) {
  const view = barView(payment, peak, compact);
  const due = hasValue(payment.due) ? payment.due.value : undefined;
  const half = halfHeightFor(compact);
  const select = onSelect ? () => onSelect(payment.id) : undefined;

  return (
    <div
      className="flex min-w-0 shrink-0 flex-col items-center"
      style={{ width: columnWidthFor(compact) }}
    >
      {/* Above the axis: inflow grows up from it, so this half bottom-aligns. */}
      <div
        className="flex w-full flex-col items-center justify-end gap-1 px-1.5"
        style={{ height: half }}
      >
        {view.inflow ? (
          <>
            <BarValue view={view} />
            <BarRect view={view} onSelect={select} />
          </>
        ) : null}
      </div>

      {/* Below the axis: outflow grows down from it, so this half top-aligns. */}
      <div
        className="flex w-full flex-col items-center justify-start gap-1 px-1.5"
        style={{ height: half }}
      >
        {view.inflow ? null : (
          <>
            <BarRect view={view} onSelect={select} />
            <BarValue view={view} />
          </>
        )}
      </div>

      <span
        className={cn(
          'mt-1 whitespace-nowrap text-[0.6875rem] leading-none',
          due && isToday(due) ? 'font-medium text-brand' : 'text-faint',
        )}
      >
        {due ? formatShortDate(due) : '—'}
      </span>
    </div>
  );
}

function EmptyState({ from, days }: { from: string; days: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-mute text-sm">Nothing scheduled in the next {days} days.</p>
      <p className="text-faint text-xs">
        Payments appear here as soon as they are captured — from {formatShortDate(from)}.
      </p>
    </div>
  );
}

function LoadingState({ compact }: { compact: boolean }) {
  // Keyed by label, not index — the set is fixed and never reorders.
  const bars = [
    { id: 'a', w: 0.6 },
    { id: 'b', w: 0.35 },
    { id: 'c', w: 0.8 },
    { id: 'd', w: 0.45 },
    { id: 'e', w: 0.7 },
    { id: 'f', w: 0.3 },
  ];
  return (
    <output aria-label="Loading money timeline" className="block">
      <div className="flex items-end justify-around gap-2 py-6">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="w-10 animate-pulse rounded-sm bg-fill-2"
            style={{ height: (compact ? COMPACT_MAX_BAR : MAX_BAR) * bar.w }}
          />
        ))}
      </div>
    </output>
  );
}

/** Spec §3.2: the cut is per-figure, and it is applied before the data is read. */
function RestrictedState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-mute text-sm">Firm money is admin-only.</p>
      <p className="text-faint text-xs">Your sites and today's work are on Home.</p>
    </div>
  );
}

export function MoneyTimeline({
  projectId,
  days = 60,
  from,
  compact = false,
  restricted = false,
  onSelectPayment,
  stateOverride,
}: MoneyTimelineProps) {
  // Subscribed to the entity table alone — the only thing the selector reads.
  const storeEntities = useStore((s) => s.entities);
  const entities = stateOverride?.entities ?? storeEntities;

  const window = useMemo(() => {
    return moneyWindow(
      { entities },
      {
        ...(projectId ? { projectId } : {}),
        days,
        ...(from ? { from } : {}),
      },
    );
  }, [entities, projectId, days, from]);

  if (restricted) return <RestrictedState />;

  const peak = peakAmount(window.payments);
  const hasPayments = window.payments.length > 0;
  const half = halfHeightFor(compact);
  const columnWidth = columnWidthFor(compact);

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-medium text-ink text-xs uppercase tracking-wide">
          Money timeline · inflow above, outflow below
        </span>
        <span className="text-faint text-xs">
          {formatShortDate(window.from)} – {formatShortDate(window.to)}
          {projectId ? ' · one project' : ' · all projects'}
        </span>
      </figcaption>

      {!hasPayments ? (
        <EmptyState from={window.from} days={days} />
      ) : (
        <div className="overflow-x-auto">
          <div className="relative flex min-w-max">
            {/* IN / OUT gutter, naming the halves as w09 does. */}
            <div
              className="sticky left-0 z-20 flex shrink-0 flex-col justify-between bg-paper pr-2 text-[0.6875rem] text-faint uppercase tracking-wide"
              style={{ height: half * 2 }}
            >
              <span className="flex flex-1 items-center">In</span>
              <span className="flex flex-1 items-center">Out</span>
            </div>

            <div className="relative">
              {/* The gap band: one shaded, dash-bounded region per gap, behind
                  the bars. This is the pixel the product is bought for. */}
              {window.gaps.map((gap) => {
                const first = window.payments.findIndex((p) => inGap(p, gap));
                const last = findLastIndex(window.payments, (p) => inGap(p, gap));
                if (first < 0) return null;
                return (
                  <div
                    key={`band-${gap.from}-${gap.to}`}
                    className="pointer-events-none absolute top-0 z-0 border-brand border-x border-dashed bg-brand-soft"
                    style={{
                      left: first * columnWidth,
                      width: (last - first + 1) * columnWidth,
                      height: half * 2,
                    }}
                  />
                );
              })}

              {/* The axis, continuous across every column. */}
              <div
                className="pointer-events-none absolute right-0 left-0 z-10 h-px bg-line-strong"
                style={{ top: half }}
              />

              <div className="relative z-10 flex">
                {window.payments.map((payment) => (
                  <Bar
                    key={payment.id}
                    payment={payment}
                    peak={peak}
                    compact={compact}
                    {...(onSelectPayment ? { onSelect: onSelectPayment } : {})}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The gap label. The most valuable pixel gets stated in words, not just shading. */}
      {window.gaps.map((gap) => (
        <p
          key={`${gap.from}-${gap.to}`}
          className="mt-2 rounded-md bg-brand px-3 py-1.5 text-center font-medium text-[0.8125rem] text-paper"
        >
          Coverage gap {formatINR(gap.shortfall)}
          <span className="ml-2 font-normal opacity-90">
            {gap.from === gap.to
              ? formatShortDate(gap.from)
              : `${formatShortDate(gap.from)} – ${formatShortDate(gap.to)}`}
          </span>
        </p>
      ))}

      {/* Totals always state what they exclude — spec §5.5, P4. */}
      {hasPayments ? (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-faint text-xs">
          <span>
            In <span className="tabular text-ok">{formatINR(window.inflowTotal.value)}</span>
            {window.inflowTotal.caveat ? ` · ${window.inflowTotal.caveat}` : ''}
          </span>
          <span>
            Out <span className="tabular text-mute">{formatINR(window.outflowTotal.value)}</span>
            {window.outflowTotal.caveat ? ` · ${window.outflowTotal.caveat}` : ''}
          </span>
        </p>
      ) : null}
    </figure>
  );
}

export { LoadingState as MoneyTimelineLoading };
