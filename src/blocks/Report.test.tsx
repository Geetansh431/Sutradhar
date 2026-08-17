/**
 * Block 06 and the report templates behind it.
 *
 * The rule worth testing hardest is that a report never quietly includes an
 * unconfirmed figure in a total. A report *looks* settled — it is the one
 * surface where a silently-mixed figure would be most convincing and most
 * wrong — so every total here states its own exclusions.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Report } from '@/blocks/Report';
import { buildReport, periodAnomaly, runReport } from '@/domain/selectors/report';
import { buildState } from '@/fixtures/scenarios';
import { formatINR } from '@/lib/money';

const live = buildState('live');
const ADMIN = { entities: live.entities, currentUserId: 'person-anil' };
const TEAM = { entities: live.entities, currentUserId: 'person-ravi' };
const JULY = { from: '2026-07-01', to: '2026-07-31' };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

describe('project P&L — the july-across-projects answer', () => {
  const report = buildReport(ADMIN, 'project-pnl', { period: JULY });

  it('nets July across the firm', () => {
    // in 8,00,000 − out 10,15,000. Negative, and the salary run is why.
    expect(report.total && formatINR(report.total.value)).toBe('-₹2,15,000');
  });

  it('breaks the month down by project, firm-level included', () => {
    const byLabel = Object.fromEntries(report.rows.map((row) => [row.label, row.value]));
    expect(byLabel['Iyer Residence']).toBe('-₹5,000');
    expect(byLabel['Kormangala']).toBe('₹2,10,000');
    expect(byLabel['Firm-level']).toBe('-₹4,20,000');
  });

  it('shows each project roughly level — the month turns on the firm-level cost', () => {
    const iyer = report.rows.find((row) => row.label === 'Iyer Residence');
    const firm = report.rows.find((row) => row.label === 'Firm-level');
    // The narrative's claim, asserted: no project explains the loss on its own.
    expect(iyer?.value).not.toBe(report.total && formatINR(report.total.value));
    expect(firm?.value).toBe('-₹4,20,000');
  });

  it('says nothing falls in an empty period rather than rendering a zero', () => {
    const january = buildReport(ADMIN, 'project-pnl', {
      period: { from: '2026-01-01', to: '2026-01-31' },
    });
    expect(january.rows).toHaveLength(0);
  });
});

describe('the other three templates', () => {
  it('ranks vendor exposure largest first, and states its exclusions', () => {
    const report = buildReport(ADMIN, 'vendor-exposure');
    expect(report.rows[0]?.label).toBe('Sharma Electricals');
    // Kumar's figures came off a photographed bill, so the total says so.
    expect(report.total?.caveat).toContain('unconfirmed');
  });

  it('buckets ageing by how overdue money is', () => {
    const report = buildReport(ADMIN, 'ageing');
    expect(report.rows.map((row) => row.label)).toEqual([
      'Not yet due',
      'Overdue 0–30 days',
      'Overdue 31–60 days',
      'Overdue 60+ days',
    ]);
  });

  it('names how many people the salary sheet could not price', () => {
    const report = buildReport(ADMIN, 'salary-sheet');
    // Anil has no salary on file, so the total is not the full monthly cost.
    expect(report.caveats[0]).toContain('no salary on file');
  });
});

describe('the role cut — §3.2', () => {
  it('computes no report at all for Team', () => {
    expect(runReport(TEAM, 'project-pnl', { period: JULY })).toBeNull();
    expect(runReport(TEAM, 'salary-sheet')).toBeNull();
  });

  it('renders the restriction rather than an empty document', () => {
    const html = text(renderToStaticMarkup(<Report report={runReport(TEAM, 'ageing')} />));
    expect(html).toContain('admin-only');
    expect(html).not.toMatch(/₹/);
  });
});

describe('the anomaly — what the question promises past in/out/net', () => {
  it('names the cost that belongs to no project, and why it matters', () => {
    const anomaly = periodAnomaly(ADMIN, JULY);
    expect(anomaly).toContain('₹4,20,000');
    // §9.3: the consequence, not the fact.
    expect(anomaly).toContain('no project’s margin');
  });

  it('says nothing about a period holding nothing', () => {
    expect(periodAnomaly(ADMIN, { from: '2026-01-01', to: '2026-01-31' })).toBeNull();
  });
});

describe('Report — the block', () => {
  const report = buildReport(ADMIN, 'project-pnl', { period: JULY });

  it('states the parameters it ran with, so the reader knows what they hold', () => {
    const html = text(renderToStaticMarkup(<Report report={report} />));
    expect(html).toContain('Project P&L');
    expect(html).toContain('2026-07-01 to 2026-07-31');
  });

  it('puts the exclusions with the total, not in a footnote', () => {
    const exposure = buildReport(ADMIN, 'vendor-exposure');
    const html = text(renderToStaticMarkup(<Report report={exposure} />));
    expect(html).toContain('Total');
    expect(html).toContain('unconfirmed');
  });

  it('offers template controls only when it can change them (§8.1)', () => {
    const readOnly = text(renderToStaticMarkup(<Report report={report} />));
    expect(readOnly).not.toContain('Ageing');

    const withControls = text(
      renderToStaticMarkup(
        <Report
          report={report}
          templates={[
            { id: 'project-pnl', label: 'Project P&L' },
            { id: 'ageing', label: 'Ageing' },
          ]}
          onChangeTemplate={() => {}}
        />,
      ),
    );
    expect(withControls).toContain('Ageing');
  });
});
