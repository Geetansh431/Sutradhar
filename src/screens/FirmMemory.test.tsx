/**
 * Firm Memory — §6.8, "the screen that most directly expresses the product's
 * honesty".
 *
 * So the tests are honesty tests: every figure is derived rather than written,
 * unreadable files are named, and the weekly log carries the uncomfortable line
 * rather than only the wins.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  coverageHeader,
  openGaps,
  shortfallReasons,
  sourceCounts,
  whatChanged,
} from '@/domain/selectors/memory';
import { buildState } from '@/fixtures/scenarios';
import { FirmMemory } from '@/screens/FirmMemory';

const live = buildState('live');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (state = live) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <FirmMemory stateOverride={state} />
    </MemoryRouter>,
  );

describe('the coverage header — w10', () => {
  const html = render();

  it('shows the headline percentage, framed as progress', () => {
    expect(text(html)).toContain('Firm coverage 58%');
    expect(text(html)).toContain('Up from 34% at onboarding');
  });

  it('states a target rather than implying completion', () => {
    expect(text(html)).toContain('target for a confident month-end: 75%');
  });

  it('counts what is still only in a head — the honest number', () => {
    const header = coverageHeader(live);
    expect(header.onlyInYourHead).toBeGreaterThan(0);
    expect(text(html)).toContain('still only in your head');
  });

  it('derives the headline from the store, never a literal', () => {
    const quieter = { ...live, coverage: 0.41 };
    expect(text(render(quieter))).toContain('Firm coverage 41%');
  });
});

describe('coverage by area carries a reason — §6.8', () => {
  const html = render();
  const reasons = shortfallReasons(live);

  it('gives each shortfall a one-line reason', () => {
    // The terms gap sits with "Vendors & terms", alongside the question that
    // closes it — so clicking that bar opens the gap that explains the reason.
    expect(reasons.vendorsProfiles).toBe('2 of 3 — 1 vendor has no terms');
    expect(text(html)).toContain('1 vendor has no terms');
  });

  it('counts vendors without terms rather than asserting a number', () => {
    const noVendors = { ...live, entities: {} };
    expect(shortfallReasons(noVendors).vendorsProfiles).toBe('0 of 0');
  });

  it('keeps the copy that says the gaps are the point', () => {
    expect(text(html)).toContain('gaps are the product working');
  });
});

describe('sources are counted, and failures named', () => {
  const counts = sourceCounts(live);

  it('counts documents, exports and human answers from the store', () => {
    expect(counts.documents).toBe(live.documents.length);
    expect(counts.exports).toBe(1);
    expect(counts.humanAnswers).toBe(Object.keys(live.onboarding.answered).length);
  });

  it('names the unreadable file and why — never glossed', () => {
    expect(counts.unreadable).toBe(1);
    expect(counts.unreadableReason).toBe('handwritten bills');
    expect(text(render())).toContain('1 file unreadable — handwritten bills');
  });
});

describe('fill a gap — the interview, permanently available', () => {
  const html = render();

  it('offers questions still worth asking', () => {
    const gaps = openGaps(live);
    expect(gaps.length).toBeGreaterThan(0);
    expect(text(html)).toContain('Fill a gap');
    for (const gap of gaps) {
      expect(text(html), gap.id).toContain(gap.text);
    }
  });

  it('each states what it unblocks — motivation is the point', () => {
    expect(text(html)).toContain('blocks:');
  });

  it('never offers a question already answered', () => {
    const gaps = openGaps(live);
    for (const gap of gaps) {
      expect(live.onboarding.answered[gap.id], gap.id).toBeUndefined();
    }
  });

  it('retires a question skipped twice rather than nagging', () => {
    const gaps = openGaps(live);
    // The live scenario has one skipped twice.
    expect(gaps.some((gap) => gap.id === 'q-team-attendance')).toBe(false);
  });
});

describe('what changed carries the uncomfortable line — §6.8', () => {
  const entries = whatChanged(live);

  it('logs the week, wins and all', () => {
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries.some((entry) => entry.delta > 0)).toBe(true);
  });

  it('includes the line about what was declined, at zero', () => {
    const uncomfortable = entries.find((entry) =>
      entry.what.includes('asked twice, skipped twice'),
    );
    expect(uncomfortable).toBeDefined();
    expect(uncomfortable?.delta).toBe(0);
    expect(text(render())).toContain('asked twice, skipped twice');
  });

  it('derives that line from the skip record rather than writing it', () => {
    const nothingSkipped = {
      ...live,
      onboarding: { ...live.onboarding, skipped: {} },
    };
    const clean = whatChanged(nothingSkipped);
    expect(clean.some((entry) => entry.what.includes('skipped twice'))).toBe(false);
  });
});

describe('onboarding dissolves into this screen — §5.1', () => {
  it('uses the same coverage panel copy as onboarding', () => {
    expect(text(render())).toContain('gaps are the product working');
  });

  it('a fresh firm reads zero here too, without pretending', () => {
    const fresh = buildState('fresh');
    const html = render(fresh);
    expect(text(html)).toContain('Firm coverage 0%');
  });
});
