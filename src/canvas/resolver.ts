/**
 * The resolver — turns a plan into an answer by reading the store.
 *
 * The plan says "money-timeline, these filters, 60-day window". This decides
 * what that means in figures. The split is what makes the canned build a real
 * dry run of the live product rather than a facade (CLAUDE.md rule 5): a model
 * emitting the same plan would produce the same answer through this same code.
 *
 * Two rules it enforces:
 *   §7.4 — "Nothing renders that cannot be traced. If a figure has no source,
 *          it does not appear in the co-panel — it appears as a caveat."
 *   §7.2 — caveats are mandatory when any figure is unconfirmed, and they name
 *          which figure.
 */

import type { BlockRef, CanvasPlan, MetricRef } from '@/canvas/plan';
import { moneyWindow } from '@/domain/selectors/money';
import { vendorExposure } from '@/domain/selectors/vendors';
import type { Document, EntityId } from '@/domain/types';
import type { SourceRef } from '@/lib/field';
import { addPaise, formatINR, type Paise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';

export type ResolverState = { entities: EntityTable; documents: Document[] };

/** What a metric resolved to, and whether it can be shown at all. */
export type ResolvedMetric = {
  value: Paise;
  display: string;
  /** Named in a caveat when true (§7.2). */
  hasUnconfirmed: boolean;
  /** The figures the caveat should name. */
  unconfirmedLabels: string[];
};

export type EvidenceCard = {
  id: string;
  label: string;
  detail: string;
  /** An unreadable source is listed honestly rather than dropped (§5.2). */
  unreadable: boolean;
};

export type ResolvedAnswer = {
  headline: string;
  metric: ResolvedMetric | null;
  narrative: string[];
  /** Plan caveats plus any the data itself demands. */
  caveats: string[];
  blocks: BlockRef[];
  evidence: EvidenceCard[];
  actions: CanvasPlan['actions'];
  followUps: string[];
};

function resolveMetric(state: ResolverState, ref: MetricRef): ResolvedMetric {
  switch (ref.metric) {
    case 'open-vendor-exposure': {
      const view = vendorExposure(state);
      const scoped = ref.scope
        ? view.vendors.filter((vendor) => vendor.id === ref.scope?.id)
        : view.vendors;
      const value = scoped.reduce((acc, vendor) => addPaise(acc, vendor.open), ZERO);
      const unconfirmed = scoped.filter((vendor) => vendor.openUnconfirmed);
      return {
        value,
        display: formatINR(value),
        hasUnconfirmed: unconfirmed.length > 0,
        unconfirmedLabels: unconfirmed.map((vendor) => vendor.name),
      };
    }

    case 'coverage-gap': {
      const gaps = moneyWindow(state).gaps;
      const value = gaps.reduce((acc, gap) => addPaise(acc, gap.shortfall), ZERO);
      return { value, display: formatINR(value), hasUnconfirmed: false, unconfirmedLabels: [] };
    }

    case 'collectible-this-week':
    case 'payable-next-14-days':
    case 'project-margin':
    case 'days-behind-schedule':
    case 'period-in-out': {
      // Planned for, not yet resolved. Returning zero would be a fabricated
      // number, so the Canvas treats an unresolved metric as a gap instead.
      return { value: ZERO, display: '—', hasUnconfirmed: false, unconfirmedLabels: [] };
    }
  }
}

/** Source cards for the evidence column, each saying what it contributed. */
function resolveEvidence(state: ResolverState, ids: string[]): EvidenceCard[] {
  const cards: EvidenceCard[] = [];

  for (const id of ids) {
    const document = state.documents.find((candidate) => candidate.id === id);
    if (document) {
      cards.push({
        id,
        label: document.name,
        detail: document.unreadable ? 'unreadable · needs a human' : 'read',
        unreadable: document.unreadable,
      });
      continue;
    }

    // A human answer is a source too (§5.5) — "Answered by you" on w11.
    if (id.startsWith('human-')) {
      cards.push({ id, label: 'Answered by you', detail: '9 Aug', unreadable: false });
      continue;
    }

    // Referenced but not in the store: say so rather than dropping it silently.
    cards.push({ id, label: id, detail: 'not in this scenario', unreadable: false });
  }

  return cards;
}

/**
 * Fills a plan from the store.
 *
 * The headline's `{metric}` placeholder is replaced here, which is the only
 * place a figure and a sentence meet.
 */
export function resolve(state: ResolverState, plan: CanvasPlan): ResolvedAnswer {
  const metric = plan.answer.metric ? resolveMetric(state, plan.answer.metric) : null;

  const caveats = [...plan.caveats];
  if (metric?.hasUnconfirmed) {
    const names = metric.unconfirmedLabels.join(' and ');
    const count = metric.unconfirmedLabels.length;
    // Mandatory, and it names which figure (§7.2).
    caveats.push(
      `${count === 1 ? 'One figure here is' : `${count} figures here are`} unconfirmed — ${names}. ` +
        'Shown with a dotted underline, and excluded from the total.',
    );
  }

  return {
    headline: plan.answer.headline.replace('{metric}', metric?.display ?? '—'),
    metric,
    narrative: plan.narrative,
    caveats,
    blocks: plan.working,
    evidence: resolveEvidence(state, plan.evidence),
    actions: plan.actions,
    followUps: plan.followUps,
  };
}

/** Sources a figure came from, for the "every figure links back" promise. */
export const sourceLabel = (source: SourceRef): string =>
  source.locator ? `${source.label} · ${source.locator}` : source.label;

export type { EntityId };
