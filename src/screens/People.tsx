/**
 * People — spec §6.5.
 *
 * "Three segments of one entity model: clients, vendors, team. Segmented
 * control at the top, shared record structure underneath."
 *
 * The shared structure is why this screen is short: one record card (block 01)
 * and one ledger (block 04), configured per segment. Three bespoke panels would
 * have been three places for the provenance treatment to drift.
 *
 * Two cuts from §3.2 apply: salary is admin-only, and so is a vendor's rate.
 * Both are dropped from the field list rather than rendered and hidden.
 */

import { useMemo, useState } from 'react';
import { ChangePreview } from '@/blocks/ChangePreview';
import { Ledger } from '@/blocks/Ledger';
import { fieldRow, plainRow, RecordCard, type RecordField } from '@/blocks/RecordCard';
import { type ModeOption, ModeSwitch } from '@/chrome/ModeSwitch';
import { ledgerFor, loadFor, type Segment, segmentRows } from '@/domain/selectors/people';
import { canSeeMoney } from '@/domain/selectors/role';
import type { Client, EntityId, Person, Vendor } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/money';
import { applyChange, type ChangeSet } from '@/store/change';
import { type EntityTable, useStore } from '@/store/store';

const SEGMENTS: ModeOption<Segment>[] = [
  { id: 'clients', label: 'Clients' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'team', label: 'Team' },
];

/** The record's fields, per segment. §6.5 lists what each holds. */
function fieldsFor(
  entity: Client | Vendor | Person,
  seesMoney: boolean,
  load: { title: string; project: string }[],
): RecordField[] {
  const text = (value: string) => value;

  if (entity.kind === 'vendor') {
    return [
      plainRow('category', 'Category', entity.category),
      ...(entity.contact ? [fieldRow('contact', 'Contact', entity.contact, text)] : []),
      // Missing terms are a gap, not a blank (§6.5) — FieldCell renders it so.
      ...(entity.paymentTerms
        ? [fieldRow('terms', 'Payment terms', entity.paymentTerms, text)]
        : []),
    ];
  }

  if (entity.kind === 'client') {
    return entity.contact ? [fieldRow('contact', 'Contact', entity.contact, text)] : [];
  }

  const fields: RecordField[] = [
    plainRow('role', 'Role', entity.role === 'admin' ? 'Admin' : 'Team'),
    plainRow(
      'load',
      'Assigned',
      load.length === 0
        ? 'nothing assigned'
        : load.map((item) => `${item.title} (${item.project})`).join(', '),
    ),
  ];

  // "Salary is admin-only" (§6.5, §3.2) — absent, not hidden.
  if (seesMoney && entity.salary) {
    fields.push(fieldRow('salary', 'Salary', entity.salary, formatINR));
  }

  return fields;
}

export type PeopleProps = {
  /** See `MoneyProps` — a static render never sees a store reset. */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null };
};

export function People({ stateOverride }: PeopleProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const [segment, setSegment] = useState<Segment>('vendors');
  const [selectedId, setSelectedId] = useState<EntityId | null>(null);
  const [pending, setPending] = useState<ChangeSet | null>(null);

  const seesMoney = canSeeMoney({ entities, currentUserId });

  const rows = useMemo(() => segmentRows({ entities }, segment), [entities, segment]);
  const selected = selectedId ? entities[selectedId] : undefined;
  const active = selected ?? (rows[0] ? entities[rows[0].id] : undefined);

  const record = useMemo(() => {
    // Only the three People kinds have a record here; anything else is not a
    // person and has no card.
    const subject =
      active && (active.kind === 'client' || active.kind === 'vendor' || active.kind === 'person')
        ? active
        : null;
    if (!subject) return null;

    return {
      id: subject.id,
      name: subject.name,
      kind: subject.kind,
      fields: fieldsFor(subject, seesMoney, loadFor({ entities }, subject.id)),
      // A team member sees no ledger — it is money either way (§3.2).
      ledger: seesMoney ? ledgerFor({ entities }, subject.id) : null,
    };
  }, [active, entities, seesMoney]);

  const confirm = (confirmed: ChangeSet) => {
    applyChange(useStore.getState(), confirmed, currentUserId ?? 'person-anil');
    setPending(null);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">People</h1>
        <p className="text-mute text-sm">Clients, vendors and team — one record structure</p>
      </header>

      <ModeSwitch
        modes={SEGMENTS}
        active={segment}
        onChange={(next) => {
          setSegment(next);
          setSelectedId(null);
        }}
        label="People segment"
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        {/* The segmented list. */}
        <ul className="space-y-1">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cn(
                  'w-full cursor-pointer rounded-md border px-3 py-2 text-left transition-colors',
                  active?.id === row.id
                    ? 'border-brand bg-brand-soft/50'
                    : 'border-line bg-paper hover:border-line-strong',
                )}
              >
                <p className="font-medium text-ink text-sm">{row.name}</p>
                <p className="text-faint text-xs">{row.detail}</p>
                {/* The gap is shown in the list, not only on the record. */}
                {row.gap ? <p className="fv-missing text-xs">{row.gap}</p> : null}
              </button>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="rounded-md border border-line bg-paper px-3 py-6 text-center">
              <p className="text-mute text-sm">Nobody here yet.</p>
            </li>
          ) : null}
        </ul>

        {/* The record, and its ledger. */}
        <div className="min-w-0 space-y-4">
          {record ? (
            <>
              <RecordCard
                title={record.name}
                subtitle={record.kind}
                fields={record.fields}
                entityId={record.id}
                onPropose={setPending}
              />

              {record.ledger ? (
                <section className="rounded-md border border-line bg-paper p-4">
                  <Ledger
                    lines={record.ledger.lines}
                    outstanding={record.ledger.outstanding}
                    subject={record.name}
                    onPropose={setPending}
                  />
                </section>
              ) : null}
            </>
          ) : (
            <p className="rounded-md border border-line bg-paper px-4 py-8 text-center text-mute text-sm">
              Pick someone to see their record.
            </p>
          )}

          {pending ? (
            <ChangePreview
              changeSet={pending}
              onConfirm={confirm}
              onDiscard={() => setPending(null)}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
