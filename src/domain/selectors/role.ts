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

/**
 * The rail's destinations, with the role cut already applied (§4.1, §3.2).
 *
 * Money is absent from a team member's navigation entirely — not shown and
 * disabled, absent. The cut is a data decision, so it happens here.
 */
export type Destination = { path: string; label: string; hint: string };

const ALL_DESTINATIONS: Destination[] = [
  { path: '/', label: 'Home', hint: 'brief + queue' },
  { path: '/projects', label: 'Projects', hint: 'list · board · pipeline' },
  { path: '/money', label: 'Money', hint: 'timeline + ledgers' },
  { path: '/people', label: 'People', hint: 'clients · vendors · team' },
  { path: '/files', label: 'Files', hint: 'tree + versions' },
  { path: '/calendar', label: 'Calendar', hint: 'one deadline axis' },
  { path: '/canvas', label: 'Canvas', hint: 'composed answers' },
  { path: '/memory', label: 'Memory', hint: "what we know / don't" },
];

export function destinations(state: RoleState): Destination[] {
  if (canSeeMoney(state)) return ALL_DESTINATIONS;
  return ALL_DESTINATIONS.filter((d) => d.path !== '/money');
}

/**
 * The pinned screens this user may see (§7.5). Pins are per-user, and an admin
 * pin holding money never reaches a team member.
 */
export function visiblePins<T extends { ownerId: EntityId; containsMoney: boolean }>(
  state: RoleState,
  pinned: T[],
): T[] {
  const money = canSeeMoney(state);
  return pinned.filter(
    (pin) => pin.ownerId === state.currentUserId && (money || !pin.containsMoney),
  );
}
