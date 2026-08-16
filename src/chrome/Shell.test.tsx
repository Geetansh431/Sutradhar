/**
 * The chrome: rail, ask bar, and the guarantees they carry.
 *
 * Two matter most. The rail must *omit* Money for a team member rather than
 * disable it (§3.2), and the ask bar must have no path from free text to an
 * answer (CLAUDE.md, on-script only).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { filterQuestions, QUESTIONS, questionById } from '@/canvas/questions';
import { AskBar } from '@/chrome/AskBar';
import { Rail } from '@/chrome/Rail';
import { destinations, visiblePins } from '@/domain/selectors/role';
import { buildState } from '@/fixtures/scenarios';
import type { PinnedScreen } from '@/store/store';

const live = buildState('live');
const settled = buildState('settled');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const renderRail = (userId: string | null, pins: PinnedScreen[] = []) => {
  const state = { entities: live.entities, currentUserId: userId };
  return renderToStaticMarkup(
    <MemoryRouter>
      <Rail destinations={destinations(state)} pins={visiblePins(state, pins)} />
    </MemoryRouter>,
  );
};

describe('the rail — §4.1', () => {
  const html = renderRail('person-anil');

  it('lists the eight destinations', () => {
    for (const label of [
      'Home',
      'Projects',
      'Money',
      'People',
      'Files',
      'Calendar',
      'Canvas',
      'Memory',
    ]) {
      expect(text(html), label).toContain(label);
    }
  });

  it('tucks Settings in the footer', () => {
    expect(text(html)).toContain('Settings');
    // Last thing in the rail, after every destination.
    expect(html.lastIndexOf('Settings')).toBeGreaterThan(html.lastIndexOf('Memory'));
  });

  it('carries the product name', () => {
    expect(text(html)).toContain('sutradhar');
  });
});

describe('the rail applies the money line — §3.2', () => {
  it('omits Money for a team member, rather than disabling it', () => {
    const html = renderRail('person-ravi');
    expect(text(html)).not.toContain('Money');
    expect(text(html)).toContain('Home');
    expect(text(html)).toContain('Projects');
  });

  it('omits it for an unknown user too — the narrower cut is the default', () => {
    expect(text(renderRail(null))).not.toContain('Money');
  });

  it('the destination list itself is filtered, not the markup', () => {
    const team = destinations({ entities: live.entities, currentUserId: 'person-ravi' });
    expect(team.some((d) => d.path === '/money')).toBe(false);
  });
});

describe('pinned screens — §4.2, §7.5', () => {
  const pin = settled.pinned[0];

  it('the settled scenario carries the demo close', () => {
    expect(pin?.name).toBe('Vendor exposure');
  });

  it('shows the owner their own pin, below the destinations', () => {
    if (!pin) throw new Error('fixture changed');
    const html = renderRail('person-anil', [pin]);
    expect(text(html)).toContain('Pinned');
    expect(text(html)).toContain('Vendor exposure');
    expect(html.indexOf('Vendor exposure')).toBeGreaterThan(html.indexOf('Memory'));
  });

  it("never shows an admin's money pin to a team member", () => {
    if (!pin) throw new Error('fixture changed');
    const html = renderRail('person-ravi', [pin]);
    expect(text(html)).not.toContain('Vendor exposure');
  });

  it('never shows one user their colleague’s pins', () => {
    if (!pin) throw new Error('fixture changed');
    const visible = visiblePins({ entities: live.entities, currentUserId: 'person-priya' }, [pin]);
    expect(visible).toEqual([]);
  });
});

describe('the ask bar is on-script only', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <AskBar onPick={() => {}} />
    </MemoryRouter>,
  );

  it('invites both asking and capturing, as one bar', () => {
    expect(text(html)).toContain('Ask or capture anything');
  });

  it('offers no form — there is nothing to submit free text to', () => {
    expect(html).not.toContain('<form');
    expect(html).not.toContain('type="submit"');
  });

  it('every question maps to a canned id', () => {
    for (const question of QUESTIONS) {
      expect(questionById(question.id)?.id).toBe(question.id);
    }
  });

  it('narrows the list as the user types', () => {
    expect(filterQuestions('vendor').length).toBeGreaterThan(0);
    expect(filterQuestions('vendor').length).toBeLessThan(QUESTIONS.length);
  });

  it('returns nothing for an unprogrammed question — no fallback path', () => {
    expect(filterQuestions('what is the weather in Bangalore')).toEqual([]);
  });

  it('includes the capture example from §7.6, which is not a question', () => {
    const capture = QUESTIONS.find((q) => q.group === 'capture');
    expect(capture?.text).toContain('Sharma ka bill aa gaya');
    expect(capture?.answers).toContain('change preview');
  });
});
