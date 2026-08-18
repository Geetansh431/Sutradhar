/**
 * Project workspace — spec §6.3, wireframe w08.
 *
 * "One project, everything about it." A composition: stage stepper, fact row,
 * tabs, task tree (block 08), project-scoped money timeline (block 03), site
 * feed, and the persistent needs-a-decision panel.
 *
 * The role cut is the selector's, not this screen's — `workspace()` returns
 * `money: null` for Team, and the Money tab is absent rather than disabled
 * (§3.2, §9.2 rule #6).
 */

import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { ChangePreview } from '@/blocks/ChangePreview';
import { TaskTree } from '@/blocks/TaskTree';
import { ModeSwitch } from '@/chrome/ModeSwitch';
import { DecisionPanel } from '@/chrome/workspace/DecisionPanel';
import { FactRow } from '@/chrome/workspace/FactRow';
import { MoneyPanel } from '@/chrome/workspace/MoneyPanel';
import { SiteFeed } from '@/chrome/workspace/SiteFeed';
import { StageStepper } from '@/chrome/workspace/StageStepper';
import { isBuilt, type Tab, tabsFor, UnbuiltTab } from '@/chrome/workspace/tabs';
import { moneyWindow } from '@/domain/selectors/money';
import { taskTree } from '@/domain/selectors/tasks';
import { workspace } from '@/domain/selectors/workspace';
import type { EntityId, SiteNote } from '@/domain/types';
import { useScenarioPath } from '@/lib/scenarioLink';
import { applyChange, type ChangeSet } from '@/store/change';
import { type EntityTable, useStore } from '@/store/store';

export type ProjectWorkspaceProps = {
  projectId: EntityId;
  /** Tests and `/lab` read from here instead of the live store — see `Money`. */
  stateOverride?: {
    entities: EntityTable;
    siteNotes: SiteNote[];
    currentUserId: EntityId | null;
  };
};

export function ProjectWorkspace({ projectId, stateOverride }: ProjectWorkspaceProps) {
  const storeEntities = useStore((s) => s.entities);
  const storeNotes = useStore((s) => s.siteNotes);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const siteNotes = stateOverride?.siteNotes ?? storeNotes;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const [tab, setTab] = useState<Tab>('overview');
  const [pending, setPending] = useState<ChangeSet | null>(null);

  const view = useMemo(
    () => workspace({ entities, siteNotes, currentUserId }, projectId),
    [entities, siteNotes, currentUserId, projectId],
  );
  const tree = useMemo(() => taskTree({ entities }, projectId), [entities, projectId]);
  const money = useMemo(
    () => (view?.money ? moneyWindow({ entities }, { projectId }) : null),
    [entities, projectId, view?.money],
  );

  if (!view) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-mute text-sm">No such project.</p>
      </main>
    );
  }

  const confirm = (confirmed: ChangeSet) => {
    applyChange(useStore.getState(), confirmed, currentUserId ?? 'person-anil');
    setPending(null);
  };

  const activeTab = view.money === null && tab === 'money' ? 'overview' : tab;

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <p className="text-faint text-xs">Projects › {view.project.name}</p>
        <h1 className="font-display text-ink text-xl">{view.project.name}</h1>
      </header>

      <StageStepper steps={view.stages} />
      <FactRow view={view} />

      <ModeSwitch
        modes={tabsFor(view.money !== null)}
        active={activeTab}
        onChange={setTab}
        label="Project tabs"
      />

      {isBuilt(activeTab) ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border border-line p-4">
            <TaskTree
              nodes={tree}
              subject={view.project.name}
              projectId={projectId}
              onPropose={setPending}
            />
          </section>

          <div className="space-y-4">
            {money ? (
              <MoneyPanel
                projectId={projectId}
                payments={money.payments}
                {...(stateOverride ? { stateOverride: { entities } } : {})}
              />
            ) : null}

            <SiteFeed items={view.feed} />
          </div>
        </div>
      ) : (
        <UnbuiltTab tab={activeTab} />
      )}

      <DecisionPanel
        decisions={view.decisions}
        subject={view.project.name}
        onPropose={setPending}
      />

      {pending ? (
        <ChangePreview changeSet={pending} onConfirm={confirm} onDiscard={() => setPending(null)} />
      ) : null}
    </main>
  );
}

/**
 * The route entry: `/projects/:projectId`.
 *
 * Bracket access because `noPropertyAccessFromIndexSignature` is on, and
 * destructuring rather than `params['x']` because Biome's `useLiteralKeys` then
 * forbids that — the tension documented in HANDOFF.md.
 */
export function ProjectWorkspaceRoute() {
  const { projectId } = useParams();
  const link = useScenarioPath();
  if (projectId === undefined) return <Navigate to={link('/projects')} replace />;
  return <ProjectWorkspace projectId={projectId} />;
}
