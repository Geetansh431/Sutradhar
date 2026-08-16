/**
 * The warning strip — spec §6.4.
 *
 * "One sentence stating the gap in plain language, with two actions: chase the
 * inflow, or re-gate the outflow. Both open a change preview — neither writes
 * directly." The component takes the sentence rather than composing it, so the
 * wording stays in a selector where it can be tested.
 */

export type StripAction = { label: string; onRun: () => void };

export function WarningStrip({ sentence, actions }: { sentence: string; actions: StripAction[] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand bg-brand-soft/50 px-4 py-3">
      <p className="font-medium text-ink text-sm">{sentence}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onRun}
            className="cursor-pointer whitespace-nowrap rounded-full border border-brand px-3 py-1 font-medium text-brand text-sm hover:bg-brand hover:text-paper"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
