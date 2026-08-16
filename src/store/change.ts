/**
 * The single mutation path. Nothing else may write to the store.
 *
 * Enforces, structurally:
 *   - no-AI rule #2 (money state changes are human-only): `settle` ops carry actor 'user'
 *   - no-AI rule #4 (never delete): there is no delete op, only `archive`
 *   - no-AI rule #5 (audit is append-only): audit entries are written here, never elsewhere
 *   - the change-preview contract: AI-proposed sets must be confirmed before applying
 */

import { nanoid } from 'nanoid';
import type { Entity, EntityId, EntityPatch } from '@/domain/types';
import type { SourceRef } from '@/lib/field';
import type { Paise } from '@/lib/money';
import type { Store } from './store';

export type Change =
  | { op: 'create'; entity: Entity }
  | { op: 'update'; id: EntityId; patch: EntityPatch }
  | { op: 'link'; from: EntityId; to: EntityId; relation: 'gated-on' | 'belongs-to' | 'supplies' }
  | { op: 'unlink'; from: EntityId; to: EntityId }
  | { op: 'confirm'; id: EntityId; field: string }
  | { op: 'settle'; id: EntityId; amount: Paise; on: string }
  | { op: 'archive'; id: EntityId; reason: string };
// NOTE: there is deliberately no 'delete'.

export type Confidence = 'high' | 'low';

export type ProposedChange = {
  change: Change;
  /** Rendered as the diff line: "₹2,00,000 → ₹2,80,000" */
  before: string | null;
  after: string;
  label: string;
  confidence: Confidence;
};

export type ChangeSet = {
  id: string;
  proposedBy: 'ai' | 'user';
  source: SourceRef | null;
  changes: ProposedChange[];
  createdAt: string;
  /** AI-proposed sets are inert until a human confirms. */
  confirmedAt: string | null;
  confirmedBy: string | null;
};

export const proposeChangeSet = (
  init: Pick<ChangeSet, 'proposedBy' | 'source' | 'changes'>,
): ChangeSet => ({
  id: nanoid(8),
  createdAt: new Date().toISOString(),
  confirmedAt: null,
  confirmedBy: null,
  ...init,
});

export type AuditEntry = {
  id: string;
  changeSetId: string;
  actor: string;
  proposedBy: 'ai' | 'user';
  at: string;
  summary: string;
  source: SourceRef | null;
};

/** A set that can be undone for 24h (spec §8.3). */
export type UndoEntry = { changeSet: ChangeSet; inverse: Change[]; expiresAt: string };

/**
 * The only function that may write to the store (CLAUDE.md non-negotiable #4).
 * A `ChangeSet` must be confirmed before it applies — AI-proposed sets are inert
 * until a human confirms them (spec §9.2, no-AI rule #2 for money/date changes).
 */
export function applyChange(store: Store, changeSet: ChangeSet, actor: string): void {
  if (!changeSet.confirmedAt) {
    throw new Error(`applyChange: ChangeSet ${changeSet.id} is not confirmed`);
  }

  const inverse: Change[] = [];
  for (const { change } of changeSet.changes) {
    inverse.push(applyOne(store, change));
  }

  store.pushAudit({
    id: nanoid(8),
    changeSetId: changeSet.id,
    actor,
    proposedBy: changeSet.proposedBy,
    at: new Date().toISOString(),
    summary: changeSet.changes.map((c) => c.label).join('; '),
    source: changeSet.source,
  });

  store.commit(changeSet, inverse);
}

/** Applies one op via Immer's `set`, returning its inverse for the undo queue. */
function applyOne(store: Store, change: Change): Change {
  switch (change.op) {
    case 'create': {
      store.setEntity(change.entity.id, change.entity);
      return { op: 'archive', id: change.entity.id, reason: 'undo: create' };
    }
    case 'update': {
      const before = store.getEntitySnapshot(change.id);
      store.patchEntity(change.id, change.patch);
      return { op: 'update', id: change.id, patch: before ?? {} };
    }
    case 'link': {
      store.linkEntities(change.from, change.to, change.relation);
      return { op: 'unlink', from: change.from, to: change.to };
    }
    case 'unlink': {
      store.unlinkEntities(change.from, change.to);
      return { op: 'unlink', from: change.from, to: change.to };
    }
    case 'confirm': {
      store.confirmField(change.id, change.field, 'user');
      return { op: 'confirm', id: change.id, field: change.field };
    }
    case 'settle': {
      store.patchEntity(change.id, { status: 'paid' });
      return { op: 'settle', id: change.id, amount: change.amount, on: change.on };
    }
    case 'archive': {
      store.patchEntity(change.id, { archivedAt: new Date().toISOString() });
      return { op: 'archive', id: change.id, reason: change.reason };
    }
  }
}
