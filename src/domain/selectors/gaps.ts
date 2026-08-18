/**
 * Gaps — spec §8.1, block 10.
 *
 * "What is missing in this context, and what it blocks. Editing: answer inline."
 *
 * Two things distinguish a gap from an empty state. A gap knows *what it
 * blocks* — an absent vendor term is not an empty cell, it is the reason three
 * coverage warnings cannot be computed — and a gap can be closed where it is
 * found, without sending the user somewhere else (§8.2, "no block is a dead end").
 *
 * Scoped by area or by entity, because "what is missing here" only means
 * something relative to a here. A gap list with no context is a to-do list, and
 * §9.3 is explicit that undisciplined proactivity becomes noise.
 */

import type { EntityId } from '@/domain/types';
import { AREA_LABELS, INTERVIEW, type InterviewQuestion } from '@/fixtures/ingestion';
import type { CoverageByArea, EntityTable } from '@/store/store';

export type GapsState = {
  entities: EntityTable;
  coverageByArea: CoverageByArea;
  onboarding: { answered: Record<string, string>; skipped: Record<string, number> };
};

export type CoverageArea = keyof CoverageByArea;

/** One missing thing, and the consequence of it being missing. */
export type Gap = {
  id: string;
  /** The question that would close it — asked as a question, not stated as a lack. */
  question: string;
  /** Tappable answers (§5.3: "never a text field where a choice would do"). */
  options: string[];
  /** What answering unblocks. This is the point — motivation, not inventory. */
  unblocks: string[];
  area: CoverageArea;
  areaLabel: string;
  target: EntityId | null;
};

export type GapView = {
  /** What this list is about: an area name, an entity name, or the firm. */
  subject: string;
  gaps: Gap[];
  /** Coverage for the scope, 0..1. Null when the scope spans several areas. */
  coverage: number | null;
  /**
   * Gaps the firm has actively declined to close — asked twice, skipped twice
   * (§5.3). Counted, never re-asked: nagging is how a product gets muted.
   */
  declined: number;
};

const toGap = (question: InterviewQuestion): Gap => ({
  id: question.id,
  question: question.text,
  options: question.options,
  unblocks: question.unblocks,
  area: question.area,
  areaLabel: AREA_LABELS[question.area],
  target: question.target,
});

const isOpen = (state: GapsState, question: InterviewQuestion): boolean =>
  state.onboarding.answered[question.id] === undefined &&
  (state.onboarding.skipped[question.id] ?? 0) < 2;

const isDeclined = (state: GapsState, question: InterviewQuestion): boolean =>
  state.onboarding.answered[question.id] === undefined &&
  (state.onboarding.skipped[question.id] ?? 0) >= 2;

const nameOf = (state: GapsState, id: EntityId): string => {
  const entity = state.entities[id];
  return entity && 'name' in entity ? entity.name : id;
};

/**
 * Every gap in one coverage area — what the Canvas asks for when a question
 * resolves to a `gap` block.
 */
export function gapsInArea(state: GapsState, area: CoverageArea): GapView {
  const inArea = INTERVIEW.filter((question) => question.area === area);
  return {
    subject: AREA_LABELS[area],
    gaps: inArea.filter((question) => isOpen(state, question)).map(toGap),
    coverage: state.coverageByArea[area],
    declined: inArea.filter((question) => isDeclined(state, question)).length,
  };
}

/** Every gap that lands on one entity — a vendor's missing terms, say. */
export function gapsForEntity(state: GapsState, entityId: EntityId): GapView {
  const onEntity = INTERVIEW.filter((question) => question.target === entityId);
  return {
    subject: nameOf(state, entityId),
    gaps: onEntity.filter((question) => isOpen(state, question)).map(toGap),
    // An entity's gaps can span areas, so no single coverage figure is honest.
    coverage: null,
    declined: onEntity.filter((question) => isDeclined(state, question)).length,
  };
}

/** Everything still open, firm-wide. Firm Memory's "Fill a gap" panel. */
export function allGaps(state: GapsState, limit?: number): GapView {
  const open = INTERVIEW.filter((question) => isOpen(state, question)).map(toGap);
  return {
    subject: 'the firm',
    gaps: limit === undefined ? open : open.slice(0, limit),
    coverage: null,
    declined: INTERVIEW.filter((question) => isDeclined(state, question)).length,
  };
}

/**
 * Narrows a plan's `area` string to a real coverage area.
 *
 * `plan.ts` types it as a string, and rule 8 forbids casting it into one — so
 * a plan naming an area the firm does not track fails visibly rather than
 * resolving to an empty list that looks like "nothing missing".
 */
export const isCoverageArea = (value: string): value is CoverageArea =>
  Object.hasOwn(AREA_LABELS, value);
