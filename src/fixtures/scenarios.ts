/**
 * Scenario seeding replaces persistence (see CLAUDE.md).
 *
 * `/?s=live` boots straight into the mid-demo state, so a stray refresh in front
 * of an advisor costs two seconds instead of replaying onboarding. Every scenario
 * is a pure function of the fixtures — no stored state, nothing to go stale.
 */

import type { AppState } from '@/store/store';
import { buildFirm } from './firm';
import { COVERAGE_AT_ONBOARDING } from './ingestion';

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
  // Guarded so the module is safe to render outside a browser (tests, and any
  // static render). Without a URL to read, the demo default is the right answer.
  if (typeof window === 'undefined') return 'live';
  const s = new URLSearchParams(window.location.search).get('s');
  return isScenarioId(s) ? s : 'live';
}

export function buildState(id: ScenarioId): AppState {
  const firm = buildFirm();
  switch (id) {
    case 'fresh':
      // Nothing dropped yet. Coverage is zero and the product says so.
      return {
        ...firm,
        documents: [],
        // The people exist — someone is sitting here dropping files in. What is
        // absent is everything the documents would have told us.
        entities: Object.fromEntries(
          Object.entries(firm.entities).filter(([, entity]) => entity.kind === 'person'),
        ),
        coverage: 0,
        coverageByArea: {
          projectsStages: 0,
          moneyClientSide: 0,
          moneyVendorSide: 0,
          vendorsProfiles: 0,
          teamLeaveSalary: 0,
          companyFinances: 0,
        },
        onboarding: { step: 'seed', answered: {}, skipped: {}, ingested: [] },
      };

    case 'extracted':
      // Documents parsed, interview not started — w04's state, coverage 34%.
      return {
        ...firm,
        coverage: 0.34,
        coverageByArea: { ...COVERAGE_AT_ONBOARDING },
        onboarding: { step: 'interview', answered: {}, skipped: {}, ingested: [] },
        interviewAnswered: 0,
      };

    case 'live':
      return {
        ...firm,
        coverage: 0.58,
        onboarding: {
          step: 'done',
          // The interview has been running a while: some answered, one skipped
          // twice and therefore retired (§5.3).
          answered: {
            'q-kormangala-live': 'Live',
            'q-sharma-terms': '45',
            'q-kumar-again': 'With conditions',
          },
          skipped: { 'q-team-attendance': 2 },
          ingested: [],
        },
      };
    case 'settled':
      return {
        ...firm,
        coverage: 0.61,
        onboarding: {
          step: 'done',
          answered: {
            'q-kormangala-live': 'Live',
            'q-sharma-terms': '45',
            'q-kumar-again': 'With conditions',
            'q-iyer-instalment': 'Yes',
          },
          skipped: { 'q-team-attendance': 2 },
          ingested: [],
        },
        demoSettled: true,
        // The demo's close (4:30): the admin pinned the vendor-exposure canvas
        // and it became their own screen in the rail.
        pinned: [
          {
            id: 'pin-vendor-exposure',
            name: 'Vendor exposure',
            questionId: 'vendor-exposure',
            ownerId: 'person-anil',
            containsMoney: true,
            pinnedAt: '2026-08-12T07:45:00.000Z',
          },
        ],
      };
  }
}
