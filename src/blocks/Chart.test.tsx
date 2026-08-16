/**
 * Block 07 and the exposure selector behind it.
 *
 * The rule worth testing hardest is §7.4's: the chart type set is closed. It is
 * a union, so an invented encoding is a compile error rather than a runtime
 * surprise — these tests cover the four that exist and the field states.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Chart, type ChartType, moneyDatum } from '@/blocks/Chart';
import { vendorExposure } from '@/domain/selectors/vendors';
import { buildState } from '@/fixtures/scenarios';
import { formatINR, rupees } from '@/lib/money';

const LIVE = { entities: buildState('live').entities };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const confirmed = (value: number) =>
  ({
    state: 'confirmed',
    value: rupees(value),
    source: { kind: 'human', id: 'h', label: 'confirmed' },
    confirmedBy: 'person-anil',
    confirmedAt: '2026-08-09T00:00:00.000Z',
  }) as const;

describe('vendor exposure — w11', () => {
  const view = vendorExposure(LIVE);

  it('ranks the three vendors, largest first', () => {
    expect(view.vendors.map((v) => v.name)).toEqual([
      'Sharma Electricals',
      'Kumar Carpentry',
      'Godrej dealer',
    ]);
  });

  it("matches w11's per-vendor figures where the wireframes agree", () => {
    const byName = Object.fromEntries(view.vendors.map((v) => [v.name, formatINR(v.open)]));
    expect(byName['Sharma Electricals']).toBe('₹2,80,000');
    expect(byName['Kumar Carpentry']).toBe('₹2,12,000');
    // Godrej is ₹1,70,000 per w09, whose coverage gap is built on that figure.
    expect(byName['Godrej dealer']).toBe('₹1,70,000');
  });

  it('names the gating relationship — the point of the answer', () => {
    const sharma = view.vendors.find((v) => v.name === 'Sharma Electricals');
    expect(sharma && formatINR(sharma.gated)).toBe('₹80,000');
  });

  it('flags the vendor whose figure rests on an unconfirmed bill', () => {
    const kumar = view.vendors.find((v) => v.name === 'Kumar Carpentry');
    expect(kumar?.openUnconfirmed).toBe(true);
    const sharma = view.vendors.find((v) => v.name === 'Sharma Electricals');
    expect(sharma?.openUnconfirmed).toBe(false);
  });

  it('the total excludes unconfirmed money and says so — P4', () => {
    expect(view.total.caveat).toBe('excludes 2 unconfirmed figures');
  });

  it('shares add to one', () => {
    const sum = view.vendors.reduce((acc, v) => acc + v.share, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('counts the projects the exposure spans', () => {
    expect(view.projectCount).toBe(2);
  });
});

describe('the chart renders the closed type set — §7.4', () => {
  const data = [
    { label: 'Sharma', value: 0.42, emphasis: true },
    { label: 'Kumar', value: 0.32 },
    { label: 'Godrej', value: 0.26 },
  ];

  it('renders each of the four types without error', () => {
    for (const type of ['bar', 'hbar', 'timeline', 'stacked'] as ChartType[]) {
      const html = renderToStaticMarkup(<Chart type={type} data={data} />);
      expect(html.length, type).toBeGreaterThan(50);
      expect(text(html), type).toContain('Sharma');
    }
  });

  it('shows a percentage when the values are shares', () => {
    const html = renderToStaticMarkup(<Chart type="hbar" data={data} asShare />);
    expect(text(html)).toContain('42%');
    expect(text(html)).toContain('26%');
  });

  it('emphasises the largest bar only', () => {
    const html = renderToStaticMarkup(<Chart type="hbar" data={data} asShare />);
    expect(html.match(/bg-brand"/g)).toHaveLength(1);
  });

  it('offers click-through when a caller wants it — the only interaction', () => {
    const withDrill = renderToStaticMarkup(
      <Chart type="hbar" data={data} onDrillDown={() => {}} />,
    );
    expect(withDrill).toContain('<button');
    // The hint lives in the title attribute, which `text()` strips.
    expect(withDrill).toContain('open the rows behind this');

    const without = renderToStaticMarkup(<Chart type="hbar" data={data} />);
    expect(without).not.toContain('<button');
  });

  it('never offers editing — the block has no write path', () => {
    const html = renderToStaticMarkup(<Chart type="hbar" data={data} onDrillDown={() => {}} />);
    expect(html).not.toContain('<input');
    expect(html).not.toContain('contenteditable');
  });
});

describe('field states carry into the chart', () => {
  it('dots an extracted figure', () => {
    const html = renderToStaticMarkup(
      <Chart
        type="hbar"
        data={[
          moneyDatum('Kumar', {
            state: 'extracted',
            value: rupees(212000),
            source: { kind: 'document', id: 'd', label: 'bill' },
            confidence: 0.58,
          }),
        ]}
      />,
    );
    expect(html).toContain('fv-extracted');
  });

  it('marks a conflicting figure amber and picks no value', () => {
    const html = renderToStaticMarkup(
      <Chart
        type="hbar"
        data={[
          moneyDatum('Sharma', {
            state: 'conflicting',
            candidates: [
              { value: rupees(280000), source: { kind: 'document', id: 'd', label: 'Ledger' } },
              { value: rupees(265000), source: { kind: 'message', id: 'm', label: 'chat' } },
            ],
          }),
        ]}
      />,
    );
    expect(html).toContain('fv-conflicting');
    expect(text(html)).not.toContain('2,80,000');
  });

  it('renders a missing figure as an em dash, never a zero bar', () => {
    const html = renderToStaticMarkup(
      <Chart type="hbar" data={[moneyDatum('Godrej', { state: 'missing', blocks: ['ledger'] })]} />,
    );
    expect(html).toContain('fv-missing');
    expect(text(html)).toContain('—');
    expect(text(html)).not.toContain('₹0');
  });

  it('formats money through the short formatter', () => {
    const html = renderToStaticMarkup(
      <Chart type="hbar" data={[moneyDatum('Sharma', confirmed(280000))]} />,
    );
    expect(text(html)).toContain('₹2.8L');
  });
});

describe('states', () => {
  it('says what will appear rather than drawing an empty axis', () => {
    const html = renderToStaticMarkup(<Chart type="hbar" data={[]} />);
    expect(text(html)).toContain('Nothing to chart yet');
  });

  it('renders no figure when restricted — §3.2', () => {
    const html = renderToStaticMarkup(
      <Chart type="hbar" data={[moneyDatum('Sharma', confirmed(280000))]} restricted />,
    );
    expect(text(html)).toContain('admin-only');
    expect(text(html)).not.toMatch(/₹/);
  });
});
