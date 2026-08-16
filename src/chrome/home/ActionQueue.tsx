/**
 * The action queue — spec §6.1.
 *
 * "Every item that needs a human, in one list, each with a one-tap primary
 * action. Sorted by consequence, not by date." The sort happens in the selector;
 * this renders what it is given, in order.
 *
 * The empty state is "celebratory, not blank" — a queue you have emptied is the
 * product working, and it should feel like it.
 */

import type { QueueItem, QueueKind } from '@/domain/selectors/home';
import { cn } from '@/lib/cn';

/**
 * Tag tone by urgency, matching w06: money that is due or undecided reads in
 * accent, things that merely need answering read amber, routine approvals grey.
 */
const kindTone = (kind: QueueKind): string => {
  switch (kind) {
    case 'CONFIRM':
    case 'DECIDE':
      return 'border-brand text-brand';
    case 'SEND':
    case 'ANSWER':
      return 'border-warn text-warn';
    default:
      return 'border-line-strong text-mute';
  }
};

function QueueRow({ item, onRun }: { item: QueueItem; onRun?: (item: QueueItem) => void }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-line bg-paper px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 font-medium text-[0.6875rem] tracking-wide',
              kindTone(item.kind),
            )}
          >
            {item.kind}
          </span>
          <span className="text-faint text-xs">{item.detail}</span>
        </div>
        <p className="mt-1 font-medium text-ink">{item.title}</p>
      </div>

      <button
        type="button"
        onClick={onRun ? () => onRun(item) : undefined}
        className="cursor-pointer whitespace-nowrap rounded-full border border-brand px-4 py-1 font-medium text-brand text-sm hover:bg-brand hover:text-paper"
      >
        {item.action}
      </button>
    </li>
  );
}

function EmptyQueue() {
  return (
    <div className="rounded-md border border-ok/40 bg-ok-soft/30 px-4 py-8 text-center">
      <p className="font-medium text-ink text-sm">Your day is done.</p>
      <p className="mt-1 text-mute text-sm">
        Nothing needs you right now. Tomorrow's instalment and two site visits are already
        scheduled.
      </p>
    </div>
  );
}

export function ActionQueue({
  items,
  onRun,
}: {
  items: QueueItem[];
  onRun?: (item: QueueItem) => void;
}) {
  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-medium text-ink text-xs uppercase tracking-wide">
          Action queue · {items.length} {items.length === 1 ? 'item' : 'items'}
        </h2>
        <span className="text-faint text-xs">empty this = your day is done</span>
      </div>

      {items.length === 0 ? (
        <EmptyQueue />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <QueueRow key={item.id} item={item} {...(onRun ? { onRun } : {})} />
          ))}
        </ul>
      )}
    </section>
  );
}
