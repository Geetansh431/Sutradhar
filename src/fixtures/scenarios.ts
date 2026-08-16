/**
 * Scenario seeding replaces persistence (see CLAUDE.md).
 *
 * `/?s=live` boots straight into the mid-demo state, so a stray refresh in front
 * of an advisor costs two seconds instead of replaying onboarding. Every scenario
 * is a pure function of the fixtures — no stored state, nothing to go stale.
 */

import type { AppState } from '@/store/store';
import { buildFirm } from './firm';

export const SCENARIOS = {
  /** Nothing ingested. The empty product. */
  fresh: 'fresh',
  /** Documents parsed, interview not started, coverage 34%. */
  extracted: 'extracted',
  /** Full firm, mid-demo, coverage 58%. The default. */
  live: 'live',
  /** After the demo's actions have been taken — for rehearsing the close. */
  settled: 'settled',
} as const;

export type ScenarioId = keyof typeof SCENARIOS;

export const isScenarioId = (v: string | null): v is ScenarioId =>
  v !== null && Object.hasOwn(SCENARIOS, v);

export function readScenarioFromUrl(): ScenarioId {
  const s = new URLSearchParams(window.location.search).get('s');
  return isScenarioId(s) ? s : 'live';
}

export function buildState(id: ScenarioId): AppState {
  const firm = buildFirm();
  switch (id) {
    case 'fresh':
      return { ...firm, documents: [], entities: {}, coverage: 0, onboarding: { step: 'seed' } };
    case 'extracted':
      return { ...firm, coverage: 0.34, onboarding: { step: 'interview' }, interviewAnswered: 0 };
    case 'live':
      return { ...firm, coverage: 0.58, onboarding: { step: 'done' } };
    case 'settled':
      return { ...firm, coverage: 0.61, onboarding: { step: 'done' }, demoSettled: true };
  }
}
