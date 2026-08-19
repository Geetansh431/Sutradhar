/**
 * Documents and the passages figures came from — spec §8.1 block 05, §6.6.
 *
 * "Any figure extracted from a file links back to it, opening in the document
 * viewer at the relevant passage."
 *
 * The passage is addressed by `SourceRef.locator`, which is a human string —
 * 'row 4', 'p.2 clause 4', 'msg 214'. Matching is therefore by id equality
 * against the content's own line ids, and a locator that matches nothing
 * resolves to the document with no highlight rather than to an error: the
 * source still exists, we just cannot point at the line.
 */

import type { Document, DocumentContent, EntityId } from '@/domain/types';
import type { SourceRef } from '@/lib/field';

export type DocumentsState = { documents: Document[] };

/** One line of a document, flattened for the viewer to paint. */
export type Passage = {
  id: string;
  /** Rendered left of the line: a row number, a clause, an author. */
  label: string | null;
  text: string;
  /** Cells, when the document is a sheet — so a row stays a row. */
  cells: string[] | null;
};

export type DocumentView = {
  document: Document;
  /** Column headers, for a sheet. Null for every other shape. */
  columns: string[] | null;
  passages: Passage[];
  /** The passage the locator pointed at, if we could find it. */
  highlightId: string | null;
  /** Said out loud when a locator names a line we cannot find. */
  unresolvedLocator: string | null;
};

const flatten = (content: DocumentContent): { columns: string[] | null; passages: Passage[] } => {
  switch (content.shape) {
    case 'sheet':
      return {
        columns: content.columns,
        passages: content.rows.map((row) => ({
          id: row.id,
          label: row.id,
          text: row.cells.join(' · '),
          cells: row.cells,
        })),
      };

    case 'pages':
      return {
        columns: null,
        passages: content.pages.flatMap((page) =>
          page.lines.map((line) => ({
            id: line.id,
            label: page.label,
            text: line.text,
            cells: null,
          })),
        ),
      };

    case 'thread':
      return {
        columns: null,
        passages: content.messages.map((msg) => ({
          id: msg.id,
          label: `${msg.author} · ${msg.at}`,
          text: msg.text,
          cells: null,
        })),
      };

    case 'image':
      // A photograph has no lines. What the extractor thought it read is shown
      // as the single passage, marked as a reading rather than a quotation.
      return {
        columns: null,
        passages: content.transcribed
          ? [
              {
                id: 'transcribed',
                label: 'read from the image',
                text: content.transcribed,
                cells: null,
              },
            ]
          : [],
      };
  }
};

/**
 * Open a document, optionally at a passage.
 *
 * Returns `null` only when no such document exists — a document we hold with
 * no content still opens, because "we have this file and cannot read it" is
 * itself worth showing (§5.2).
 */
export function documentView(
  state: DocumentsState,
  documentId: EntityId,
  locator?: string | null,
): DocumentView | null {
  const document = state.documents.find((candidate) => candidate.id === documentId);
  if (!document) return null;

  const { columns, passages } = document.content
    ? flatten(document.content)
    : { columns: null, passages: [] };

  const found = locator ? passages.find((passage) => passage.id === locator) : undefined;

  return {
    document,
    columns,
    passages,
    highlightId: found?.id ?? null,
    // A locator we were given but could not place is stated, not swallowed.
    unresolvedLocator: locator && !found ? locator : null,
  };
}

/** Open a document straight from the source a figure carries. */
export function viewForSource(state: DocumentsState, source: SourceRef): DocumentView | null {
  if (source.kind !== 'document') return null;
  return documentView(state, source.id, source.locator ?? null);
}
