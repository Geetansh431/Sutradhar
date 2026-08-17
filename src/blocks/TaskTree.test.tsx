/**
 * Block 08 and the task-tree selector behind it.
 *
 * The tree is the one block whose *shape* is the assertion — w08 draws four
 * roots with a specific nesting, and a tree that renders the right rows in the
 * wrong hierarchy looks fine in a screenshot and is wrong. So depth and
 * parentage are tested directly, not inferred from the text.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TaskTree } from '@/blocks/TaskTree';
import { flattenTree, scheduleView, taskSummary, taskTree } from '@/domain/selectors/tasks';
import { buildState } from '@/fixtures/scenarios';

const LIVE = { entities: buildState('live').entities };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

describe('taskTree — w08', () => {
  const tree = taskTree(LIVE, 'project-iyer');

  it('nests under four roots, in the order w08 draws them', () => {
    expect(tree.map((node) => node.title)).toEqual([
      'False ceiling',
      'Modular kitchen',
      'Electrical — bedrooms',
      'Wardrobe (change order)',
    ]);
  });

  it('hangs the four ceiling sub-tasks off False ceiling', () => {
    const ceiling = tree.find((node) => node.title === 'False ceiling');
    expect(ceiling?.children.map((child) => child.title)).toEqual([
      'Wiring',
      'Framing',
      'Boards',
      'Finishing',
    ]);
  });

  it('gives children depth 1, so the block indents without walking up', () => {
    const rows = flattenTree(tree);
    const byTitle = Object.fromEntries(rows.map((row) => [row.title, row.depth]));
    expect(byTitle['False ceiling']).toBe(0);
    expect(byTitle['Wiring']).toBe(1);
    expect(byTitle['Wardrobe (change order)']).toBe(0);
  });

  it('resolves a vendor assignee to its name and marks an internal one', () => {
    const rows = flattenTree(tree);
    const byTitle = Object.fromEntries(rows.map((row) => [row.title, row.assignee]));
    expect(byTitle['Wiring']).toBe('Sharma Electricals');
    expect(byTitle['Framing']).toBe('Kumar Carpentry');
    expect(byTitle['Measurement']).toBe('Ravi (internal)');
  });

  it('leaves an unassigned task null rather than inventing a name', () => {
    const rows = flattenTree(tree);
    expect(rows.find((row) => row.title === 'Finishing')?.assignee).toBeNull();
  });

  it('carries the change order as needs-decision — the margin-leak story', () => {
    const order = tree.find((node) => node.title === 'Wardrobe (change order)');
    expect(order?.status).toBe('needs-decision');
  });

  it('says "pending price" against the change order, not a person (w08)', () => {
    // An unpriced task waits on a decision, not on someone doing the work.
    const order = tree.find((node) => node.title === 'Wardrobe (change order)');
    expect(order?.assignee).toBe('pending price');
  });

  it('scopes to one project', () => {
    const kormangala = taskTree(LIVE, 'project-kormangala');
    expect(kormangala.every((node) => node.title !== 'Modular kitchen')).toBe(true);
  });
});

describe('scheduleView — the kormangala-handover answer', () => {
  const view = scheduleView(LIVE, 'project-kormangala');

  it('reads the slip that was recorded, not one derived from today', () => {
    // Both Kormangala dates are in the *future* on the fixed clock. Measuring
    // overdue-ness against today would report "nothing behind", which is the
    // opposite of true — the slip is against the plan.
    expect(view.daysBehind).toBe(4);
  });

  it('walks the blocking chain from the ceiling down to snagging', () => {
    expect(view.chain.map((task) => task.title)).toEqual([
      'False ceiling',
      'Electrical — second fix',
      'Painting',
      'Snagging and handover',
    ]);
  });

  it('names the head of the chain — unblock this and the rest can move', () => {
    expect(view.blocker?.title).toBe('False ceiling');
  });

  it('lists what has no date at all, which is why nothing counts down', () => {
    expect(view.undated.map((task) => task.title)).toEqual(['Painting', 'Snagging and handover']);
  });

  it('reports nothing behind on a project that is not slipping', () => {
    const hsr = scheduleView(LIVE, 'project-hsr-villa');
    expect(hsr.daysBehind).toBeNull();
    expect(hsr.chain).toEqual([]);
  });
});

describe('taskSummary', () => {
  it('counts what the tree is worth saying out loud', () => {
    const summary = taskSummary(LIVE, 'project-iyer');
    expect(summary.total).toBe(10);
    expect(summary.slipping).toBe(2);
    expect(summary.needsDecision).toBe(1);
    expect(summary.unassigned).toBe(2);
  });
});

describe('TaskTree — the block', () => {
  const tree = taskTree(LIVE, 'project-iyer');

  it('renders every task and its assignee', () => {
    const out = text(renderToStaticMarkup(<TaskTree nodes={tree} subject="Iyer Residence" />));
    expect(out).toContain('False ceiling');
    expect(out).toContain('Sharma Electricals');
    expect(out).toContain('unassigned');
  });

  it('marks an inferred deadline with the ≈ the rest of the product uses', () => {
    const out = renderToStaticMarkup(<TaskTree nodes={tree} subject="Iyer Residence" />);
    // Boards is inferred from Ravi's site note.
    expect(out).toContain('fv-inferred');
    expect(text(out)).toContain('≈');
  });

  it('renders a missing deadline as an affordance, never a blank', () => {
    const out = renderToStaticMarkup(<TaskTree nodes={tree} subject="Iyer Residence" />);
    expect(out).toContain('fv-missing');
    expect(text(out)).toContain('— add');
  });

  it('offers no edit verbs without onPropose — a block never writes', () => {
    const out = text(renderToStaticMarkup(<TaskTree nodes={tree} subject="Iyer Residence" />));
    expect(out).not.toContain('Mark done');
    expect(out).not.toContain('add task');
  });

  it('offers add, re-parent and mark-done once it can propose', () => {
    const out = text(
      renderToStaticMarkup(
        <TaskTree
          nodes={tree}
          subject="Iyer Residence"
          projectId="project-iyer"
          onPropose={() => {}}
        />,
      ),
    );
    expect(out).toContain('Mark done');
    expect(out).toContain('add task');
    expect(out).toContain('drag to re-parent');
  });

  it('says the tree is not theirs rather than showing an empty one', () => {
    const out = text(
      renderToStaticMarkup(<TaskTree nodes={tree} subject="Iyer Residence" restricted />),
    );
    expect(out).not.toContain('False ceiling');
    expect(out).toContain('not yours to see');
  });

  it('says what will fill an empty tree', () => {
    const out = text(renderToStaticMarkup(<TaskTree nodes={[]} subject="Kormangala Apartment" />));
    expect(out).toContain('No tasks on Kormangala Apartment yet');
  });
});
