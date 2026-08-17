/**
 * The project workspace — spec §6.3, wireframe w08.
 *
 * "One project, everything about it." The stage stepper is the firm's own
 * lifecycle, not an abstract kanban, so the eight stages are fixed and named
 * here once.
 *
 * The role cut runs *inside* this selector, not over its output. §3.2 gives
 * Team no money and no deal values, and §9.2 rule #6 names showing-then-hiding
 * as the failure mode — so `money` is `null` for Team and the figures are never
 * computed at all.
 *
 * ONE DOCUMENTED DIVERGENCE FROM w08. The fact row on the wireframe reads
 * "Margin now 12.4%", and no combination of the Iyer figures it prints in the
 * same row produces that number: value ₹18,40,000, received ₹9,20,000, spent
 * ₹7,10,000 give 11.4% as (received − spent)/value and 61.4% as
 * (value − spent)/value. The spec (§6.3) names the field but never defines it,
 * and no demo beat in §10 turns on the figure.
 *
 * Rather than reverse-engineer a fixture to land on 12.4%, margin is defined
 * here the way a design firm means it — value less what is paid out and less
 * what is ordered but unbilled — and `committed` was added to carry the second
 * term. Iyer's ₹4,50,000 committed is its three open outflows on w09 (Sharma
 * ₹80,000 + ₹2,00,000, Godrej ₹1,70,000), so the number traces to payments the
 * demo already shows. Iyer reads 37.0%.
 *
 * This is the one place the wireframe does not win, because here it cannot: its
 * own numbers contradict it. Flagged rather than quietly reconciled.
 */

import type { EntityId, Project, ProjectStage, SiteNote } from '@/domain/types';
import { daysFromToday } from '@/lib/dates';
import { hasValue, isConfirmed, type Total, totalMoney } from '@/lib/field';
import { type Paise, ratioPaise, subPaise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';
import { canSeeMoney, type RoleState } from './role';

export type WorkspaceState = {
  entities: EntityTable;
  siteNotes: SiteNote[];
  currentUserId: EntityId | null;
};

/** §6.3: eight stages, in the firm's own order. */
export const PROJECT_STAGES: ProjectStage[] = [
  'enquiry',
  'feasibility',
  'cad',
  'concept',
  'contract',
  'vendors',
  'execution',
  'handover',
];

export const PROJECT_STAGE_LABEL: Record<ProjectStage, string> = {
  enquiry: 'Enquiry',
  feasibility: 'Feasibility',
  cad: 'CAD',
  concept: 'Concept',
  contract: 'Contract',
  vendors: 'Vendors',
  execution: 'Execution',
  handover: 'Handover',
};

/** One dot on the stepper: done, current, or not yet reached. */
export type StageStep = {
  stage: ProjectStage;
  label: string;
  state: 'done' | 'current' | 'ahead';
};

export function stageSteps(project: Project): StageStep[] {
  const current = project.stage;
  const currentIndex = current ? PROJECT_STAGES.indexOf(current) : -1;
  return PROJECT_STAGES.map((stage, index) => ({
    stage,
    label: PROJECT_STAGE_LABEL[stage],
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'ahead',
  }));
}

/**
 * The money half of the fact row. Admin-only, and absent rather than zeroed
 * for anyone else.
 *
 * Margin is derived from confirmed figures only: a margin that quietly mixes a
 * confirmed receipt with one read off a photograph is exactly the total P4
 * forbids. Both totals carry their own exclusions.
 */
export type ProjectMoney = {
  value: Project['value'];
  received: Total;
  spent: Total;
  committed: Total;
  /** Value less what has been paid out and what has been ordered. */
  margin: Paise;
  /** The same as a share of the project's value, or null when value is unconfirmed. */
  marginPct: number | null;
  /** True when a figure the margin rests on is not confirmed — say so, never hide it. */
  restsOnUnconfirmed: boolean;
};

function projectMoney(project: Project): ProjectMoney {
  const received = totalMoney(project.received);
  const spent = totalMoney(project.spent);
  const committed = totalMoney(project.committed);

  // Cost is real when the work is ordered, not when the cheque clears — so
  // committed money is subtracted alongside spent. Margin computed from spent
  // alone is the blindness the change-order story is about.
  const margin = hasValue(project.value)
    ? subPaise(subPaise(project.value.value, spent.value), committed.value)
    : ZERO;

  return {
    value: project.value,
    received,
    spent,
    committed,
    margin,
    marginPct: hasValue(project.value) ? ratioPaise(margin, project.value.value) : null,
    restsOnUnconfirmed:
      !isConfirmed(project.value) || spent.excludedCount > 0 || committed.excludedCount > 0,
  };
}

/** One post in the site feed (§6.3), newest first, author resolved. */
export type FeedItem = {
  id: EntityId;
  author: string;
  at: string;
  text: string;
  photoCount: number;
};

export function siteFeed(state: WorkspaceState, projectId: EntityId): FeedItem[] {
  return state.siteNotes
    .filter((note) => note.projectId === projectId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((note) => {
      const author = state.entities[note.authorId];
      return {
        id: note.id,
        author: author && 'name' in author ? author.name : 'Unknown',
        at: note.at,
        text: note.text,
        photoCount: note.photoCount,
      };
    });
}

/**
 * The persistent accent panel: anything unpriced or unapproved (§6.3).
 *
 * In the demo this holds the unpriced change order — the margin-leak story. The
 * figure at risk is an estimate and says so: it is not a `Confirmed` value and
 * never enters a total.
 */
export type Decision = {
  id: EntityId;
  title: string;
  /** What happened, in the product's voice: consequence, not status. */
  detail: string;
  action: string;
};

function decisions(state: WorkspaceState, projectId: EntityId, showMoney: boolean): Decision[] {
  const found: Decision[] = [];

  for (const entity of Object.values(state.entities)) {
    if (entity.kind !== 'task') continue;
    if (entity.projectId !== projectId || entity.archivedAt !== null) continue;
    if (entity.status !== 'needs-decision') continue;

    const note = state.siteNotes
      .filter((n) => n.projectId === projectId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .find((n) => n.text.toLowerCase().includes('wardrobe'));

    const age = note ? Math.abs(daysFromToday(note.at.slice(0, 10))) : null;
    const logged = age === null ? 'Logged on site' : `Logged on site ${age} days ago`;

    found.push({
      id: entity.id,
      title: `Change order: ${entity.title.replace(/\s*\(change order\)\s*/i, '')}`,
      // The rupee figure is money, so Team is not told what is at risk.
      detail: showMoney
        ? `${logged}, unpriced. Silent margin at risk.`
        : `${logged}, unpriced. It has not been quoted to the client.`,
      action: 'Price it',
    });
  }

  return found;
}

export type Workspace = {
  project: Project;
  clientName: string;
  stages: StageStep[];
  handoverDate: Project['handoverDate'];
  /** Null for Team — never computed, not computed-and-hidden (§3.2). */
  money: ProjectMoney | null;
  feed: FeedItem[];
  decisions: Decision[];
};

export function workspace(state: WorkspaceState, projectId: EntityId): Workspace | null {
  const project = state.entities[projectId];
  if (!project || project.kind !== 'project' || project.archivedAt !== null) return null;

  const roleState: RoleState = { entities: state.entities, currentUserId: state.currentUserId };
  const showMoney = canSeeMoney(roleState);
  const client = state.entities[project.clientId];

  return {
    project,
    clientName: client && 'name' in client ? client.name : 'Unknown',
    stages: stageSteps(project),
    handoverDate: project.handoverDate,
    money: showMoney ? projectMoney(project) : null,
    feed: siteFeed(state, projectId),
    decisions: decisions(state, projectId, showMoney),
  };
}
