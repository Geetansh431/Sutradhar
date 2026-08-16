/**
 * Block 09 — Change preview.
 *
 * "The only door AI has into the firm's data. Specified in full because getting
 * it wrong invalidates the trust the whole product depends on." (spec §8.3)
 *
 * Every element of that section is a requirement, so each is named here:
 *   header count   — how many objects will change, before any of them do
 *   source line    — what produced this, one click to open
 *   per-object diff — a type tag, the object, and before → after. Never prose.
 *   per-object confidence — "unsure — check me" is marked, never hidden
 *   actions        — Confirm all (primary), Edit, Discard. ⌘↵ confirms.
 *   reversibility  — undo for 24h, stated on the block itself
 *   audit          — written by `applyChange`, not here
 *
 * This block never writes. It hands a confirmed ChangeSet back to its caller,
 * and `applyChange` is the only thing that touches the store (rule 4).
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { nowISO } from '@/lib/dates';
import type { Change, ChangeSet, ProposedChange } from '@/store/change';

/** NEW / EDIT / LINK — derived from the op, never stored twice. */
export const changeTag = (change: Change): string => {
  switch (change.op) {
    case 'create':
      return 'NEW';
    case 'update':
    case 'confirm':
    case 'settle':
      return 'EDIT';
    case 'link':
      return 'LINK';
    case 'unlink':
      return 'UNLINK';
    case 'archive':
      return 'ARCHIVE';
  }
};

/**
 * The wireframe's tag list includes DELETE, but there is no delete op — no-AI
 * rule #4. `archive` is the strongest thing that can be proposed, and it says
 * so rather than borrowing the harsher word.
 *
 * Every tag renders in accent. Amber means "we are unsure" everywhere else in
 * the product (§5.5 — inferred and conflicting), so using it for a certain
 * archive would say the wrong thing about the row's confidence.
 */
const tagTone = (): string => 'border-brand text-brand';

/** A row's identity: what it does and to what, so keys survive a reorder. */
const changeKey = (proposed: ProposedChange, index: number): string => {
  const change = proposed.change;
  const target =
    change.op === 'create'
      ? change.entity.id
      : change.op === 'link' || change.op === 'unlink'
        ? `${change.from}-${change.to}`
        : change.id;
  return `${change.op}-${target}-${index}`;
};

function ConfidenceMark({ confidence }: { confidence: ProposedChange['confidence'] }) {
  if (confidence === 'high') {
    return <span className="font-medium text-ok text-xs">confident</span>;
  }
  // Marked, never hidden, never silently dropped.
  return <span className="font-medium text-warn text-xs">unsure — check me</span>;
}

function DiffLine({ proposed }: { proposed: ProposedChange }) {
  if (proposed.before === null) {
    return <p className="text-mute text-sm">{proposed.after}</p>;
  }
  return (
    <p className="text-mute text-sm">
      <span className="tabular">{proposed.before}</span>
      <span className="mx-1.5 text-faint">→</span>
      <span className="tabular text-ink">{proposed.after}</span>
    </p>
  );
}

function ChangeRow({
  proposed,
  onEdit,
}: {
  proposed: ProposedChange;
  onEdit?: (() => void) | undefined;
}) {
  const tag = changeTag(proposed.change);
  return (
    <li
      className={cn(
        'rounded-md border p-3',
        proposed.confidence === 'low' ? 'border-warn/50 bg-warn-soft/30' : 'border-line bg-panel',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 font-medium text-[0.6875rem] tracking-wide',
              tagTone(),
            )}
          >
            {tag}
          </span>
          <span className="font-medium text-ink">{proposed.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceMark confidence={proposed.confidence} />
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="cursor-pointer text-faint text-xs hover:text-ink"
            >
              Edit
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-1.5">
        <DiffLine proposed={proposed} />
      </div>
    </li>
  );
}

export type ChangePreviewProps = {
  changeSet: ChangeSet;
  /**
   * Receives the set with `confirmedAt`/`confirmedBy` filled in. The caller
   * passes it to `applyChange` — this block never writes.
   */
  onConfirm: (confirmed: ChangeSet) => void;
  onDiscard?: () => void;
  /** Opens the source that produced the proposal — the file, message or note. */
  onOpenSource?: () => void;
  /** Lets a row be corrected before confirming (§8.3, "Edit any line"). */
  onEditRow?: (index: number) => void;
  /** Who is confirming. Money state changes are human-only — no-AI rule #2. */
  confirmedBy?: string;
};

export function ChangePreview({
  changeSet,
  onConfirm,
  onDiscard,
  onOpenSource,
  onEditRow,
  confirmedBy = 'person-anil',
}: ChangePreviewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const count = changeSet.changes.length;

  const confirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    onConfirm({ ...changeSet, confirmedAt: nowISO(), confirmedBy });
  };

  // ⌘↵ confirms — "the admin will do this twenty times a day". The handler is
  // held in a ref so the listener registers once rather than on every render.
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        confirmRef.current();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, []);

  if (count === 0) {
    return (
      <div className="rounded-md border border-line p-4 text-center">
        <p className="text-mute text-sm">Nothing to confirm.</p>
        <p className="text-faint text-xs">A proposal appears here when something is captured.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="rounded-md border border-ok/50 bg-ok-soft/40 p-4">
        <p className="font-medium text-ink text-sm">
          {count} {count === 1 ? 'change' : 'changes'} confirmed.
        </p>
        <p className="mt-1 text-mute text-xs">
          Undo stays available for 24 hours — reversibility is a promise, not a setting.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-brand">
      {/* Header: states how many objects will change before any of them do. */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-brand-soft px-4 py-3">
        <h3 className="font-medium text-brand text-sm uppercase tracking-wide">
          {count} {count === 1 ? 'change' : 'changes'} proposed
        </h3>
        {changeSet.source ? (
          <span className="text-mute text-xs">
            from:{' '}
            {onOpenSource ? (
              <button
                type="button"
                onClick={onOpenSource}
                className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-ink"
              >
                {changeSet.source.label}
              </button>
            ) : (
              changeSet.source.label
            )}
          </span>
        ) : null}
      </header>

      <div className="space-y-3 p-4">
        {/* Source line — what produced this proposal, verbatim. */}
        {changeSet.source?.locator ? (
          <p className="text-faint text-sm italic">“{changeSet.source.locator}”</p>
        ) : null}

        <ul className="space-y-2">
          {changeSet.changes.map((proposed, index) => (
            <ChangeRow
              key={changeKey(proposed, index)}
              proposed={proposed}
              {...(onEditRow ? { onEdit: () => onEditRow(index) } : {})}
            />
          ))}
        </ul>

        <div className="border-line border-t border-dashed pt-3">
          <p className="text-faint text-xs">
            Nothing is written until you confirm. Undo stays available for 24 hours.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={confirm}
              className="cursor-pointer rounded-md bg-brand px-4 py-1.5 font-medium text-paper text-sm hover:bg-accent-hover"
            >
              Confirm all
            </button>
            {onEditRow ? (
              <button
                type="button"
                onClick={() => onEditRow(0)}
                className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-mute text-sm hover:text-ink"
              >
                Edit
              </button>
            ) : null}
            {onDiscard ? (
              <button
                type="button"
                onClick={onDiscard}
                className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-mute text-sm hover:text-ink"
              >
                Discard
              </button>
            ) : null}
            <span className="ml-auto text-faint text-xs">⌘↵ to confirm</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <output aria-label="Preparing a change preview" className="block">
      <div className="space-y-2 rounded-md border border-line p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-fill-2" />
        <div className="h-14 animate-pulse rounded bg-fill-2" />
        <div className="h-14 animate-pulse rounded bg-fill-2" />
      </div>
    </output>
  );
}

export { LoadingState as ChangePreviewLoading };
