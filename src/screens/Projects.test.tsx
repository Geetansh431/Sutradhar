/**
 * Projects — §6.2's board and list, and §9.3's proactivity rules.
 *
 * The observations are the part worth testing hardest. §9.3 says a proactive
 * system that is not disciplined becomes noise, and noise is how a product gets
 * muted — so: consequence not fact, at most four, and never the same problem
 * said three ways.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  observations,
  pipelineBoard,
  pipelineCard,
  projectCounts,
  projectRows,
} from '@/domain/selectors/projects';
import type { Project } from '@/domain/types';
import { buildState } from '@/fixtures/scenarios';
import { Projects } from '@/screens/Projects';

const live = buildState('live');
const state = { entities: live.entities };

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
      <Projects stateOverride={{ entities: live.entities, currentUserId: userId }} />
    </MemoryRouter>,
  );

describe('the pipeline board — w07', () => {
  const board = pipelineBoard(state);
  const html = render();

  it('has the four stages, in order', () => {
    expect(text(html)).toContain('Enquiry');
    expect(text(html)).toContain('Feasibility');
    expect(text(html)).toContain('Quoted');
    expect(text(html)).toContain('Negotiating');
  });

  it("matches w07's column counts", () => {
    expect(board.enquiry).toHaveLength(3);
    expect(board.feasibility).toHaveLength(2);
    expect(board.quoted).toHaveLength(2);
    expect(board.negotiating).toHaveLength(1);
  });

  it('says why the board matters, above it', () => {
    expect(text(html)).toContain('every field here lives only in memory today');
  });

  it('shows value and likelihood on each card', () => {
    expect(text(html)).toContain('₹12L est');
    expect(text(html)).toContain('40% likely');
  });

  it('marks an unassessed likelihood rather than guessing one', () => {
    expect(text(html)).toContain('unassessed');
    expect(html).toContain('fv-missing');
  });

  it('sorts each column by how long a deal has been sitting', () => {
    for (const cards of Object.values(board)) {
      const days = cards.map((card) => card.daysInStage);
      expect(days).toEqual([...days].sort((a, b) => b - a));
    }
  });
});

describe("ageing uses the firm's own pattern — §6.2", () => {
  it('flags a deal past the threshold for its stage', () => {
    const quoted = pipelineBoard(state).quoted;
    const hsr = quoted.find((card) => card.name === 'HSR duplex');
    expect(hsr?.daysInStage).toBe(9);
    expect(hsr?.ageing).toBe(true);
  });

  it('does not flag one inside it', () => {
    const feasibility = pipelineBoard(state).feasibility;
    for (const card of feasibility) {
      expect(card.ageing, card.name).toBe(false);
    }
  });

  it('thresholds differ by stage — negotiating is allowed to take longer', () => {
    const rao = pipelineBoard(state).negotiating[0];
    // 7 days in Quoted would be ageing; in Negotiating it is not.
    expect(rao?.daysInStage).toBe(7);
    expect(rao?.ageing).toBe(false);
  });

  it('a project with no stage date does not read as brand new', () => {
    const undated: Project = {
      ...(Object.values(live.entities).find((e): e is Project => e.kind === 'project') as Project),
      stageSince: null,
    };
    expect(pipelineCard(undated).daysInStage).toBe(0);
  });
});

describe('Sutradhar noticed — §9.3', () => {
  const found = observations(state);
  const html = render();

  it('offers two to four observations, never more', () => {
    expect(found.length).toBeGreaterThanOrEqual(2);
    expect(found.length).toBeLessThanOrEqual(4);
  });

  it('says the consequence, not the fact', () => {
    const ageing = found.find((observation) => observation.text.includes('sitting in'));
    // Not merely "13 days" — what 13 days has cost this firm before.
    expect(ageing?.text).toContain('were lost');
  });

  it('names distinct problems rather than one problem three ways', () => {
    const actions = found.map((observation) => observation.action);
    expect(new Set(actions).size).toBeGreaterThan(1);
  });

  it("carries w07's three observations", () => {
    const all = found.map((observation) => observation.text).join(' ');
    expect(all).toContain('Café fitout has been sitting in Enquiry');
    expect(all).toContain('no owner and no follow-up set');
    expect(all).toContain('that is where vacuums begin');
  });

  it('each has one action, and it opens a preview rather than writing', () => {
    for (const observation of found) {
      expect(observation.action, observation.id).toBeTruthy();
    }
    expect(text(html)).toContain('Nudge client');
    expect(text(html)).toContain('Build schedule');
  });

  it('can be dismissed — "never nag twice"', () => {
    expect(text(html)).toContain('dismiss');
  });

  it('the lost-deal count is derived, not asserted', () => {
    const noLosses = {
      entities: Object.fromEntries(
        Object.entries(live.entities).filter(
          ([, entity]) => !(entity.kind === 'project' && entity.status === 'lost'),
        ),
      ),
    };
    const text = observations(noLosses)
      .map((observation) => observation.text)
      .join(' ');
    expect(text).not.toContain('were lost');
    expect(text).toContain('tend not to close');
  });
});

describe('the team cut — §3.2, §9.3', () => {
  it('gives a team member no firm-level observations', () => {
    const html = render('person-ravi');
    expect(text(html)).not.toContain('Sutradhar noticed');
    expect(text(html)).not.toContain('vacuums begin');
  });

  it('drops the value column from the list for them', () => {
    const html = render('person-ravi');
    expect(text(html)).not.toMatch(/₹/);
  });
});

describe('list mode — §6.2', () => {
  it('rows carry stage, client and health', () => {
    const rows = projectRows(state);
    expect(rows.length).toBeGreaterThan(0);
    const iyer = rows.find((row) => row.name === 'Iyer Residence');
    expect(iyer?.clientName).toBe('R. Iyer');
    expect(iyer?.stage).toBe('execution');
  });

  it('excludes archived projects', () => {
    const rows = projectRows(state);
    expect(rows.some((row) => row.name === 'Mehta Duplex')).toBe(false);
  });
});

describe('the header counts', () => {
  it('adds up', () => {
    const counts = projectCounts(state);
    expect(counts.live + counts.pipeline + counts.closed).toBe(counts.total);
  });
});
