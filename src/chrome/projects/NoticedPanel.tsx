/**
 * "Sutradhar noticed" — spec §6.2, wireframe w07.
 *
 * "Two to four proactive observations below the board, each with an action
 * chip. This is the clearest place in the product to show that the system is
 * watching, because these are exactly the things that fall through today."
 *
 * Every action opens a change preview. §9.3's "never nag twice" is why an
 * observation can be dismissed, and why a dismissed one does not return.
 */

import type { Observation } from '@/domain/selectors/projects';

export function NoticedPanel({
  observations,
  dismissed,
  onAct,
  onDismiss,
}: {
  observations: Observation[];
  dismissed: ReadonlySet<string>;
  onAct: (observation: Observation) => void;
  onDismiss: (id: string) => void;
}) {
  const shown = observations.filter((observation) => !dismissed.has(observation.id));
  if (shown.length === 0) return null;

  return (
    <section className="rounded-md border border-brand">
      <header className="bg-brand-soft px-4 py-3">
        <h2 className="font-medium text-brand text-sm uppercase tracking-wide">
          Sutradhar noticed
        </h2>
      </header>

      <ul className="divide-y divide-line">
        {shown.map((observation) => (
          <li
            key={observation.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
          >
            <p className="min-w-0 flex-1 text-ink text-sm">
              <span className="mr-2 text-brand">·</span>
              {observation.text}
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onDismiss(observation.id)}
                title="Dismiss — this will not come back unless the facts change"
                className="cursor-pointer text-faint text-xs hover:text-ink"
              >
                dismiss
              </button>
              <button
                type="button"
                onClick={() => onAct(observation)}
                className="cursor-pointer whitespace-nowrap rounded-full border border-brand px-3 py-1 font-medium text-brand text-sm hover:bg-brand hover:text-paper"
              >
                {observation.action}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
