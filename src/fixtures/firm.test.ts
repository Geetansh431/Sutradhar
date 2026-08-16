/**
 * The fixtures are the demo. Every figure below is visible in a wireframe, so a
 * change that breaks one of these breaks a demo beat in `docs/spec/10-demo.md`.
 *
 * If a test here fails, the question is not "how do I fix the test" — it is
 * "did I mean to change what the demo shows".
 */

import { describe, expect, it } from 'vitest';
import type { Payment, Project, Task, Vendor } from '@/domain/types';
import { buildFirm } from '@/fixtures/firm';
import { daysFromToday, isToday, isWithinDays } from '@/lib/dates';
import { formatINR } from '@/lib/money';

const firm = buildFirm();
const all = Object.values(firm.entities);
const payments = all.filter((e): e is Payment => e.kind === 'payment');
const projects = all.filter((e): e is Project => e.kind === 'project');
const vendors = all.filter((e): e is Vendor => e.kind === 'vendor');
const tasks = all.filter((e): e is Task => e.kind === 'task');

describe('w08 — project workspace', () => {
  const iyer = projects.find((p) => p.id === 'project-iyer');

  it('the fact row reads 18,40,000 / 9,20,000 / 7,10,000', () => {
    expect(iyer?.value.state === 'confirmed' && formatINR(iyer.value.value)).toBe('₹18,40,000');
    const received = iyer?.received[0];
    const spent = iyer?.spent[0];
    expect(received?.state === 'confirmed' && formatINR(received.value)).toBe('₹9,20,000');
    expect(spent?.state === 'confirmed' && formatINR(spent.value)).toBe('₹7,10,000');
  });

  it('handover is 28 Sep, still only extracted', () => {
    expect(iyer?.handoverDate?.state).toBe('extracted');
    expect(iyer?.handoverDate && 'value' in iyer.handoverDate && iyer.handoverDate.value).toBe(
      '2026-09-28',
    );
  });

  it('the task tree nests under false ceiling and modular kitchen', () => {
    const children = (parentId: string) =>
      tasks.filter((t) => t.parentId === parentId).map((t) => t.title);
    expect(children('task-iyer-false-ceiling')).toEqual([
      'Wiring',
      'Framing',
      'Boards',
      'Finishing',
    ]);
    expect(children('task-iyer-modular-kitchen')).toEqual(['Measurement', 'Installation']);
  });

  it('finishing is unassigned and the wardrobe needs a decision', () => {
    expect(tasks.find((t) => t.id === 'task-iyer-finishing')?.status).toBe('unassigned');
    expect(tasks.find((t) => t.id === 'task-iyer-wardrobe-change-order')?.status).toBe(
      'needs-decision',
    );
  });
});

describe('w09 — money', () => {
  it('the payment grid is these six rows, in this order', () => {
    // The grid is the next 60 days; the two overdue bills that make up the rest
    // of each vendor's exposure (w11) sit before it and are excluded here.
    const rows = payments
      .filter((p) => p.status !== 'overdue')
      .map((p) => ({
        id: p.id,
        due: p.due.state === 'confirmed' ? p.due.value : null,
        amount: 'value' in p.amount ? formatINR(p.amount.value) : null,
        direction: p.direction,
      }))
      .sort((a, b) => String(a.due).localeCompare(String(b.due)));

    expect(rows).toEqual([
      { id: 'payment-iyer-instalment-3', due: '2026-08-12', amount: '₹2,50,000', direction: 'in' },
      { id: 'payment-sharma-running-bill', due: '2026-08-14', amount: '₹80,000', direction: 'out' },
      { id: 'payment-kumar-kormangala', due: '2026-08-18', amount: '₹1,10,000', direction: 'out' },
      { id: 'payment-godrej-iyer', due: '2026-08-26', amount: '₹1,70,000', direction: 'out' },
      { id: 'payment-team-salaries-aug', due: '2026-08-31', amount: '₹4,20,000', direction: 'out' },
      { id: 'payment-rao-hsr-villa', due: '2026-09-02', amount: '₹3,00,000', direction: 'in' },
    ]);
  });

  it("Sharma's bill is gated on the Iyer instalment — the demo's spine", () => {
    const sharma = payments.find((p) => p.id === 'payment-sharma-running-bill');
    expect(sharma?.gatedOn).toBe('payment-iyer-instalment-3');
  });

  it('the ₹1,70,000 Godrej payment — the one that opens the gap — is not gated', () => {
    const godrej = payments.find((p) => p.id === 'payment-godrej-iyer');
    expect(godrej?.gatedOn).toBeNull();
    expect(godrej?.amount.state === 'confirmed' && formatINR(godrej.amount.value)).toBe(
      '₹1,70,000',
    );
  });
});

describe('the demo timeline, against the fixed today', () => {
  const due = (id: string) => {
    const p = payments.find((p) => p.id === id);
    return p?.due.state === 'confirmed' ? p.due.value : '';
  };

  it('the Iyer instalment is due today — w09 says "due today"', () => {
    expect(isToday(due('payment-iyer-instalment-3'))).toBe(true);
  });

  it("Sharma's ₹80,000 lands two days out, after the instalment it is gated on", () => {
    expect(daysFromToday(due('payment-sharma-running-bill'))).toBe(2);
    expect(daysFromToday(due('payment-sharma-running-bill'))).toBeGreaterThan(
      daysFromToday(due('payment-iyer-instalment-3')),
    );
  });

  it('the Godrej payment opens the gap inside the 14-day pulse-card window', () => {
    expect(daysFromToday(due('payment-godrej-iyer'))).toBe(14);
    expect(isWithinDays(due('payment-godrej-iyer'), 14)).toBe(true);
  });

  it('nothing scheduled is in the past — the demo opens on a clean queue', () => {
    for (const p of payments) {
      // Overdue bills are deliberately behind us: they are what the firm has
      // not paid, and they are the bulk of w11's vendor exposure.
      if (p.status === 'overdue') continue;
      if (p.due.state === 'confirmed') {
        expect(daysFromToday(p.due.value), `${p.id} is in the past`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('the overdue bills carry the rest of each vendor exposure — w11', () => {
    const overdue = payments.filter((p) => p.status === 'overdue');
    expect(overdue).toHaveLength(2);
    for (const p of overdue) {
      expect(daysFromToday(p.due.state === 'confirmed' ? p.due.value : '')).toBeLessThan(0);
    }
  });
});

describe('w11 — canvas, vendor exposure', () => {
  it('terms: Sharma 45 days, Kumar 30 days, Godrej missing', () => {
    const terms = Object.fromEntries(
      vendors.map((v) => [
        v.name,
        v.paymentTerms?.state === 'confirmed' ? v.paymentTerms.value : v.paymentTerms?.state,
      ]),
    );
    expect(terms).toEqual({
      'Sharma Electricals': '45 days from bill',
      'Kumar Carpentry': '30 days from bill',
      'Godrej dealer': 'missing',
    });
  });

  it("Kumar's figure is unconfirmed — it is one of the two dotted numbers", () => {
    const kumar = payments.find((p) => p.id === 'payment-kumar-kormangala');
    expect(kumar?.amount.state).toBe('extracted');
  });
});

describe('w07 — pipeline board', () => {
  it('column counts are 3 / 2 / 2 / 1', () => {
    const counts: Record<string, number> = {};
    for (const p of projects.filter((p) => p.status === 'pipeline')) {
      const stage = p.pipelineStage ?? 'none';
      counts[stage] = (counts[stage] ?? 0) + 1;
    }
    expect(counts).toEqual({ enquiry: 3, feasibility: 2, quoted: 2, negotiating: 1 });
  });

  it('Café fitout has no likelihood — the enquiry with neither owner nor assessment', () => {
    const cafe = projects.find((p) => p.id === 'project-cafe-fitout');
    expect(cafe?.likelihood?.state).toBe('missing');
  });
});

describe('w10 — firm memory', () => {
  it('coverage by area matches the six bars', () => {
    expect(firm.coverageByArea).toEqual({
      projectsStages: 0.92,
      moneyClientSide: 0.78,
      moneyVendorSide: 0.49,
      vendorsProfiles: 0.61,
      teamLeaveSalary: 0.22,
      companyFinances: 0.34,
    });
  });

  it('unreadable files are kept, not dropped', () => {
    expect(firm.documents.some((d) => d.unreadable)).toBe(true);
  });
});

describe('the fixtures obey the project rules', () => {
  it('every entity id is unique and self-consistent', () => {
    for (const [id, entity] of Object.entries(firm.entities)) {
      expect(entity.id).toBe(id);
    }
  });

  it('every payment reference that is set resolves to a real entity', () => {
    for (const p of payments) {
      // Both are nullable: a firm-level cost like salaries has neither.
      if (p.projectId) expect(firm.entities[p.projectId], `${p.id} project`).toBeDefined();
      if (p.counterpartyId) {
        expect(firm.entities[p.counterpartyId], `${p.id} counterparty`).toBeDefined();
      }
    }
  });

  it('a payment with no counterparty carries its own label', () => {
    for (const p of payments) {
      if (!p.counterpartyId) expect(p.label, `${p.id} needs a label`).toBeTruthy();
    }
  });

  it('every gatedOn and task parent resolves', () => {
    for (const p of payments) {
      if (p.gatedOn) expect(firm.entities[p.gatedOn], `${p.id} gatedOn`).toBeDefined();
    }
    for (const t of tasks) {
      if (t.parentId) expect(firm.entities[t.parentId], `${t.id} parent`).toBeDefined();
      expect(firm.entities[t.projectId], `${t.id} project`).toBeDefined();
    }
  });

  it('nothing is archived in the live scenario except the past projects', () => {
    const archived = all.filter((e) => e.archivedAt !== null);
    expect(archived.every((e) => e.kind === 'project')).toBe(true);
  });
});
