/**
 * The coverage gap is the product's whole reason for existing — spec §6.4 calls
 * it "the single most valuable pixel". These tests pin both the demo's headline
 * figure and the rules that produce it.
 */

import { describe, expect, it } from 'vitest';
import { coverageGaps, isCovered, moneyWindow, paymentsInWindow } from '@/domain/selectors/money';
import type { EntityId, Payment, PaymentDirection } from '@/domain/types';
import { buildState } from '@/fixtures/scenarios';
import { formatINR, type Paise, rupees } from '@/lib/money';

const live = buildState('live');

const SOURCE = { kind: 'human', id: 'h', label: 'test' } as const;

const confirmed = <T>(value: T) =>
  ({
    state: 'confirmed',
    value,
    source: SOURCE,
    confirmedBy: 'person-anil',
    confirmedAt: '2026-08-09T00:00:00.000Z',
  }) as const;

const extracted = <T>(value: T) =>
  ({ state: 'extracted', value, source: SOURCE, confidence: 0.7 }) as const;

/** A payment with sane defaults; `due` and amounts are plain values. */
const payment = (over: {
  id: EntityId;
  direction: PaymentDirection;
  due?: string;
  amount?: Paise;
  /** Sets the amount to an extracted (unconfirmed) figure instead. */
  unconfirmedAmount?: Paise;
  status?: Payment['status'];
  gatedOn?: EntityId | null;
}): Payment => ({
  kind: 'payment',
  id: over.id,
  direction: over.direction,
  projectId: 'project-iyer',
  counterpartyId: 'vendor-sharma',
  amount:
    over.unconfirmedAmount !== undefined
      ? extracted(over.unconfirmedAmount)
      : confirmed(over.amount ?? rupees(100000)),
  due: confirmed(over.due ?? '2026-08-20'),
  status: over.status ?? 'planned',
  gatedOn: over.gatedOn ?? null,
  archivedAt: null,
});

const byId = (...ps: Payment[]) => new Map(ps.map((p) => [p.id, p]));

describe('w09 — the demo gap', () => {
  const window = moneyWindow(live);

  it('is one band of ₹1,70,000, the Godrej payment alone', () => {
    expect(window.gaps).toHaveLength(1);
    const [gap] = window.gaps;
    expect(gap && formatINR(gap.shortfall)).toBe('₹1,70,000');
    expect(gap?.paymentIds).toEqual(['payment-godrej-iyer']);
    expect(gap?.from).toBe('2026-08-26');
  });

  it("marks only Godrej uncovered — the one row w09 labels 'not covered'", () => {
    const uncovered = window.payments.filter((p) => p.uncovered).map((p) => p.id);
    expect(uncovered).toEqual(['payment-godrej-iyer']);
  });

  it("Sharma's bill is covered — it is gated on the instalment due today", () => {
    const sharma = window.payments.find((p) => p.id === 'payment-sharma-running-bill');
    expect(sharma?.uncovered).toBe(false);
    expect(sharma?.gatedOn).toBe('payment-iyer-instalment-3');
  });

  it('totals state their exclusions — Kumar is extracted, so it is left out', () => {
    expect(window.outflowTotal.caveat).toBe('excludes 1 unconfirmed figure');
    expect(window.inflowTotal.caveat).toBeNull();
  });
});

describe('what counts as covered', () => {
  it('an inflow is never itself a gap', () => {
    const p = payment({ id: 'in', direction: 'in' });
    expect(isCovered(p, byId(p))).toBe(true);
  });

  it('an ungated outflow is uncovered', () => {
    const p = payment({ id: 'out', direction: 'out' });
    expect(isCovered(p, byId(p))).toBe(false);
  });

  it('a gated outflow is covered when the gate lands first', () => {
    const gate = payment({ id: 'gate', direction: 'in', due: '2026-08-15' });
    const out = payment({ id: 'out', direction: 'out', gatedOn: 'gate' });
    expect(isCovered(out, byId(gate, out))).toBe(true);
  });

  it('a gate arriving after the payment does not cover it', () => {
    const gate = payment({ id: 'gate', direction: 'in', due: '2026-08-25' });
    const out = payment({ id: 'out', direction: 'out', gatedOn: 'gate' });
    expect(isCovered(out, byId(gate, out))).toBe(false);
  });

  it('a gate whose own amount is unconfirmed is not cover', () => {
    const gate = payment({
      id: 'gate',
      direction: 'in',
      due: '2026-08-15',
      unconfirmedAmount: rupees(500000),
    });
    const out = payment({ id: 'out', direction: 'out', gatedOn: 'gate' });
    expect(isCovered(out, byId(gate, out))).toBe(false);
  });

  it('a gate pointing at another outflow is not cover', () => {
    const notAnInflow = payment({ id: 'gate', direction: 'out', due: '2026-08-15' });
    const out = payment({ id: 'out', direction: 'out', gatedOn: 'gate' });
    expect(isCovered(out, byId(notAnInflow, out))).toBe(false);
  });

  it('a gate that does not exist is not cover', () => {
    const out = payment({ id: 'out', direction: 'out', gatedOn: 'missing' });
    expect(isCovered(out, byId(out))).toBe(false);
  });

  it('recurring firm costs are not a vacuum', () => {
    const p = payment({ id: 'salary', direction: 'out', status: 'recurring' });
    expect(isCovered(p, byId(p))).toBe(true);
  });

  it('an unconfirmed amount is not warned on — rule 3', () => {
    const p = payment({ id: 'out', direction: 'out', unconfirmedAmount: rupees(90000) });
    expect(isCovered(p, byId(p))).toBe(true);
  });

  it('an already-paid outflow is behind us', () => {
    const p = payment({ id: 'out', direction: 'out', status: 'paid' });
    expect(isCovered(p, byId(p))).toBe(true);
  });
});

describe('banding', () => {
  it('groups consecutive uncovered outflows into one band', () => {
    const a = payment({ id: 'a', direction: 'out', due: '2026-08-20' });
    const b = payment({ id: 'b', direction: 'out', due: '2026-08-22' });
    const gaps = coverageGaps([a, b]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.paymentIds).toEqual(['a', 'b']);
    expect(gaps[0] && formatINR(gaps[0].shortfall)).toBe('₹2,00,000');
    expect(gaps[0]?.from).toBe('2026-08-20');
    expect(gaps[0]?.to).toBe('2026-08-22');
  });

  it('a covered payment between two uncovered ones splits the band', () => {
    const mk = (id: string, due: string, gatedOn: EntityId | null = null) =>
      payment({ id, direction: 'out', gatedOn, due });
    const gate = payment({ id: 'gate', direction: 'in', due: '2026-08-01' });

    const gaps = coverageGaps([
      gate,
      mk('a', '2026-08-20'),
      mk('b', '2026-08-22', 'gate'),
      mk('c', '2026-08-24'),
    ]);
    expect(gaps).toHaveLength(2);
    expect(gaps[0]?.paymentIds).toEqual(['a']);
    expect(gaps[1]?.paymentIds).toEqual(['c']);
  });

  it('inflow inside the band is recorded but does not offset the shortfall', () => {
    // Money arriving for another project does not pay this vendor.
    const out = payment({ id: 'out', direction: 'out', due: '2026-08-20' });
    const other = payment({
      id: 'other',
      direction: 'in',
      due: '2026-08-20',
      amount: rupees(999999),
    });
    const [gap] = coverageGaps([out, other]);
    expect(gap && formatINR(gap.shortfall)).toBe('₹1,00,000');
    expect(gap && formatINR(gap.inflow)).toBe('₹9,99,999');
  });

  it('no payments means no gaps, not a zero-width band', () => {
    expect(coverageGaps([])).toEqual([]);
  });

  it('a fully covered schedule has no gaps', () => {
    const gate = payment({ id: 'gate', direction: 'in', due: '2026-08-01' });
    const out = payment({ id: 'out', direction: 'out', due: '2026-08-20', gatedOn: 'gate' });
    expect(coverageGaps([gate, out])).toEqual([]);
  });
});

describe('the window', () => {
  it('defaults to 60 days from the fixed today — spec §6.4', () => {
    const w = moneyWindow(live);
    expect(w.from).toBe('2026-08-12');
    expect(w.to).toBe('2026-10-11');
  });

  it('filters to one project', () => {
    const all = paymentsInWindow(live);
    const iyer = paymentsInWindow(live, { projectId: 'project-iyer' });
    expect(iyer.length).toBeLessThan(all.length);
    expect(iyer.every((p) => p.projectId === 'project-iyer')).toBe(true);
  });

  it('sorts by due date', () => {
    const dues = paymentsInWindow(live).map((p) =>
      p.due.state === 'confirmed' ? p.due.value : '',
    );
    expect(dues).toEqual([...dues].sort());
  });

  it('resolves counterparty and project names for display', () => {
    const w = moneyWindow(live);
    const sharma = w.payments.find((p) => p.id === 'payment-sharma-running-bill');
    expect(sharma?.counterpartyName).toBe('Sharma Electricals');
    expect(sharma?.projectName).toBe('Iyer Residence');
  });
});
