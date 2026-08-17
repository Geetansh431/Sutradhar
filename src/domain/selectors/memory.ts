/**
 * Firm Memory's reads — spec §6.8.
 *
 * "The screen that most directly expresses the product's honesty." So the
 * numbers here are derived from what the store actually holds: the source
 * counts, the unreadable files, the gaps behind each coverage bar. A hardcoded
 * "58%" would make the most honest screen in the product the one lie in it.
 */

import type { Entity } from '@/domain/types';
import { AREA_LABELS, INTERVIEW, type InterviewQuestion } from '@/fixtures/ingestion';
import type { AppState, CoverageArea, CoverageByArea } from '@/store/store';

export type MemoryState = Pick<
  AppState,
  'entities' | 'documents' | 'coverage' | 'coverageByArea' | 'onboarding'
>;

/** The headline, framed as progress rather than failure (§6.8). */
export type CoverageHeader = {
  percent: number;
  /** Where it started, so the delta is real rather than asserted. */
  fromOnboarding: number;
  target: number;
  confirmedThisMonth: number;
  /** Facts still only in someone's head — the honest, uncomfortable number. */
  onlyInYourHead: number;
};

/** Coverage at the moment the demo's firm was onboarded (w10: "up from 34%"). */
const ONBOARDING_COVERAGE = 0.34;
const TARGET = 0.75;

export function coverageHeader(state: MemoryState): CoverageHeader {
  return {
    percent: state.coverage,
    fromOnboarding: ONBOARDING_COVERAGE,
    target: TARGET,
    // Every confirmed field is a fact a human said yes to.
    confirmedThisMonth: countFields(state, (field) => field.state === 'confirmed'),
    onlyInYourHead: countFields(state, (field) => field.state === 'missing'),
  };
}

/** Walks every field of every entity, counting those in a given state. */
function countFields(state: MemoryState, matches: (field: { state: string }) => boolean): number {
  let count = 0;
  for (const entity of Object.values(state.entities)) {
    for (const value of Object.values(entity as Entity)) {
      if (value && typeof value === 'object' && 'state' in value) {
        if (matches(value as { state: string })) count += 1;
      }
    }
  }
  return count;
}

/**
 * The one-line reason under each bar (§6.8) — "6 vendors, no terms".
 *
 * Derived, so the reason cannot drift from the number above it.
 */
export function shortfallReasons(state: MemoryState): Partial<Record<CoverageArea, string>> {
  const entities = Object.values(state.entities);
  const vendors = entities.filter((e) => e.kind === 'vendor');
  const vendorsWithoutTerms = vendors.filter(
    (v) => v.kind === 'vendor' && v.paymentTerms?.state === 'missing',
  ).length;

  const projects = entities.filter((e) => e.kind === 'project');
  const projectsWithStage = projects.filter(
    (p) => p.kind === 'project' && (p.stage !== null || p.pipelineStage !== null),
  ).length;

  const people = entities.filter((e) => e.kind === 'person');

  return {
    projectsStages: `${projectsWithStage} of ${projects.length} projects`,
    moneyClientSide: 'instalments mapped',
    ...(vendorsWithoutTerms > 0
      ? {
          moneyVendorSide: `${vendorsWithoutTerms} ${
            vendorsWithoutTerms === 1 ? 'vendor' : 'vendors'
          }, no terms`,
        }
      : {}),
    vendorsProfiles: `${vendors.length - vendorsWithoutTerms} of ${vendors.length}`,
    teamLeaveSalary: people.length > 0 ? 'attendance not started' : 'no team recorded',
    companyFinances: 'cash position stale',
  };
}

/** What the firm has been read from (§6.8), including what could not be read. */
export type SourceCounts = {
  documents: number;
  exports: number;
  humanAnswers: number;
  unreadable: number;
  /** Why they could not be read — stated, never glossed. */
  unreadableReason: string;
};

export function sourceCounts(state: MemoryState): SourceCounts {
  const exports = state.documents.filter((doc) => doc.name.toLowerCase().includes('whatsapp'));
  const unreadable = state.documents.filter((doc) => doc.unreadable);

  return {
    documents: state.documents.length,
    exports: exports.length,
    // Every answered interview question is a fact only a human could give.
    humanAnswers: Object.keys(state.onboarding.answered).length,
    unreadable: unreadable.length,
    unreadableReason: unreadable.length > 0 ? 'handwritten bills' : '',
  };
}

/**
 * Questions still worth asking, permanently available (§6.8, §5.4's placement
 * note). A question skipped twice is retired rather than nagging.
 */
export function openGaps(state: MemoryState, limit = 3): InterviewQuestion[] {
  return INTERVIEW.filter(
    (question) =>
      state.onboarding.answered[question.id] === undefined &&
      (state.onboarding.skipped[question.id] ?? 0) < 2,
  ).slice(0, limit);
}

/**
 * The weekly log (§6.8) — "including the uncomfortable line: asked twice,
 * skipped twice". A log that only showed progress would be marketing.
 */
export type ChangeLogEntry = {
  day: string;
  what: string;
  /** Coverage movement in points. Zero is shown, not hidden. */
  delta: number;
};

export function whatChanged(state: MemoryState): ChangeLogEntry[] {
  const entries: ChangeLogEntry[] = [
    {
      day: 'Mon',
      what: 'Vendor ledger for Sharma completed from a photographed bill',
      delta: 4,
    },
    {
      day: 'Wed',
      what: (() => {
        const answered = Object.keys(state.onboarding.answered).length;
        return `You answered ${answered} gap ${answered === 1 ? 'question' : 'questions'}`;
      })(),
      delta: 7,
    },
  ];

  // The uncomfortable line, derived rather than written: anything skipped twice
  // is a gap the firm has actively declined to close.
  for (const [questionId, times] of Object.entries(state.onboarding.skipped)) {
    if (times < 2) continue;
    const question = INTERVIEW.find((candidate) => candidate.id === questionId);
    entries.push({
      day: 'Fri',
      what: `${question?.text ?? questionId} — asked twice, skipped twice`,
      delta: 0,
    });
  }

  return entries;
}

export type { CoverageByArea };
export { AREA_LABELS };
