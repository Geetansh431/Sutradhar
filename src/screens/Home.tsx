/**
 * Home — spec §6.1, wireframe w06.
 *
 * "The most important screen in the product, because it is the one that makes
 * it a habit. It answers two questions before the user asks anything: what
 * changed, and what needs me." Brief on top, queue below, money and today on
 * the right.
 *
 * Home and the Action Queue are one screen (§4.2) — deliberately not two
 * destinations.
 *
 * The team cut (§3.2): brief scoped to their sites, queue scoped to their
 * items, no pulse cards and no money panel. Applied by not reading those
 * selectors at all.
 */

import { useMemo } from 'react';
import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import { ActionQueue } from '@/chrome/home/ActionQueue';
import { Brief, BriefHeader } from '@/chrome/home/Brief';
import { PulseCards } from '@/chrome/home/PulseCards';
import { TodayPanel } from '@/chrome/home/TodayPanel';
import { actionQueue, brief, pulse, today } from '@/domain/selectors/home';
import { canSeeMoney, currentPerson } from '@/domain/selectors/role';
import type { EntityId } from '@/domain/types';
import { type EntityTable, useStore } from '@/store/store';

export type HomeProps = {
  /** See `MoneyProps` — a static render never sees a store reset. */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null; coverage: number };
};

export function Home({ stateOverride }: HomeProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const storeCoverage = useStore((s) => s.coverage);

  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;
  const coverage = stateOverride?.coverage ?? storeCoverage;

  const seesMoney = canSeeMoney({ entities, currentUserId });
  const person = currentPerson({ entities, currentUserId });

  const view = useMemo(
    () => ({
      brief: brief({ entities }, coverage, seesMoney ? {} : { forPersonId: currentUserId ?? '' }),
      queue: actionQueue({ entities }, seesMoney ? {} : { forPersonId: currentUserId ?? '' }),
      today: today({ entities }),
      // Never computed for a team member — the figure is not fetched (§3.2).
      pulse: seesMoney ? pulse({ entities }) : null,
    }),
    [entities, coverage, seesMoney, currentUserId],
  );

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <BriefHeader name={person?.name.split(' ')[0] ?? 'there'} />

      <Brief brief={view.brief} />

      {view.pulse ? <PulseCards pulse={view.pulse} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ActionQueue items={view.queue} />

        <div className="space-y-4">
          {seesMoney ? (
            <section className="rounded-md border border-line bg-panel p-4">
              <h2 className="mb-3 font-medium text-ink text-xs uppercase tracking-wide">
                Money, next 14 days
              </h2>
              <MoneyTimeline
                compact
                days={14}
                {...(stateOverride ? { stateOverride: { entities } } : {})}
              />
            </section>
          ) : null}

          <TodayPanel items={view.today} />
        </div>
      </div>
    </main>
  );
}
