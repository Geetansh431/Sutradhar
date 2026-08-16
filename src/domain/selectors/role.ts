/**
 * The role cut (spec §3.2) — applied here, at the data layer.
 *
 * "The role filter is applied at the data layer, not the view layer. A team
 * member's Canvas query must never retrieve a restricted figure and then hide
 * it — the figure must never be fetched."
 *
 * So screens ask `canSeeMoney` before calling a money selector, rather than
 * fetching a total and rendering it dimmed. The difference is invisible in a
 * screenshot and the whole point in a real system.
 */

import type { EntityId, Person, PersonRole } from '@/domain/types';
import type { EntityTable } from '@/store/store';

export type RoleState = { entities: EntityTable; currentUserId: EntityId | null };

export const currentPerson = (state: RoleState): Person | undefined => {
  if (!state.currentUserId) return undefined;
  const entity = state.entities[state.currentUserId];
  return entity?.kind === 'person' ? entity : undefined;
};

/** Defaults to `team` — the narrower cut — when we cannot tell who is asking. */
export const currentRole = (state: RoleState): PersonRole => currentPerson(state)?.role ?? 'team';

export const isAdmin = (state: RoleState): boolean => currentRole(state) === 'admin';

/**
 * The money line. Admin only — "a team member sees the work; they do not see
 * what the firm makes on it or what anyone is paid".
 */
export const canSeeMoney = (state: RoleState): boolean => isAdmin(state);

/** Money is not in a team member's navigation at all (§3.2). */
export const canReachMoneyScreen = (state: RoleState): boolean => canSeeMoney(state);
