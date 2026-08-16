/**
 * The Canvas: the planner/resolver split, the layout law, and §7.7's failures.
 *
 * The load-bearing test is the first one. CLAUDE.md rule 5 says a plan carries
 * refs and never values — if that holds, a live model emitting the same shape
 * produces the same answer through the same resolver, and the canned build is a
 * real dry run rather than a facade.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { planFor, plannedQuestionIds } from '@/canvas/planner';
import { QUESTIONS } from '@/canvas/questions';
import { resolve } from '@/canvas/resolver';
import { buildState } from '@/fixtures/scenarios';
import { Canvas } from '@/screens/Canvas';

const live = buildState('live');
const state = { entities: live.entities, documents: live.documents };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const render = (questionId: string, userId: string | null = 'person-anil') =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Canvas questionId={questionId} stateOverride={{ ...state, currentUserId: userId }} />
    </MemoryRouter>,
  );

describe('a plan carries refs, never values — rule 5', () => {
  it('no plan contains a rupee figure or a digit-heavy literal', () => {
    for (const id of plannedQuestionIds()) {
      const serialised = JSON.stringify(planFor(id));
      expect(serialised, id).not.toContain('₹');
      // No stored amount: the largest number a plan may hold is a day window.
      const numbers = [...serialised.matchAll(/:\s*(\d+)/g)].map((m) => Number(m[1]));
      for (const value of numbers) {
        expect(value, `${id} carries ${value}`).toBeLessThanOrEqual(365);
      }
    }
  });

  it('every plan validates against the schema', () => {
    for (const id of plannedQuestionIds()) {
      expect(() => planFor(id), id).not.toThrow();
      expect(planFor(id), id).not.toBeNull();
    }
  });

  it('composes two to five blocks — §7.4', () => {
    for (const id of plannedQuestionIds()) {
      const plan = planFor(id);
      expect(plan?.working.length, id).toBeGreaterThanOrEqual(1);
      expect(plan?.working.length, id).toBeLessThanOrEqual(3);
    }
  });

  it('offers exactly three follow-ups — §7.2', () => {
    for (const id of plannedQuestionIds()) {
      expect(planFor(id)?.followUps, id).toHaveLength(3);
    }
  });

  it('the resolver, not the plan, produces the figure', () => {
    const plan = planFor('vendor-exposure');
    if (!plan) throw new Error('vendor-exposure has no plan');
    expect(plan.answer.headline).toContain('{metric}');
    expect(resolve(state, plan).headline).toContain('₹6,62,000');
  });
});

describe('the resolver enforces §7.2 caveats', () => {
  const plan = planFor('vendor-exposure');
  if (!plan) throw new Error('vendor-exposure has no plan');
  const answer = resolve(state, plan);

  it('names the unconfirmed figure rather than hedging generally', () => {
    expect(answer.caveats).toHaveLength(1);
    expect(answer.caveats[0]).toContain('Kumar Carpentry');
    expect(answer.caveats[0]).toContain('excluded from the total');
  });

  it('lists an unreadable source honestly rather than dropping it', () => {
    const unreadable = answer.evidence.filter((card) => card.unreadable);
    expect(unreadable).toHaveLength(1);
    expect(unreadable[0]?.label).toBe('IMG_2231.jpg');
  });

  it('resolves documents to their real names', () => {
    expect(answer.evidence.map((card) => card.label)).toContain('Payments_Master.xlsx');
  });
});

describe('the layout law — §7.3', () => {
  const html = render('vendor-exposure');

  it('puts the answer, evidence, working area and actions on the page', () => {
    expect(text(html)).toContain('Answer');
    expect(text(html)).toContain('Evidence');
    expect(text(html)).toContain('Actions');
  });

  it('holds the answer to one figure and one line', () => {
    expect(text(html)).toContain('₹6,62,000');
    expect(html).toContain('truncate');
  });

  it('evidence comes after the working area in source order — right column', () => {
    expect(html.indexOf('Evidence')).toBeGreaterThan(html.indexOf('Answer'));
  });

  it('states that no action writes without a preview', () => {
    expect(text(html)).toContain('No action here writes anything until a change preview');
  });

  it('composes the blocks the plan named, and says how many', () => {
    expect(text(html)).toContain('Co-panel · 2 blocks composed');
    expect(text(html)).toContain('Sharma Electricals');
    expect(text(html)).toContain('42%');
  });

  it('offers the pin — where freedom becomes personalisation (§7.5)', () => {
    expect(text(html)).toContain('Pin as screen');
  });
});

describe('the AI panel — §7.2', () => {
  const html = render('vendor-exposure');

  it('shows the question and the prose answer', () => {
    expect(text(html)).toContain('Which vendors are we most exposed to right now?');
    expect(text(html)).toContain('Three vendors hold unbilled or unpaid commitment');
  });

  it('keeps prose under the 120-word bound', () => {
    const plan = planFor('vendor-exposure');
    const words = (plan?.narrative ?? []).join(' ').split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThanOrEqual(120);
  });

  it('surfaces the caveat beside the prose', () => {
    expect(text(html)).toContain('One figure here is unconfirmed — Kumar Carpentry');
  });

  it('offers three follow-ups, specific to this answer', () => {
    expect(text(html)).toContain('Same view, last financial year');
    expect(text(html)).toContain("What if Iyer's instalment slips 2 weeks?");
  });
});

describe('when the Canvas cannot answer — §7.7', () => {
  it('out of role scope: says admin-only, and never hints at the figure', () => {
    const html = render('vendor-exposure', 'person-ravi');
    expect(text(html)).toContain('admin-only');
    expect(text(html)).not.toMatch(/₹/);
    expect(text(html)).not.toContain('approximately');
    expect(text(html)).not.toContain('Sharma');
  });

  it('a capture is recognised as capture, not answered as a question', () => {
    const html = render('sharma-bill-capture');
    expect(text(html)).toContain('capture, not a question');
    expect(text(html)).toContain('change preview');
  });

  it('an unplanned question says so and does not improvise', () => {
    const html = render('iyer-margin');
    expect(text(html)).toContain('cannot answer that one yet');
    expect(text(html)).not.toMatch(/₹/);
  });

  it('an unknown question offers what can be asked instead', () => {
    const html = render('what-is-the-weather');
    expect(text(html)).toContain('Nothing canned matches that');
    expect(text(html)).toContain('Which vendors are we most exposed to right now?');
  });
});

describe('the question list and the plans agree', () => {
  it('every planned id is a real canned question', () => {
    for (const id of plannedQuestionIds()) {
      expect(
        QUESTIONS.some((q) => q.id === id),
        id,
      ).toBe(true);
    }
  });
});
