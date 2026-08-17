/**
 * The project workspace — §6.3, w08.
 *
 * The role cut is what this file tests hardest. §3.2 gives Team no money and no
 * deal values, and §9.2 rule #6 names computing-then-hiding as the failure mode
 * — so the assertion is that Ravi's HTML contains no rupee figure at all, not
 * that the money regions are marked hidden. Two leaks were caught this way
 * elsewhere in the build.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { siteFeed, stageSteps, workspace } from '@/domain/selectors/workspace';
import { buildState } from '@/fixtures/scenarios';
import { ProjectWorkspace } from '@/screens/ProjectWorkspace';

const live = buildState('live');

const stateFor = (userId: string | null) => ({
  entities: live.entities,
  siteNotes: live.siteNotes,
  currentUserId: userId,
});

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (userId: string | null = 'person-anil', projectId = 'project-iyer') =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ProjectWorkspace projectId={projectId} stateOverride={stateFor(userId)} />
    </MemoryRouter>,
  );

describe('the stage stepper — w08', () => {
  it("runs the firm's eight stages in order", () => {
    const project = live.entities['project-iyer'];
    if (!project || project.kind !== 'project') throw new Error('fixture missing');
    expect(stageSteps(project).map((step) => step.label)).toEqual([
      'Enquiry',
      'Feasibility',
      'CAD',
      'Concept',
      'Contract',
      'Vendors',
      'Execution',
      'Handover',
    ]);
  });

  it('marks execution current and handover not yet reached', () => {
    const project = live.entities['project-iyer'];
    if (!project || project.kind !== 'project') throw new Error('fixture missing');
    const byLabel = Object.fromEntries(stageSteps(project).map((s) => [s.label, s.state]));
    expect(byLabel['Contract']).toBe('done');
    expect(byLabel['Execution']).toBe('current');
    expect(byLabel['Handover']).toBe('ahead');
  });
});

describe('the fact row', () => {
  const view = workspace(stateFor('person-anil'), 'project-iyer');

  it("carries w08's figures", () => {
    const html = text(render());
    expect(html).toContain('R. Iyer');
    expect(html).toContain('₹18,40,000');
    expect(html).toContain('₹9,20,000');
    expect(html).toContain('₹7,10,000');
    expect(html).toContain('28 Sep');
  });

  it('subtracts committed money from margin, not just spent', () => {
    // value 18,40,000 − spent 7,10,000 − committed 4,50,000 = 6,80,000 → 37.0%
    expect(view?.money?.marginPct).toBeCloseTo(0.3696, 3);
  });

  it('says when a margin rests on an unconfirmed figure', () => {
    // Kormangala's spent and committed are both extracted, not confirmed.
    const kormangala = workspace(stateFor('person-anil'), 'project-kormangala');
    expect(kormangala?.money?.restsOnUnconfirmed).toBe(true);
    expect(view?.money?.restsOnUnconfirmed).toBe(false);
  });
});

describe('the site feed — w08', () => {
  it("puts Ravi's 08:10 note at the top, newest first", () => {
    const feed = siteFeed(stateFor('person-anil'), 'project-iyer');
    expect(feed[0]?.author).toBe('Ravi');
    expect(feed[0]?.text).toBe('ceiling boards delayed');
  });

  it('renders the author and the time', () => {
    const html = text(render());
    expect(html).toContain('Ravi, 08:10');
    expect(html).toContain('ceiling boards delayed');
  });
});

describe('needs a decision — the margin-leak story', () => {
  it('holds the unpriced change order', () => {
    const html = text(render());
    expect(html).toContain('Needs a decision');
    expect(html).toContain('Change order: Wardrobe');
    expect(html).toContain('unpriced');
    expect(html).toContain('Price it');
  });

  it('is persistent — it offers no dismiss', () => {
    expect(text(render())).not.toContain('Dismiss');
  });
});

describe('the task tree is composed here', () => {
  it("renders w08's tree with its assignees", () => {
    const html = text(render());
    expect(html).toContain('False ceiling');
    expect(html).toContain('Sharma Electricals');
    expect(html).toContain('Wardrobe (change order)');
  });
});

describe('the role cut — §3.2, §9.2 rule #6', () => {
  const teamHtml = render('person-ravi');

  it('computes no money for Team at all', () => {
    expect(workspace(stateFor('person-ravi'), 'project-iyer')?.money).toBeNull();
  });

  it('leaks not one rupee figure into the Team render', () => {
    const rupees = teamHtml.match(/₹/g) ?? [];
    expect(rupees).toHaveLength(0);
  });

  it('hides the Money tab rather than disabling it', () => {
    expect(text(teamHtml)).not.toContain('Money');
    expect(text(render())).toContain('Money');
  });

  it('still shows Team the work — the tasks and the stage', () => {
    const html = text(teamHtml);
    expect(html).toContain('False ceiling');
    expect(html).toContain('Execution');
  });

  it('tells Team what is undecided without naming the amount', () => {
    const html = text(teamHtml);
    expect(html).toContain('Change order: Wardrobe');
    expect(html).toContain('not been quoted');
  });
});

describe('a project that does not exist', () => {
  it('says so rather than rendering an empty workspace', () => {
    expect(text(render('person-anil', 'project-nope'))).toContain('No such project');
  });
});
