/**
 * Block 05 and the document selector behind it.
 *
 * This block is the proof behind P5 — "every number carries its source" — so
 * the assertions that matter are about honesty rather than layout: the passage
 * a figure cites is the one highlighted, a citation we cannot place is said out
 * loud, and a photograph is never presented as if it were a quotation.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DocumentViewer } from '@/blocks/DocumentViewer';
import { documentView, viewForSource } from '@/domain/selectors/documents';
import { buildState } from '@/fixtures/scenarios';

const DOCS = { documents: buildState('live').documents };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

describe('documentView — resolving a citation', () => {
  it('highlights the row a figure names', () => {
    const view = documentView(DOCS, 'doc-payments-master', 'row 118');
    expect(view?.highlightId).toBe('row 118');
    expect(view?.unresolvedLocator).toBeNull();
  });

  it('flattens a sheet into rows that keep their cells', () => {
    const view = documentView(DOCS, 'doc-payments-master', 'row 118');
    const row = view?.passages.find((passage) => passage.id === 'row 118');
    expect(row?.cells).toContain('2,50,000');
  });

  it('reads a clause out of a PDF page', () => {
    const view = documentView(DOCS, 'doc-iyer-contract', 'p.2 clause 4');
    expect(view?.highlightId).toBe('p.2 clause 4');
    expect(view?.passages.find((p) => p.id === 'p.2 clause 4')?.text).toContain('28 September');
  });

  it('reads a message out of a chat export', () => {
    const view = documentView(DOCS, 'doc-whatsapp-kormangala', 'msg 214');
    expect(view?.passages.find((p) => p.id === 'msg 214')?.label).toContain('Ravi');
  });

  it('names a citation it cannot place rather than silently not highlighting', () => {
    // A missing highlight and a document with no relevant passage look
    // identical on screen, and they mean opposite things.
    const view = documentView(DOCS, 'doc-payments-master', 'row 9999');
    expect(view?.highlightId).toBeNull();
    expect(view?.unresolvedLocator).toBe('row 9999');
  });

  it('opens a document we hold but cannot quote', () => {
    const view = documentView(DOCS, 'doc-agreements');
    expect(view).not.toBeNull();
    expect(view?.passages).toHaveLength(0);
  });

  it('returns null only when the file is not in this scenario', () => {
    expect(documentView(DOCS, 'doc-does-not-exist')).toBeNull();
  });

  it('opens straight from the source a figure carries', () => {
    const view = viewForSource(DOCS, {
      kind: 'document',
      id: 'doc-payments-master',
      label: 'Payments_Master.xlsx',
      locator: 'row 4',
    });
    expect(view?.highlightId).toBe('row 4');
  });

  it('has nothing to open for a source that is not a document', () => {
    expect(viewForSource(DOCS, { kind: 'human', id: 'h', label: 'Anil' })).toBeNull();
  });
});

describe('DocumentViewer — the block', () => {
  it('names the file and where it sits', () => {
    const html = text(
      renderToStaticMarkup(
        <DocumentViewer view={documentView(DOCS, 'doc-payments-master', 'row 118')} />,
      ),
    );
    expect(html).toContain('Payments_Master.xlsx');
    expect(html).toContain('Firm/Finance');
  });

  it('says an unreadable file could not be read, and that nothing rests on it', () => {
    const html = text(
      renderToStaticMarkup(<DocumentViewer view={documentView(DOCS, 'doc-img-2231')} />),
    );
    expect(html).toContain('could not be read');
    expect(html).toContain('nothing rests on it');
  });

  it('presents a photograph as a reading, never as a quotation', () => {
    const html = text(
      renderToStaticMarkup(<DocumentViewer view={documentView(DOCS, 'doc-vendor-bills')} />),
    );
    expect(html).toContain('read from the image');
    expect(html).toContain('handwriting unclear');
  });

  it('offers no correction without somewhere to put it — the file is never edited', () => {
    const html = text(
      renderToStaticMarkup(
        <DocumentViewer view={documentView(DOCS, 'doc-payments-master', 'row 118')} />,
      ),
    );
    expect(html).not.toContain('confirm it');
  });

  it('corrects our reading, not the document', () => {
    const html = text(
      renderToStaticMarkup(
        <DocumentViewer
          view={documentView(DOCS, 'doc-vendor-bills', 'transcribed')}
          correcting={{ entityId: 'payment-kumar-earlier', field: 'amount', current: '₹1,02,000' }}
          onPropose={() => {}}
        />,
      ),
    );
    expect(html).toContain('confirm it');
    expect(html).toContain('The file itself is never edited here');
  });

  it('says a source is absent rather than rendering an empty frame', () => {
    const html = text(renderToStaticMarkup(<DocumentViewer view={null} />));
    expect(html).toContain('not in this scenario');
  });

  it('does not open a document for a role that may not see it', () => {
    const html = text(
      renderToStaticMarkup(
        <DocumentViewer
          view={documentView(DOCS, 'doc-iyer-contract', 'p.2 clause 4')}
          restricted
        />,
      ),
    );
    expect(html).toContain('not yours to open');
    expect(html).not.toContain('28 September');
  });
});
