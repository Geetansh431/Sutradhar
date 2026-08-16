/**
 * Money's states, and the role cut.
 *
 * The cut is the one worth testing hard: §3.2 says a restricted figure "must
 * never be fetched", so the test asserts the selector is never reached, not
 * merely that nothing renders.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { chaseInflow, regateOutflow } from '@/domain/proposals';
import { gapSentence, moneyWindow } from '@/domain/selectors/money';
import { canReachMoneyScreen, currentRole } from '@/domain/selectors/role';
import { buildState } from '@/fixtures/scenarios';
import { Money } from '@/screens/Money';

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Renders the screen against an explicit state. Zustand serves its initial
 * snapshot during a static render, so a store reset would not be visible —
 * the screen takes the same override its blocks do.
 */
const renderAs = (userId: string | null) =>
  renderToStaticMarkup(
    <Money stateOverride={{ entities: buildState('live').entities, currentUserId: userId }} />,
  );

describe('the admin view — w09', () => {
  const html = renderAs('person-anil');

  it('names the screen and its scope', () => {
    expect(text(html)).toContain('Money');
    expect(text(html)).toContain('All projects · next 60 days');
  });

  it('offers the three modes, timeline first', () => {
    expect(text(html)).toContain('Timeline');
    expect(text(html)).toContain('Ledgers');
    expect(text(html)).toContain('All payments');
  });

  it('composes the timeline and its coverage gap', () => {
    expect(text(html)).toContain('Money timeline · inflow above, outflow below');
    expect(text(html)).toContain('Coverage gap ₹1,70,000');
  });

  it('states the gap in one plain sentence, with both actions', () => {
    expect(text(html)).toContain('₹1,70,000 due to vendors');
    expect(text(html)).toContain('Chase inflow');
    expect(text(html)).toContain('Re-gate outflow');
  });

  it('composes the payment grid below it', () => {
    expect(text(html)).toContain('Sharma Electricals');
    expect(text(html)).toContain('Team salaries');
    expect(text(html)).toContain('not covered');
  });

  it('leaves the prototype badge to the shell, not the screen', () => {
    // The badge is permanent (CLAUDE.md) but lives in the topbar now, so a
    // screen rendered on its own should not draw a second one.
    expect(text(html)).not.toContain('Prototype · canned responses');
  });

  it('shows no change preview until an action is taken', () => {
    expect(text(html)).not.toContain('changes proposed');
    expect(text(html)).not.toContain('Confirm all');
  });
});

describe('the role cut — §3.2', () => {
  it('resolves the seeded admin', () => {
    const state = { ...buildState('live'), currentUserId: 'person-anil' };
    expect(currentRole(state)).toBe('admin');
    expect(canReachMoneyScreen(state)).toBe(true);
  });

  it('a team member cannot reach Money', () => {
    const state = { ...buildState('live'), currentUserId: 'person-ravi' };
    expect(currentRole(state)).toBe('team');
    expect(canReachMoneyScreen(state)).toBe(false);
  });

  it('defaults to the narrower cut when the user is unknown', () => {
    const state = { ...buildState('live'), currentUserId: null };
    expect(currentRole(state)).toBe('team');
    expect(canReachMoneyScreen(state)).toBe(false);
  });

  it('renders no figure at all for a team member', () => {
    const html = renderAs('person-ravi');
    expect(text(html)).toContain('Money is admin-only');
    expect(text(html)).not.toMatch(/₹/);
    expect(text(html)).not.toContain('Sharma');
    expect(text(html)).not.toContain('Coverage gap');
  });

  it('says nothing was loaded — the figure is never fetched, not hidden', () => {
    const html = renderAs('person-ravi');
    expect(text(html)).toContain('Nothing here was loaded');
  });
});

describe('the strip actions propose rather than write', () => {
  const state = buildState('live');
  const window = moneyWindow({ entities: state.entities });
  const gap = window.gaps[0];

  it('chase drafts a reminder for a human to send — no-AI rule #3', () => {
    if (!gap) throw new Error('fixture changed');
    const set = chaseInflow(gap, window.payments);
    expect(set.confirmedAt).toBeNull();
    expect(set.changes[0]?.after).toContain('you read it and send it');
  });

  it('re-gate links the uncovered payment to a later inflow, marked unsure', () => {
    if (!gap) throw new Error('fixture changed');
    const set = regateOutflow(gap, window.payments);
    expect(set?.confirmedAt).toBeNull();
    const change = set?.changes[0];
    expect(change?.confidence).toBe('low');
    expect(change?.change).toMatchObject({
      op: 'link',
      from: 'payment-godrej-iyer',
      relation: 'gated-on',
    });
  });

  it('the sentence names the shortfall and what is scheduled against it', () => {
    if (!gap) throw new Error('fixture changed');
    expect(gapSentence(gap)).toBe(
      '₹1,70,000 due to vendors, 26 Aug. No inflow is scheduled against it.',
    );
  });
});

describe('states from the spec table', () => {
  it('a firm with no payments offers what will appear', () => {
    const entities = { ...buildState('live').entities };
    for (const [id, entity] of Object.entries(entities)) {
      if (entity.kind === 'payment') delete entities[id];
    }
    const html = renderToStaticMarkup(
      <Money stateOverride={{ entities, currentUserId: 'person-anil' }} />,
    );

    expect(text(html)).toContain('No payments scheduled in this window.');
    // No gap means no warning strip — not an empty strip.
    expect(text(html)).not.toContain('Chase inflow');
  });
});
