/**
 * The left rail — spec §4.1, §4.2, present on every wireframe.
 *
 * Eight destinations, Settings tucked in the footer, and the user's pinned
 * canvases below Firm Memory. "The user's own screens sit alongside ours,
 * visually identical" (§4.2) — hence the same markup for both lists, differing
 * only by an unpin affordance.
 *
 * The role cut happens in `destinations()`: Money is *absent* from a team
 * member's rail, not present-and-disabled.
 */

import { NavLink } from 'react-router';
import { useScenarioPath } from '@/lib/scenarioLink';
import type { Destination } from '@/domain/selectors/role';
import { cn } from '@/lib/cn';
import type { PinnedScreen } from '@/store/store';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-md px-3 py-2 text-sm transition-colors',
    isActive
      ? 'border-brand border-l-2 bg-brand-soft font-medium text-brand'
      : 'border-transparent border-l-2 text-mute hover:bg-fill hover:text-ink',
  );

export function Rail({
  destinations,
  pins,
  onUnpin,
}: {
  destinations: Destination[];
  pins: PinnedScreen[];
  onUnpin?: (id: string) => void;
}) {
  // Every link keeps `?s=` — a refresh from a deep link would otherwise
  // silently reseed the demo as `live`.
  const link = useScenarioPath();

  return (
    <nav
      aria-label="Main"
      className="flex h-dvh w-56 shrink-0 flex-col border-line border-r bg-panel"
    >
      <div className="px-4 py-4">
        <span className="font-display font-semibold text-brand text-lg">sutradhar</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <ul>
          {destinations.map((destination) => (
            <li key={destination.path}>
              <NavLink
                to={link(destination.path)}
                end={destination.path === '/'}
                className={linkClass}
              >
                {destination.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Pinned canvases sit below Firm Memory, visually identical (§4.2). */}
        {pins.length > 0 ? (
          <>
            <p className="mt-4 px-3 text-faint text-xs uppercase tracking-wide">Pinned</p>
            <ul>
              {pins.map((pin) => (
                <li key={pin.id} className="group relative">
                  <NavLink to={link(`/canvas/${pin.questionId}`)} className={linkClass}>
                    {pin.name}
                  </NavLink>
                  {onUnpin ? (
                    <button
                      type="button"
                      onClick={() => onUnpin(pin.id)}
                      aria-label={`Unpin ${pin.name}`}
                      className="absolute top-1/2 right-2 hidden -translate-y-1/2 cursor-pointer text-faint text-xs hover:text-ink group-hover:block"
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {/* "Settings — tucked in the rail footer" (§4.1). */}
      <div className="border-line border-t px-2 py-2">
        <NavLink to={link('/settings')} className={linkClass}>
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
