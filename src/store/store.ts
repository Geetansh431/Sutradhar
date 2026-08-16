/**
 * The store. Entities keyed by id, plus the state onboarding and Firm Memory
 * read from. `applyChange` in `change.ts` is the only writer — this file only
 * defines the shape and the read/write primitives Immer needs.
 */

import { castDraft } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Document, Entity, EntityId, EntityKind, EntityPatch } from '@/domain/types';
import { hoursFromNow, nowISO } from '@/lib/dates';
import type { FieldValue } from '@/lib/field';
import type { AuditEntry, Change, ChangeSet, UndoEntry } from './change';

export type OnboardingStep = 'seed' | 'extract' | 'interview' | 'done';

export type Onboarding = {
  step: OnboardingStep;
  /** Question ids the user has answered, and what they said. */
  answered: Record<string, string>;
  /**
   * Question ids skipped, and how many times. "Skipping is recorded, and
   * re-asked later at most twice" (§5.3) — so a question skipped twice stops
   * being offered rather than nagging.
   */
  skipped: Record<string, number>;
  /** Files that have finished ingesting, for the replayed animation. */
  ingested: string[];
};

/**
 * The six areas on Firm Memory's coverage-by-area panel, named as
 * `w10_firm_memory.png` labels them (spec §6.8).
 */
export type CoverageArea =
  | 'projectsStages'
  | 'moneyClientSide'
  | 'moneyVendorSide'
  | 'vendorsProfiles'
  | 'teamLeaveSalary'
  | 'companyFinances';

export type CoverageByArea = Record<CoverageArea, number>;

export type EntityTable = Record<EntityId, Entity>;

/**
 * A canvas the user kept — spec §7.5. "Any composition the user keeps becomes a
 * permanent screen in their rail. They designed it by asking a question, not by
 * configuring anything."
 *
 * It stores the question, not the answer: a pinned canvas re-runs its query on
 * open, so a pin cannot go stale the way a saved screenshot would.
 */
export type PinnedScreen = {
  id: EntityId;
  /** Renameable; defaults to the question that produced it. */
  name: string;
  questionId: string;
  /** Per-user by default (§7.5). */
  ownerId: EntityId;
  /** Admin pins holding money are never visible to Team (§7.5). */
  containsMoney: boolean;
  pinnedAt: string;
};

export type AppState = {
  entities: EntityTable;
  documents: Document[];
  /** Overall coverage, 0..1 — the headline number on Home and Firm Memory. */
  coverage: number;
  coverageByArea: CoverageByArea;
  onboarding: Onboarding;
  interviewAnswered: number;
  demoSettled: boolean;
  audit: AuditEntry[];
  undoQueue: UndoEntry[];
  currentUserId: EntityId | null;
  /** The user's own screens, shown in the rail below Firm Memory (§4.2). */
  pinned: PinnedScreen[];
};

export type Store = AppState & {
  reset: (next: AppState) => void;
  commit: (changeSet: ChangeSet, inverse: Change[]) => void;
  pushAudit: (entry: AuditEntry) => void;
  setEntity: (id: EntityId, entity: Entity) => void;
  getEntitySnapshot: (id: EntityId) => EntityPatch | undefined;
  patchEntity: (id: EntityId, patch: EntityPatch) => void;
  linkEntities: (
    from: EntityId,
    to: EntityId,
    relation: 'gated-on' | 'belongs-to' | 'supplies',
  ) => void;
  unlinkEntities: (from: EntityId, to: EntityId) => void;
  confirmField: (id: EntityId, field: string, confirmedBy: string) => void;
  /** The demo's role switcher — §3.2, "two seeded logins ... visible switcher". */
  setCurrentUser: (id: EntityId) => void;
  /** Records an interview answer and moves the coverage it unblocks. */
  answerQuestion: (questionId: string, answer: string, area: CoverageArea) => void;
  /** Records a skip. Twice and the question is retired (§5.3). */
  skipQuestion: (questionId: string) => void;
  /** Records a parsed file and adds the coverage its contents imply. */
  markIngested: (fileId: string, adds: Partial<Record<CoverageArea, number>>) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  pin: (screen: PinnedScreen) => void;
  unpin: (id: EntityId) => void;
};

export const useStore = create<Store>()(
  immer((set, get) => ({
    entities: {},
    documents: [],
    coverage: 0,
    coverageByArea: {
      projectsStages: 0,
      moneyClientSide: 0,
      moneyVendorSide: 0,
      vendorsProfiles: 0,
      teamLeaveSalary: 0,
      companyFinances: 0,
    },
    onboarding: { step: 'seed', answered: {}, skipped: {}, ingested: [] },
    interviewAnswered: 0,
    demoSettled: false,
    audit: [],
    undoQueue: [],
    currentUserId: null,
    pinned: [],

    reset: (next) =>
      set((state) => {
        Object.assign(state, next);
      }),

    commit: (changeSet, inverse) =>
      set((state) => {
        state.undoQueue.push(
          castDraft({
            changeSet,
            inverse,
            // Undo stays available for 24h — spec §8.3.
            expiresAt: hoursFromNow(24),
          }),
        );
      }),

    pushAudit: (entry) =>
      set((state) => {
        state.audit.push(entry);
      }),

    // The casts in this function and confirmField below are the one sanctioned boundary
    // where the generic store crosses the 7-type Entity union by string key — TypeScript
    // cannot type a write-by-field-name across a discriminated union. Every caller above
    // this file stays fully typed; do not spread casts beyond these two functions.
    setEntity: (id, entity) =>
      set((state) => {
        state.entities[id] = entity as never;
      }),

    getEntitySnapshot: (id) => {
      const entity = get().entities[id];
      return entity ? { ...entity } : undefined;
    },

    patchEntity: (id, patch) =>
      set((state) => {
        const entity = state.entities[id];
        if (!entity) return;
        Object.assign(entity, patch);
      }),

    linkEntities: (from, to, relation) =>
      set((state) => {
        if (relation !== 'gated-on') return;
        const entity = state.entities[from];
        if (entity?.kind === 'payment') entity.gatedOn = to;
      }),

    unlinkEntities: (from, _to) =>
      set((state) => {
        const entity = state.entities[from];
        if (entity?.kind === 'payment') entity.gatedOn = null;
      }),

    setCurrentUser: (id) =>
      set((state) => {
        state.currentUserId = id;
      }),

    answerQuestion: (questionId, answer, area) =>
      set((state) => {
        state.onboarding.answered[questionId] = answer;
        delete state.onboarding.skipped[questionId];
        // Coverage moves because a gap was filled — the bar responding is the
        // point of §6.8's "motivation is the point".
        const current = state.coverageByArea[area];
        state.coverageByArea[area] = Math.min(1, current + 0.04);
        const areas = Object.values(state.coverageByArea);
        state.coverage = areas.reduce((sum, value) => sum + value, 0) / areas.length;
      }),

    skipQuestion: (questionId) =>
      set((state) => {
        state.onboarding.skipped[questionId] = (state.onboarding.skipped[questionId] ?? 0) + 1;
      }),

    markIngested: (fileId, adds) =>
      set((state) => {
        // Idempotent: the replay may fire twice under StrictMode, and coverage
        // must not double-count a file.
        if (state.onboarding.ingested.includes(fileId)) return;
        state.onboarding.ingested.push(fileId);

        for (const [area, amount] of Object.entries(adds)) {
          const key = area as CoverageArea;
          state.coverageByArea[key] = Math.min(1, state.coverageByArea[key] + (amount ?? 0));
        }
        const areas = Object.values(state.coverageByArea);
        state.coverage = areas.reduce((sum, value) => sum + value, 0) / areas.length;
      }),

    setOnboardingStep: (step) =>
      set((state) => {
        state.onboarding.step = step;
      }),

    pin: (screen) =>
      set((state) => {
        if (state.pinned.some((p) => p.id === screen.id)) return;
        state.pinned.push(screen);
      }),

    unpin: (id) =>
      set((state) => {
        state.pinned = state.pinned.filter((p) => p.id !== id);
      }),

    confirmField: (id, field, confirmedBy) =>
      set((state) => {
        const entity = state.entities[id];
        if (!entity) return;
        const bag = entity as unknown as Record<string, FieldValue<unknown>>;
        const confirmed = confirmFieldValue(bag[field], id, field, confirmedBy);
        if (confirmed) bag[field] = confirmed;
      }),
  })),
);

/** Promotes an extracted or inferred field to confirmed. Anything else is left as-is. */
function confirmFieldValue(
  current: FieldValue<unknown> | undefined,
  id: EntityId,
  field: string,
  confirmedBy: string,
): FieldValue<unknown> | undefined {
  if (!current || current.state === 'confirmed') return undefined;
  if (current.state !== 'extracted' && current.state !== 'inferred') return undefined;
  return {
    state: 'confirmed',
    value: current.value,
    source:
      current.state === 'extracted'
        ? current.source
        : { kind: 'derived', id: `${id}-${field}`, label: 'inferred value' },
    confirmedBy,
    confirmedAt: nowISO(),
  };
}

export const getEntity = (state: AppState, id: EntityId): Entity | undefined => state.entities[id];

export const listEntities = <K extends EntityKind>(
  state: AppState,
  kind: K,
): Extract<Entity, { kind: K }>[] =>
  Object.values(state.entities).filter((e): e is Extract<Entity, { kind: K }> => e.kind === kind);
