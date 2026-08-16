/**
 * The demo's role switcher — spec §3.2.
 *
 * "Prototype: two seeded logins, Admin and Team, with a visible switcher for
 * demo purposes."
 *
 * It exists so the money line can be *shown* rather than described: switching
 * to Ravi removes Money from the rail and empties the brief of figures, in
 * front of the audience. It is demo scaffolding and would not ship.
 */

import type { Person } from '@/domain/types';
import { cn } from '@/lib/cn';

export function RoleSwitcher({
  people,
  currentUserId,
  onSwitch,
}: {
  people: Person[];
  currentUserId: string | null;
  onSwitch: (id: string) => void;
}) {
  if (people.length < 2) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-fill p-0.5">
      {people.map((person) => (
        <button
          key={person.id}
          type="button"
          onClick={() => onSwitch(person.id)}
          aria-pressed={person.id === currentUserId}
          title={`View as ${person.name} (${person.role})`}
          className={cn(
            'cursor-pointer rounded-full px-2.5 py-0.5 text-xs transition-colors',
            person.id === currentUserId
              ? 'bg-paper font-medium text-ink shadow-sm'
              : 'text-mute hover:text-ink',
          )}
        >
          {person.role === 'admin' ? 'Admin' : 'Team'}
        </button>
      ))}
    </div>
  );
}
