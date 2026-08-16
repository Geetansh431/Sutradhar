/**
 * Chrome shared across screens that have modes.
 *
 * Projects has list / board / map, Money has timeline / ledgers / payments
 * (spec §6.2, §6.4). Same control, so it lives here rather than being redrawn
 * per screen — a mode switch that looked different on two screens would cost
 * exactly the spatial memory the layout law exists to protect.
 */

import { cn } from '@/lib/cn';

export type ModeOption<T extends string> = { id: T; label: string };

export function ModeSwitch<T extends string>({
  modes,
  active,
  onChange,
  label,
}: {
  modes: ModeOption<T>[];
  active: T;
  onChange: (mode: T) => void;
  label: string;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          aria-pressed={active === mode.id}
          className={cn(
            'cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors',
            active === mode.id
              ? 'border-brand font-medium text-brand'
              : 'border-line text-mute hover:text-ink',
          )}
        >
          {mode.label}
        </button>
      ))}
    </fieldset>
  );
}

/**
 * The permanent badge (CLAUDE.md: do not remove). It belongs on every screen,
 * so it is defined once.
 */
export function PrototypeBadge() {
  return (
    <span className="rounded border border-line bg-fill px-2 py-1 text-mute text-xs">
      Prototype · canned responses
    </span>
  );
}

/**
 * What a team member sees if they reach an admin-only URL. Says so plainly and
 * never hints at the figure — spec §7.7, "state plainly that this is
 * admin-only. Never hint at the figure, never say 'approximately'."
 */
export function AdminOnly({ what }: { what: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-ink text-xl">{what} is admin-only</h1>
      <p className="mt-2 text-mute text-sm">
        Your sites and today's work are on Home. Nothing here was loaded.
      </p>
    </main>
  );
}
