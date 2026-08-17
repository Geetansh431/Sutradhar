/**
 * Block 01 — Record card.
 *
 * "One entity: canonical fields, status, provenance per field. Editing: inline,
 * field by field." (§8.1)
 *
 * Provenance per *field* is the distinguishing requirement: not one source for
 * the record, but a source for every value on it — which is what makes §2.1's
 * P5 ("every number carries its source") true at the level a user actually
 * inspects.
 *
 * Editing goes through `onPropose`, so a card without one is read-only. No
 * block writes (§8.2).
 */

import { useState } from 'react';
import { FieldCell } from '@/blocks/DataGrid';
import type { EntityId } from '@/domain/types';
import { cn } from '@/lib/cn';
import type { FieldValue } from '@/lib/field';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

/**
 * One row of the card.
 *
 * A record mixes types by nature — a vendor has a string term and a person has
 * a Paise salary — so each row renders itself rather than the card being
 * generic over one value type. `render` is built by `fieldRow` / `plainRow`
 * below, which keep the provenance treatment in one place.
 */
export type RecordField = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  /** Makes this row editable. Requires `onPropose` on the card. */
  editable?: {
    read: () => string;
    toChange: (next: string) => ChangeSet['changes'][number] | null;
  };
};

/** A tracked value: renders with its state treatment and its provenance. */
export const fieldRow = <T,>(
  id: string,
  label: string,
  field: FieldValue<T>,
  format: (value: T) => string,
): RecordField => ({
  id,
  label,
  render: () => <FieldCell field={field} format={format} />,
});

/** A value with no provenance to show — a name, a category, a role. */
export const plainRow = (id: string, label: string, value: string): RecordField => ({
  id,
  label,
  render: () => <span className="text-ink">{value}</span>,
});

export type RecordCardProps = {
  title: string;
  /** A short line under the title — category, role, status. */
  subtitle?: string;
  fields: RecordField[];
  entityId: EntityId;
  onPropose?: (changeSet: ChangeSet) => void;
  /** Actions the record implies. Each opens a preview. */
  actions?: { label: string; onRun: () => void }[];
  loading?: boolean;
  restricted?: boolean;
  restrictedMessage?: string;
};

function EditableValue({
  field,
  onPropose,
  children,
}: {
  field: RecordField;
  onPropose: (changeSet: ChangeSet) => void;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const editable = field.editable;
  if (!editable) return <>{children}</>;

  const commit = () => {
    setEditing(false);
    const change = editable.toChange(draft);
    if (!change) return;
    // A proposal, never a write (§8.2).
    onPropose(proposeChangeSet({ proposedBy: 'user', source: null, changes: [change] }));
  };

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: the row was just clicked to edit
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
        aria-label={`Edit ${field.label}`}
        className="w-full rounded-sm border border-brand bg-paper px-2 py-0.5 text-ink text-sm outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(editable.read());
        setEditing(true);
      }}
      title="Click to edit — nothing is written until you confirm"
      className="w-full cursor-pointer rounded-sm px-1 py-0.5 text-left hover:bg-fill"
    >
      {children}
    </button>
  );
}

function LoadingState() {
  const rows = ['a', 'b', 'c', 'd'];
  return (
    <output aria-label="Loading record" className="block space-y-2">
      <div className="h-5 w-40 animate-pulse rounded bg-fill-2" />
      {rows.map((row) => (
        <div key={row} className="flex gap-3">
          <div className="h-4 w-24 animate-pulse rounded bg-fill-2" />
          <div className="h-4 flex-1 animate-pulse rounded bg-fill-2" />
        </div>
      ))}
    </output>
  );
}

export function RecordCard({
  title,
  subtitle,
  fields,
  onPropose,
  actions,
  loading = false,
  restricted = false,
  restrictedMessage = 'This record is admin-only.',
}: RecordCardProps) {
  if (restricted) {
    return (
      <div className="rounded-md border border-line bg-panel px-4 py-8 text-center">
        <p className="text-mute text-sm">{restrictedMessage}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-md border border-line bg-paper p-4">
        <LoadingState />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-md border border-line bg-paper px-4 py-8 text-center">
        <p className="text-mute text-sm">Nothing recorded for {title} yet.</p>
        <p className="mt-1 text-faint text-xs">Answer a gap question and it fills in.</p>
      </div>
    );
  }

  return (
    <article className="rounded-md border border-line bg-paper">
      <header className="border-line border-b px-4 py-3">
        <h3 className="font-medium text-ink">{title}</h3>
        {subtitle ? <p className="text-faint text-xs">{subtitle}</p> : null}
      </header>

      <dl className="divide-y divide-line/60">
        {fields.map((field) => {
          const rendered = field.render();

          return (
            <div key={field.id} className="flex gap-4 px-4 py-2 text-sm">
              <dt className="w-32 shrink-0 text-mute">{field.label}</dt>
              <dd className="min-w-0 flex-1">
                {field.editable && onPropose ? (
                  <EditableValue field={field} onPropose={onPropose}>
                    {rendered}
                  </EditableValue>
                ) : (
                  rendered
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {actions && actions.length > 0 ? (
        <footer className="flex flex-wrap gap-2 border-line border-t px-4 py-3">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onRun}
              className={cn(
                'cursor-pointer rounded-full border border-brand px-3 py-1',
                'font-medium text-brand text-sm hover:bg-brand hover:text-paper',
              )}
            >
              {action.label}
            </button>
          ))}
        </footer>
      ) : null}

      {onPropose ? (
        <p className="border-line border-t px-4 py-2 text-faint text-xs">
          Click any value to edit — nothing is written until you confirm.
        </p>
      ) : null}
    </article>
  );
}

export { LoadingState as RecordCardLoading };
