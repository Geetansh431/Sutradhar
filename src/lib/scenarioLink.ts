/**
 * Carrying `?s=` across navigation.
 *
 * State lives in memory and resets on refresh (CLAUDE.md, "scenarios, not
 * persistence"), and `?s=` is what reseeds it. A link that drops the query
 * therefore doesn't break anything *until* someone refreshes — at which point
 * the demo silently reseeds as `live`, which is the wrong firm if the scenario
 * was `fresh` or `extracted`.
 *
 * `App` already fixed this for the onboarding redirect. This is the same fix
 * for every other link, in one place so it cannot be forgotten at the sixth.
 *
 * Pure so it can be tested without a router; `useScenarioPath` is the hook the
 * components actually use.
 */

import { useLocation } from 'react-router';
import { isScenarioId } from '@/fixtures/scenarios';

/**
 * Appends the scenario query to a path, if there is one worth carrying.
 *
 * An absent or unrecognised `?s=` is left off rather than defaulted: `live` is
 * the default anyway, so writing it into every URL would add noise that says
 * nothing.
 */
export function withScenario(path: string, search: string): string {
  const scenario = new URLSearchParams(search).get('s');
  if (!isScenarioId(scenario)) return path;
  // A path may already carry a query — keep it, and add ours.
  return `${path}${path.includes('?') ? '&' : '?'}s=${scenario}`;
}

/** `to={link('/money')}` — the same path, with the current scenario kept. */
export function useScenarioPath(): (path: string) => string {
  const { search } = useLocation();
  return (path: string) => withScenario(path, search);
}
