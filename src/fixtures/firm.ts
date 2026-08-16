/**
 * The synthetic firm. Modelled on the design partner's real shapes (spec §1.2),
 * not invented from nothing.
 *
 * EVERY FIGURE HERE COMES FROM A WIREFRAME. Where the spec prose and a wireframe
 * disagree, the wireframe wins — it is what the demo shows on screen. The demo
 * beats in `docs/spec/10-demo.md` reference these numbers directly, so changing
 * one silently breaks a beat. Sources, by wireframe:
 *
 *   w08_project_workspace  Iyer: ₹18,40,000 value · ₹9,20,000 in · ₹7,10,000 out
 *                          · 12.4% margin · 28 Sep handover · the task tree
 *   w09_money              the six-row payment grid and the ₹1,70,000 coverage gap
 *   w11_canvas             vendor exposure ₹6,42,000 = Sharma 2,80,000
 *                          + Kumar 2,12,000 + Godrej 1,50,000, and their terms
 *   w10_firm_memory        coverage 58%, and the six areas by name
 *   w06_home               the brief, the pulse cards, the nine-item queue
 *
 * The two live projects are hand-authored and carry the narrative. Do not
 * regenerate or "tidy" them.
 */

import type { Client, Document, Payment, Person, Project, Task, Vendor } from '@/domain/types';
import type { SourceRef } from '@/lib/field';
import { rupees } from '@/lib/money';
import type { AppState, CoverageByArea, EntityTable } from '@/store/store';

const doc = (id: string, label: string, locator?: string): SourceRef => ({
  kind: 'document',
  id,
  label,
  ...(locator ? { locator } : {}),
});

const human = (label: string, locator?: string): SourceRef => ({
  kind: 'human',
  id: `human-${label.toLowerCase().replace(/\s+/g, '-')}`,
  label,
  ...(locator ? { locator } : {}),
});

const message = (label: string, locator?: string): SourceRef => ({
  kind: 'message',
  id: `msg-${label.toLowerCase().replace(/\s+/g, '-')}`,
  label,
  ...(locator ? { locator } : {}),
});

/** The demo is staged on Tuesday 12 August 2026 — "due today" on w09 is this date. */
const CONFIRMED_AT = '2026-08-09T09:00:00.000Z';
const ADMIN = 'person-anil';

const confirmedBy = (source: SourceRef, at = CONFIRMED_AT) =>
  ({ state: 'confirmed', source, confirmedBy: ADMIN, confirmedAt: at }) as const;

// ── People ──────────────────────────────────────────────────────────────
// "AK" in the topbar of every wireframe; the brief greets "Anil".

const admin: Person = {
  id: ADMIN,
  kind: 'person',
  name: 'Anil Kumar',
  role: 'admin',
  salary: null,
  assignedProjectIds: [],
  archivedAt: null,
};

/** Ravi posts the site feed on w08 and has the leave request on w06. */
const supervisor: Person = {
  id: 'person-ravi',
  kind: 'person',
  name: 'Ravi',
  role: 'team',
  salary: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: rupees(45000),
  },
  assignedProjectIds: ['project-iyer', 'project-kormangala'],
  archivedAt: null,
};

const designer: Person = {
  id: 'person-priya',
  kind: 'person',
  name: 'Priya Sen',
  role: 'team',
  salary: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: rupees(38000),
  },
  assignedProjectIds: ['project-kormangala'],
  archivedAt: null,
};

// ── Clients ─────────────────────────────────────────────────────────────

const iyerClient: Client = {
  id: 'client-iyer',
  kind: 'client',
  name: 'R. Iyer',
  contact: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: '+91 98450 11223',
  },
  archivedAt: null,
};

const kormangalaClient: Client = {
  id: 'client-kormangala',
  kind: 'client',
  name: 'Kormangala flat owner',
  contact: {
    state: 'extracted',
    value: 'kormangala.owner@gmail.com',
    source: doc('doc-whatsapp-kormangala', 'WhatsApp_Kormangala.txt', 'msg 214'),
    confidence: 0.82,
  },
  archivedAt: null,
};

/** M. Rao — the ₹3,00,000 inflow on 02 Sep (w09), on HSR Villa. */
const raoClient: Client = {
  id: 'client-rao',
  kind: 'client',
  name: 'M. Rao',
  contact: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: '+91 99001 45678',
  },
  archivedAt: null,
};

// ── Vendors ─────────────────────────────────────────────────────────────
// Open exposure and terms are read straight off w11_canvas.

const sharma: Vendor = {
  id: 'vendor-sharma',
  kind: 'vendor',
  name: 'Sharma Electricals',
  category: 'electrical',
  contact: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: '+91 98220 44556',
  },
  // w11: 45 days. The interview question on w04 asks 30 or 45 — this is the answer.
  paymentTerms: {
    ...confirmedBy(human('Anil Kumar', 'gap question, 9 Aug')),
    value: '45 days from bill',
  },
  archivedAt: null,
};

const kumar: Vendor = {
  id: 'vendor-kumar-carpentry',
  kind: 'vendor',
  name: 'Kumar Carpentry',
  category: 'carpentry',
  contact: {
    state: 'extracted',
    value: '+91 90080 12233',
    source: doc('doc-payments-master', 'Payments_Master.xlsx', 'row 4'),
    confidence: 0.9,
  },
  paymentTerms: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: '30 days from bill',
  },
  archivedAt: null,
};

/** w11: terms "unknown", dotted. w10 makes it a live gap question. */
const godrej: Vendor = {
  id: 'vendor-godrej-dealer',
  kind: 'vendor',
  name: 'Godrej dealer',
  category: 'fittings',
  contact: {
    state: 'extracted',
    value: '+91 80500 99887',
    source: doc('doc-payments-master', 'Payments_Master.xlsx', 'row 9'),
    confidence: 0.85,
  },
  paymentTerms: { state: 'missing', blocks: ['vendor ledger', 'coverage warnings'] },
  archivedAt: null,
};

// ── Projects ────────────────────────────────────────────────────────────

/** w08_project_workspace, read field by field off the fact row. */
const iyer: Project = {
  id: 'project-iyer',
  kind: 'project',
  name: 'Iyer Residence',
  clientId: 'client-iyer',
  status: 'live',
  pipelineStage: null,
  stage: 'execution',
  value: {
    state: 'confirmed',
    value: rupees(1840000),
    source: doc('doc-iyer-quotation', 'Iyer_Quotation_v3.pdf', '22 line items'),
    confirmedBy: ADMIN,
    confirmedAt: CONFIRMED_AT,
  },
  likelihood: null,
  received: [
    {
      ...confirmedBy(doc('doc-payments-master', 'Payments_Master.xlsx', 'Iyer, cleared')),
      value: rupees(920000),
    },
  ],
  spent: [
    {
      ...confirmedBy(doc('doc-payments-master', 'Payments_Master.xlsx', 'Iyer, paid out')),
      value: rupees(710000),
    },
  ],
  handoverDate: {
    state: 'extracted',
    value: '2026-09-28',
    source: doc('doc-iyer-contract', 'Iyer contract.pdf', 'p.2 clause 4'),
    confidence: 0.95,
  },
  archivedAt: null,
};

/** w06/w08: four days behind since Saturday, false ceiling is the blocker. */
const kormangala: Project = {
  id: 'project-kormangala',
  kind: 'project',
  name: 'Kormangala',
  clientId: 'client-kormangala',
  status: 'live',
  pipelineStage: null,
  stage: 'execution',
  value: {
    state: 'extracted',
    value: rupees(1650000),
    source: doc('doc-whatsapp-kormangala', 'WhatsApp_Kormangala.txt', 'msg 88'),
    confidence: 0.74,
  },
  likelihood: null,
  received: [
    {
      ...confirmedBy(doc('doc-payments-master', 'Payments_Master.xlsx', 'Kormangala, cleared')),
      value: rupees(600000),
    },
  ],
  spent: [
    {
      state: 'extracted',
      value: rupees(180000),
      source: doc('doc-payments-master', 'Payments_Master.xlsx', 'Kormangala, paid out'),
      confidence: 0.88,
    },
  ],
  handoverDate: { state: 'missing', blocks: ['calendar', 'handover countdown'] },
  archivedAt: null,
};

/** HSR Villa — carries M. Rao's 02 Sep inflow on w09. */
const hsrVilla: Project = {
  id: 'project-hsr-villa',
  kind: 'project',
  name: 'HSR Villa',
  clientId: 'client-rao',
  status: 'live',
  pipelineStage: null,
  stage: 'contract',
  value: {
    ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
    value: rupees(2200000),
  },
  likelihood: null,
  received: [],
  spent: [],
  handoverDate: { state: 'missing', blocks: ['calendar'] },
  archivedAt: null,
};

/** Pipeline, from w07. Every field here "lives only in memory today". */
const pipeline: Project[] = [
  {
    id: 'project-whitefield-3bhk',
    kind: 'project',
    name: 'Whitefield 3BHK',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'enquiry',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(1200000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.4 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-cafe-fitout',
    kind: 'project',
    name: 'Café fitout',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'enquiry',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(800000) },
    // w07: "unassessed", and the only enquiry with neither owner nor assessment.
    likelihood: { state: 'missing', blocks: ['pipeline value', 'expected profit'] },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    // w07's ENQUIRY header counts 3; the board renders two and this one
    // sits below the fold. Same for the two below — the column counts are
    // on screen, so the records have to exist.
    id: 'project-jayanagar-kitchen',
    kind: 'project',
    name: 'Jayanagar kitchen',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'enquiry',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(450000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.3 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-indiranagar-studio',
    kind: 'project',
    name: 'Indiranagar studio',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'feasibility',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(1500000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.45 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-btm-office',
    kind: 'project',
    name: 'BTM office fitout',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'quoted',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(1800000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.5 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-sarjapur-villa',
    kind: 'project',
    name: 'Sarjapur villa',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'feasibility',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(3500000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.6 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-hsr-duplex',
    kind: 'project',
    name: 'HSR duplex',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'quoted',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(2200000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.7 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
  {
    id: 'project-rao-penthouse',
    kind: 'project',
    name: 'Rao penthouse',
    clientId: 'client-rao',
    status: 'pipeline',
    pipelineStage: 'negotiating',
    stage: null,
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(4800000) },
    likelihood: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: 0.85 },
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: null,
  },
];

/** Three archived projects — vendor track record only (spec §5.6). */
const archived: Project[] = [
  {
    id: 'project-mehta-archived',
    kind: 'project',
    name: 'Mehta Duplex',
    clientId: 'client-rao',
    status: 'past',
    pipelineStage: null,
    stage: 'handover',
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(2100000) },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-02-10',
    },
    archivedAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'project-rao-bungalow-archived',
    kind: 'project',
    name: 'Rao Bungalow',
    clientId: 'client-rao',
    status: 'past',
    pipelineStage: null,
    stage: 'handover',
    value: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: rupees(3400000) },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2025-11-20',
    },
    archivedAt: '2025-11-20T00:00:00.000Z',
  },
  {
    id: 'project-koramangala-flat-archived',
    kind: 'project',
    name: 'Koramangala flat',
    clientId: 'client-rao',
    status: 'past',
    pipelineStage: null,
    stage: 'handover',
    value: { ...confirmedBy(human('Anil Kumar', 'gap question, 9 Aug')), value: rupees(1450000) },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: {
      ...confirmedBy(human('Anil Kumar', 'gap question, 9 Aug')),
      value: '2026-05-30',
    },
    archivedAt: '2026-05-30T00:00:00.000Z',
  },
];

// ── Payments ────────────────────────────────────────────────────────────
// The six rows of w09's payment grid, in its order. The gating relationship
// between Sharma's ₹80,000 and Iyer instalment 3 is the demo's spine.

const payments: Payment[] = [
  {
    id: 'payment-sharma-running-bill',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-iyer',
    counterpartyId: 'vendor-sharma',
    // Confirmed on w11 (plain, counts toward the ₹6.42L) and captured from a
    // bill photo — the change-preview example on w14.
    amount: {
      ...confirmedBy(message('Sharma', 'WhatsApp + IMG_2231.jpg'), '2026-08-09T18:00:00.000Z'),
      value: rupees(80000),
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-08-14',
    },
    status: 'due',
    gatedOn: 'payment-iyer-instalment-3',
    archivedAt: null,
  },
  {
    id: 'payment-iyer-instalment-3',
    kind: 'payment',
    direction: 'in',
    projectId: 'project-iyer',
    counterpartyId: 'client-iyer',
    amount: {
      ...confirmedBy(doc('doc-iyer-quotation', 'Iyer_Quotation_v3.pdf', 'instalment 3')),
      value: rupees(250000),
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-08-12',
    },
    status: 'due',
    gatedOn: null,
    archivedAt: null,
  },
  {
    id: 'payment-kumar-kormangala',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-kormangala',
    counterpartyId: 'vendor-kumar-carpentry',
    // w11 shows Kumar's open figure dotted — read from a photographed bill.
    amount: {
      state: 'extracted',
      value: rupees(110000),
      source: doc('doc-vendor-bills', 'Vendor bills (14 photos)', 'IMG_2244.jpg'),
      confidence: 0.61,
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-08-18',
    },
    status: 'planned',
    gatedOn: null,
    archivedAt: null,
  },
  {
    id: 'payment-godrej-iyer',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-iyer',
    counterpartyId: 'vendor-godrej-dealer',
    // The ₹1,70,000 that opens the coverage gap. w09 marks it "not covered".
    amount: {
      ...confirmedBy(doc('doc-payments-master', 'Payments_Master.xlsx', 'row 118')),
      value: rupees(170000),
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-08-26',
    },
    status: 'planned',
    gatedOn: null,
    archivedAt: null,
  },
  {
    id: 'payment-team-salaries-aug',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-iyer',
    counterpartyId: ADMIN,
    amount: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: rupees(420000),
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-08-31',
    },
    status: 'planned',
    gatedOn: null,
    archivedAt: null,
  },
  {
    id: 'payment-rao-hsr-villa',
    kind: 'payment',
    direction: 'in',
    projectId: 'project-hsr-villa',
    counterpartyId: 'client-rao',
    amount: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: rupees(300000),
    },
    due: {
      ...confirmedBy(human('Anil Kumar', 'onboarding interview')),
      value: '2026-09-02',
    },
    status: 'planned',
    gatedOn: null,
    archivedAt: null,
  },
];

// ── Tasks ───────────────────────────────────────────────────────────────
// The Iyer task tree, exactly as w08 draws it. Status dots: green on track,
// amber slipping, grey unassigned, accent needs a decision.

const tasks: Task[] = [
  {
    id: 'task-iyer-false-ceiling',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: null,
    title: 'False ceiling',
    assigneeId: 'vendor-sharma',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-08-22' },
    status: 'slipping',
    linkedPaymentId: 'payment-sharma-running-bill',
    archivedAt: null,
  },
  {
    id: 'task-iyer-wiring',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-false-ceiling',
    title: 'Wiring',
    assigneeId: 'vendor-sharma',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-08-16' },
    status: 'on-track',
    linkedPaymentId: 'payment-sharma-running-bill',
    archivedAt: null,
  },
  {
    id: 'task-iyer-framing',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-false-ceiling',
    title: 'Framing',
    assigneeId: 'vendor-kumar-carpentry',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-08-18' },
    status: 'on-track',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-iyer-boards',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-false-ceiling',
    title: 'Boards',
    assigneeId: 'vendor-kumar-carpentry',
    // Ravi's site note on w08: "ceiling boards delayed".
    deadline: {
      state: 'inferred',
      value: '2026-08-20',
      derivedFrom: [message('Ravi', 'site note, 08:10')],
      workings: 'Two days after framing, per the last three ceiling jobs.',
    },
    status: 'slipping',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-iyer-finishing',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-false-ceiling',
    title: 'Finishing',
    assigneeId: null,
    deadline: { state: 'missing', blocks: ['handover countdown'] },
    status: 'unassigned',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-iyer-modular-kitchen',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: null,
    title: 'Modular kitchen',
    assigneeId: 'vendor-godrej-dealer',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-09-05' },
    status: 'on-track',
    linkedPaymentId: 'payment-godrej-iyer',
    archivedAt: null,
  },
  {
    id: 'task-iyer-measurement',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-modular-kitchen',
    title: 'Measurement',
    assigneeId: 'person-ravi',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-08-20' },
    status: 'on-track',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-iyer-installation',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: 'task-iyer-modular-kitchen',
    title: 'Installation',
    assigneeId: 'vendor-godrej-dealer',
    deadline: { state: 'missing', blocks: ['handover countdown'] },
    status: 'unassigned',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-iyer-electrical-bedrooms',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: null,
    title: 'Electrical — bedrooms',
    assigneeId: 'vendor-sharma',
    deadline: { ...confirmedBy(human('Anil Kumar', 'onboarding interview')), value: '2026-08-29' },
    status: 'on-track',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    // The margin-leak story: unpriced change order, ~₹45,000 at risk (w06, w08).
    id: 'task-iyer-wardrobe-change-order',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: null,
    title: 'Wardrobe (change order)',
    assigneeId: ADMIN,
    deadline: { state: 'missing', blocks: ['project margin', 'change order approval'] },
    status: 'needs-decision',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-kormangala-false-ceiling',
    kind: 'task',
    projectId: 'project-kormangala',
    parentId: null,
    title: 'False ceiling',
    assigneeId: 'person-ravi',
    deadline: {
      state: 'inferred',
      value: '2026-08-19',
      derivedFrom: [message('Ravi', 'site note, 9 Aug')],
      workings: 'Four days behind the plan since Saturday.',
    },
    status: 'slipping',
    linkedPaymentId: 'payment-kumar-kormangala',
    archivedAt: null,
  },
];

// ── Documents ───────────────────────────────────────────────────────────
// The ingested list on w04, including the honestly-failed ones.

const documents: Document[] = [
  {
    id: 'doc-payments-master',
    kind: 'document',
    name: 'Payments_Master.xlsx',
    projectId: null,
    currentForExecution: true,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-iyer-quotation',
    kind: 'document',
    name: 'Iyer_Quotation_v3.pdf',
    projectId: 'project-iyer',
    currentForExecution: true,
    approvedAt: '2026-07-01T00:00:00.000Z',
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-iyer-contract',
    kind: 'document',
    name: 'Iyer contract.pdf',
    projectId: 'project-iyer',
    currentForExecution: true,
    approvedAt: '2026-07-01T00:00:00.000Z',
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-whatsapp-kormangala',
    kind: 'document',
    name: 'WhatsApp_Kormangala.txt',
    projectId: 'project-kormangala',
    currentForExecution: false,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-vendor-bills',
    kind: 'document',
    name: 'Vendor bills (14 photos)',
    projectId: null,
    currentForExecution: false,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    // w11 lists IMG_2231.jpg as unreadable evidence; w10 says 3 are handwritten.
    id: 'doc-img-2231',
    kind: 'document',
    name: 'IMG_2231.jpg',
    projectId: 'project-iyer',
    currentForExecution: false,
    approvedAt: null,
    unreadable: true,
    archivedAt: null,
  },
  {
    id: 'doc-agreements',
    kind: 'document',
    name: 'Agreements/ (7 PDFs)',
    projectId: null,
    currentForExecution: false,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
];

// ── Coverage ────────────────────────────────────────────────────────────
// w10_firm_memory, by area. Headline is 58%, up from 34% at onboarding.

const coverageByArea: CoverageByArea = {
  projectsStages: 0.92,
  moneyClientSide: 0.78,
  moneyVendorSide: 0.49,
  vendorsProfiles: 0.61,
  teamLeaveSalary: 0.22,
  companyFinances: 0.34,
};

export type Firm = Omit<AppState, 'coverage' | 'onboarding'>;

const allEntities = (): EntityTable => {
  const list = [
    admin,
    supervisor,
    designer,
    iyerClient,
    kormangalaClient,
    raoClient,
    sharma,
    kumar,
    godrej,
    iyer,
    kormangala,
    hsrVilla,
    ...pipeline,
    ...archived,
    ...payments,
    ...tasks,
  ];
  const table: EntityTable = {};
  for (const entity of list) table[entity.id] = entity;
  return table;
};

export function buildFirm(): Firm {
  return {
    entities: allEntities(),
    documents,
    coverageByArea,
    interviewAnswered: 0,
    demoSettled: false,
    audit: [],
    undoQueue: [],
    currentUserId: ADMIN,
  };
}
