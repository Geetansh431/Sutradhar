/**
 * The application shell — rail on the left, topbar above the screen.
 *
 * Every wireframe has this frame, so screens render inside it rather than each
 * drawing their own header. The topbar carries the ask bar (§4.3, "present on
 * every screen") and the permanent prototype badge.
 */

import { Outlet, useNavigate } from 'react-router';
import { AskBar } from '@/chrome/AskBar';
import { PrototypeBadge } from '@/chrome/ModeSwitch';
import { Rail } from '@/chrome/Rail';
import { RoleSwitcher } from '@/chrome/RoleSwitcher';
import { currentPerson, destinations, visiblePins } from '@/domain/selectors/role';
import type { Person } from '@/domain/types';
import { useScenarioPath } from '@/lib/scenarioLink';
import { useStore } from '@/store/store';

/** "AK" — the initials shown top-right on every wireframe. */
const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function Shell() {
  const entities = useStore((s) => s.entities);
  const currentUserId = useStore((s) => s.currentUserId);
  const pinned = useStore((s) => s.pinned);
  const unpin = useStore((s) => s.unpin);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const navigate = useNavigate();
  const link = useScenarioPath();

  const roleState = { entities, currentUserId };
  const person = currentPerson(roleState);

  // One of each role, for the demo switcher (§3.2).
  const people = Object.values(entities).filter((e): e is Person => e.kind === 'person');
  const seededLogins = [
    people.find((p) => p.role === 'admin'),
    people.find((p) => p.role === 'team'),
  ].filter((p): p is Person => p !== undefined);

  return (
    // Exactly the viewport, never taller: the rail is `h-dvh` and stays put
    // only if the *window* never scrolls. With `min-h-dvh` a long screen grew
    // the page and carried the rail up out of view with it. The content pane
    // below owns the scroll instead.
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Rail
        destinations={destinations(roleState)}
        pins={visiblePins(roleState, pinned)}
        onUnpin={unpin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-line border-b bg-paper px-6 py-3">
          <AskBar onPick={(question) => navigate(link(`/canvas/${question.id}`))} />

          <div className="flex items-center gap-3">
            <RoleSwitcher
              people={seededLogins}
              currentUserId={currentUserId}
              onSwitch={setCurrentUser}
            />
            <PrototypeBadge />
            <span
              title={person?.name ?? 'Not signed in'}
              className="flex size-8 items-center justify-center rounded-full bg-fill-2 font-medium text-mute text-xs"
            >
              {person ? initials(person.name) : '—'}
            </span>
          </div>
        </header>

        {/* The one scroll container. The topbar sits above it and stays. */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
