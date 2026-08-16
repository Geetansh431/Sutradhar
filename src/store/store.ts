/**
 * The store. Entities keyed by id, plus the state onboarding and Firm Memory
 * read from. `applyChange` in `change.ts` is the only writer — this file only
 * defines the shape and the read/write primitives Immer needs.
 */

import { castDraft } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Document, Entity, EntityId, EntityKind, EntityPatch } from '@/domain/types';
import type { FieldValue } from '@/lib/field';
import type { AuditEntry, Change, ChangeSet, UndoEntry } from './change';

export type OnboardingStep = 'seed' | 'extract' | 'interview' | 'done';

export type Onboarding = {
  step: OnboardingStep;
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
    onboarding: { step: 'seed' },
    interviewAnswered: 0,
    demoSettled: false,
    audit: [],
    undoQueue: [],
    currentUserId: null,

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
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
    confirmedAt: new Date().toISOString(),
  };
}

export const getEntity = (state: AppState, id: EntityId): Entity | undefined => state.entities[id];

export const listEntities = <K extends EntityKind>(
  state: AppState,
  kind: K,
): Extract<Entity, { kind: K }>[] =>
  Object.values(state.entities).filter((e): e is Extract<Entity, { kind: K }> => e.kind === kind);
