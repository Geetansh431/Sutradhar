/**
 * Carrying `?s=` across navigation.
 *
 * The bug this prevents is quiet: a link that drops the query works fine until
 * someone refreshes, at which point the demo reseeds as `live` — the wrong firm
 * if the scenario was `fresh` or `extracted`. Nothing on screen says so.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Rail } from '@/chrome/Rail';
import { destinations } from '@/domain/selectors/role';
import { buildState } from '@/fixtures/scenarios';
import { withScenario } from '@/lib/scenarioLink';

const live = buildState('live');

describe('withScenario', () => {
  it('carries a real scenario through', () => {
    expect(withScenario('/money', '?s=extracted')).toBe('/money?s=extracted');
  });

  it('leaves the path alone when there is no scenario to carry', () => {
    expect(withScenario('/money', '')).toBe('/money');
  });

  it('ignores a scenario id the fixtures do not define', () => {
    // Better a default than a URL asserting a firm that does not exist.
    expect(withScenario('/money', '?s=nonsense')).toBe('/money');
  });

  it('appends to a path that already carries a query', () => {
    expect(withScenario('/canvas?q=1', '?s=fresh')).toBe('/canvas?q=1&s=fresh');
  });
});

describe('the rail carries the scenario', () => {
  const railAt = (entry: string) =>
    renderToStaticMarkup(
      <MemoryRouter initialEntries={[entry]}>
        <Rail
          destinations={destinations({ entities: live.entities, currentUserId: 'person-anil' })}
          pins={[]}
        />
      </MemoryRouter>,
    );

  it('keeps ?s= on every destination', () => {
    const html = railAt('/money?s=extracted');
    expect(html).toContain('href="/projects?s=extracted"');
    expect(html).toContain('href="/settings?s=extracted"');
  });

  it('adds nothing when the url carries no scenario', () => {
    const html = railAt('/money');
    expect(html).toContain('href="/projects"');
    expect(html).not.toContain('?s=');
  });
});
