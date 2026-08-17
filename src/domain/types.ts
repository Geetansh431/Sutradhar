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
  /**
   * Work ordered and owed but not yet paid out — spec §6.3's "margin now".
   *
   * Margin computed from `spent` alone flatters every project mid-execution,
   * which is precisely the blindness the change-order story is about: the cost
   * is real the moment the work is ordered, not the moment the cheque clears.
   */
  committed: FieldValue<Paise>[];
  handoverDate: FieldValue<string> | null;
  /**
   * When the project entered its current stage. Ageing is measured from here,
   * and w07 shows it in accent once it exceeds the firm's own pattern (§6.2) —
   * so a stage change has to move this, not just the stage.
   */
  stageSince: string | null;
  /** Who is chasing it. `null` is the gap w07 calls out on the café fitout. */
  ownerId: EntityId | null;
  /** The next planned contact. `null` reads as "no follow-up set". */
  nextFollowUp: string | null;
  /** One line of state, as the card's third line (§6.2). */
  note: string | null;
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
/**
 * `recurring` is a firm-level cost that repeats — salaries, rent. It is planned
 * rather than gated to a client instalment, so it never counts as a coverage
 * gap (spec §6.4; w09 shows the salary row with no "gated on" value).
 */
export type PaymentStatus = 'planned' | 'due' | 'paid' | 'overdue' | 'recurring';

export type Payment = {
  id: EntityId;
  kind: 'payment';
  direction: PaymentDirection;
  /**
   * `null` for a firm-level cost that belongs to no single project — salaries,
   * rent. w09 prints "firm-level" in the project column for exactly these.
   */
  projectId: EntityId | null;
  /**
   * The client (direction 'in') or vendor (direction 'out') this payment is
   * with. `null` where the counterparty is the firm itself, as with salaries.
   */
  counterpartyId: EntityId | null;
  /** Shown when there is no counterparty entity to name — "Team salaries". */
  label?: string;
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
  /**
   * Days this task has slipped against the plan it was scheduled to — spec
   * §6.3, and the `kormangala-handover` answer.
   *
   * Recorded, not derived: a task due next Wednesday can already be four days
   * behind where it should be, and comparing its date to today would call that
   * "nothing overdue". Slippage is against the plan, and only the site knows
   * it, which is why it carries provenance like any other observed fact.
   */
  slippedDays: FieldValue<number> | null;
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
  /**
   * Which folder this sits in — spec §6.6's "folder tree per project, plus a
   * firm-level tree. The firm defines the hierarchy; we do not impose one."
   * A path, so the tree is derived rather than stored as nesting.
   */
  folder: string;
  /**
   * Version label, and what this replaced. Together they end §6.6's named
   * failure: "the carpenter built from the old PDF". A superseded drawing is
   * still on file — it is not deleted, it is marked as not current.
   */
  version: string | null;
  supersedesId: EntityId | null;
  archivedAt: string | null;
};

export type Entity = Project | Person | Client | Vendor | Payment | Task | Document;

/**
 * A supervisor's post to the project's site feed — spec §6.3, w08.
 *
 * Deliberately *not* an `Entity`: `EntityKind` must match `EntityRef` in
 * `canvas/plan.ts` exactly, and the canvas never plans over a site note. It is
 * a feed the workspace reads, like `documents`, not something the firm's
 * questions are asked about.
 */
export type SiteNote = {
  id: EntityId;
  projectId: EntityId;
  /** Who posted it — a person on the team. */
  authorId: EntityId;
  /** ISO instant, so the feed sorts newest-first without a wall-clock read. */
  at: string;
  text: string;
  /** How many photos came with it. The demo renders tiles, not real images. */
  photoCount: number;
};

/** A partial write to one entity's own fields, keyed by field name. */
export type EntityPatch = Record<string, unknown>;
