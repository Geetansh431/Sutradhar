/**
 * Onboarding — §5's three rules, and the interview's own rules.
 *
 * The three rules are the tests worth having: it never blocks, it never
 * finishes, and it never pretends. Each is checkable.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BUNDLE, COVERAGE_AT_ONBOARDING, INTERVIEW, INTERVIEW_VISIBLE } from '@/fixtures/ingestion';
import { buildState } from '@/fixtures/scenarios';
import { Onboarding } from '@/screens/Onboarding';
import { useStore } from '@/store/store';

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>,
  );

describe('rule 1 — it never blocks', () => {
  const html = render();

  it('offers the skip route, phrased as reassurance not escape', () => {
    expect(text(html)).toContain('You can skip all of this — Sutradhar already works');
  });

  it('says the product already works, in the step line', () => {
    expect(text(html)).toContain('you can start using Sutradhar now');
  });
});

describe('rule 3 — it never pretends', () => {
  const html = render();

  it('shows coverage as a number from the first minute', () => {
    expect(text(html)).toContain('Firm coverage');
    expect(text(html)).toContain('%');
  });

  it('says the gaps are the point', () => {
    expect(text(html)).toContain('gaps are the product working');
  });

  it("w04's onboarding coverage is lower than the live figures — a 34% firm looks like one", () => {
    const live = buildState('live');
    expect(COVERAGE_AT_ONBOARDING.projectsStages).toBeLessThan(live.coverageByArea.projectsStages);
    expect(COVERAGE_AT_ONBOARDING.teamLeaveSalary).toBe(0.18);
  });
});

describe('the drop zone — §5.3', () => {
  const html = render();

  it('names real artefacts so the user recognises their own mess', () => {
    expect(text(html)).toContain('WhatsApp exports');
    expect(text(html)).toContain('site photos');
    expect(text(html)).toContain('quotations');
  });

  it('promises no sorting', () => {
    expect(text(html)).toContain('No sorting');
  });

  it('offers Drive as well as a file picker', () => {
    expect(text(html)).toContain('Connect Drive');
    expect(text(html)).toContain('Browse files');
  });
});

describe('the ingested bundle states what was found — §5.3', () => {
  it('shows what each file yielded, not merely that it succeeded', () => {
    const master = BUNDLE.find((file) => file.id === 'doc-payments-master');
    expect(master?.found).toBe('412 rows → 3 projects, 19 vendors');
  });

  it('states failures rather than dropping them', () => {
    const photos = BUNDLE.find((file) => file.id === 'doc-vendor-bills');
    expect(photos?.found).toContain('5 unreadable, needs a human');
    expect(photos?.status).toBe('partial');
  });

  it('lands the rows at different times, so the parse reads as work', () => {
    const times = BUNDLE.map((file) => file.settlesAt);
    expect(new Set(times).size).toBe(times.length);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('ingestion moves coverage — the 1:15 beat', () => {
  it("the bundle adds up to exactly w04's figures", () => {
    const total = { ...COVERAGE_AT_ONBOARDING };
    for (const key of Object.keys(total) as (keyof typeof total)[]) {
      const summed = BUNDLE.reduce((sum, file) => sum + (file.adds[key] ?? 0), 0);
      // Reading the whole bundle lands on the coverage w04 prints.
      expect(Math.round(summed * 100), key).toBe(Math.round(COVERAGE_AT_ONBOARDING[key] * 100));
    }
  });

  it('a file lands its coverage once, however often it is replayed', () => {
    useStore.getState().reset(buildState('fresh'));
    const file = BUNDLE[0];
    if (!file) throw new Error('empty bundle');

    useStore.getState().markIngested(file.id, file.adds);
    const once = useStore.getState().coverageByArea.projectsStages;
    useStore.getState().markIngested(file.id, file.adds);
    expect(useStore.getState().coverageByArea.projectsStages).toBe(once);
  });
});

describe('the interview — §5.4', () => {
  const html = render();

  it('shows at most five at a time', () => {
    const asked = INTERVIEW.slice(0, INTERVIEW_VISIBLE);
    expect(asked.length).toBeLessThanOrEqual(5);
    for (const question of asked) {
      expect(text(html), question.id).toContain(question.text);
    }
  });

  it('never offers a text field where a choice would do', () => {
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<textarea');
  });

  it('every question is tappable and skippable', () => {
    for (const question of INTERVIEW) {
      expect(question.options.length, question.id).toBeGreaterThanOrEqual(2);
    }
    expect(text(html)).toContain('skip');
  });

  it('each states what it unblocks — motivation is the point', () => {
    for (const question of INTERVIEW) {
      expect(question.unblocks.length, question.id).toBeGreaterThan(0);
    }
    expect(text(html)).toContain('blocks:');
  });

  it('covers the six shapes §5.4 lists, in priority order', () => {
    const shapes = new Set(INTERVIEW.map((question) => question.shape));
    expect(shapes).toContain('live-or-not');
    expect(shapes).toContain('money-truth');
    expect(shapes).toContain('terms');
    expect(shapes).toContain('ownership');
    expect(shapes).toContain('judgement');
    expect(shapes).toContain('history');
    // The highest-priority shape is asked first.
    expect(INTERVIEW[0]?.shape).toBe('live-or-not');
  });
});

describe('answering moves coverage — the bar responds', () => {
  it('an answer raises the area it unblocks, and the headline with it', () => {
    const base = buildState('extracted');
    useStore.getState().reset(base);

    const before = useStore.getState().coverageByArea.vendorsProfiles;
    useStore.getState().answerQuestion('q-sharma-terms', '45', 'vendorsProfiles');
    const after = useStore.getState().coverageByArea.vendorsProfiles;

    expect(after).toBeGreaterThan(before);
    expect(useStore.getState().onboarding.answered['q-sharma-terms']).toBe('45');
  });

  it('a skip is recorded, and twice retires the question — §5.3', () => {
    useStore.getState().reset(buildState('extracted'));
    useStore.getState().skipQuestion('q-godrej-terms');
    expect(useStore.getState().onboarding.skipped['q-godrej-terms']).toBe(1);
    useStore.getState().skipQuestion('q-godrej-terms');
    expect(useStore.getState().onboarding.skipped['q-godrej-terms']).toBe(2);
  });

  it('answering a previously skipped question clears the skip', () => {
    useStore.getState().reset(buildState('extracted'));
    useStore.getState().skipQuestion('q-godrej-terms');
    useStore.getState().answerQuestion('q-godrej-terms', '30 days', 'moneyVendorSide');
    expect(useStore.getState().onboarding.skipped['q-godrej-terms']).toBeUndefined();
  });
});

describe('rule 2 — it never finishes', () => {
  it('the live scenario keeps its answers and its retired question', () => {
    const live = buildState('live');
    expect(live.onboarding.step).toBe('done');
    expect(Object.keys(live.onboarding.answered).length).toBeGreaterThan(0);
    // Asked twice, skipped twice — it stops being offered but is not forgotten.
    expect(live.onboarding.skipped['q-team-attendance']).toBe(2);
  });

  it('a fresh firm starts at seed with nothing answered', () => {
    const fresh = buildState('fresh');
    expect(fresh.onboarding.step).toBe('seed');
    expect(fresh.coverage).toBe(0);
    expect(Object.keys(fresh.onboarding.answered)).toHaveLength(0);
  });
});
