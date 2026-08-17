/**
 * People — spec §6.5. "Three segments of one entity model: clients, vendors,
 * team. Segmented control at the top, shared record structure underneath."
 *
 * The shared structure is the point: a client, a vendor and a team member are
 * the same shape with different fields, which is why the screen composes one
 * record card rather than three bespoke panels.
 */

import type { LedgerLine } from '@/blocks/Ledger';
import type { Client, EntityId, Payment, Person, Vendor } from '@/domain/types';
import { hasValue, isConfirmed, type Total, totalMoney } from '@/lib/field';
import { addPaise, type Paise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';

export type PeopleState = { entities: EntityTable };

export type Segment = 'clients' | 'vendors' | 'team';

/** One row in the segmented list. */
export type PersonRow = {
  id: EntityId;
  name: string;
  /** Category, role, or the client's project count. */
  detail: string;
  /** A gap worth showing in the list itself — missing terms (§6.5). */
  gap: string | null;
};

const entitiesOf = <K extends 'client' | 'vendor' | 'person'>(
  state: PeopleState,
  kind: K,
): Extract<Client | Vendor | Person, { kind: K }>[] =>
  Object.values(state.entities).filter(
    (entity): entity is Extract<Client | Vendor | Person, { kind: K }> =>
      entity.kind === kind && entity.archivedAt === null,
  );

const paymentsOf = (state: PeopleState, counterpartyId: EntityId): Payment[] =>
  Object.values(state.entities)
    .filter(
      (entity): entity is Payment =>
        entity.kind === 'payment' &&
        entity.counterpartyId === counterpartyId &&
        entity.archivedAt === null,
    )
    .sort((a, b) => {
      const left = hasValue(a.due) ? a.due.value : '';
      const right = hasValue(b.due) ? b.due.value : '';
      return left.localeCompare(right);
    });

export function segmentRows(state: PeopleState, segment: Segment): PersonRow[] {
  if (segment === 'clients') {
    return entitiesOf(state, 'client').map((client) => {
      const projects = Object.values(state.entities).filter(
        (entity) => entity.kind === 'project' && entity.clientId === client.id,
      );
      return {
        id: client.id,
        name: client.name,
        detail: `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`,
        gap: client.contact?.state === 'missing' ? 'no contact on file' : null,
      };
    });
  }

  if (segment === 'vendors') {
    return entitiesOf(state, 'vendor').map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      detail: vendor.category,
      // "Missing terms are shown as gaps, not blanks" (§6.5).
      gap: vendor.paymentTerms?.state === 'missing' ? 'no payment terms' : null,
    }));
  }

  return entitiesOf(state, 'person').map((person) => {
    const assigned = person.assignedProjectIds.length;
    return {
      id: person.id,
      name: person.name,
      detail: person.role === 'admin' ? 'admin' : 'team',
      gap: assigned === 0 ? 'nothing assigned' : null,
    };
  });
}

/**
 * A running ledger for one counterparty (§8.1, block 04).
 *
 * The balance runs over every line with a value, so an extracted figure still
 * moves it — hiding an unpaid bill because it came off a photograph would
 * understate what is owed. The *total* excludes it and says so (rule 3).
 */
export function ledgerFor(
  state: PeopleState,
  counterpartyId: EntityId,
): {
  lines: LedgerLine[];
  outstanding: Total;
} {
  const payments = paymentsOf(state, counterpartyId);

  let balance = ZERO;
  const lines: LedgerLine[] = payments.map((payment) => {
    if (hasValue(payment.amount) && payment.status !== 'paid') {
      balance = addPaise(balance, payment.amount.value);
    }
    return {
      id: payment.id,
      date: payment.due,
      description: describe(state, payment),
      amount: payment.amount,
      status: payment.status,
      balance,
    };
  });

  const unpaid = payments.filter((payment) => payment.status !== 'paid');
  return { lines, outstanding: totalMoney(unpaid.map((payment) => payment.amount)) };
}

const describe = (state: PeopleState, payment: Payment): string => {
  const project = payment.projectId ? state.entities[payment.projectId] : undefined;
  const where = project && 'name' in project ? project.name : 'firm-level';
  return payment.direction === 'in' ? `Instalment · ${where}` : `Bill · ${where}`;
};

/** Confirmed money only, for anything that must not include a guess. */
export const confirmedOutstanding = (lines: LedgerLine[]): Paise =>
  lines
    .filter((line) => line.status !== 'paid' && isConfirmed(line.amount))
    .reduce(
      (total, line) => (isConfirmed(line.amount) ? addPaise(total, line.amount.value) : total),
      ZERO,
    );

/** Everything assigned to a team member, for §6.5's load view. */
export function loadFor(
  state: PeopleState,
  personId: EntityId,
): { title: string; project: string }[] {
  return Object.values(state.entities)
    .filter(
      (entity) =>
        entity.kind === 'task' && entity.assigneeId === personId && entity.status !== 'done',
    )
    .map((task) => {
      if (task.kind !== 'task') return { title: '', project: '' };
      const project = state.entities[task.projectId];
      return {
        title: task.title,
        project: project && 'name' in project ? project.name : '—',
      };
    });
}
