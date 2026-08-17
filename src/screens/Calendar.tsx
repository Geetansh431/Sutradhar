/**
 * Calendar — spec §6.7, IA §4.1.
 *
 * "One axis for every deadline in the firm: task deadlines, payment due dates,
 * stage gates, site visits, leave. Month view default, week toggle. Filterable
 * by project, person and type. Read-mostly — items are created where they live,
 * not here."
 *
 * Read-mostly is why this screen holds no change preview: nothing is authored
 * on the calendar, so there is no write for it to gate. The month grid is
 * screen-level composition rather than a block — the vocabulary is closed at
 * ten (rule 7), and a month grid is not one of them.
 */

import { useMemo, useState } from 'react';
import { MonthGrid } from '@/chrome/calendar/MonthGrid';
import { type ModeOption, ModeSwitch } from '@/chrome/ModeSwitch';
import { type CalendarKind, calendarDays, KIND_LABEL } from '@/domain/selectors/calendar';
import { canSeeMoney } from '@/domain/selectors/role';
import type { EntityId } from '@/domain/types';
import { addDays, formatLongDate, TODAY } from '@/lib/dates';
import { type EntityTable, useStore } from '@/store/store';

type Mode = 'month' | 'week';

const MODES: ModeOption<Mode>[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
];

/** Month view starts on the 1st of the current month; week view starts today. */
const windowFor = (mode: Mode): { from: string; to: string } =>
  mode === 'week'
    ? { from: TODAY, to: addDays(TODAY, 6) }
    : { from: `${TODAY.slice(0, 7)}-01`, to: addDays(`${TODAY.slice(0, 7)}-01`, 41) };

export type CalendarProps = {
  /** Tests and `/lab` read from here instead of the live store — see `Money`. */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null };
};

export function Calendar({ stateOverride }: CalendarProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const [mode, setMode] = useState<Mode>('month');
  const [kind, setKind] = useState<CalendarKind | 'all'>('all');

  // Derived from `mode` alone, so it is memoised on `mode` and the day list can
  // depend on the object itself rather than picking its fields apart.
  const window = useMemo(() => windowFor(mode), [mode]);
  const days = useMemo(
    () => calendarDays({ entities, currentUserId }, window),
    [entities, currentUserId, window],
  );

  const filtered = days
    .map((day) => ({
      ...day,
      items: kind === 'all' ? day.items : day.items.filter((item) => item.kind === kind),
    }))
    .filter((day) => day.items.length > 0);

  const total = filtered.reduce((count, day) => count + day.items.length, 0);

  // A team member's axis holds no payments (§3.2), so the filter that would
  // narrow to them is absent rather than present and always empty.
  const seesMoney = canSeeMoney({ entities, currentUserId });
  const kinds: (CalendarKind | 'all')[] = seesMoney
    ? ['all', 'task', 'payment', 'handover', 'follow-up']
    : ['all', 'task', 'handover', 'follow-up'];

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Calendar</h1>
        <p className="text-mute text-sm">
          Every deadline in the firm on one axis · {total} {total === 1 ? 'item' : 'items'} from{' '}
          {formatLongDate(window.from)}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <ModeSwitch modes={MODES} active={mode} onChange={setMode} label="Calendar view" />

        <div className="flex flex-wrap gap-1">
          {kinds.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={
                kind === option
                  ? 'cursor-pointer rounded-full border border-brand bg-brand-soft px-3 py-1 font-medium text-brand text-xs'
                  : 'cursor-pointer rounded-full border border-line px-3 py-1 text-mute text-xs hover:border-line-strong'
              }
            >
              {option === 'all' ? 'Everything' : KIND_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <MonthGrid days={filtered} from={window.from} to={window.to} />

      <p className="text-faint text-xs">
        Read-mostly: items are created where they live — a task on its project, a payment on Money —
        and appear here.
      </p>
    </main>
  );
}
