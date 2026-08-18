/**
 * Coverage by area — spec §5.3 and §6.8.
 *
 * "Six areas with percentage bars. Deliberately shows the low numbers. Copy:
 * 'gaps are the product working'."
 *
 * Shared between onboarding and Firm Memory, because §5.1 says the onboarding
 * surface *dissolves into* Firm Memory rather than being replaced by it — the
 * same panel continuing is the point, not a coincidence.
 */

import { AREA_LABELS } from '@/fixtures/ingestion';
import { cn } from '@/lib/cn';
import type { CoverageByArea } from '@/store/store';

/** Low numbers are shown in accent — not hidden, not softened. */
const tone = (value: number): string => (value >= 0.6 ? 'bg-ok' : 'bg-brand');

export function CoveragePanel({
  coverage,
  title = 'Firm coverage',
  /** Per-area reasons, as w10 shows them ("6 vendors, no terms"). */
  reasons,
  onSelectArea,
  selectedArea,
}: {
  coverage: CoverageByArea;
  title?: string;
  reasons?: Partial<Record<keyof CoverageByArea, string>>;
  /** §6.8: "Clicking an area opens the gaps behind it." */
  onSelectArea?: (area: keyof CoverageByArea) => void;
  selectedArea?: keyof CoverageByArea | null;
}) {
  const areas = Object.keys(AREA_LABELS) as (keyof CoverageByArea)[];

  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <h2 className="mb-3 font-medium text-faint text-xs uppercase tracking-wide">{title}</h2>

      <ul className="space-y-2.5">
        {areas.map((area) => {
          const value = coverage[area];
          return (
            <li key={area}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded px-1 py-0.5',
                  onSelectArea && 'cursor-pointer hover:bg-fill-2',
                  selectedArea === area && 'bg-fill-2',
                )}
                {...(onSelectArea
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: () => onSelectArea(area),
                      onKeyDown: (event: React.KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectArea(area);
                        }
                      },
                    }
                  : {})}
              >
                <span className="w-40 shrink-0 text-ink text-sm">{AREA_LABELS[area]}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-fill-2">
                  <span
                    className={cn('block h-full rounded-full', tone(value))}
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </span>
                <span className="tabular w-12 shrink-0 text-right font-medium text-ink text-sm">
                  {Math.round(value * 100)}%
                </span>
              </div>
              {reasons?.[area] ? (
                <p className="mt-0.5 pl-43 text-faint text-xs">{reasons[area]}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-brand text-sm">
        Nothing here is hidden from you — gaps are the product working.
      </p>
    </section>
  );
}
