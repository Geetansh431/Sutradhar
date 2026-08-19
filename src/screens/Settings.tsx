/**
 * Settings — spec §6.9, IA §4.1.
 *
 * "Deliberately thin, and the only place in the product that looks like
 * configuration. It exists because the schema-freedom promise in §7.5 has to be
 * true somewhere."
 *
 * So the screen's job is to *state the boundary*, not to hold editors. §6.9's
 * two columns are the content: what a firm may shape, and what it may not. The
 * right-hand column is the load-bearing half — a product that let you redefine
 * what a payment means, or edit your own audit log, would have no ground left
 * to stand on when it says a figure carries its source.
 *
 * Read-only throughout, for two reasons that agree. §10 forbids the demo
 * showing a form being filled in; and §7.5 locates the real freedom elsewhere —
 * "each firm ends up with a product shaped to how it actually thinks, with zero
 * setup burden and no settings page involved". The screens a firm keeps from
 * the Canvas are the larger half of that freedom, arrived at by asking.
 *
 * The rule about never *visiting* this screen during the five minutes stands.
 * It exists so the rail footer is not a dead end.
 */

import { currentRole } from '@/domain/selectors/role';
import type { EntityId, Person } from '@/domain/types';
import { EDITABLE, NOT_EDITABLE } from '@/fixtures/schema';
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

      {/* §6.9's two columns. The right-hand one is not an apology for a missing
          feature — it is the statement that makes the left-hand one credible. */}
      <section className="rounded-lg border border-line p-4">
        <h2 className="mb-1 font-medium text-ink text-xs uppercase tracking-wide">Schema</h2>
        <p className="mb-4 text-mute text-sm">
          The shape came from your own files; it was not chosen from a template. Some of it is yours
          to change, and some of it is what everything else depends on.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
              Yours to shape
            </h3>
            <dl className="space-y-2.5">
              {EDITABLE.map((rule) => (
                <div key={rule.id}>
                  <dt className="text-ink text-sm">{rule.label}</dt>
                  <dd className="text-faint text-xs">{rule.because}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
              Fixed, and why
            </h3>
            <dl className="space-y-2.5">
              {NOT_EDITABLE.map((rule) => (
                <div key={rule.id}>
                  <dt className="text-mute text-sm">{rule.label}</dt>
                  <dd className="text-faint text-xs">{rule.because}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="mt-4 border-line/60 border-t pt-3 text-faint text-xs">
          Nothing here is edited in this prototype. In the product each of the left-hand items
          changes through a change preview, like every other write — and the screens you keep from
          the Canvas are the larger half of the same freedom, arrived at by asking rather than
          configuring.
        </p>
      </section>
    </main>
  );
}
