/**
 * Block 02 — Data grid.
 *
 * "Any list of records. Filter, sort, group, column pick. Cell-level inline
 * edit; multi-select bulk actions." (spec §8.1). It appears in Money, the
 * Projects list, and the Canvas, so it is generic over its row type: a caller
 * supplies columns, the grid supplies the behaviour.
 *
 * The universal contract (§8.2) in this block:
 *   editable in place  — a cell with `editable` opens an input; committing it
 *                        raises a ChangeSet, never a direct write
 *   provenance-bearing — every FieldValue cell carries its state class and a
 *                        title naming the source
 *   exportable         — CSV, from the footer
 *   pinnable           — the caller wires `onPin`; the affordance lives here
 *   write-gated        — `onPropose` receives a ChangeSet. If a caller does not
 *                        pass it, cells are not editable at all.
 */

import { useMemo, useState } from 'react';
import type { EntityId } from '@/domain/types';
import { cn } from '@/lib/cn';
import type { FieldValue } from '@/lib/field';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

/**
 * Sorting is hand-rolled rather than TanStack's.
 *
 * SETUP.md budgets @tanstack/react-table for this block, and v8 would have
 * earned its place. But v9 restructured the API around opt-in features and
 * types that resist a generic `<TRow>` wrapper — every column definition ends
 * up fighting `RowData`, and the escape hatch is an `any` that CLAUDE.md rule 8
 * forbids. What this block actually needs from it today is a comparator and a
 * direction, which is the twenty lines below.
 *
 * Revisit when grouping and column-pick land: those are where the library pays
 * for itself, and it may be worth wrapping a non-generic table per row type.
 */

export type GridAlign = 'left' | 'right';

/** A column, described in the product's terms rather than the table library's. */
export type GridColumn<TRow> = {
  id: string;
  /** Uppercase, tracked — the header style on w09. */
  header: string;
  /** What the cell shows. Return a string, or a node for anything richer. */
  cell: (row: TRow) => React.ReactNode;
  /** The value sorting compares. Omit to make the column unsortable. */
  sortValue?: (row: TRow) => string | number;
  align?: GridAlign;
  /** Money and other figures use tabular numerals so columns line up. */
  tabular?: boolean;
  /**
   * Makes the cell editable in place. `read` seeds the input, `toChange` turns
   * the committed text into a change. Requires `onPropose` on the grid.
   */
  editable?: {
    read: (row: TRow) => string;
    toChange: (row: TRow, next: string) => ChangeSet['changes'][number] | null;
  };
  /** CSV value. Defaults to the cell's text content where that is a string. */
  csv?: (row: TRow) => string;
};

export type DataGridProps<TRow> = {
  rows: TRow[];
  columns: GridColumn<TRow>[];
  rowId: (row: TRow) => EntityId;
  /** Shown when `rows` is empty — never a blank panel (§1.3). */
  emptyMessage?: string;
  emptyHint?: string;
  loading?: boolean;
  /** Team members never see firm money — spec §3.2. */
  restricted?: boolean;
  restrictedMessage?: string;
  /** Multi-select and its bulk actions. Omit to disable selection. */
  bulkActions?: { label: string; onRun: (ids: EntityId[]) => void }[];
  /** Every write goes through here as a proposal. Omit to make the grid read-only. */
  onPropose?: (changeSet: ChangeSet) => void;
  onSelectRow?: (id: EntityId) => void;
  /** Rows the caller wants marked — the coverage gap highlights its payments. */
  highlightIds?: ReadonlySet<EntityId>;
  caption?: string;
  /** Footer affordances, as w09 words them. */
  onPin?: () => void;
  askHint?: boolean;
};

/** The `.fv-*` class for a field state — defined once, in globals.css. */
export const fieldStateClass = (state: FieldValue<unknown>['state']): string =>
  state === 'extracted'
    ? 'fv-extracted'
    : state === 'inferred'
      ? 'fv-inferred'
      : state === 'conflicting'
        ? 'fv-conflicting'
        : state === 'missing'
          ? 'fv-missing'
          : '';

/**
 * Renders a FieldValue with its state treatment and provenance. Every cell that
 * shows a stored figure should go through this rather than reaching for
 * `.value` — that is what makes rule §8.2's "provenance-bearing" true.
 */
export function FieldCell<T>({
  field,
  format,
  className,
}: {
  field: FieldValue<T>;
  format: (value: T) => string;
  className?: string;
}) {
  if (field.state === 'missing') {
    return (
      <span
        className={cn('fv-missing', className)}
        title={`Missing · blocks ${field.blocks.join(', ')}`}
      >
        — add
      </span>
    );
  }
  if (field.state === 'conflicting') {
    const shown = field.candidates.map((c) => format(c.value)).join(' / ');
    return (
      <span
        className={cn('fv-conflicting', className)}
        title={`Sources disagree: ${field.candidates.map((c) => `${format(c.value)} (${c.source.label})`).join(' · ')}`}
      >
        {shown}
      </span>
    );
  }

  const source =
    field.state === 'confirmed'
      ? `Confirmed · ${field.source.label}${field.source.locator ? ` · ${field.source.locator}` : ''}`
      : field.state === 'extracted'
        ? `Extracted · ${field.source.label}${field.source.locator ? ` · ${field.source.locator}` : ''}`
        : `Inferred · ${field.workings}`;

  return (
    <span className={cn(fieldStateClass(field.state), className)} title={source}>
      {field.state === 'inferred' ? '≈ ' : ''}
      {format(field.value)}
    </span>
  );
}

function EditableCell<TRow>({
  row,
  column,
  onPropose,
}: {
  row: TRow;
  column: GridColumn<TRow>;
  onPropose: (changeSet: ChangeSet) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const editable = column.editable;
  if (!editable) return <>{column.cell(row)}</>;

  const commit = () => {
    setEditing(false);
    const change = editable.toChange(row, draft);
    if (!change) return;
    // No direct writes: the edit becomes a proposal the human confirms.
    onPropose(proposeChangeSet({ proposedBy: 'user', source: null, changes: [change] }));
  };

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: the cell was just clicked to edit
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-full rounded-sm border border-brand bg-paper px-1 py-0.5 text-[0.8125rem] outline-none"
        aria-label={`Edit ${column.header}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(editable.read(row));
        setEditing(true);
      }}
      className="w-full cursor-pointer rounded-sm px-1 py-0.5 text-left hover:bg-fill"
      title="Click to edit — nothing is written until you confirm"
    >
      {column.cell(row)}
    </button>
  );
}

function GridRow<TRow>({
  id,
  row,
  columns,
  highlighted,
  selectable,
  isSelected,
  onToggleSelect,
  onSelect,
  onPropose,
}: {
  id: EntityId;
  row: TRow;
  columns: GridColumn<TRow>[];
  highlighted: boolean;
  selectable: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSelect?: () => void;
  onPropose?: (changeSet: ChangeSet) => void;
}) {
  return (
    <tr
      className={cn(
        'border-line/60 border-b last:border-0',
        highlighted && 'bg-brand-soft/50',
        onSelect && 'cursor-pointer hover:bg-fill/60',
      )}
      {...(onSelect ? { onClick: onSelect } : {})}
    >
      {selectable ? (
        <td className="px-2 py-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select row ${id}`}
          />
        </td>
      ) : null}
      {columns.map((column) => (
        <td
          key={column.id}
          className={cn(
            'px-3 py-2',
            column.align === 'right' ? 'text-right' : 'text-left',
            column.tabular && 'tabular',
          )}
        >
          {column.editable && onPropose ? (
            <EditableCell row={row} column={column} onPropose={onPropose} />
          ) : (
            column.cell(row)
          )}
        </td>
      ))}
    </tr>
  );
}

type SortState = { columnId: string; desc: boolean } | null;

function HeaderCell<TRow>({
  column,
  sort,
  onToggle,
}: {
  column: GridColumn<TRow>;
  sort: SortState;
  onToggle: () => void;
}) {
  const active = sort?.columnId === column.id;
  const className = cn(
    'px-3 py-2 font-medium text-faint text-xs uppercase tracking-wide',
    column.align === 'right' ? 'text-right' : 'text-left',
  );

  if (column.sortValue === undefined) {
    return (
      <th aria-sort="none" className={className}>
        {column.header}
      </th>
    );
  }

  return (
    <th
      aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}
      className={className}
    >
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer uppercase tracking-wide hover:text-ink"
      >
        {column.header}
        {active ? (sort.desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  );
}

const toCsv = <TRow,>(rows: TRow[], columns: GridColumn<TRow>[]): string => {
  const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = columns.map((c) => quote(c.header)).join(',');
  const body = rows.map((row) =>
    columns
      .map((c) => {
        if (c.csv) return quote(c.csv(row));
        const cell = c.cell(row);
        return quote(typeof cell === 'string' || typeof cell === 'number' ? String(cell) : '');
      })
      .join(','),
  );
  return [head, ...body].join('\n');
};

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-mute text-sm">{message}</p>
      {hint ? <p className="text-faint text-xs">{hint}</p> : null}
    </div>
  );
}

function LoadingState() {
  const rows = ['a', 'b', 'c', 'd'];
  return (
    <output aria-label="Loading rows" className="block space-y-2 py-3">
      {rows.map((r) => (
        <div key={r} className="h-6 animate-pulse rounded-sm bg-fill-2" />
      ))}
    </output>
  );
}

export function DataGrid<TRow>({
  rows,
  columns,
  rowId,
  emptyMessage = 'Nothing here yet.',
  emptyHint,
  loading = false,
  restricted = false,
  restrictedMessage = 'This view is admin-only.',
  bulkActions,
  onPropose,
  onSelectRow,
  highlightIds,
  caption,
  onPin,
  askHint = true,
}: DataGridProps<TRow>) {
  const [selected, setSelected] = useState<ReadonlySet<EntityId>>(new Set());
  const [sort, setSort] = useState<{ columnId: string; desc: boolean } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.id === sort.columnId);
    const value = column?.sortValue;
    if (!value) return rows;
    return [...rows].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      const order =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.desc ? -order : order;
    });
  }, [rows, columns, sort]);

  const toggleSort = (columnId: string) =>
    setSort((current) =>
      current?.columnId === columnId
        ? current.desc
          ? null // third click clears — back to the order the selector gave
          : { columnId, desc: true }
        : { columnId, desc: false },
    );

  if (restricted) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
        <p className="text-mute text-sm">{restrictedMessage}</p>
        <p className="text-faint text-xs">Your sites and today's work are on Home.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;
  if (rows.length === 0)
    return <EmptyState message={emptyMessage} {...(emptyHint ? { hint: emptyHint } : {})} />;

  const selectable = bulkActions !== undefined && bulkActions.length > 0;
  const allSelected = selected.size > 0 && selected.size === rows.length;

  const toggle = (id: EntityId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const download = () => {
    const csv = toCsv(rows, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caption ?? 'export'}.csv`.replace(/\s+/g, '-').toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0">
      {selectable && selected.size > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-brand-soft px-3 py-2 text-sm">
          <span className="text-brand">{selected.size} selected</span>
          {bulkActions?.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => action.onRun([...selected])}
              className="rounded border border-brand px-2 py-0.5 text-brand text-xs hover:bg-brand hover:text-paper"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.8125rem]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-line border-b">
              {selectable ? (
                <th className="w-8 px-2 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map(rowId)))}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <HeaderCell
                  key={column.id}
                  column={column}
                  sort={sort}
                  onToggle={() => toggleSort(column.id)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const id = rowId(row);
              return (
                <GridRow
                  key={id}
                  id={id}
                  row={row}
                  columns={columns}
                  highlighted={highlightIds?.has(id) ?? false}
                  selectable={selectable}
                  isSelected={selected.has(id)}
                  onToggleSelect={() => toggle(id)}
                  {...(onSelectRow ? { onSelect: () => onSelectRow(id) } : {})}
                  {...(onPropose ? { onPropose } : {})}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <FooterStrip
        editable={onPropose !== undefined}
        askHint={askHint}
        onExport={download}
        {...(onPin ? { onPin } : {})}
      />
    </div>
  );
}

/** The footer strip, worded as w09 words it. */
function FooterStrip({
  editable,
  askHint,
  onExport,
  onPin,
}: {
  editable: boolean;
  askHint: boolean;
  onExport: () => void;
  onPin?: () => void;
}) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-faint text-xs">
      {editable ? <span>Click any cell to edit</span> : null}
      {askHint ? <span>⌘K to ask about this view</span> : null}
      <button type="button" onClick={onExport} className="cursor-pointer hover:text-ink">
        Export CSV
      </button>
      {onPin ? (
        <button type="button" onClick={onPin} className="cursor-pointer hover:text-ink">
          Pin
        </button>
      ) : null}
    </p>
  );
}

export { LoadingState as DataGridLoading, toCsv };
