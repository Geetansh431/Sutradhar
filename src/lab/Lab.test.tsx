/**
 * A render smoke test for `/lab`.
 *
 * `curl` returning 200 from the dev server proves only that the HTML shell was
 * served — React may still throw on mount. This renders the tree for real, so a
 * crash in the lab or anything it imports fails the build rather than showing up
 * as a blank page in front of someone.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ALL_CASES } from '@/lab/blocks';
import { Lab } from '@/lab/Lab';
import { BLOCKS, STATES } from '@/lab/registry';

const render = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lab" element={<Lab />} />
        <Route path="/lab/:section" element={<Lab />} />
      </Routes>
    </MemoryRouter>,
  );

describe('/lab', () => {
  const html = render('/lab');

  it('renders without throwing', () => {
    expect(html.length).toBeGreaterThan(1000);
  });

  it('lists all ten blocks by name', () => {
    for (const block of BLOCKS) {
      expect(html, `missing ${block.name}`).toContain(block.name);
    }
  });

  it('shows every state label for every block', () => {
    for (const state of STATES) {
      expect(html, `missing state ${state.label}`).toContain(state.label);
    }
  });

  it('marks unbuilt cases rather than hiding them', () => {
    // Ten blocks x seven states, minus whatever is registered.
    const expected = BLOCKS.length * STATES.length - ALL_CASES.length;
    const found = html.split('not built').length - 1;
    expect(found).toBe(expected);
  });

  it('carries the permanent prototype badge (CLAUDE.md: do not remove)', () => {
    expect(html).toContain('Prototype · canned responses');
  });
});

describe('/lab/type', () => {
  const html = render('/lab/type');

  it('renders the specimen against real content', () => {
    expect(html).toContain('₹18,40,000');
    expect(html).toContain('Source Serif 4');
  });

  it('is the type page, not the block index', () => {
    expect(html).not.toContain('not built');
  });
});
