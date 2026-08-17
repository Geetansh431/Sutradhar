/**
 * Routing — the "no dead ends" bar.
 *
 * Every destination the rail offers must render its own screen. Three of them
 * (`/files`, `/calendar`, `/settings`) used to fall through the catch-all to
 * Home: no crash, and no way to notice from a screenshot either, because Home
 * looks fine. This test is what makes that silent.
 *
 * It renders the real `Routes` at each path rather than asserting against a
 * hand-kept list, so a route deleted from `App` fails here.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/App';
import { destinations } from '@/domain/selectors/role';
import { buildState } from '@/fixtures/scenarios';

const live = buildState('live');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const at = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

/** The heading each destination should land on. */
const HEADING: Record<string, string> = {
  '/projects': 'Projects',
  '/money': 'Money',
  '/people': 'People',
  '/files': 'Files',
  '/calendar': 'Calendar',
  '/canvas': 'Canvas',
  '/memory': 'Firm Memory',
};

describe('every rail destination reaches its own screen', () => {
  const paths = destinations({ entities: live.entities, currentUserId: 'person-anil' })
    .map((destination) => destination.path)
    .filter((path) => path !== '/');

  it('covers every destination the rail offers', () => {
    // If a destination is added to the rail without a heading here, this fails
    // rather than the new link quietly going untested.
    for (const path of paths) expect(HEADING[path]).toBeDefined();
  });

  for (const path of paths) {
    it(`${path} renders its own screen, not the catch-all`, () => {
      const html = text(at(path));
      const heading = HEADING[path];
      // The screens' own headings are static, so they render even though the
      // store is empty under `renderToStaticMarkup`. A path falling through to
      // the catch-all redirects instead, and renders nothing at all — which is
      // exactly what these three used to do.
      expect(html).not.toBe('');
      if (heading) expect(html).toContain(heading);
    });
  }

  it('/settings renders too — it is in the rail footer, not the destination list', () => {
    expect(text(at('/settings'))).toContain('Nothing here was configured');
  });

  it('a project workspace has its own url and reaches the workspace screen', () => {
    // These routes read the live store, which serves its *initial* (empty)
    // snapshot during `renderToStaticMarkup` — the same reason every screen
    // takes a `stateOverride`. So this asserts the route resolves to the
    // workspace at all; the workspace's own rendering is tested with an
    // override in `ProjectWorkspace.test.tsx`.
    expect(text(at('/projects/project-iyer'))).toContain('No such project');
  });

  it('an unknown path redirects rather than rendering an unknown screen', () => {
    // `Navigate` renders nothing and changes the location; the redirect landing
    // on Home is what matters, and Home is empty without a seeded store.
    expect(at('/no-such-screen')).toBe('');
  });
});
