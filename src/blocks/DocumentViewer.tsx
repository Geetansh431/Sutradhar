/**
 * Block 05 — Document viewer.
 *
 * "The source file with the relevant passage highlighted. Read-only; 'correct
 * this extraction' opens a preview." (§8.1)
 *
 * This is the visible proof behind P5 — every number carries its source. A
 * figure that says "extracted from Payments_Master.xlsx, row 118" is a claim;
 * this block is where the claim can be checked, which is the difference between
 * provenance as a feature and provenance as a footnote.
 *
 * Read-only is the point and not a shortcut: the source document is a record of
 * what someone else wrote, and editing it here would falsify the evidence. What
 * can be corrected is *our reading* of it, which is a change to our data and
 * goes through a preview like every other write (§8.2).
 */

import type { DocumentView } from '@/domain/selectors/documents';
import { cn } from '@/lib/cn';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

export type DocumentViewerProps = {
  view: DocumentView | null;
  /**
   * Which field this document was opened to justify. Without it the viewer is
   * a reader; with it, the reading can be corrected.
   */
  correcting?: { entityId: string; field: string; current: string };
  /**
   * Narrow rendering, for the evidence column — which the layout law fixes at
   * 16rem (§7.3), too tight for a six-column sheet. Rows stack instead of
   * scrolling sideways: a reader checking a figure should not have to drag.
   */
  compact?: boolean;
  onPropose?: (changeSet: ChangeSet) => void;
  loading?: boolean;
  restricted?: boolean;
};

const correctionChange = (
  correcting: NonNullable<DocumentViewerProps['correcting']>,
): ChangeSet['changes'][number] => ({
  // Confirming is the correction that matters most: it promotes a figure we
  // read off a document to one a human has stood behind.
  change: { op: 'confirm', id: correcting.entityId, field: correcting.field },
  before: `${correcting.current} · extracted`,
  after: `${correcting.current} · confirmed`,
  label: `${correcting.field} — checked against the source`,
  confidence: 'high',
});

function LoadingState() {
  const rows = ['a', 'b', 'c', 'd', 'e'];
  return (
    <output aria-label="Loading document" className="block space-y-2 py-2">
      <div className="h-4 w-48 animate-pulse rounded bg-fill-2" />
      {rows.map((row) => (
        <div key={row} className="h-5 animate-pulse rounded bg-fill-2" />
      ))}
    </output>
  );
}

export function DocumentViewer({
  view,
  correcting,
  compact = false,
  onPropose,
  loading = false,
  restricted = false,
}: DocumentViewerProps) {
  if (restricted) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">This document is not yours to open.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  if (view === null) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">That source is not in this scenario.</p>
        <p className="mt-1 text-faint text-xs">
          The figure still names it — we just do not hold the file.
        </p>
      </div>
    );
  }

  const { document, passages, columns, highlightId, unresolvedLocator } = view;
  const isSheet = columns !== null;

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-ink text-xs uppercase tracking-wide">
          {document.name}
        </span>
        <span className="text-faint text-xs">
          {document.folder}
          {document.version ? ` · ${document.version}` : ''}
        </span>
      </figcaption>

      {/* §5.2: a file we could not read is said so plainly, never dropped. */}
      {document.unreadable ? (
        <div className="rounded-md border border-warn/50 bg-warn-soft/30 px-3 py-2">
          <p className="text-ink text-sm">This file could not be read.</p>
          <p className="mt-0.5 text-faint text-xs">
            Handwriting on a photograph. Nothing was extracted from it, so nothing rests on it.
          </p>
        </div>
      ) : passages.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-mute text-sm">We hold this file, but not its contents.</p>
          <p className="mt-1 text-faint text-xs">
            It is on the shelf and in the folder tree — there is simply nothing to quote.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          {isSheet && !compact ? (
            <div className="flex gap-3 border-line border-b px-3 py-1.5 text-faint text-xs uppercase tracking-wide">
              <span className="w-16 shrink-0" />
              {columns.map((column) => (
                <span key={column} className="flex-1 whitespace-nowrap">
                  {column}
                </span>
              ))}
            </div>
          ) : null}

          <ul>
            {passages.map((passage) => {
              const highlighted = passage.id === highlightId;
              return (
                <li
                  key={passage.id}
                  // The highlight is the whole point of the block, so it is the
                  // loudest thing in it.
                  className={cn(
                    'border-line/60 border-b px-3 py-1.5 last:border-0',
                    highlighted && 'border-brand/30 bg-brand-soft',
                  )}
                >
                  {isSheet && passage.cells ? (
                    compact ? (
                      // Label above, cells wrapped beneath — the same row, read
                      // top-to-bottom instead of left-to-right.
                      <div className="text-[0.8125rem]">
                        <span className="text-faint text-xs">{passage.label}</span>
                        <div className="flex flex-wrap gap-x-2">
                          {passage.cells.map((cell, index) =>
                            cell ? (
                              <span
                                key={`${passage.id}-${columns[index] ?? index}`}
                                className={cn(
                                  'tabular',
                                  highlighted ? 'font-medium text-ink' : 'text-mute',
                                )}
                              >
                                {cell}
                              </span>
                            ) : null,
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 text-[0.8125rem]">
                        <span className="w-16 shrink-0 text-faint text-xs">{passage.label}</span>
                        {passage.cells.map((cell, index) => (
                          <span
                            key={`${passage.id}-${columns[index] ?? index}`}
                            className={cn(
                              'tabular flex-1 whitespace-nowrap',
                              highlighted ? 'font-medium text-ink' : 'text-mute',
                            )}
                          >
                            {cell || '—'}
                          </span>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-[0.8125rem]">
                      {passage.label ? (
                        <span className="mr-2 text-faint text-xs">{passage.label}</span>
                      ) : null}
                      <span className={highlighted ? 'font-medium text-ink' : 'text-mute'}>
                        {passage.text}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* A locator we were handed but could not place. Stated, not swallowed —
          a highlight silently missing looks identical to a document with no
          relevant passage, and they mean opposite things. */}
      {unresolvedLocator ? (
        <p className="mt-2 text-faint text-xs">
          The figure cites “{unresolvedLocator}”, which we could not find in this file.
        </p>
      ) : null}

      {correcting && onPropose ? (
        <div className="mt-2 flex flex-wrap items-baseline gap-3 border-line/60 border-t pt-2">
          <button
            type="button"
            onClick={() =>
              onPropose(
                proposeChangeSet({
                  proposedBy: 'user',
                  source: null,
                  changes: [correctionChange(correcting)],
                }),
              )
            }
            className="cursor-pointer text-brand text-xs hover:underline"
          >
            This reading is right — confirm it
          </button>
          <span className="text-faint text-xs">
            The file itself is never edited here. Only what we read from it.
          </span>
        </div>
      ) : null}
    </figure>
  );
}

export { LoadingState as DocumentViewerLoading };
