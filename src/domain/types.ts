/**
 * The entity model. Kinds match `EntityRef` in `canvas/plan.ts` exactly —
 * the plan schema and the domain model must never drift apart.
 */

import type { FieldValue } from '@/lib/field';
import type { Paise } from '@/lib/money';

export type EntityKind =
  | 'project'
  | 'client'
  | 'vendor'
  | 'person'
  | 'payment'
  | 'task'
  | 'document';

export type EntityId = string;

/** Spec §6.2, §7.1: pipeline stages precede the project stage stepper. */
export type PipelineStage = 'enquiry' | 'feasibility' | 'quoted' | 'negotiating';

/** Spec §6.3: the eight-stage lifecycle for a live project. */
export type ProjectStage =
  | 'enquiry'
  | 'feasibility'
  | 'cad'
  | 'concept'
  | 'contract'
  | 'vendors'
  | 'execution'
  | 'handover';

export type ProjectStatus = 'pipeline' | 'live' | 'past' | 'lost';

export type Project = {
  id: EntityId;
  kind: 'project';
  name: string;
  clientId: EntityId;
  status: ProjectStatus;
  /** Only set once status is 'pipeline'. */
  pipelineStage: PipelineStage | null;
  /** Only set once status is 'live' or 'past'. */
  stage: ProjectStage | null;
  value: FieldValue<Paise>;
  likelihood: FieldValue<number> | null;
  received: FieldValue<Paise>[];
  spent: FieldValue<Paise>[];
  handoverDate: FieldValue<string> | null;
  archivedAt: string | null;
};

export type PersonRole = 'admin' | 'team';

export type Person = {
  id: EntityId;
  kind: 'person';
  name: string;
  role: PersonRole;
  /** Admin-only per spec §3.2 — the money line. */
  salary: FieldValue<Paise> | null;
  assignedProjectIds: EntityId[];
  archivedAt: string | null;
};

export type Client = {
  id: EntityId;
  kind: 'client';
  name: string;
  contact: FieldValue<string> | null;
  archivedAt: string | null;
};

export type VendorCategory = string;

export type Vendor = {
  id: EntityId;
  kind: 'vendor';
  name: string;
  category: VendorCategory;
  contact: FieldValue<string> | null;
  /** Missing terms are a gap, not a blank — spec §6.5. */
  paymentTerms: FieldValue<string> | null;
  archivedAt: string | null;
};

export type PaymentDirection = 'in' | 'out';
export type PaymentStatus = 'planned' | 'due' | 'paid' | 'overdue';

export type Payment = {
  id: EntityId;
  kind: 'payment';
  direction: PaymentDirection;
  projectId: EntityId;
  /** The client (direction 'in') or vendor (direction 'out') this payment is with. */
  counterpartyId: EntityId;
  amount: FieldValue<Paise>;
  due: FieldValue<string>;
  status: PaymentStatus;
  /** The client instalment that funds this vendor payment — spec §6.4. */
  gatedOn: EntityId | null;
  archivedAt: string | null;
};

export type TaskStatus = 'on-track' | 'slipping' | 'unassigned' | 'needs-decision' | 'done';

export type Task = {
  id: EntityId;
  kind: 'task';
  projectId: EntityId;
  parentId: EntityId | null;
  title: string;
  assigneeId: EntityId | null;
  deadline: FieldValue<string> | null;
  status: TaskStatus;
  linkedPaymentId: EntityId | null;
  archivedAt: string | null;
};

export type Document = {
  id: EntityId;
  kind: 'document';
  name: string;
  projectId: EntityId | null;
  /** Whether this is the file execution should be working from — spec §6.6. */
  currentForExecution: boolean;
  approvedAt: string | null;
  unreadable: boolean;
  archivedAt: string | null;
};

export type Entity = Project | Person | Client | Vendor | Payment | Task | Document;

/** A partial write to one entity's own fields, keyed by field name. */
export type EntityPatch = Record<string, unknown>;
