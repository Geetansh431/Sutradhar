/**
 * Report templates — spec §8.1, block 06.
 *
 * "Fixed templates only: project P&L, vendor exposure, ageing, salary sheet.
 * Parameters only (period, project, entity)."
 *
 * Fixed is the whole point. A report builder would compete with the Canvas and
 * split the mental model (§4.2 says the same about a Reports destination), so
 * the four templates are a closed union and the only freedom is parameters.
 *
 * Every template returns rows plus a `Total` that states its own exclusions —
 * a report is where an unconfirmed figure quietly entering a sum would do the
 * most damage, because a report looks like a settled document.
 */

import type { EntityId, Payment, Person } from '@/domain/types';
import { daysFromToday } from '@/lib/dates';
import { hasValue, isConfirmed, type Total, totalMoney } from '@/lib/field';
import { addPaise, formatINR, type Paise, subPaise, ZERO } from '@/lib/money';
import type { EntityTable } from '@/store/store';
import { listPayments } from './money';
import { canSeeMoney, type RoleState } from './role';

export type ReportState = { entities: EntityTable; currentUserId: EntityId | null };

/** The four, and only these four (§8.1). */
export type ReportTemplate = 'project-pnl' | 'vendor-exposure' | 'ageing' | 'salary-sheet';

export const TEMPLATE_LABEL: Record<ReportTemplate, string> = {
  'project-pnl': 'Project P&L',
  'vendor-exposure': 'Vendor exposure',
  ageing: 'Ageing',
  'salary-sheet': 'Salary sheet',
};

export type ReportRow = {
  id: string;
  label: string;
  /** Right-hand figure, already formatted. Null renders as an em dash. */
  value: string | null;
  /** A second line under the label — what the row is, not what it costs. */
  detail: string | null;
  /** Emphasised: the row the reader should land on first. */
  emphasis?: boolean;
};

export type Report = {
  template: ReportTemplate;
  title: string;
  /** The parameters this run used, stated so the reader knows what they hold. */
  subtitle: string;
  rows: ReportRow[];
  total: Total | null;
  /** What the report cannot say, in its own words. Never silent. */
  caveats: string[];
};

export type ReportParams = {
  /** Inclusive `YYYY-MM-DD` range. Omitted means everything on file. */
  period?: { from: string; to: string };
  projectId?: EntityId;
  entityId?: EntityId;
};

const nameOf = (state: ReportState, id: EntityId | null): string => {
  if (id === null) return 'firm-level';
  const entity = state.entities[id];
  return entity && 'name' in entity ? entity.name : 'Unknown';
};

const inPeriod = (payment: Payment, period?: { from: string; to: string }): boolean => {
  if (!period) return true;
  if (!hasValue(payment.due)) return false;
  return payment.due.value >= period.from && payment.due.value <= period.to;
};

/**
 * In, out, net for a period — what `july-across-projects` asks for.
 *
 * Per project, so "across all projects" is a readable list rather than one
 * number that hides which project moved.
 */
function projectPnl(state: ReportState, params: ReportParams): Report {
  const payments = listPayments(state).filter(
    (payment) =>
      inPeriod(payment, params.period) &&
      (params.projectId === undefined || payment.projectId === params.projectId),
  );

  const byProject = new Map<string, Payment[]>();
  for (const payment of payments) {
    const key = payment.projectId ?? 'firm-level';
    byProject.set(key, [...(byProject.get(key) ?? []), payment]);
  }

  const rows: ReportRow[] = [];
  let net = ZERO;
  let excluded = 0;

  for (const [key, group] of byProject) {
    const ins = group.filter((payment) => payment.direction === 'in');
    const outs = group.filter((payment) => payment.direction === 'out');
    const inTotal = totalMoney(ins.map((payment) => payment.amount));
    const outTotal = totalMoney(outs.map((payment) => payment.amount));
    const projectNet = subPaise(inTotal.value, outTotal.value);

    net = addPaise(net, projectNet);
    excluded += inTotal.excludedCount + outTotal.excludedCount;

    rows.push({
      id: key,
      label: key === 'firm-level' ? 'Firm-level' : nameOf(state, key),
      value: formatINR(projectNet),
      detail: `in ${formatINR(inTotal.value)} · out ${formatINR(outTotal.value)}`,
    });
  }

  rows.sort((a, b) => a.label.localeCompare(b.label));

  return {
    template: 'project-pnl',
    title: TEMPLATE_LABEL['project-pnl'],
    subtitle: params.period ? `${params.period.from} to ${params.period.to}` : 'everything on file',
    rows,
    total: {
      value: net,
      countedCount: rows.length,
      excludedCount: excluded,
      caveat:
        excluded === 0
          ? null
          : `excludes ${excluded} unconfirmed ${excluded === 1 ? 'figure' : 'figures'}`,
    },
    caveats: [],
  };
}

/** What each vendor is owed. The same shape w11's grid draws, as a document. */
function vendorExposureReport(state: ReportState, params: ReportParams): Report {
  const open = listPayments(state).filter(
    (payment) =>
      payment.direction === 'out' &&
      payment.status !== 'paid' &&
      // A vendor-exposure report is about vendors. A firm-level cost — the
      // salary run — has no counterparty and is not exposure to anyone; it
      // belongs in the P&L, and listing it here would rank it above the
      // vendors the report exists to rank.
      payment.counterpartyId !== null &&
      inPeriod(payment, params.period) &&
      (params.entityId === undefined || payment.counterpartyId === params.entityId),
  );

  const byVendor = new Map<string, Payment[]>();
  for (const payment of open) {
    const key = payment.counterpartyId ?? 'firm-level';
    byVendor.set(key, [...(byVendor.get(key) ?? []), payment]);
  }

  const rows: ReportRow[] = [...byVendor.entries()]
    .map(([key, group]) => {
      const total = totalMoney(group.map((payment) => payment.amount));
      return {
        id: key,
        label: nameOf(state, key === 'firm-level' ? null : key),
        value: formatINR(total.value),
        detail:
          total.excludedCount > 0
            ? `${group.length} open · ${total.excludedCount} unconfirmed`
            : `${group.length} open`,
        sortKey: total.value,
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey: _sortKey, ...row }) => row);

  const total = totalMoney(open.map((payment) => payment.amount));

  return {
    template: 'vendor-exposure',
    title: TEMPLATE_LABEL['vendor-exposure'],
    subtitle: params.period ? `${params.period.from} to ${params.period.to}` : 'all open',
    rows,
    total,
    caveats: [],
  };
}

/** How long money has been outstanding, in the buckets a firm actually uses. */
function ageing(state: ReportState, params: ReportParams): Report {
  const open = listPayments(state).filter(
    (payment) =>
      payment.status !== 'paid' &&
      hasValue(payment.due) &&
      (params.entityId === undefined || payment.counterpartyId === params.entityId),
  );

  const buckets: { id: string; label: string; min: number; max: number }[] = [
    { id: 'not-due', label: 'Not yet due', min: Number.NEGATIVE_INFINITY, max: -1 },
    { id: '0-30', label: 'Overdue 0–30 days', min: 0, max: 30 },
    { id: '31-60', label: 'Overdue 31–60 days', min: 31, max: 60 },
    { id: '60-plus', label: 'Overdue 60+ days', min: 61, max: Number.POSITIVE_INFINITY },
  ];

  const rows: ReportRow[] = buckets.map((bucket) => {
    const group = open.filter((payment) => {
      if (!hasValue(payment.due)) return false;
      const overdueBy = -daysFromToday(payment.due.value);
      return overdueBy >= bucket.min && overdueBy <= bucket.max;
    });
    const total = totalMoney(group.map((payment) => payment.amount));
    return {
      id: bucket.id,
      label: bucket.label,
      value: formatINR(total.value),
      detail: group.length === 1 ? '1 payment' : `${group.length} payments`,
      // The oldest bucket is the one worth landing on.
      emphasis: bucket.id === '60-plus' && group.length > 0,
    };
  });

  return {
    template: 'ageing',
    title: TEMPLATE_LABEL.ageing,
    subtitle: 'open payments, by age',
    rows,
    total: totalMoney(open.map((payment) => payment.amount)),
    caveats: [],
  };
}

/** Monthly salary commitment. Admin-only, and absent rather than empty (§3.2). */
function salarySheet(state: ReportState): Report {
  const people = Object.values(state.entities).filter(
    (entity): entity is Person => entity.kind === 'person' && entity.archivedAt === null,
  );

  const withSalary = people.filter((person) => person.salary !== null);

  const rows: ReportRow[] = withSalary.map((person) => ({
    id: person.id,
    label: person.name,
    value: person.salary && hasValue(person.salary) ? formatINR(person.salary.value) : null,
    detail: person.role,
  }));

  const salaries = withSalary
    .map((person) => person.salary)
    .filter((salary): salary is NonNullable<typeof salary> => salary !== null);

  const noSalary = people.length - withSalary.length;

  return {
    template: 'salary-sheet',
    title: TEMPLATE_LABEL['salary-sheet'],
    subtitle: 'monthly, per person',
    rows,
    total: totalMoney(salaries),
    caveats:
      noSalary > 0
        ? [
            `${noSalary} ${noSalary === 1 ? 'person has' : 'people have'} no salary on file, so ` +
              'the total is not the firm’s full monthly cost.',
          ]
        : [],
  };
}

/**
 * Run a template, with no role check.
 *
 * Callers that have already applied the cut use this — the Canvas gates on
 * `canSeeMoney` before it resolves anything, so re-deriving the role from a
 * `currentUserId` it does not carry would be a second, weaker check.
 */
export function buildReport(
  state: { entities: EntityTable },
  template: ReportTemplate,
  params: ReportParams = {},
): Report {
  const full: ReportState = { entities: state.entities, currentUserId: null };
  switch (template) {
    case 'project-pnl':
      return projectPnl(full, params);
    case 'vendor-exposure':
      return vendorExposureReport(full, params);
    case 'ageing':
      return ageing(full, params);
    case 'salary-sheet':
      return salarySheet(full);
  }
}

/**
 * Run a template for a given user.
 *
 * Returns `null` when the role may not see it — every template here is a money
 * document, and §3.2 gives Team none. Restricted reports are never *computed*,
 * which is the same cut every other selector makes.
 */
export function runReport(
  state: ReportState,
  template: ReportTemplate,
  params: ReportParams = {},
): Report | null {
  const seesMoney = canSeeMoney({
    entities: state.entities,
    currentUserId: state.currentUserId,
  } satisfies RoleState);

  if (!seesMoney) return null;
  return buildReport(state, template, params);
}

/**
 * The one anomaly worth noticing in a period — what `july-across-projects`
 * promises beyond in/out/net.
 *
 * §9.3: say the consequence, not the fact. The largest single outflow is a
 * fact; that it is a firm-level cost carried by no project is the consequence,
 * because it is the one that shows up nowhere in a per-project P&L.
 */
export function periodAnomaly(
  state: ReportState,
  period: { from: string; to: string },
): string | null {
  const payments = listPayments(state).filter((payment) => inPeriod(payment, period));
  if (payments.length === 0) return null;

  const firmLevel = payments.filter(
    (payment) => payment.projectId === null && payment.direction === 'out',
  );
  const firmTotal = totalMoney(firmLevel.map((payment) => payment.amount));

  if (firmLevel.length > 0 && firmTotal.value > ZERO) {
    return (
      `${formatINR(firmTotal.value)} of the outflow belongs to no project, so it appears in ` +
      'no project’s margin. That is the cost most often forgotten when quoting the next job.'
    );
  }

  const unconfirmed = payments.filter((payment) => !isConfirmed(payment.amount));
  if (unconfirmed.length > 0) {
    return `${unconfirmed.length} of these figures are unconfirmed, so the net is provisional.`;
  }

  return null;
}

export type { Paise };
