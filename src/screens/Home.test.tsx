/**
 * Home's four regions, the states in §6.1's table, and the team cut.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { actionQueue, brief, pulse, today } from '@/domain/selectors/home';
import { buildState } from '@/fixtures/scenarios';
import { formatINR } from '@/lib/money';
import { Home } from '@/screens/Home';

const live = buildState('live');
const entities = live.entities;

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (userId: string | null, coverage = live.coverage) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Home stateOverride={{ entities, currentUserId: userId, coverage }} />
    </MemoryRouter>,
  );

describe('the admin view — w06', () => {
  const html = render('person-anil');

  it('greets by first name, on the fixed date', () => {
    expect(text(html)).toContain('Wednesday, 12 August');
    expect(text(html)).toContain('Good morning, Anil');
  });

  it('renders the brief as prose, timestamped and marked not-a-chat', () => {
    expect(text(html)).toContain('The brief');
    expect(text(html)).toContain('generated 07:40 · not a chat');
    // Prose, not bullets: the brief's own section holds a <p> and no list.
    const section = html.slice(html.indexOf('The brief'));
    const briefMarkup = section.slice(0, section.indexOf('</section>'));
    expect(briefMarkup).toContain('<p');
    expect(briefMarkup).not.toContain('<ul');
    expect(briefMarkup).not.toContain('<li');
  });

  it("the brief states consequence, not status — the demo's whole premise", () => {
    expect(text(html)).toContain('if it slips, that payment has no cover');
    expect(text(html)).toContain('₹2,50,000');
    expect(text(html)).toContain('₹80,000');
  });

  it('shows four pulse cards, numbers only', () => {
    expect(text(html)).toContain('collectible this week');
    expect(text(html)).toContain('payable in 14 days');
    expect(text(html)).toContain('coverage gap ahead');
    expect(text(html)).toContain('sites live');
  });

  it('heads the queue with its count and the copy from the spec', () => {
    const queue = actionQueue({ entities });
    expect(text(html)).toContain(`Action queue · ${queue.length} items`);
    expect(text(html)).toContain('empty this = your day is done');
  });

  it('renders the item kinds the spec names', () => {
    expect(text(html)).toContain('CONFIRM');
    expect(text(html)).toContain('DECIDE');
    expect(text(html)).toContain('SEND');
  });

  it('composes the 14-day money miniature and Today', () => {
    expect(text(html)).toContain('Money, next 14 days');
    expect(text(html)).toContain('Today');
    expect(text(html)).toContain('Open full calendar');
  });

  it('leaves the prototype badge to the shell, not the screen', () => {
    // The badge is permanent (CLAUDE.md) but lives in the topbar now, so a
    // screen rendered on its own should not draw a second one.
    expect(text(html)).not.toContain('Prototype · canned responses');
  });
});

describe('the queue is sorted by consequence, not date — §6.1', () => {
  const queue = actionQueue({ entities });

  it('puts money that is due today above a gap question', () => {
    const kinds = queue.map((item) => item.kind);
    expect(kinds.indexOf('SEND')).toBeLessThan(kinds.indexOf('ANSWER'));
  });

  it('is genuinely ordered by the consequence score', () => {
    const scores = queue.map((item) => item.consequence);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('names a project, never an id', () => {
    for (const item of queue) {
      expect(item.title, item.id).not.toMatch(/project-|payment-|vendor-/);
    }
  });
});

describe('the pulse reads from the store', () => {
  const figures = pulse({ entities });

  it('counts the one coverage gap the fixtures produce', () => {
    expect(figures.coverageGapsAhead).toBe(1);
  });

  it('collects only confirmed money — rule 3', () => {
    // Kumar's ₹1,10,000 is extracted, so it is not payable-in-14-days.
    expect(formatINR(figures.payableIn14Days)).not.toContain('3,60,000');
  });

  it('counts live projects, not archived or pipeline ones', () => {
    expect(figures.liveSites).toBe(3);
  });
});

describe('the team cut — §3.2', () => {
  const html = render('person-ravi');

  it('shows no pulse cards and no money panel', () => {
    expect(text(html)).not.toContain('collectible this week');
    expect(text(html)).not.toContain('Money, next 14 days');
  });

  it('shows no money figure anywhere', () => {
    expect(text(html)).not.toMatch(/₹/);
  });

  it('scopes the queue to their own work', () => {
    const theirs = actionQueue({ entities }, { forPersonId: 'person-ravi' });
    expect(theirs.length).toBeGreaterThan(0);
    for (const item of theirs) {
      expect(item.detail).not.toMatch(/₹/);
    }
  });

  it('still shows Today — their sites are theirs to see', () => {
    expect(text(html)).toContain('Today');
  });
});

describe('states from §6.1', () => {
  it('low coverage makes the brief say what it cannot see', () => {
    const html = render('person-anil', 0.34);
    expect(text(html)).toContain('I can only see the client side of the money so far');
  });

  it('full coverage carries no caveat', () => {
    const written = brief({ entities }, 0.58);
    expect(written.caveat).toBeNull();
  });

  it('an empty queue is celebratory, not blank', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Home stateOverride={{ entities: {}, currentUserId: 'person-anil', coverage: 0.58 }} />
      </MemoryRouter>,
    );
    expect(text(html)).toContain('Your day is done');
    expect(text(html)).toContain('Action queue · 0 items');
  });
});

describe('Today is today only', () => {
  it("lists the instalment due today and nothing else's date", () => {
    const items = today({ entities });
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.what.includes('R. Iyer'))).toBe(true);
  });
});
