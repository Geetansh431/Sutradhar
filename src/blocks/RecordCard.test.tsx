/**
 * Blocks 01 and 04 — the record card and the ledger.
 *
 * §8.1 singles out "provenance per field" for the record card, so that is the
 * test that matters: every tracked value carries its own source, not one source
 * for the record.
 *
 * For the ledger, it is no-AI rule #2 — money state changes are human-only, so
 * mark-paid proposes and never writes.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Ledger, type LedgerLine } from '@/blocks/Ledger';
import { fieldRow, plainRow, RecordCard } from '@/blocks/RecordCard';
import { ledgerFor } from '@/domain/selectors/people';
import { buildState } from '@/fixtures/scenarios';
import { formatINR, rupees } from '@/lib/money';

const state = { entities: buildState('live').entities };
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const asText = (value: string) => value;

const confirmed = <T,>(value: T) =>
  ({
    state: 'confirmed',
    value,
    source: { kind: 'document', id: 'd', label: 'Vendor sheet', locator: 'row 4' },
    confirmedBy: 'person-anil',
    confirmedAt: '2026-08-09T00:00:00.000Z',
  }) as const;

describe('record card — provenance per field (§8.1)', () => {
  const html = renderToStaticMarkup(
    <RecordCard
      title="Sharma Electricals"
      subtitle="electrical"
      entityId="vendor-sharma"
      fields={[
        plainRow('category', 'Category', 'electrical'),
        fieldRow('terms', 'Payment terms', confirmed('45 days from bill'), asText),
        fieldRow(
          'contact',
          'Contact',
          {
            state: 'extracted',
            value: '+91 90080 12233',
            source: { kind: 'document', id: 'd2', label: 'Contact sheet', locator: 'row 9' },
            confidence: 0.9,
          },
          asText,
        ),
      ]}
    />,
  );

  it('gives each tracked value its own source, not one for the record', () => {
    expect(html).toMatch(/title="Confirmed · Vendor sheet · row 4"/);
    expect(html).toMatch(/title="Extracted · Contact sheet · row 9"/);
  });

  it('leaves a plain value without provenance — there is none to show', () => {
    expect(text(html)).toContain('electrical');
  });

  it('carries each field state through to its class', () => {
    expect(html).toContain('fv-extracted');
  });

  it('is read-only without onPropose — no block writes (§8.2)', () => {
    expect(text(html)).not.toContain('Click any value to edit');
    expect(html).not.toContain('<input');
  });

  it('offers inline editing once a caller accepts proposals', () => {
    const editable = renderToStaticMarkup(
      <RecordCard
        title="Sharma"
        entityId="vendor-sharma"
        fields={[plainRow('category', 'Category', 'electrical')]}
        onPropose={() => {}}
      />,
    );
    expect(text(editable)).toContain('nothing is written until you confirm');
  });

  it('says nothing is recorded rather than showing an empty frame', () => {
    const empty = renderToStaticMarkup(
      <RecordCard title="Godrej dealer" entityId="vendor-godrej-dealer" fields={[]} />,
    );
    expect(text(empty)).toContain('Nothing recorded for Godrej dealer yet');
    expect(text(empty)).toContain('Answer a gap question');
  });

  it('renders no field at all when restricted — §3.2', () => {
    const restricted = renderToStaticMarkup(
      <RecordCard
        title="Ravi"
        entityId="person-ravi"
        fields={[fieldRow('salary', 'Salary', confirmed(rupees(45000)), formatINR)]}
        restricted
        restrictedMessage="Salary is admin-only."
      />,
    );
    expect(text(restricted)).toContain('Salary is admin-only');
    expect(text(restricted)).not.toMatch(/₹/);
  });
});

describe('ledger — mark paid is human-only (no-AI rule #2)', () => {
  const ledger = ledgerFor(state, 'vendor-sharma');

  it('offers mark-paid on an unpaid, confirmed line', () => {
    const html = renderToStaticMarkup(
      <Ledger
        lines={ledger.lines}
        outstanding={ledger.outstanding}
        subject="Sharma Electricals"
        onPropose={() => {}}
      />,
    );
    expect(text(html)).toContain('Mark paid');
    expect(text(html)).toContain('only you can confirm it');
  });

  it('offers nothing to click without onPropose — it cannot write', () => {
    const html = renderToStaticMarkup(
      <Ledger lines={ledger.lines} outstanding={ledger.outstanding} subject="Sharma" />,
    );
    expect(text(html)).not.toContain('Mark paid');
  });

  it('does not offer it on an unconfirmed amount — a guess cannot be settled', () => {
    const line = ledger.lines[0];
    if (!line) throw new Error('fixture changed');
    const guessed: LedgerLine = {
      ...line,
      amount: {
        state: 'extracted',
        value: rupees(80000),
        source: { kind: 'document', id: 'd', label: 'photo' },
        confidence: 0.6,
      },
    };
    const html = renderToStaticMarkup(
      <Ledger
        lines={[guessed]}
        outstanding={ledger.outstanding}
        subject="Sharma"
        onPropose={() => {}}
      />,
    );
    expect(text(html)).not.toContain('Mark paid');
  });

  it('states the outstanding total and its exclusions', () => {
    const kumar = ledgerFor(state, 'vendor-kumar-carpentry');
    const html = renderToStaticMarkup(
      <Ledger lines={kumar.lines} outstanding={kumar.outstanding} subject="Kumar Carpentry" />,
    );
    expect(text(html)).toContain('Outstanding');
    expect(text(html)).toContain('excludes 2 unconfirmed figures');
  });

  it('says what will appear rather than showing an empty table', () => {
    const html = renderToStaticMarkup(
      <Ledger
        lines={[]}
        outstanding={{ value: rupees(0), countedCount: 0, excludedCount: 0, caveat: null }}
        subject="Godrej dealer"
      />,
    );
    expect(text(html)).toContain('No entries for Godrej dealer yet');
  });

  it('renders no figure when restricted', () => {
    const html = renderToStaticMarkup(
      <Ledger lines={ledger.lines} outstanding={ledger.outstanding} subject="Sharma" restricted />,
    );
    expect(text(html)).toContain('admin-only');
    expect(text(html)).not.toMatch(/₹/);
  });
});
