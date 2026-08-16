/**
 * The block's rendered output, against the wireframe it comes from.
 *
 * These assert what a reviewer would look for in the screenshot: the gap is
 * stated in words, unconfirmed money keeps its dotted treatment, totals name
 * their exclusions, and the restricted view never renders a figure at all.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import type { MoneyState } from '@/domain/selectors/money';
import type { Payment } from '@/domain/types';
import { buildState } from '@/fixtures/scenarios';
import { rupees } from '@/lib/money';

const LIVE: MoneyState = { entities: buildState('live').entities };

/** Visible text only — attributes stripped. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

/** Everything a screen reader or a hover would surface, attributes included. */
const all = (html: string) => html.replace(/&#x27;/g, "'").replace(/&middot;/g, '·');

/** The distinct aria-labels on the page — one per bar. */
const labels = (html: string) => [
  ...new Set([...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1] ?? '')),
];

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('populated — w09', () => {
  const html = render(<MoneyTimeline stateOverride={LIVE} />);

  it('states the coverage gap in words, not only as shading', () => {
    expect(text(html)).toContain('Coverage gap ₹1,70,000');
  });

  it('labels the window and its scope', () => {
    expect(text(html)).toContain('12 Aug – 11 Oct');
    expect(text(html)).toContain('all projects');
  });

  it('draws a bar per payment in the window', () => {
    // Six payments in the live scenario's 60-day window.
    expect(html.split('aria-label=').length - 1).toBe(6);
  });

  it('marks the uncovered payment, and only that one', () => {
    const flagged = labels(html).filter((l) => l.includes('not covered'));
    expect(flagged).toEqual(['Godrej dealer · ₹1,70,000 · Iyer Residence · not covered']);
  });

  it('totals name what they exclude — P4', () => {
    expect(text(html)).toContain('excludes 1 unconfirmed figure');
  });

  it('renders every figure through the money formatter', () => {
    // Indian digit grouping, never a bare number with a rupee sign glued on.
    expect(text(html)).toMatch(/₹[\d,]+/);
    expect(text(html)).not.toMatch(/₹\d{6}/);
  });
});

describe('field states keep their treatment', () => {
  const withAmount = (amount: Payment['amount'], id = 'p1'): MoneyState => ({
    entities: {
      [id]: {
        kind: 'payment',
        id,
        direction: 'out',
        projectId: 'project-iyer',
        counterpartyId: 'vendor-sharma',
        amount,
        due: {
          state: 'confirmed',
          value: '2026-08-20',
          source: { kind: 'human', id: 'h', label: 't' },
          confirmedBy: 'a',
          confirmedAt: '2026-08-09T00:00:00.000Z',
        },
        status: 'planned',
        gatedOn: null,
        archivedAt: null,
      },
    },
  });

  it('extracted renders dotted — the .fv-extracted class, not ad hoc styling', () => {
    const html = render(
      <MoneyTimeline
        stateOverride={withAmount({
          state: 'extracted',
          value: rupees(110000),
          source: { kind: 'document', id: 'd', label: 'bill' },
          confidence: 0.6,
        })}
      />,
    );
    expect(html).toContain('fv-extracted');
  });

  it('conflicting renders amber, with no value silently chosen', () => {
    const html = render(
      <MoneyTimeline
        stateOverride={withAmount({
          state: 'conflicting',
          candidates: [
            { value: rupees(90000), source: { kind: 'document', id: 'd', label: 'bill' } },
            { value: rupees(95000), source: { kind: 'message', id: 'm', label: 'chat' } },
          ],
        })}
      />,
    );
    expect(html).toContain('fv-conflicting');
    expect(text(html)).not.toContain('₹90,000');
    expect(text(html)).not.toContain('₹95,000');
  });

  it('missing renders an affordance, never a zero', () => {
    const html = render(
      <MoneyTimeline stateOverride={withAmount({ state: 'missing', blocks: ['grid'] })} />,
    );
    expect(html).toContain('fv-missing');
    // "Unknown" because this scoped state has no vendor row — the block degrades
    // rather than throwing on a dangling reference.
    expect(labels(html)).toEqual(['Unknown · amount missing']);
    // An em dash where the figure would be — never a zero.
    expect(text(html)).toContain('—');
  });
});

describe('empty', () => {
  const html = render(<MoneyTimeline stateOverride={{ entities: {} }} />);

  it('offers what will appear rather than showing a blank panel', () => {
    expect(text(html)).toContain('Nothing scheduled in the next 60 days');
    expect(text(html)).toContain('as soon as they are captured');
  });

  it('shows no totals when there is nothing to total', () => {
    expect(text(html)).not.toContain('excludes');
  });
});

describe('restricted — spec §3.2', () => {
  const html = render(<MoneyTimeline restricted stateOverride={LIVE} />);

  it('states the boundary plainly', () => {
    expect(text(html)).toContain('Firm money is admin-only');
  });

  it('never renders a figure — not hidden, not fetched', () => {
    expect(text(html)).not.toMatch(/₹/);
    expect(text(html)).not.toContain('Coverage gap');
  });
});

describe('scoping', () => {
  it('filters to one project', () => {
    const html = render(<MoneyTimeline stateOverride={LIVE} projectId="project-kormangala" />);
    expect(text(html)).toContain('one project');
    expect(all(html)).toContain('Kumar Carpentry');
    expect(all(html)).not.toContain('Godrej dealer');
  });

  it('honours a shorter window — Home renders 14 days', () => {
    const html = render(<MoneyTimeline stateOverride={LIVE} days={14} />);
    expect(text(html)).toContain('12 Aug – 26 Aug');
  });
});
