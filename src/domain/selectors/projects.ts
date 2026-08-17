/**
 * Projects and the pipeline — spec §6.2.
 *
 * "The pipeline matters disproportionately because every field in it —
 * feasibility, likelihood, expected profit, follow-up state — currently exists
 * only in the founder's memory. It is the purest demonstration of the product's
 * premise."
 *
 * The observations at the bottom are the sharp end of that, and they are
 * governed by §9.3: say the consequence, not the fact. "Waiting 9 days" is a
 * fact. "Last three deals that crossed 7 days here were lost" is why it matters.
 */

import type { EntityId, PipelineStage, Project } from '@/domain/types';
import { daysFromToday } from '@/lib/dates';
import { hasValue } from '@/lib/field';
import type { EntityTable } from '@/store/store';

export type ProjectsState = { entities: EntityTable };

export const PIPELINE_STAGES: PipelineStage[] = ['enquiry', 'feasibility', 'quoted', 'negotiating'];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  enquiry: 'Enquiry',
  feasibility: 'Feasibility',
  quoted: 'Quoted',
  negotiating: 'Negotiating',
};

const projects = (state: ProjectsState): Project[] =>
  Object.values(state.entities).filter((e): e is Project => e.kind === 'project');

/** The header count: "13 total · 6 live · 4 in pipeline · 3 closed". */
export type ProjectCounts = { total: number; live: number; pipeline: number; closed: number };

export function projectCounts(state: ProjectsState): ProjectCounts {
  const all = projects(state);
  return {
    total: all.length,
    live: all.filter((project) => project.status === 'live').length,
    pipeline: all.filter((project) => project.status === 'pipeline').length,
    closed: all.filter((project) => project.status === 'past' || project.status === 'lost').length,
  };
}

/**
 * How long a deal has sat in its current stage, and whether that is unusual.
 *
 * "Ageing is shown in accent when it exceeds the firm's own historical pattern"
 * (§6.2) — the firm's own, not a generic threshold, which is the difference
 * between a warning that means something and one that gets muted.
 */
const STALE_AFTER_DAYS: Record<PipelineStage, number> = {
  enquiry: 7,
  feasibility: 10,
  quoted: 7,
  negotiating: 14,
};

export type PipelineCard = {
  id: EntityId;
  name: string;
  /** Estimated value, formatted by the caller so this stays money-free. */
  value: Project['value'];
  likelihood: Project['likelihood'];
  /** One line of state (§6.2). */
  note: string | null;
  daysInStage: number;
  /** True once past the firm's own pattern for this stage. */
  ageing: boolean;
  hasOwner: boolean;
  hasFollowUp: boolean;
};

export function pipelineCard(project: Project): PipelineCard {
  const days = project.stageSince ? Math.abs(daysFromToday(project.stageSince)) : 0;
  const threshold = project.pipelineStage ? STALE_AFTER_DAYS[project.pipelineStage] : 14;

  return {
    id: project.id,
    name: project.name,
    value: project.value,
    likelihood: project.likelihood,
    note: project.note,
    daysInStage: days,
    ageing: days > threshold,
    hasOwner: project.ownerId !== null,
    hasFollowUp: project.nextFollowUp !== null,
  };
}

/** The board, in stage order. */
export function pipelineBoard(state: ProjectsState): Record<PipelineStage, PipelineCard[]> {
  const board: Record<PipelineStage, PipelineCard[]> = {
    enquiry: [],
    feasibility: [],
    quoted: [],
    negotiating: [],
  };

  for (const project of projects(state)) {
    if (project.status !== 'pipeline' || !project.pipelineStage) continue;
    board[project.pipelineStage].push(pipelineCard(project));
  }

  for (const stage of PIPELINE_STAGES) {
    board[stage].sort((a, b) => b.daysInStage - a.daysInStage);
  }

  return board;
}

/**
 * "Sutradhar noticed" — two to four proactive observations (§6.2).
 *
 * Each must clear §9.3's bar: a concrete, dated consequence, said as the
 * consequence rather than the fact. An observation that only restated the card
 * would be noise, and noise is how a product gets muted.
 */
export type Observation = {
  id: string;
  /** The sentence. States what it costs, not what it is. */
  text: string;
  /** The one action it implies. Opens a change preview; never writes. */
  action: string;
  targetId: EntityId;
};

type Ageing = { project: Project; card: PipelineCard };

/** Deals past the firm's own pattern for their stage, worst first. */
const ageingDeals = (pipeline: Project[]): Ageing[] =>
  pipeline
    .map((project) => ({ project, card: pipelineCard(project) }))
    .filter(({ card }) => card.ageing)
    .sort((a, b) => b.card.daysInStage - a.card.daysInStage);

/** What ageing has cost this firm before — the consequence, not the fact. */
function ageingObservation(worst: Ageing, lostCount: number): Observation | null {
  const stage = worst.project.pipelineStage;
  if (!stage) return null;

  const threshold = STALE_AFTER_DAYS[stage];
  const history =
    lostCount > 0
      ? `The last ${lostCount === 1 ? 'deal' : `${lostCount} deals`} that crossed ${threshold} days here ${lostCount === 1 ? 'was' : 'were'} lost.`
      : `Deals that cross ${threshold} days here tend not to close.`;

  return {
    id: `obs-ageing-${worst.project.id}`,
    text: `${worst.project.name} has been sitting in ${STAGE_LABEL[stage]} for ${worst.card.daysInStage} days. ${history}`,
    action: 'Nudge client',
    targetId: worst.project.id,
  };
}

/** Nobody is carrying it — no owner and nothing booked. */
function unownedObservation(unowned: Project[]): Observation | null {
  const first = unowned[0];
  if (!first) return null;

  return {
    id: `obs-unowned-${first.id}`,
    text:
      `${first.name} has no owner and no follow-up set. ` +
      (unowned.length === 1
        ? 'It is the only enquiry with neither.'
        : `${unowned.length} enquiries are in the same position.`),
    action: 'Assign',
    targetId: first.id,
  };
}

/** Furthest along, nothing scheduled — where the payment vacuum starts. */
function unscheduledObservation(state: ProjectsState, pipeline: Project[]): Observation | null {
  const first = pipeline.find(
    (project) =>
      project.pipelineStage === 'negotiating' &&
      !Object.values(state.entities).some(
        (entity) => entity.kind === 'payment' && entity.projectId === project.id,
      ),
  );
  if (!first) return null;

  return {
    id: `obs-no-schedule-${first.id}`,
    text: `${first.name} contract is drafted but no payment schedule exists yet — that is where vacuums begin.`,
    action: 'Build schedule',
    targetId: first.id,
  };
}

export function observations(state: ProjectsState): Observation[] {
  const all = projects(state);
  const pipeline = all.filter((project) => project.status === 'pipeline');
  const lostCount = all.filter((project) => project.status === 'lost').length;

  const ageing = ageingDeals(pipeline);
  const unowned = pipeline.filter((project) => project.ownerId === null && !project.nextFollowUp);

  // One of each kind, worst first. Three near-identical ageing lines would be
  // noise, and §9.3 is explicit that noise is how a product gets muted.
  const found = [
    ageing[0] ? ageingObservation(ageing[0], lostCount) : null,
    unownedObservation(unowned),
    unscheduledObservation(state, pipeline),
  ].filter((observation): observation is Observation => observation !== null);

  // Room left? Name the next-worst rather than padding.
  const second = ageing[1];
  if (found.length < 4 && second?.project.pipelineStage) {
    found.push({
      id: `obs-ageing-${second.project.id}`,
      text: `${second.project.name} has been in ${STAGE_LABEL[second.project.pipelineStage]} ${second.card.daysInStage} days, with no follow-up booked.`,
      action: 'Nudge client',
      targetId: second.project.id,
    });
  }

  // Two to four (§6.2). More than four is a list nobody reads.
  return found.slice(0, 4);
}

/** Rows for list mode's data grid (§6.2). */
export type ProjectRow = {
  id: EntityId;
  name: string;
  stage: string;
  clientName: string;
  value: Project['value'];
  status: Project['status'];
  note: string | null;
};

export function projectRows(state: ProjectsState): ProjectRow[] {
  return projects(state)
    .filter((project) => project.archivedAt === null)
    .map((project) => {
      const client = state.entities[project.clientId];
      return {
        id: project.id,
        name: project.name,
        stage: project.pipelineStage ? STAGE_LABEL[project.pipelineStage] : (project.stage ?? '—'),
        clientName: client && 'name' in client ? client.name : 'Unknown',
        value: project.value,
        status: project.status,
        note: project.note,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export { hasValue };
