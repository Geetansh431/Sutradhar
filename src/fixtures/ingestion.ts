/**
 * The demo's document bundle and the interview it produces.
 *
 * §5.7: "Extraction is pre-computed for the demo bundle. The prepared synthetic
 * documents map to a known result set. Ingestion animates at a realistic pace
 * and can be walked through live, but it does not depend on a model call
 * succeeding in front of an advisor."
 *
 * So this is the known result set. The animation replays it; nothing here is
 * computed at demo time.
 */

import type { EntityId } from '@/domain/types';

export type IngestStatus = 'queued' | 'reading' | 'partial' | 'done';

export type IngestedFile = {
  id: string;
  name: string;
  /**
   * What was *found*, not merely that it succeeded — §5.3. "412 rows → 3
   * projects, 19 vendors" is the line that tells the user we read it.
   */
  found: string;
  status: IngestStatus;
  /** Milliseconds into the replay when this row reaches its final status. */
  settlesAt: number;
  /**
   * What reading this file adds to coverage, by area. Extraction is
   * pre-computed (§5.7), so this is part of the known result rather than
   * something derived at demo time — and it is what makes the bars move as the
   * rows land, which is the 1:15 beat.
   */
  adds: Partial<Record<keyof typeof COVERAGE_AT_ONBOARDING, number>>;
};

/** Coverage at onboarding, per w04 — lower than w10's current figures. */
export const COVERAGE_AT_ONBOARDING = {
  projectsStages: 0.82,
  moneyClientSide: 0.64,
  moneyVendorSide: 0.41,
  vendorsProfiles: 0.55,
  teamLeaveSalary: 0.18,
  companyFinances: 0.3,
} as const;

/** w04's ingested list, in its order. */
export const BUNDLE: IngestedFile[] = [
  {
    id: 'doc-payments-master',
    name: 'Payments_Master.xlsx',
    found: '412 rows → 3 projects, 19 vendors',
    status: 'done',
    settlesAt: 900,
    adds: { projectsStages: 0.52, moneyClientSide: 0.4, moneyVendorSide: 0.24 },
  },
  {
    id: 'doc-iyer-quotation',
    name: 'Iyer_Quotation_v3.pdf',
    found: '₹18,40,000 · 22 line items',
    status: 'done',
    settlesAt: 1700,
    adds: { moneyClientSide: 0.24, projectsStages: 0.12 },
  },
  {
    id: 'doc-whatsapp-kormangala',
    name: 'WhatsApp_Kormangala.txt',
    found: '1,204 msgs → 6 decisions, 11 payments',
    status: 'reading',
    settlesAt: 2600,
    adds: { projectsStages: 0.18, moneyVendorSide: 0.1, companyFinances: 0.12 },
  },
  {
    id: 'doc-vendor-bills',
    name: 'Vendor bills (14 photos)',
    // Failures are stated, never hidden (§5.2, §5.3).
    found: '9 read · 5 unreadable, needs a human',
    status: 'partial',
    settlesAt: 3400,
    adds: { moneyVendorSide: 0.07, vendorsProfiles: 0.35, teamLeaveSalary: 0.18 },
  },
  {
    id: 'doc-agreements',
    name: 'Agreements/ (7 PDFs)',
    found: 'queued',
    status: 'queued',
    settlesAt: 4200,
    adds: { vendorsProfiles: 0.2, companyFinances: 0.18 },
  },
];

/** w04 says 34 files; the list shows the five batches they arrived in. */
export const BUNDLE_FILE_COUNT = 34;

/**
 * The interview — §5.4. A question earns its place only if a human is the only
 * possible source, answering it unblocks something concrete, and it can be
 * answered in under ten seconds by tapping.
 *
 * Shapes in priority order: live-or-not, money truth, terms, ownership,
 * judgement, history.
 */
export type QuestionShape =
  | 'live-or-not'
  | 'money-truth'
  | 'terms'
  | 'ownership'
  | 'judgement'
  | 'history';

export type InterviewQuestion = {
  id: string;
  shape: QuestionShape;
  text: string;
  /** Tappable answers. "Never a text field where a choice would do." */
  options: string[];
  /** What answering it unblocks — motivation is the point (§6.8). */
  unblocks: string[];
  /** The entity the answer would land on. */
  target: EntityId | null;
  /** Coverage area the answer moves, so the bar visibly responds. */
  area:
    | 'projectsStages'
    | 'moneyClientSide'
    | 'moneyVendorSide'
    | 'vendorsProfiles'
    | 'teamLeaveSalary'
    | 'companyFinances';
};

/** Ordered by §5.4's priority. w04 shows the first three. */
export const INTERVIEW: InterviewQuestion[] = [
  {
    id: 'q-kormangala-live',
    shape: 'live-or-not',
    text: 'Kormangala flat — is this live or closed?',
    options: ['Live', 'Closed', 'Lost'],
    unblocks: ['project list', 'coverage warnings'],
    target: 'project-kormangala',
    area: 'projectsStages',
  },
  {
    id: 'q-sharma-terms',
    shape: 'terms',
    text: "Sharma Electricals' running bill — 30 or 45 days?",
    options: ['30', '45', 'Other'],
    unblocks: ['vendor ledger', 'coverage warnings'],
    target: 'vendor-sharma',
    area: 'vendorsProfiles',
  },
  {
    id: 'q-iyer-instalment',
    shape: 'money-truth',
    text: 'Iyer instalment 3 — has it actually come in?',
    options: ['Yes', 'No', 'Partly'],
    unblocks: ['money timeline', 'the morning brief'],
    target: 'payment-iyer-instalment-3',
    area: 'moneyClientSide',
  },
  {
    id: 'q-godrej-terms',
    shape: 'terms',
    text: 'Godrej dealer — what are their payment terms?',
    options: ['30 days', '45 days', 'On delivery', "Don't know"],
    unblocks: ['vendor ledger', 'coverage warnings'],
    target: 'vendor-godrej-dealer',
    area: 'moneyVendorSide',
  },
  {
    id: 'q-cafe-owner',
    shape: 'ownership',
    text: 'Who is responsible for the café fitout enquiry?',
    options: ['Anil', 'Priya', 'Nobody yet'],
    unblocks: ['pipeline value', 'follow-up reminders'],
    target: 'project-cafe-fitout',
    area: 'projectsStages',
  },
  {
    id: 'q-hsr-likelihood',
    shape: 'judgement',
    text: 'How likely is the HSR duplex to convert?',
    options: ['Very', 'Even odds', 'Unlikely'],
    unblocks: ['expected profit', 'pipeline value'],
    target: 'project-hsr-duplex',
    area: 'projectsStages',
  },
  {
    id: 'q-kumar-again',
    shape: 'history',
    text: 'Would you work with Kumar Carpentry again?',
    options: ['Yes', 'With conditions', 'No'],
    unblocks: ['vendor track record'],
    target: 'vendor-kumar-carpentry',
    area: 'vendorsProfiles',
  },
  {
    id: 'q-team-attendance',
    shape: 'ownership',
    text: 'Is anyone tracking site attendance today?',
    options: ['Ravi', 'Nobody', 'On paper'],
    unblocks: ['team load', 'attendance record'],
    target: null,
    area: 'teamLeaveSalary',
  },
];

/** w04's header count — "5 of 28". Five visible, the rest still to come. */
export const INTERVIEW_TOTAL = 28;
export const INTERVIEW_VISIBLE = 5;

/** The six areas as w04 and w10 label them. */
export const AREA_LABELS = {
  projectsStages: 'Projects & stages',
  moneyClientSide: 'Money — client side',
  moneyVendorSide: 'Money — vendor side',
  vendorsProfiles: 'Vendors & terms',
  teamLeaveSalary: 'Team & attendance',
  companyFinances: 'Company finances',
} as const;
