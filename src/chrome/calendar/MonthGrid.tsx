/**
 * The calendar's day list — spec §6.7.
 *
 * A dense agenda rather than an empty month grid: a firm with twenty dated
 * things in six weeks would render thirty-odd blank cells, and blank cells are
 * the part of a calendar nobody reads. Days with nothing on them are omitted
 * and said so in a line, which is more honest about how full the month is.
 *
 * Today is marked, and a date the firm is not certain of renders dotted like
 * every other unconfirmed value in the product.
 */

import type { CalendarDay } from '@/domain/selectors/calendar';
import { KIND_LABEL } from '@/domain/selectors/calendar';
import { cn } from '@/lib/cn';
import { formatRelative, formatShortDate, isPast, isToday } from '@/lib/dates';

const KIND_TONE: Record<string, string> = {
  task: 'border-line text-mute',
  payment: 'border-brand/40 text-brand',
  handover: 'border-ok/50 text-ok',
  'follow-up': 'border-line text-mute',
};

export function MonthGrid({ days, from, to }: { days: CalendarDay[]; from: string; to: string }) {
  if (days.length === 0) {
    return (
      <section className="rounded-lg border border-line px-4 py-10 text-center">
        <p className="text-mute text-sm">Nothing dated in this window.</p>
        <p className="mt-1 text-faint text-xs">
          {formatShortDate(from)} — {formatShortDate(to)}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line">
      <ul className="divide-y divide-line/60">
        {days.map((day) => (
          <li key={day.date} className="flex gap-4 px-4 py-3">
            <div className="w-24 shrink-0">
              <p
                className={cn(
                  'font-medium text-sm',
                  isToday(day.date) ? 'text-brand' : isPast(day.date) ? 'text-faint' : 'text-ink',
                )}
              >
                {formatShortDate(day.date)}
              </p>
              <p className="text-faint text-xs">{formatRelative(day.date)}</p>
            </div>

            <ul className="min-w-0 flex-1 space-y-1">
              {day.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[0.6875rem] uppercase tracking-wide',
                      KIND_TONE[item.kind] ?? 'border-line text-mute',
                    )}
                  >
                    {KIND_LABEL[item.kind]}
                  </span>

                  <span className={cn('text-sm', item.uncertain ? 'fv-inferred' : 'text-ink')}>
                    {item.title}
                  </span>

                  {item.detail ? (
                    <span className="tabular text-mute text-sm">{item.detail}</span>
                  ) : null}

                  {item.projectName ? (
                    <span className="text-faint text-xs">· {item.projectName}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
