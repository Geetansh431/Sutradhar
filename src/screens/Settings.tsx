/**
 * Settings — IA §4.1: "Schema, roles, users. Tucked in the rail footer."
 *
 * Deliberately the dullest screen in the product, and deliberately read-only.
 *
 * §10 says the demo must never show a form being filled in or a settings page,
 * and this does not contradict that: the rule governs the *script*, not whether
 * the destination exists. A rail link that goes nowhere is a dead end, which
 * the day 8–9 bar forbids. So the screen exists, states what the firm is
 * configured as, and is never visited during the five minutes.
 *
 * It shows what was inferred during onboarding rather than offering knobs —
 * which is the actual claim: nothing here had to be configured.
 */

import { currentRole } from '@/domain/selectors/role';
import type { EntityId, Person } from '@/domain/types';
import { type EntityTable, useStore } from '@/store/store';

const ROLE_SUMMARY: Record<string, string> = {
  admin: 'Everything, including money and deal values',
  team: 'Projects they are on — no money, no deal values',
};

export type SettingsProps = {
  /** Tests and `/lab` read from here instead of the live store — see `Money`. */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null };
};

export function Settings({ stateOverride }: SettingsProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const people = Object.values(entities).filter(
    (entity): entity is Person => entity.kind === 'person' && entity.archivedAt === null,
  );
  const role = currentRole({ entities, currentUserId });

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Settings</h1>
        <p className="text-mute text-sm">
          Nothing here was configured. It was read from the folder you handed over.
        </p>
      </header>

      <section className="rounded-lg border border-line p-4">
        <h2 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">Roles</h2>
        <dl className="space-y-2">
          {Object.entries(ROLE_SUMMARY).map(([id, summary]) => (
            <div key={id} className="flex flex-wrap items-baseline gap-2">
              <dt className="w-16 font-medium text-ink text-sm capitalize">{id}</dt>
              <dd className="text-mute text-sm">{summary}</dd>
              {role === id ? <span className="text-brand text-xs">· you</span> : null}
            </div>
          ))}
        </dl>
        <p className="mt-3 text-faint text-xs">
          The switcher in the topbar changes who you are signed in as — demo scaffolding, per §3.2,
          and the fastest way to see the money line.
        </p>
      </section>

      <section className="rounded-lg border border-line p-4">
        <h2 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">Users</h2>
        <ul className="space-y-1">
          {people.map((person) => (
            <li key={person.id} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="text-ink">{person.name}</span>
              <span className="text-faint text-xs capitalize">{person.role}</span>
              {person.id === currentUserId ? (
                <span className="text-brand text-xs">· signed in</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line p-4">
        <h2 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">Schema</h2>
        <p className="text-mute text-sm">
          Projects, clients, vendors, people, payments, tasks and documents — with a source and a
          state on every field. The shape came from the firm's own files; it was not chosen from a
          template.
        </p>
        <p className="mt-2 text-faint text-xs">
          This prototype holds no account, no billing and no integrations, so there is nothing else
          to set.
        </p>
      </section>
    </main>
  );
}
