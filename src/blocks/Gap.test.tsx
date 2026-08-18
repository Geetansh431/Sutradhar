/**
 * Block 10 and the gap selectors behind it.
 *
 * The distinguishing claim is that a gap is not an empty state: it knows what
 * it blocks, and it can be closed where it is found. Both are asserted here,
 * because a block that only said "nothing on file" would look identical in a
 * screenshot and be worth nothing.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Gap } from '@/blocks/Gap';
import { allGaps, gapsForEntity, gapsInArea, isCoverageArea } from '@/domain/selectors/gaps';
import { buildState } from '@/fixtures/scenarios';

const live = buildState('live');
const STATE = {
  entities: live.entities,
  coverageByArea: live.coverageByArea,
  onboarding: { answered: live.onboarding.answered, skipped: live.onboarding.skipped },
};

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

describe('gaps by area', () => {
  it("finds Godrej's missing terms under Vendors & terms", () => {
    // Both terms questions live in one area, so the question that asks about
    // terms is found by the answer that scopes to terms.
    const view = gapsInArea(STATE, 'vendorsProfiles');
    expect(view.gaps.map((gap) => gap.id)).toContain('q-godrej-terms');
  });

  it('omits what has already been answered', () => {
    // Sharma's terms were answered in the live scenario.
    const view = gapsInArea(STATE, 'vendorsProfiles');
    expect(view.gaps.map((gap) => gap.id)).not.toContain('q-sharma-terms');
  });

  it('carries the area coverage, so the block can state it', () => {
    expect(gapsInArea(STATE, 'vendorsProfiles').coverage).toBe(live.coverageByArea.vendorsProfiles);
  });
});

describe('gaps by entity', () => {
  it('scopes to one entity', () => {
    const view = gapsForEntity(STATE, 'vendor-godrej-dealer');
    expect(view.subject).toBe('Godrej dealer');
    expect(view.gaps.map((gap) => gap.id)).toEqual(['q-godrej-terms']);
  });

  it('reports no coverage figure — an entity spans areas', () => {
    expect(gapsForEntity(STATE, 'vendor-godrej-dealer').coverage).toBeNull();
  });
});

describe('what the firm has declined to answer — §5.3', () => {
  it('counts a question skipped twice, and stops offering it', () => {
    // `q-team-attendance` is skipped twice in the live scenario.
    const view = allGaps(STATE);
    expect(view.gaps.map((gap) => gap.id)).not.toContain('q-team-attendance');
    expect(view.declined).toBe(1);
  });
});

describe('isCoverageArea', () => {
  it('narrows a real area and rejects anything else', () => {
    expect(isCoverageArea('vendorsProfiles')).toBe(true);
    expect(isCoverageArea('not-an-area')).toBe(false);
  });
});

describe('Gap — the block', () => {
  const view = gapsInArea(STATE, 'vendorsProfiles');

  it('states the consequence, not the absence (§9.3)', () => {
    const html = text(renderToStaticMarkup(<Gap view={view} />));
    expect(html).toContain('Godrej dealer — what are their payment terms?');
    expect(html).toContain('Blocks vendor ledger and coverage warnings');
  });

  it('offers the answers inline once it can propose (§8.1)', () => {
    const html = text(renderToStaticMarkup(<Gap view={view} onPropose={() => {}} />));
    expect(html).toContain('On delivery');
    expect(html).toContain('nothing is written until you confirm');
  });

  it('answers nothing without onPropose — a block never writes (§8.2)', () => {
    const html = text(renderToStaticMarkup(<Gap view={view} />));
    expect(html).not.toContain('nothing is written until you confirm');
  });

  it('proposes rather than writing when an answer is tapped', () => {
    let proposed = 0;
    const html = renderToStaticMarkup(
      <Gap
        view={view}
        onPropose={() => {
          proposed += 1;
        }}
      />,
    );
    // Static render cannot click, so assert the affordance exists and that
    // nothing fired during render.
    expect(html).toContain('45 days');
    expect(proposed).toBe(0);
  });

  it('says an empty list is not a finished state', () => {
    const html = text(
      renderToStaticMarkup(
        <Gap view={{ subject: 'Iyer Residence', gaps: [], coverage: 0.92, declined: 0 }} />,
      ),
    );
    expect(html).toContain('Nothing missing here');
    expect(html).toContain('not a finished state');
  });

  it('surfaces what was asked twice and skipped twice', () => {
    const html = text(renderToStaticMarkup(<Gap view={allGaps(STATE)} />));
    expect(html).toContain('asked twice and skipped twice');
  });

  it('is admin-only when restricted', () => {
    const html = text(renderToStaticMarkup(<Gap view={view} restricted />));
    expect(html).toContain('admin-only');
    expect(html).not.toContain('Godrej');
  });
});
