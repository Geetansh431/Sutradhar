/**
 * The grid's rendered output and its contract obligations (spec §8.2).
 *
 * The important assertions here are the ones about writes: a cell only becomes
 * editable when a caller passes `onPropose`, and committing an edit produces an
 * unconfirmed ChangeSet rather than touching the store.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataGrid, type GridColumn, toCsv } from '@/blocks/DataGrid';
import { paymentColumns, uncoveredIds } from '@/blocks/paymentColumns';
import { moneyWindow } from '@/domain/selectors/money';
import { buildState } from '@/fixtures/scenarios';
import { rupees } from '@/lib/money';

const LIVE = { entities: buildState('live').entities };
const rows = moneyWindow(LIVE).payments;
const columns = paymentColumns({
  gateLabel: (id) => (id === 'payment-iyer-instalment-3' ? 'Iyer inst. 3' : id),
});

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('the payment grid — w09', () => {
  const html = render(
    <DataGrid
      rows={rows}
      columns={columns}
      rowId={(p) => p.id}
      highlightIds={uncoveredIds(rows)}
      onPropose={() => {}}
    />,
  );

  it('has the seven columns w09 names, in order', () => {
    const headers = [...html.matchAll(/<th[^>]*>(?:<button[^>]*>)?([^<]+)/g)].map((m) =>
      (m[1] ?? '').trim(),
    );
    expect(headers).toEqual([
      'Due',
      'Entity',
      'Project',
      'Direction',
      'Amount',
      'Status',
      'Gated on',
    ]);
  });

  it('renders every payment as a row', () => {
    expect(html.match(/<tr/g)).toHaveLength(rows.length + 1); // + header
  });

  it("says 'not covered' only against the uncovered payment", () => {
    expect(text(html).match(/not covered/g)).toHaveLength(1);
  });

  it("names Sharma's gate rather than showing a raw id", () => {
    expect(text(html)).toContain('Iyer inst. 3');
    expect(text(html)).not.toContain('payment-iyer-instalment-3');
  });

  it('prints the firm-level salary row as w09 does', () => {
    expect(text(html)).toContain('Team salaries');
    expect(text(html)).toContain('firm-level');
  });

  it("marks today's instalment 'due today'", () => {
    expect(text(html)).toContain('due today');
  });

  it('formats every figure through formatINR', () => {
    expect(text(html)).toContain('₹2,50,000');
    expect(text(html)).toContain('₹1,70,000');
    // Never a bare unformatted amount.
    expect(text(html)).not.toMatch(/₹\d{6,}/);
  });

  it('keeps dates on one line', () => {
    expect(html).toContain('whitespace-nowrap');
  });
});

describe('field states carry their provenance', () => {
  const html = render(<DataGrid rows={rows} columns={columns} rowId={(p) => p.id} />);

  it("dots Kumar's extracted amount and names the source on hover", () => {
    expect(html).toContain('fv-extracted');
    expect(html).toMatch(/title="Extracted · [^"]*Vendor bills/);
  });

  it('titles a confirmed figure with its source too', () => {
    expect(html).toMatch(/title="Confirmed ·/);
  });
});

describe('write-gating — §8.2', () => {
  it('is read-only when no onPropose is given: no edit affordance', () => {
    const html = render(<DataGrid rows={rows} columns={columns} rowId={(p) => p.id} />);
    expect(text(html)).not.toContain('Click any cell to edit');
    expect(html).not.toContain('Click to edit');
  });

  it('offers editing only when a caller accepts proposals', () => {
    const html = render(
      <DataGrid rows={rows} columns={columns} rowId={(p) => p.id} onPropose={() => {}} />,
    );
    expect(text(html)).toContain('Click any cell to edit');
  });

  it('an edit produces an unconfirmed ChangeSet, never a write', () => {
    const amount = columns.find((c) => c.id === 'amount');
    const row = rows.find((p) => p.id === 'payment-godrej-iyer');
    expect(amount?.editable).toBeDefined();
    if (!amount?.editable || !row) throw new Error('fixture changed');

    const proposed = amount.editable.toChange(row, '200000');
    expect(proposed).not.toBeNull();
    expect(proposed?.change).toEqual({
      op: 'update',
      id: 'payment-godrej-iyer',
      patch: { amount: rupees(200000) },
    });
    // The diff line the change preview will render.
    expect(proposed?.before).toBe('₹1,70,000');
    expect(proposed?.after).toBe('₹2,00,000');
  });

  it('rejects an unparseable edit rather than writing a wrong number', () => {
    const amount = columns.find((c) => c.id === 'amount');
    const row = rows[0];
    if (!amount?.editable || !row) throw new Error('fixture changed');
    // Number('') is 0 — each of these would otherwise propose ₹0.
    for (const junk of ['abc', '', '   ', '₹', '-']) {
      expect(amount.editable.toChange(row, junk), `"${junk}" should be refused`).toBeNull();
    }
  });

  it('refuses a negative amount', () => {
    const amount = columns.find((c) => c.id === 'amount');
    const row = rows[0];
    if (!amount?.editable || !row) throw new Error('fixture changed');
    expect(amount.editable.toChange(row, '-500')).toBeNull();
  });
});

describe('sorting', () => {
  it('marks every sortable column for assistive tech', () => {
    const html = render(<DataGrid rows={rows} columns={columns} rowId={(p) => p.id} />);
    expect(html.match(/aria-sort="none"/g)).toHaveLength(columns.length);
  });
});

describe('selection and bulk actions', () => {
  it('offers no checkboxes without bulk actions', () => {
    const html = render(<DataGrid rows={rows} columns={columns} rowId={(p) => p.id} />);
    expect(html).not.toContain('type="checkbox"');
  });

  it('offers one checkbox per row plus select-all when actions exist', () => {
    const html = render(
      <DataGrid
        rows={rows}
        columns={columns}
        rowId={(p) => p.id}
        bulkActions={[{ label: 'Re-gate', onRun: () => {} }]}
      />,
    );
    expect(html.match(/type="checkbox"/g)).toHaveLength(rows.length + 1);
  });
});

describe('empty and restricted', () => {
  it('offers what will appear rather than a blank panel', () => {
    const html = render(
      <DataGrid
        rows={[]}
        columns={columns}
        rowId={(p) => p.id}
        emptyMessage="No payments scheduled in this window."
        emptyHint="Capture one with ⌘K."
      />,
    );
    expect(text(html)).toContain('No payments scheduled in this window.');
    expect(text(html)).toContain('Capture one with ⌘K.');
  });

  it('renders no figures at all when restricted — §3.2', () => {
    const html = render(
      <DataGrid
        rows={rows}
        columns={columns}
        rowId={(p) => p.id}
        restricted
        restrictedMessage="Firm money is admin-only."
      />,
    );
    expect(text(html)).toContain('Firm money is admin-only.');
    expect(text(html)).not.toMatch(/₹/);
  });
});

describe('export', () => {
  it('writes a CSV with the headers and one line per row', () => {
    const csv = toCsv(rows, columns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Due,Entity,Project,Direction,Amount,Status,Gated on');
    expect(lines).toHaveLength(rows.length + 1);
    expect(lines[4]).toContain('Godrej dealer');
    expect(lines[4]).toContain('not covered');
  });

  it('quotes a value containing a comma', () => {
    type Row = { id: string; name: string };
    const cols: GridColumn<Row>[] = [{ id: 'name', header: 'Name', cell: (r) => r.name }];
    const csv = toCsv([{ id: 'a', name: 'Sharma, Electricals' }], cols);
    expect(csv).toContain('"Sharma, Electricals"');
  });

  it('exports the stored figure, not the formatted one', () => {
    // A spreadsheet needs a number it can sum, not "₹1,70,000".
    const csv = toCsv(rows, columns);
    expect(csv).toContain('170000');
    expect(csv).not.toContain('₹');
  });
});
