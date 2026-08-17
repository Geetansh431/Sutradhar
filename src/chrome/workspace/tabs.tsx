/**
 * The workspace's six tabs — spec §6.3.
 *
 * "Overview, Tasks, Money, Files, People, Activity. Money tab hidden for Team
 * role." Hidden, not disabled: a tab a role may never open is not a door with a
 * lock on it, it is not a door (§3.2).
 *
 * Four of the six are unbuilt. The placeholder says so plainly rather than
 * rendering an empty panel that reads as a bug — the demo never shows a dead
 * end it does not admit to.
 */

import type { ModeOption } from '@/chrome/ModeSwitch';

export type Tab = 'overview' | 'tasks' | 'money' | 'files' | 'people' | 'activity';

const ALL_TABS: ModeOption<Tab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'money', label: 'Money' },
  { id: 'files', label: 'Files' },
  { id: 'people', label: 'People' },
  { id: 'activity', label: 'Activity' },
];

export const tabsFor = (seesMoney: boolean): ModeOption<Tab>[] =>
  seesMoney ? ALL_TABS : ALL_TABS.filter((tab) => tab.id !== 'money');

/** Overview and Tasks both lead with the tree; the rest are not built. */
export const isBuilt = (tab: Tab): boolean => tab === 'overview' || tab === 'tasks';

export function UnbuiltTab({ tab }: { tab: Tab }) {
  const label = ALL_TABS.find((option) => option.id === tab)?.label ?? tab;
  return (
    <section className="rounded-lg border border-line px-4 py-10 text-center">
      <p className="text-mute text-sm">{label} is not built in the prototype.</p>
    </section>
  );
}
