/**
 * The canvas plan schema.
 *
 * A plan says WHICH blocks and WHICH entities. It never carries a value.
 * Every number the user sees is resolved from the store by `resolver.ts`.
 * This is no-AI rule #1 ("never invent a number") enforced by the schema:
 * there is nowhere in this shape to put a figure.
 *
 * The canned planner and a future live model both emit this. Swapping one for
 * the other is a single import change in `planner.ts`.
 */

import { z } from 'zod';

export const EntityRef = z.object({
  kind: z.enum(['project', 'client', 'vendor', 'person', 'payment', 'task', 'document']),
  id: z.string(),
});

export const Query = z.object({
  from: z.enum(['payments', 'projects', 'vendors', 'clients', 'tasks', 'documents']),
  where: z.array(
    z.object({
      field: z.string(),
      op: z.enum(['eq', 'neq', 'gt', 'lt', 'in', 'between', 'exists']),
      /** Filter operands only — dates, ids, enums. Never a money figure. */
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    }),
  ),
  orderBy: z.string().optional(),
  limit: z.number().int().max(200).optional(),
});

/** A named computation the resolver knows how to run. Not a value. */
export const MetricRef = z.object({
  metric: z.enum([
    'open-vendor-exposure',
    'collectible-this-week',
    'payable-next-14-days',
    'coverage-gap',
    'project-margin',
    'days-behind-schedule',
    'period-in-out',
  ]),
  scope: EntityRef.nullable(),
  period: z.object({ from: z.string(), to: z.string() }).nullable(),
});

export const BlockRef = z.discriminatedUnion('block', [
  z.object({ block: z.literal('record-card'), entity: EntityRef }),
  z.object({ block: z.literal('data-grid'), query: Query, columns: z.array(z.string()).min(2) }),
  z.object({ block: z.literal('money-timeline'), query: Query, window: z.number().int() }),
  z.object({ block: z.literal('ledger'), entity: EntityRef }),
  z.object({
    block: z.literal('document-viewer'),
    documentId: z.string(),
    locator: z.string().nullable(),
  }),
  z.object({
    block: z.literal('report'),
    template: z.enum(['project-pnl', 'vendor-exposure', 'ageing', 'salary-sheet']),
    scope: EntityRef.nullable(),
  }),
  z.object({
    block: z.literal('chart'),
    type: z.enum(['bar', 'hbar', 'timeline', 'stacked']),
    query: Query,
    by: z.string(),
  }),
  z.object({
    block: z.literal('task-tree'),
    projectId: z.string(),
    highlight: z.array(z.string()),
  }),
  z.object({ block: z.literal('gap'), area: z.string() }),
]);

export const ActionRef = z.object({
  label: z.string().max(24),
  /** Every action opens a change preview. None writes directly. */
  intent: z.enum([
    'confirm-fields',
    'set-terms',
    're-gate',
    'reschedule',
    'notify',
    'export',
    'pin',
  ]),
  target: EntityRef.nullable(),
});

export const CanvasPlan = z.object({
  questionId: z.string(),
  answer: z.object({
    /** One line. Placeholders like {metric} are filled by the resolver. */
    headline: z.string().max(120),
    metric: MetricRef.nullable(),
  }),
  /** Prose for the AI panel. ~120 words max (spec §7.2). */
  narrative: z.array(z.string()).max(4),
  /** Mandatory when any resolved figure is unconfirmed. */
  caveats: z.array(z.string()).max(3),
  working: z.array(BlockRef).min(1).max(3),
  evidence: z.array(z.string()).max(5), // document/source ids
  actions: z.array(ActionRef).max(5),
  followUps: z.array(z.string()).length(3),
});

export type CanvasPlan = z.infer<typeof CanvasPlan>;
export type BlockRef = z.infer<typeof BlockRef>;
export type MetricRef = z.infer<typeof MetricRef>;
export type Query = z.infer<typeof Query>;
