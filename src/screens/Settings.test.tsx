/**
 * Settings — IA §4.1.
 *
 * The point of this screen is what it does *not* do. §10 forbids the demo
 * showing a form being filled in, so this holds no inputs at all: it states
 * what the firm is configured as and offers nothing to configure. It exists so
 * the rail footer is not a dead end.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { buildState } from '@/fixtures/scenarios';
import { EDITABLE, NOT_EDITABLE } from '@/fixtures/schema';
import { Settings } from '@/screens/Settings';

const live = buildState('live');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (userId: string | null = 'person-anil') =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Settings stateOverride={{ entities: live.entities, currentUserId: userId }} />
    </MemoryRouter>,
  );

describe('Settings', () => {
  it('states the roles and what each may see', () => {
    const html = text(render());
    expect(html).toContain('Everything, including money');
    expect(html).toContain('no money, no deal values');
  });

  it('lists the seeded users and marks who is signed in', () => {
    const html = text(render());
    expect(html).toContain('Anil Kumar');
    expect(html).toContain('Ravi');
    expect(html).toContain('signed in');
  });

  it('offers no form to fill in — §10 forbids showing one', () => {
    const html = render();
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('<textarea');
  });

  it('makes the claim the product actually makes: nothing was configured', () => {
    expect(text(render())).toContain('Nothing here was configured');
  });

  it('states both halves of §6.9 — what bends and what does not', () => {
    const html = text(render());
    expect(html).toContain('Yours to shape');
    expect(html).toContain('Fixed, and why');
    for (const rule of EDITABLE) expect(html).toContain(rule.label);
    for (const rule of NOT_EDITABLE) expect(html).toContain(rule.label);
  });

  it('says why each fixed thing is fixed, rather than just listing it', () => {
    // The right-hand column is what makes the left-hand one credible: a product
    // that let you edit your own audit log could not claim a figure has a source.
    const html = text(render());
    expect(html).toContain('would not be evidence of anything');
    expect(html).toContain('no total in the product would be comparable');
  });

  it('points at where the real freedom lives — §7.5, not this screen', () => {
    expect(text(render())).toContain('screens you keep from the Canvas');
  });
});
