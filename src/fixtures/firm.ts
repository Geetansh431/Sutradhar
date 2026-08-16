/**
 * The synthetic firm. Modelled on the design partner's real shapes (spec §1.2),
 * not invented from nothing.
 *
 * The two live projects — Iyer Residence and Kormangala — are hand-authored and
 * carry the demo narrative end to end (spec §10, the money moment). Do not
 * regenerate or "tidy" them; the demo beats reference their specific figures.
 *
 * Three archived projects exist only to give vendors a track record (spec §5.6:
 * "referenced once to show vendor history").
 */

import type { Client, Document, Payment, Person, Project, Task, Vendor } from '@/domain/types';
import type { SourceRef } from '@/lib/field';
import { rupees } from '@/lib/money';
import type { AppState, CoverageArea, CoverageByArea, EntityTable } from '@/store/store';

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

// ── People ──────────────────────────────────────────────────────────────

const founder: Person = {
  id: 'person-founder',
  kind: 'person',
  name: 'Rhea Malhotra',
  role: 'admin',
  salary: null,
  assignedProjectIds: [],
  archivedAt: null,
};

const siteSupervisor: Person = {
  id: 'person-supervisor',
  kind: 'person',
  name: 'Arjun Nair',
  role: 'team',
  salary: {
    state: 'confirmed',
    value: rupees(45000),
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:00:00.000Z',
  },
  assignedProjectIds: ['project-iyer'],
  archivedAt: null,
};

const designer: Person = {
  id: 'person-designer',
  kind: 'person',
  name: 'Priya Sen',
  role: 'team',
  salary: {
    state: 'confirmed',
    value: rupees(38000),
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:00:00.000Z',
  },
  assignedProjectIds: ['project-iyer', 'project-kormangala'],
  archivedAt: null,
};

// ── Clients ─────────────────────────────────────────────────────────────

const iyerClient: Client = {
  id: 'client-iyer',
  kind: 'client',
  name: 'Iyer',
  contact: {
    state: 'confirmed',
    value: '+91 98450 11223',
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:10:00.000Z',
  },
  archivedAt: null,
};

const kormangalaClient: Client = {
  id: 'client-kormangala',
  kind: 'client',
  name: 'Kormangala Flat Owners Assoc.',
  contact: {
    state: 'extracted',
    value: 'kormangala.owners@gmail.com',
    source: doc('doc-korm-contract', 'Kormangala contract.pdf', 'p.1'),
    confidence: 0.82,
  },
  archivedAt: null,
};

// ── Vendors ─────────────────────────────────────────────────────────────

const sharmaVendor: Vendor = {
  id: 'vendor-sharma',
  kind: 'vendor',
  name: 'Sharma',
  category: 'civil',
  contact: {
    state: 'confirmed',
    value: '+91 98220 44556',
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:20:00.000Z',
  },
  paymentTerms: {
    state: 'confirmed',
    value: '30 days from bill',
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:22:00.000Z',
  },
  archivedAt: null,
};

const kumarCarpentryVendor: Vendor = {
  id: 'vendor-kumar-carpentry',
  kind: 'vendor',
  name: 'Kumar Carpentry',
  category: 'carpentry',
  contact: {
    state: 'extracted',
    value: '+91 90080 12233',
    source: doc('doc-vendor-list', 'vendor contact sheet.xlsx', 'row 4'),
    confidence: 0.9,
  },
  // Missing terms are a gap, not a blank — spec §6.5.
  paymentTerms: { state: 'missing', blocks: ['vendor ledger', 'coverage warnings'] },
  archivedAt: null,
};

const godrejDealerVendor: Vendor = {
  id: 'vendor-godrej-dealer',
  kind: 'vendor',
  name: 'Godrej dealer',
  category: 'fittings',
  contact: {
    state: 'extracted',
    value: '+91 80500 99887',
    source: doc('doc-vendor-list', 'vendor contact sheet.xlsx', 'row 9'),
    confidence: 0.85,
  },
  paymentTerms: { state: 'missing', blocks: ['vendor ledger'] },
  archivedAt: null,
};

// ── Projects ────────────────────────────────────────────────────────────

const iyerProject: Project = {
  id: 'project-iyer',
  kind: 'project',
  name: 'Iyer Residence',
  clientId: 'client-iyer',
  status: 'live',
  pipelineStage: null,
  stage: 'execution',
  value: {
    state: 'confirmed',
    value: rupees(2800000),
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:30:00.000Z',
  },
  likelihood: null,
  received: [
    {
      state: 'confirmed',
      value: rupees(1400000),
      source: doc('doc-iyer-ledger', 'Iyer payments.xlsx', 'row 2'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-15T10:00:00.000Z',
    },
  ],
  spent: [
    {
      state: 'confirmed',
      value: rupees(820000),
      source: doc('doc-iyer-ledger', 'Iyer payments.xlsx', 'row 14'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  handoverDate: {
    state: 'extracted',
    value: '2026-11-15',
    source: doc('doc-iyer-contract', 'Iyer contract.pdf', 'p.2 clause 4'),
    confidence: 0.95,
  },
  archivedAt: null,
};

const kormangalaProject: Project = {
  id: 'project-kormangala',
  kind: 'project',
  name: 'Kormangala',
  clientId: 'client-kormangala',
  status: 'live',
  pipelineStage: null,
  stage: 'vendors',
  value: {
    state: 'confirmed',
    value: rupees(1650000),
    source: human('Rhea Malhotra', 'onboarding interview'),
    confirmedBy: 'person-founder',
    confirmedAt: '2026-07-14T09:40:00.000Z',
  },
  likelihood: null,
  received: [
    {
      state: 'confirmed',
      value: rupees(600000),
      source: doc('doc-korm-ledger', 'Kormangala payments.xlsx', 'row 2'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-20T10:00:00.000Z',
    },
  ],
  spent: [
    {
      state: 'extracted',
      value: rupees(180000),
      source: doc('doc-korm-ledger', 'Kormangala payments.xlsx', 'row 6'),
      confidence: 0.88,
    },
  ],
  handoverDate: { state: 'missing', blocks: ['calendar', 'handover countdown'] },
  archivedAt: null,
};

// Three archived projects — referenced once, to give vendors a track record.
const archivedProjects: Project[] = [
  {
    id: 'project-mehta-archived',
    kind: 'project',
    name: 'Mehta Duplex',
    clientId: 'client-iyer',
    status: 'past',
    pipelineStage: null,
    stage: 'handover',
    value: {
      state: 'confirmed',
      value: rupees(2100000),
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T09:50:00.000Z',
    },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: {
      state: 'confirmed',
      value: '2026-02-10',
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T09:50:00.000Z',
    },
    archivedAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'project-rao-archived',
    kind: 'project',
    name: 'Rao Bungalow',
    clientId: 'client-iyer',
    status: 'past',
    pipelineStage: null,
    stage: 'handover',
    value: {
      state: 'confirmed',
      value: rupees(3400000),
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T09:55:00.000Z',
    },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: {
      state: 'confirmed',
      value: '2025-11-20',
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T09:55:00.000Z',
    },
    archivedAt: '2025-11-20T00:00:00.000Z',
  },
  {
    id: 'project-hsr-archived',
    kind: 'project',
    name: 'HSR Layout Café Fitout',
    clientId: 'client-kormangala',
    status: 'lost',
    pipelineStage: null,
    stage: null,
    value: {
      state: 'confirmed',
      value: rupees(950000),
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T10:00:00.000Z',
    },
    likelihood: null,
    received: [],
    spent: [],
    handoverDate: null,
    archivedAt: '2026-04-01T00:00:00.000Z',
  },
];

// ── Payments ────────────────────────────────────────────────────────────
// Thursday's Sharma payment has no cover if today's Iyer instalment slips —
// the coverage-gap story from spec §6.4 and the Home brief copy example.

const payments: Payment[] = [
  {
    id: 'payment-iyer-instalment-3',
    kind: 'payment',
    direction: 'in',
    projectId: 'project-iyer',
    counterpartyId: 'client-iyer',
    amount: {
      state: 'extracted',
      value: rupees(700000),
      source: doc('doc-iyer-ledger', 'Iyer payments.xlsx', 'row 18'),
      confidence: 0.9,
    },
    due: {
      state: 'confirmed',
      value: '2026-08-16',
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T10:10:00.000Z',
    },
    status: 'due',
    gatedOn: null,
    archivedAt: null,
  },
  {
    id: 'payment-sharma-running-bill',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-iyer',
    counterpartyId: 'vendor-sharma',
    amount: {
      state: 'confirmed',
      value: rupees(80000),
      source: message('Sharma', 'WhatsApp, 2026-08-14'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-08-14T18:00:00.000Z',
    },
    due: {
      state: 'confirmed',
      value: '2026-08-20',
      source: human('Rhea Malhotra', 'onboarding interview'),
      confirmedBy: 'person-founder',
      confirmedAt: '2026-07-14T10:15:00.000Z',
    },
    status: 'due',
    gatedOn: 'payment-iyer-instalment-3',
    archivedAt: null,
  },
  {
    id: 'payment-korm-vendor-advance',
    kind: 'payment',
    direction: 'out',
    projectId: 'project-kormangala',
    counterpartyId: 'vendor-godrej-dealer',
    amount: { state: 'missing', blocks: ['payment grid', 'coverage warnings'] },
    due: { state: 'missing', blocks: ['payment grid', 'coverage warnings'] },
    status: 'planned',
    gatedOn: null,
    archivedAt: null,
  },
];

// ── Tasks ───────────────────────────────────────────────────────────────

const tasks: Task[] = [
  {
    id: 'task-iyer-wardrobe-cost',
    kind: 'task',
    projectId: 'project-iyer',
    parentId: null,
    title: 'Price the extra wardrobe (unpriced change order)',
    assigneeId: 'person-founder',
    deadline: {
      state: 'inferred',
      value: '2026-08-18',
      derivedFrom: [message('Sharma', 'WhatsApp, 2026-08-14')],
      workings: 'Two days before the next Sharma running bill is due.',
    },
    status: 'needs-decision',
    linkedPaymentId: null,
    archivedAt: null,
  },
  {
    id: 'task-korm-electrical',
    kind: 'task',
    projectId: 'project-kormangala',
    parentId: null,
    title: 'Electrical first fix',
    assigneeId: 'person-supervisor',
    deadline: {
      state: 'confirmed',
      value: '2026-08-25',
      source: human('Arjun Nair', 'site visit note'),
      confirmedBy: 'person-supervisor',
      confirmedAt: '2026-08-10T08:00:00.000Z',
    },
    status: 'on-track',
    linkedPaymentId: 'payment-korm-vendor-advance',
    archivedAt: null,
  },
];

// ── Documents ───────────────────────────────────────────────────────────

const documents: Document[] = [
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
    id: 'doc-iyer-ledger',
    kind: 'document',
    name: 'Iyer payments.xlsx',
    projectId: 'project-iyer',
    currentForExecution: true,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-korm-contract',
    kind: 'document',
    name: 'Kormangala contract.pdf',
    projectId: 'project-kormangala',
    currentForExecution: true,
    approvedAt: '2026-07-05T00:00:00.000Z',
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-korm-ledger',
    kind: 'document',
    name: 'Kormangala payments.xlsx',
    projectId: 'project-kormangala',
    currentForExecution: true,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-vendor-list',
    kind: 'document',
    name: 'vendor contact sheet.xlsx',
    projectId: null,
    currentForExecution: true,
    approvedAt: null,
    unreadable: false,
    archivedAt: null,
  },
  {
    id: 'doc-site-photos-unreadable',
    kind: 'document',
    name: 'IMG_source (corrupt).zip',
    projectId: 'project-kormangala',
    currentForExecution: false,
    approvedAt: null,
    unreadable: true,
    archivedAt: null,
  },
];

// ── Coverage ────────────────────────────────────────────────────────────

const coverageByArea: CoverageByArea = {
  clients: 0.5,
  vendors: 0.4,
  team: 0.7,
  projects: 0.65,
  money: 0.55,
  files: 0.6,
};

export type Firm = Omit<AppState, 'coverage' | 'onboarding'>;

const allEntities = (): EntityTable => {
  const list = [
    founder,
    siteSupervisor,
    designer,
    iyerClient,
    kormangalaClient,
    sharmaVendor,
    kumarCarpentryVendor,
    godrejDealerVendor,
    iyerProject,
    kormangalaProject,
    ...archivedProjects,
    ...payments,
    ...tasks,
  ];
  const table: EntityTable = {};
  for (const entity of list) table[entity.id] = entity;
  return table;
};

const coverageAreaKeys: readonly CoverageArea[] = [
  'clients',
  'vendors',
  'team',
  'projects',
  'money',
  'files',
];

export const coverageAreas = coverageAreaKeys;

export function buildFirm(): Firm {
  return {
    entities: allEntities(),
    documents,
    coverageByArea,
    interviewAnswered: 0,
    demoSettled: false,
    audit: [],
    undoQueue: [],
    currentUserId: 'person-founder',
  };
}
